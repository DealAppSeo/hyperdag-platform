/**
 * Perplexity AI Service
 * Real-time web search and up-to-date information
 * OpenAI-compatible API with web search capabilities
 * Free tier: Variable limits
 */

import axios from 'axios';

interface PerplexityConfig {
  apiKey?: string;
  baseURL: string;
  models: string[];
  cacheExpiry: number; // Cache expiry in milliseconds
}

interface PerplexityResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  citations?: string[];
  webSearchUsed?: boolean;
  cached?: boolean;
}

interface CachedQuery {
  response: PerplexityResponse;
  timestamp: number;
  query: string;
}

interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  webSearch?: boolean;
  stream?: boolean;
  systemPrompt?: string;
  citationsEnabled?: boolean;
}

export class PerplexityService {
  private config: PerplexityConfig;
  private isInitialized: boolean = false;
  private requestsThisHour = 0;
  private hourlyLimit = 100; // Conservative estimate for free tier
  private hourResetTime = Date.now() + 3600000; // 1 hour
  private queryCache = new Map<string, CachedQuery>();
  private maxCacheSize = 50;

  constructor() {
    this.config = {
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
      models: [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online',
        'llama-3.1-8b-instruct',
        'llama-3.1-70b-instruct',
        'sonar-pro'
      ],
      cacheExpiry: 1800000 // 30 minutes
    };

    if (this.config.apiKey) {
      this.isInitialized = true;
      console.log('[Perplexity] Service initialized with API key');
      console.log('[Perplexity] Available models:', this.config.models.length);
      console.log('[Perplexity] Capabilities: Real-time web search, up-to-date information');
      console.log('[Perplexity] Query caching enabled with 30min expiry');
    } else {
      console.log('[Perplexity] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    this.resetHourlyCounterIfNeeded();
    return this.isInitialized && this.requestsThisHour < this.hourlyLimit;
  }

  /**
   * Get remaining quota for this hour
   */
  getRemainingQuota(): number {
    this.resetHourlyCounterIfNeeded();
    return Math.max(0, this.hourlyLimit - this.requestsThisHour);
  }

  /**
   * Reset hourly counter if needed
   */
  private resetHourlyCounterIfNeeded(): void {
    if (Date.now() > this.hourResetTime) {
      this.requestsThisHour = 0;
      this.hourResetTime = Date.now() + 3600000;
    }
  }

  /**
   * Generate cache key for query
   */
  private getCacheKey(prompt: string, options: GenerateOptions): string {
    const keyData = {
      prompt: prompt.toLowerCase().trim(),
      model: options.model || 'llama-3.1-sonar-small-128k-online',
      webSearch: options.webSearch,
      temperature: options.temperature || 0.7
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Check cache for recent queries
   */
  private getCachedResponse(cacheKey: string): PerplexityResponse | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheExpiry;
    if (isExpired) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    console.log('[Perplexity] Cache hit - returning cached response');
    return { ...cached.response, cached: true };
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, response: PerplexityResponse, originalQuery: string): void {
    // Implement LRU cache behavior
    if (this.queryCache.size >= this.maxCacheSize) {
      const oldestKey = this.queryCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.queryCache.delete(oldestKey);
      }
    }

    this.queryCache.set(cacheKey, {
      response: { ...response, cached: false },
      timestamp: Date.now(),
      query: originalQuery
    });

    console.log(`[Perplexity] Cached response for future use (${this.queryCache.size}/${this.maxCacheSize})`);
  }

  /**
   * Generate text using Perplexity
   */
  async generateText(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<PerplexityResponse> {
    if (!this.isAvailable()) {
      throw new Error('Perplexity service not available or quota exceeded');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(prompt, options);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const startTime = Date.now();
    const model = options.model || 'llama-3.1-sonar-small-128k-online';
    const webSearchEnabled = options.webSearch !== false; // Default to true for online models

    try {
      const messages = [];
      
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const requestBody = {
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: options.stream || false,
        return_citations: options.citationsEnabled !== false,
        return_images: false,
        return_related_questions: false
      };

      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // Longer timeout for web search
        }
      );

      const latency = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const tokens = response.data.usage?.total_tokens || 0;
      const citations = response.data.citations || [];

      // Update usage tracking
      this.requestsThisHour += 1;

      console.log(`[Perplexity] Generated ${tokens} tokens in ${latency}ms (Web Search: ${webSearchEnabled})`);
      console.log(`[Perplexity] Remaining quota: ${this.getRemainingQuota()}`);
      if (citations.length > 0) {
        console.log(`[Perplexity] Found ${citations.length} citations`);
      }

      const result: PerplexityResponse = {
        content,
        latency,
        cost: 0, // Using free tier
        provider: 'perplexity',
        model,
        success: true,
        tokens,
        citations: citations.map((c: any) => c.url || c),
        webSearchUsed: webSearchEnabled && model.includes('online'),
        cached: false
      };

      // Cache the response
      this.cacheResponse(cacheKey, result, prompt);

      return result;

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Perplexity] Generation error:', error.response?.data || error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'perplexity',
        model,
        success: false,
        tokens: 0,
        webSearchUsed: webSearchEnabled,
        cached: false
      };
    }
  }

