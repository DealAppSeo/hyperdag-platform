/**
 * Circuit Breaker Pattern for Provider Failure Protection
 * 
 * Prevents cascading failures when AI providers go down.
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 * 
 * Key Features:
 * - Automatic failover to backup providers
 * - Exponential backoff for recovery attempts
 * - Per-provider circuit state tracking
 * - Configurable failure thresholds
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening circuit
  successThreshold: number;       // Successes needed to close from half-open
  timeout: number;                // Milliseconds before attempting reset
  resetBackoffMultiplier: number; // Exponential backoff for repeated failures
}

export interface CircuitStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  timeoutStart: number | null;
  consecutiveTimeouts: number;
}

export interface ProviderMetrics {
  provider: string;
  model: string;
  available: boolean;
  latency?: number;
  cost?: number;
  quality?: number;
}

export class CircuitBreaker {
  private circuits: Map<string, CircuitStats> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 60 seconds
      resetBackoffMultiplier: 2,
      ...config,
    };
  }

  /**
   * Execute request with circuit breaker protection
   */
  async executeWithProtection<T>(
    provider: string,
    executeRequest: () => Promise<T>,
    fallbackProviders: string[] = []
  ): Promise<T> {
    const circuitState = this.getCircuitState(provider);

    // Check if circuit is open
    if (circuitState === 'OPEN') {
      if (this.shouldAttemptReset(provider)) {
        // Attempt half-open state
        this.setCircuitState(provider, 'HALF_OPEN');
      } else {
        // Circuit still open, try fallback
        if (fallbackProviders.length === 0) {
          throw new Error(`Circuit breaker OPEN for ${provider} and no fallbacks available`);
        }
        
        // Try first available fallback
        for (const fallback of fallbackProviders) {
          const fallbackState = this.getCircuitState(fallback);
          if (fallbackState !== 'OPEN') {
            return this.executeWithProtection(fallback, executeRequest, 
              fallbackProviders.filter(p => p !== fallback));
          }
        }
        
        throw new Error('All providers and fallbacks have open circuits');
      }
    }

    // Attempt request
    try {
      const result = await executeRequest();
      this.recordSuccess(provider);
      return result;
    } catch (error) {
      this.recordFailure(provider);
      
      // If circuit just opened, try fallback
      const newState = this.getCircuitState(provider);
      if (newState === 'OPEN' && fallbackProviders.length > 0) {
        console.log(`[CircuitBreaker] ${provider} circuit opened, attempting fallback`);
        for (const fallback of fallbackProviders) {
          const fallbackState = this.getCircuitState(fallback);
          if (fallbackState !== 'OPEN') {
            return this.executeWithProtection(fallback, executeRequest,
              fallbackProviders.filter(p => p !== fallback));
          }
        }
      }
      
      throw error;
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(provider: string): void {
    const circuit = this.getOrCreateCircuit(provider);
    circuit.successCount++;
    circuit.lastSuccessTime = Date.now();

    // Reset failures on success
    circuit.failureCount = 0;

    // Close circuit if enough successes in half-open state
    if (circuit.state === 'HALF_OPEN' && circuit.successCount >= this.config.successThreshold) {
      console.log(`[CircuitBreaker] ${provider} circuit recovered, closing`);
      circuit.state = 'CLOSED';
      circuit.successCount = 0;
      circuit.consecutiveTimeouts = 0;
    }

    this.circuits.set(provider, circuit);
  }

  /**
   * Record failed request
   */
  private recordFailure(provider: string): void {
    const circuit = this.getOrCreateCircuit(provider);
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    // Reset success count
    circuit.successCount = 0;

    // Open circuit if threshold exceeded
    if (circuit.failureCount >= this.config.failureThreshold) {
      console.log(`[CircuitBreaker] ${provider} failure threshold exceeded, opening circuit`);
      circuit.state = 'OPEN';
      circuit.timeoutStart = Date.now();
      circuit.consecutiveTimeouts++;
    }

    // If half-open and failed, reopen circuit
    if (circuit.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker] ${provider} failed in half-open state, reopening circuit`);
      circuit.state = 'OPEN';
      circuit.timeoutStart = Date.now();
      circuit.consecutiveTimeouts++;
    }

    this.circuits.set(provider, circuit);
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(provider: string): boolean {
    const circuit = this.circuits.get(provider);
    if (!circuit || circuit.state !== 'OPEN' || !circuit.timeoutStart) {
      return false;
    }

    // Exponential backoff based on consecutive timeouts
    const backoffTimeout = this.config.timeout * 
      Math.pow(this.config.resetBackoffMultiplier, circuit.consecutiveTimeouts - 1);

    const elapsed = Date.now() - circuit.timeoutStart;
    return elapsed >= backoffTimeout;
  }

  /**
   * Get current circuit state for a provider
   */
  getCircuitState(provider: string): CircuitState {
    const circuit = this.circuits.get(provider);
    return circuit?.state || 'CLOSED';
  }

  /**
   * Set circuit state manually (for testing/admin)
   */
  setCircuitState(provider: string, state: CircuitState): void {
    const circuit = this.getOrCreateCircuit(provider);
    circuit.state = state;
    
    if (state === 'CLOSED') {
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.timeoutStart = null;
    } else if (state === 'HALF_OPEN') {
      circuit.successCount = 0;
    }
    
    this.circuits.set(provider, circuit);
  }

  /**
   * Get circuit statistics for monitoring
   */
  getCircuitStats(provider: string): CircuitStats | null {
    return this.circuits.get(provider) || null;
  }

  /**
   * Get all circuit statistics
   */
  getAllCircuitStats(): Map<string, CircuitStats> {
    return new Map(this.circuits);
  }

  /**
   * Reset circuit for a provider
   */
  resetCircuit(provider: string): void {
    const circuit = this.getOrCreateCircuit(provider);
    circuit.state = 'CLOSED';
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.timeoutStart = null;
    circuit.consecutiveTimeouts = 0;
    this.circuits.set(provider, circuit);
  }

  /**
   * Get or create circuit for provider
   */
  private getOrCreateCircuit(provider: string): CircuitStats {
    if (!this.circuits.has(provider)) {
      this.circuits.set(provider, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        timeoutStart: null,
        consecutiveTimeouts: 0,
      });
    }
    return this.circuits.get(provider)!;
  }

  /**
   * Filter providers to only available ones (closed or half-open circuits)
   */
  filterAvailableProviders(providers: ProviderMetrics[]): ProviderMetrics[] {
    return providers.map(p => ({
      ...p,
      available: this.getCircuitState(p.provider) !== 'OPEN' && p.available,
    })).filter(p => p.available);
  }
}

// Singleton instance for global circuit breaker
export const globalCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  resetBackoffMultiplier: 2,
});
