/**
 * Core Redundancy Service
 * 
 * This service implements a redundancy layer that can be extended for different 
 * service types. It provides failover capabilities, provider health checking,
 * and metrics tracking.
 */

// Generic service provider interface
export interface ServiceProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
}

// Metrics for a service provider
export interface ProviderMetrics {
  successRate: number;
  avgResponseTime: number;
  costPerRequest: number;
  lastFailure: Date | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

/**
 * Base redundancy service class to be extended by specific service types
 */
export abstract class RedundancyService<T extends ServiceProvider> {
  // List of available providers
  protected providers: T[] = [];
  
  // Primary provider name
  protected primaryProviderName: string;
  
  // Metrics for each provider
  protected metrics: Map<string, ProviderMetrics> = new Map();
  
  /**
   * Constructor
   * @param primaryProviderName Default provider to use first
   */
  constructor(primaryProviderName: string) {
    this.primaryProviderName = primaryProviderName;
  }
  
  /**
   * Add a provider to the service
   */
  public addProvider(provider: T): void {
    // Check if provider already exists
    if (this.providers.some(p => p.name === provider.name)) {
      console.warn(`Provider ${provider.name} already exists, skipping`);
      return;
    }
    
    // Add the provider
    this.providers.push(provider);
    
    // Initialize metrics if they don't exist
    if (!this.metrics.has(provider.name)) {
      this.metrics.set(provider.name, {
        successRate: 1.0,
        avgResponseTime: 0,
        costPerRequest: 0,
        lastFailure: null,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      });
    }
    
    console.log(`Added provider: ${provider.name}`);
  }
  
  /**
   * Execute a function with fallback to other providers if it fails
   */
  protected async executeWithFallback<R>(
    fn: (provider: T) => Promise<R>
  ): Promise<R> {
    // First try the primary provider
    const primaryProvider = this.providers.find(p => p.name === this.primaryProviderName);
    
    // Reorder providers to try primary first, then others
    const orderedProviders = [...this.providers];
    if (primaryProvider) {
      orderedProviders.sort((a, b) => 
        a.name === this.primaryProviderName ? -1 : 
        b.name === this.primaryProviderName ? 1 : 0
      );
    }
    
    // Try each provider until one succeeds
    let lastError: Error | null = null;
    
    for (const provider of orderedProviders) {
      const metrics = this.metrics.get(provider.name);
      if (!metrics) continue;
      
      try {
        const startTime = Date.now();
        
        // Update metrics
        metrics.totalRequests++;
        
        // Execute the function
        const result = await fn(provider);
        
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Update success metrics
        metrics.successfulRequests++;
        metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
        metrics.avgResponseTime = (metrics.avgResponseTime * (metrics.successfulRequests - 1) + responseTime) / metrics.successfulRequests;
        
        return result;
      } catch (error) {
        // Update failure metrics
        metrics.failedRequests++;
        metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
        metrics.lastFailure = new Date();
        
        // Save the error for the final throw if all providers fail
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log the failure
        console.error(`Provider ${provider.name} failed: ${error}`);
      }
    }
    
    // If all providers failed, throw the last error
    throw lastError || new Error('All providers failed and no error was captured');
  }
  
  /**
   * Check the health of all providers
   */
  public async checkProvidersHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Check each provider
    for (const provider of this.providers) {
      try {
        results[provider.name] = await provider.isAvailable();
      } catch (error) {
        results[provider.name] = false;
        console.error(`Health check failed for ${provider.name}: ${error}`);
      }
    }
    
    return results;
  }
  
  /**
   * Get metrics for all providers
   */
  public getMetrics(): Record<string, ProviderMetrics> {
    const result: Record<string, ProviderMetrics> = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = { ...metrics };
    }
    
    return result;
  }
  
  /**
   * Get all registered providers
   */
  public getProviders(): string[] {
    return this.providers.map(p => p.name);
  }
  
  /**
   * Set a new primary provider
   */
  public setPrimaryProvider(providerName: string): boolean {
    if (this.providers.some(p => p.name === providerName)) {
      this.primaryProviderName = providerName;
      return true;
    }
    return false;
  }
  
  /**
   * Get the current primary provider
   */
  public getPrimaryProvider(): string {
    return this.primaryProviderName;
  }
  
  /**
   * Initialize metrics for providers
   */
  protected abstract initializeMetrics(): void;
}