  /**
   * Search web for current information
   */
  async searchWeb(
    query: string,
    options: {
      model?: string;
      maxResults?: number;
      focus?: 'academic' | 'news' | 'general';
    } = {}
  ): Promise<PerplexityResponse> {
    const model = options.model || 'llama-3.1-sonar-small-128k-online';
    
    let enhancedQuery = query;
    if (options.focus === 'academic') {
      enhancedQuery = `Academic research on: ${query}. Focus on peer-reviewed sources and scientific publications.`;
    } else if (options.focus === 'news') {
      enhancedQuery = `Latest news about: ${query}. Focus on recent developments and current events.`;
    } else {
      enhancedQuery = `Search for comprehensive information about: ${query}`;
    }

    return this.generateText(enhancedQuery, {
      model,
      webSearch: true,
      citationsEnabled: true,
      systemPrompt: options.focus === 'academic' 
        ? 'You are a research assistant focused on providing accurate academic information with proper citations.'
        : 'You are a helpful assistant that provides current, factual information with reliable sources.'
    });
  }

  /**
   * Generate with real-time information
   */
  async generateWithRealTime(
    prompt: string,
    options: {
      timeframe?: 'today' | 'this-week' | 'this-month';
      sources?: 'news' | 'academic' | 'all';
    } = {}
  ): Promise<PerplexityResponse> {
    let enhancedPrompt = prompt;
    
    if (options.timeframe) {
      const timeFrameText = {
        'today': 'from today',
        'this-week': 'from this week',
        'this-month': 'from this month'
      };
      enhancedPrompt = `${prompt}. Focus on information ${timeFrameText[options.timeframe]}.`;
    }

    return this.generateText(enhancedPrompt, {
      model: 'llama-3.1-sonar-large-128k-online',
      webSearch: true,
      citationsEnabled: true,
      systemPrompt: 'Provide the most current and up-to-date information available, with emphasis on recent developments.'
    });
  }

  /**
   * Get cached queries summary
   */
  getCacheStats() {
    const now = Date.now();
    const activeQueries = Array.from(this.queryCache.entries())
      .filter(([_, cached]) => now - cached.timestamp <= this.config.cacheExpiry);
    
    return {
      totalCached: this.queryCache.size,
      activeQueries: activeQueries.length,
      expiredQueries: this.queryCache.size - activeQueries.length,
      cacheHitRate: this.queryCache.size > 0 ? (activeQueries.length / this.queryCache.size) * 100 : 0,
      oldestQuery: activeQueries.length > 0 
        ? new Date(Math.min(...activeQueries.map(([_, cached]) => cached.timestamp))).toISOString()
        : 'None'
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, cached] of Array.from(this.queryCache.entries())) {
      if (now - cached.timestamp > this.config.cacheExpiry) {
        this.queryCache.delete(key);
        cleared++;
      }
    }

    console.log(`[Perplexity] Cleared ${cleared} expired cache entries`);
    return cleared;
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetHourlyCounterIfNeeded();
    const cacheStats = this.getCacheStats();
    
    return {
      provider: 'Perplexity AI',
      tier: 'free_tier',
      hourlyLimit: this.hourlyLimit,
      requestsThisHour: this.requestsThisHour,
      remainingQuota: this.getRemainingQuota(),
      quotaPercentage: (this.requestsThisHour / this.hourlyLimit) * 100,
      available: this.isAvailable(),
      models: this.config.models,
      cache: cacheStats,
      capabilities: [
        'real_time_web_search',
        'up_to_date_information',
        'citation_support',
        'academic_research',
        'news_search',
        'intelligent_caching',
        'multiple_models',
        'large_context_windows'
      ],
      specialFeatures: [
        'Real-time web access',
        'Citation tracking',
        'Academic focus options',
        'News-specific search',
        'Intelligent query caching',
        'Large context windows (128k)',
        'Multiple reasoning models'
      ],
      limitations: [
        'Hourly rate limits',
        'Free tier restrictions',
        'Web search latency'
      ]
    };
  }
}

export const perplexityService = new PerplexityService();