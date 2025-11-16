/**
 * Cached AI Service Routing with DragonflyDB
 * 
 * Implements dynamic load balancing and intelligent caching
 * to improve success rate from 78.7% to target >85%
 */

import crypto from 'crypto';
import { Redis } from 'ioredis';

export interface CachedRouteConfig {
  provider: string;
  query: string;
  priority: number;
  cacheTTL: number;
  retryAttempts: number;
}

export interface RouteResult {
  result: any;
  provider: string;
  cached: boolean;
  latency: number;
  cost: number;
  timestamp: number;
}

export class CachedRoutingService {
  private dragonflyClient: Redis;
  private providerHealth: Map<string, number> = new Map();
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Connect to DragonflyDB LEARNER (DB1) for pattern discovery cache
    this.dragonflyClient = new Redis({
      host: process.env.DRAGONFLY_HOST || 'localhost',
      port: parseInt(process.env.DRAGONFLY_PORT || '6380'),
      db: 1, // Use DB1 (LEARNER) for caching
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      lazyConnect: true
    });

    this.initializeHealthTracking();
  }

  /**
   * Route AI request with intelligent caching and failover
   */
  async routeWithCache(config: CachedRouteConfig): Promise<RouteResult> {
    const startTime = Date.now();
    
    // Create cache key from query hash
    const cacheKey = this.createCacheKey(config.provider, config.query);
    
    try {
      // Try cache first
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          cached: true,
          latency: Date.now() - startTime
        };
      }

      // Execute with intelligent provider selection
      const result = await this.executeWithFailover(config);
      
      // Cache successful results
      if (result.result && !result.error) {
        await this.cacheResult(cacheKey, result, config.cacheTTL);
      }

      return {
        ...result,
        cached: false,
        latency: Date.now() - startTime
      };

    } catch (error) {
      console.error('[Cached Routing] Route failed:', error.message);
      return {
        result: null,
        provider: config.provider,
        cached: false,
        latency: Date.now() - startTime,
        cost: 0,
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Execute with intelligent failover based on provider health
   */
  private async executeWithFailover(config: CachedRouteConfig): Promise<RouteResult> {
    await this.updateProviderHealth();
    
    // Get provider priority list based on health and cost
    const prioritizedProviders = this.getPrioritizedProviders(config.provider);
    
    let lastError: Error | null = null;
    
    for (const provider of prioritizedProviders) {
      try {
        const result = await this.callProvider(provider, config.query);
        
        // Update health on success
        this.providerHealth.set(provider, Math.min(1.0, (this.providerHealth.get(provider) || 0.5) + 0.1));
        
        return {
          result: result.content,
          provider: provider,
          cached: false,
          latency: result.latency || 0,
          cost: result.cost || 0,
          timestamp: Date.now()
        };
        
      } catch (error) {
        lastError = error as Error;
        // Decrease provider health on failure
        this.providerHealth.set(provider, Math.max(0.0, (this.providerHealth.get(provider) || 0.5) - 0.2));
        console.warn(`[Cached Routing] Provider ${provider} failed:`, error.message);
        continue;
      }
    }
    
    throw lastError || new Error('All providers failed');
  }

  /**
   * Get prioritized provider list based on health, cost, and availability
   */
  private getPrioritizedProviders(preferredProvider: string): string[] {
    const providers = [
      'deepseek',      // Cost-effective primary
      'huggingface',   // Free tier fallback
      'myninja',       // Specialized tasks
      'asi1',          // Advanced intelligence
      'anthropic'      // Premium quality
    ];
    
    // Sort by health score and cost efficiency
    return providers.sort((a, b) => {
      const healthA = this.providerHealth.get(a) || 0.5;
      const healthB = this.providerHealth.get(b) || 0.5;
      
      // Prefer free tier providers when health is similar
      if (Math.abs(healthA - healthB) < 0.2) {
        if (a === 'huggingface') return -1;
        if (b === 'huggingface') return 1;
      }
      
      return healthB - healthA; // Higher health first
    });
  }

  /**
   * Create deterministic cache key
   */
  private createCacheKey(provider: string, query: string): string {
    const hash = crypto.createHash('sha256').update(query).digest('hex').substring(0, 16);
    return `ai_route:${provider}:${hash}`;
  }

  /**
   * Get cached result from DragonflyDB
   */
  private async getCachedResult(cacheKey: string): Promise<RouteResult | null> {
    try {
      const cached = await this.dragonflyClient.get(cacheKey);
      if (cached) {
        const result = JSON.parse(cached);
        console.log('[Cached Routing] Cache hit:', cacheKey);
        return result;
      }
    } catch (error) {
      console.warn('[Cached Routing] Cache read failed:', error.message);
    }
    return null;
  }

  /**
   * Cache result in DragonflyDB
   */
  private async cacheResult(cacheKey: string, result: RouteResult, ttl: number): Promise<void> {
    try {
      await this.dragonflyClient.setex(cacheKey, ttl, JSON.stringify({
        result: result.result,
        provider: result.provider,
        cost: result.cost,
        timestamp: result.timestamp
      }));
      console.log('[Cached Routing] Cached result:', cacheKey);
    } catch (error) {
      console.warn('[Cached Routing] Cache write failed:', error.message);
    }
  }

  /**
   * Call actual AI provider (integrated with real services)
   */
  private async callProvider(provider: string, query: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      switch (provider) {
        case 'deepseek':
          const { DeepSeekService } = await import('./deepseek-service');
          const deepseekService = new DeepSeekService();
          await deepseekService.initialize();
          const deepseekResponse = await deepseekService.generateResponse(query);
          return { 
            content: deepseekResponse.content, 
            latency: Date.now() - startTime, 
            cost: 0.001 
          };
          
        case 'huggingface':
          const { default: HuggingFaceService } = await import('./huggingface-service');
          const hfService = new HuggingFaceService();
          const hfResponse = await hfService.generateText(query, { model: 'microsoft/DialoGPT-medium' });
          return { 
            content: hfResponse, 
            latency: Date.now() - startTime, 
            cost: 0 
          };
          
        case 'myninja':
          const { default: MyNinjaService } = await import('./myninja-service');
          const myninjaService = new MyNinjaService();
          const myninjaResponse = await myninjaService.generateResponse(query);
          return { 
            content: myninjaResponse.content, 
            latency: Date.now() - startTime, 
            cost: 0.002 
          };
          
        case 'anthropic':
          // Use existing Anthropic client if available
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          if (!process.env.ANTHROPIC_API_KEY) throw new Error('Anthropic API key not available');
          const anthropic = new Anthropic({ 
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseURL: "https://anthropic.helicone.ai",
            defaultHeaders: { "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}` }
          });
          const anthropicResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [{ role: 'user', content: query }]
          });
          return {
            content: anthropicResponse.content[0].type === 'text' ? anthropicResponse.content[0].text : '',
            latency: Date.now() - startTime,
            cost: 0.003
          };
          
        case 'asi1':
          const { ASi1Service } = await import('./asi1-service');
          const asi1Service = new ASi1Service();
          await asi1Service.initialize();
          const asi1Response = await asi1Service.generateResponse(query);
          return { 
            content: asi1Response.content, 
            latency: Date.now() - startTime, 
            cost: 0.004 
          };
        
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[Cached Routing] Provider ${provider} error:`, error.message);
      throw error;
    }
  }

  /**
   * Initialize health tracking for all providers
   */
  private initializeHealthTracking(): void {
    const providers = ['deepseek', 'huggingface', 'myninja', 'asi1', 'anthropic'];
    providers.forEach(provider => {
      this.providerHealth.set(provider, 0.5); // Start with neutral health
    });
  }

  /**
   * Update provider health based on recent performance
   */
  private async updateProviderHealth(): Promise<void> {
    if (Date.now() - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return; // Don't check too frequently
    }

    this.lastHealthCheck = Date.now();
    
    // This could query recent success rates from your orchestrator
    // For now, maintain current health scores
  }

  /**
   * Get current provider health status
   */
  getProviderHealth(): Record<string, number> {
    const health: Record<string, number> = {};
    for (const [provider, score] of this.providerHealth) {
      health[provider] = score;
    }
    return health;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hitRate: number; totalKeys: number; memoryUsage: string }> {
    try {
      const info = await this.dragonflyClient.info('stats');
      const keys = await this.dragonflyClient.dbsize();
      
      // Parse cache hit rate from info (if available)
      const hitRateMatch = info.match(/keyspace_hits:(\d+)/);
      const missRateMatch = info.match(/keyspace_misses:(\d+)/);
      
      const hits = hitRateMatch ? parseInt(hitRateMatch[1]) : 0;
      const misses = missRateMatch ? parseInt(missRateMatch[1]) : 0;
      const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;
      
      return {
        hitRate,
        totalKeys: keys,
        memoryUsage: 'N/A' // Would need memory info parsing
      };
    } catch (error) {
      return { hitRate: 0, totalKeys: 0, memoryUsage: 'Error' };
    }
  }
}

// Export singleton instance
export const cachedRoutingService = new CachedRoutingService();