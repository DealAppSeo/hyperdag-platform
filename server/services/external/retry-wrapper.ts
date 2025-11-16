/**
 * External Dependency Retry Wrapper
 * 
 * Provides circuit breaker and retry logic for external APIs
 * Addresses OpenAI 429s, Pinata/IOTA connectivity issues
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitterMax: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
  successCount: number;
}

export class ExternalRetryWrapper {
  private circuitStates = new Map<string, CircuitBreakerState>();
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitterMax: 0.1,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      ...config
    };
  }

  /**
   * Execute API call with retry logic and circuit breaker
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: { timeout?: number; rateLimitDelay?: number }
  ): Promise<T> {
    const circuitState = this.getCircuitState(operationName);

    // Check circuit breaker
    if (this.isCircuitOpen(circuitState)) {
      throw new Error(`Circuit breaker open for ${operationName}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const result = await this.executeWithTimeout(operation, options?.timeout || 30000);
        
        // Success - update circuit breaker
        this.recordSuccess(circuitState);
        return result;

      } catch (error) {
        lastError = error as Error;
        this.recordFailure(circuitState, error as Error);

        // Handle specific error types
        if (this.isRateLimitError(error as Error)) {
          const rateLimitDelay = options?.rateLimitDelay || this.extractRateLimitDelay(error as Error);
          console.warn(`[Retry Wrapper] Rate limit hit for ${operationName}, waiting ${rateLimitDelay}ms`);
          await this.delay(rateLimitDelay);
          continue; // Don't count as failed attempt for rate limits
        }

        if (this.isNonRetryableError(error as Error)) {
          break; // Don't retry certain errors
        }

        if (attempt === this.config.maxAttempts) {
          break; // Last attempt
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        console.warn(`[Retry Wrapper] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await this.delay(delay);
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.config.maxAttempts} attempts`);
  }

  /**
   * Wrap OpenAI API calls with specific handling
   */
  async executeOpenAI<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(operation, 'openai', {
      timeout: 30000,
      rateLimitDelay: 60000 // 1 minute wait for OpenAI rate limits
    });
  }

  /**
   * Wrap Pinata API calls
   */
  async executePinata<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(operation, 'pinata', {
      timeout: 20000,
      rateLimitDelay: 10000
    });
  }

  /**
   * Wrap IOTA API calls
   */
  async executeIOTA<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(operation, 'iota', {
      timeout: 15000,
      rateLimitDelay: 5000
    });
  }

  /**
   * Execute operation with timeout
   */
  private executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get or create circuit breaker state
   */
  private getCircuitState(operationName: string): CircuitBreakerState {
    if (!this.circuitStates.has(operationName)) {
      this.circuitStates.set(operationName, {
        isOpen: false,
        failures: 0,
        lastFailure: 0,
        successCount: 0
      });
    }
    return this.circuitStates.get(operationName)!;
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(state: CircuitBreakerState): boolean {
    if (!state.isOpen) return false;
    
    // Check if timeout has passed
    if (Date.now() - state.lastFailure > this.config.circuitBreakerTimeout) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }
    
    return true;
  }

  /**
   * Record successful operation
   */
  private recordSuccess(state: CircuitBreakerState): void {
    state.failures = 0;
    state.successCount++;
    if (state.isOpen) {
      console.log('[Retry Wrapper] Circuit breaker closed - service recovered');
      state.isOpen = false;
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(state: CircuitBreakerState, error: Error): void {
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.config.circuitBreakerThreshold && !state.isOpen) {
      state.isOpen = true;
      console.error(`[Retry Wrapper] Circuit breaker opened after ${state.failures} failures`);
    }
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const isRateLimit = message.includes('rate limit') || 
                       message.includes('too many requests') ||
                       message.includes('quota exceeded') ||
                       message.includes('429');
    
    return isRateLimit;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') || 
           message.includes('forbidden') ||
           message.includes('bad request') ||
           message.includes('404');
  }

  /**
   * Extract rate limit delay from error
   */
  private extractRateLimitDelay(error: Error): number {
    // Try to parse Retry-After header info from error message
    const retryAfterMatch = error.message.match(/retry.*?(\d+)/i);
    if (retryAfterMatch) {
      return parseInt(retryAfterMatch[1]) * 1000; // Convert to milliseconds
    }
    
    // Default delays based on service
    if (error.message.toLowerCase().includes('openai')) {
      return 60000; // 1 minute for OpenAI
    }
    
    return 10000; // 10 seconds default
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * this.config.jitterMax * clampedDelay;
    
    return Math.floor(clampedDelay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): Record<string, CircuitBreakerState & { config: RetryConfig }> {
    const stats: Record<string, any> = {};
    
    for (const [name, state] of this.circuitStates) {
      stats[name] = {
        ...state,
        config: this.config
      };
    }
    
    return stats;
  }

  /**
   * Reset circuit breaker for specific operation
   */
  resetCircuitBreaker(operationName: string): void {
    const state = this.circuitStates.get(operationName);
    if (state) {
      state.isOpen = false;
      state.failures = 0;
      state.lastFailure = 0;
      console.log(`[Retry Wrapper] Circuit breaker manually reset for ${operationName}`);
    }
  }
}

// Export singleton instance
export const externalRetryWrapper = new ExternalRetryWrapper();