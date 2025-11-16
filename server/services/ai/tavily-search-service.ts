/**
 * Tavily Search API Service - RAG Augmentation
 * 
 * Provides real-time web search for contextual data
 * Free tier: 100 calls/month for knowledge augmentation
 * Use case: Research tasks, grant writing, partnership building
 */

import { prometheusMetrics } from '../monitoring/prometheus-metrics';

export interface TavilyConfig {
  apiKey?: string;
  baseUrl: string;
  maxResults: number;
  includeImages: boolean;
  includeAnswer: boolean;
}

export interface TavilySearchRequest {
  query: string;
  searchDepth?: 'basic' | 'advanced';
  includeImages?: boolean;
  includeAnswer?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface TavilySearchResult {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    publishedDate?: string;
  }>;
  images?: Array<{
    url: string;
    description: string;
  }>;
  searchMetadata: {
    resultsCount: number;
    searchTime: number;
    searchDepth: string;
  };
}

export class TavilySearchService {
  private config: TavilyConfig;
  private requestCount = 0;
  private monthlyLimit = 100; // Free tier limit
  
  constructor(config?: Partial<TavilyConfig>) {
    this.config = {
      apiKey: process.env.TAVILY_API_KEY,
      baseUrl: 'https://api.tavily.com',
      maxResults: 5,
      includeImages: false,
      includeAnswer: true,
      ...config
    };
    
    console.log('[Tavily] Search service initialized for RAG augmentation');
    
    if (!this.config.apiKey) {
      console.warn('[Tavily] No API key provided - service will not be available');
    }
  }

  /**
   * Perform web search for research augmentation
   */
  async search(request: TavilySearchRequest): Promise<TavilySearchResult> {
    if (!this.isAvailable()) {
      throw new Error('Tavily Search service not available');
    }

    if (this.requestCount >= this.monthlyLimit) {
      throw new Error('Tavily monthly limit reached');
    }

    const startTime = Date.now();

    try {
      const response = await this.callTavilyAPI({
        api_key: this.config.apiKey,
        query: request.query,
        search_depth: request.searchDepth || 'basic',
        include_images: request.includeImages ?? this.config.includeImages,
        include_answer: request.includeAnswer ?? this.config.includeAnswer,
        max_results: request.maxResults || this.config.maxResults,
        include_domains: request.includeDomains,
        exclude_domains: request.excludeDomains
      });

      const latency = Date.now() - startTime;
      this.requestCount++;

      // Record metrics
      prometheusMetrics.recordProviderRequest('tavily', 'search', 'web_search', latency / 1000);
      prometheusMetrics.recordCacheHit('search', 'tavily'); // Assuming some caching

      const result: TavilySearchResult = {
        query: request.query,
        answer: response.answer,
        results: response.results?.map((item: any) => ({
          title: item.title,
          url: item.url,
          content: item.content,
          score: item.score || 0,
          publishedDate: item.published_date
        })) || [],
        images: response.images?.map((img: any) => ({
          url: img.url,
          description: img.description || ''
        })) || [],
        searchMetadata: {
          resultsCount: response.results?.length || 0,
          searchTime: latency,
          searchDepth: request.searchDepth || 'basic'
        }
      };

      return result;

    } catch (error) {
      console.error('[Tavily] Search request failed:', error);
      prometheusMetrics.recordProviderError('tavily', error.message, '500');
      throw error;
    }
  }

  /**
   * Enhanced search for specific use cases
   */
  async searchForGrantOpportunities(keywords: string[]): Promise<TavilySearchResult> {
    const query = `grant opportunities funding ${keywords.join(' ')} 2024 2025`;
    
    return this.search({
      query,
      searchDepth: 'advanced',
      maxResults: 8,
      includeDomains: [
        'grants.gov',
        'nsf.gov',
        'nih.gov',
        'energy.gov',
        'foundation.org'
      ],
      excludeDomains: [
        'scam-grants.com',
        'fake-funding.net'
      ]
    });
  }

  /**
   * Search for partnership opportunities
   */
  async searchForPartnerships(industry: string, keywords: string[]): Promise<TavilySearchResult> {
    const query = `${industry} partnerships collaboration opportunities ${keywords.join(' ')}`;
    
    return this.search({
      query,
      searchDepth: 'advanced',
      maxResults: 6,
      includeDomains: [
        'linkedin.com',
        'techcrunch.com',
        'venturebeat.com',
        'industry-specific-sites'
      ]
    });
  }

  /**
   * Search for conference and events
   */
  async searchForConferences(topic: string, location?: string): Promise<TavilySearchResult> {
    const locationStr = location ? ` in ${location}` : '';
    const query = `${topic} conferences events 2024 2025${locationStr}`;
    
    return this.search({
      query,
      searchDepth: 'basic',
      maxResults: 10,
      includeDomains: [
        'eventbrite.com',
        'meetup.com',
        'conference-sites.com'
      ]
    });
  }

  /**
   * Research market trends and competitive intelligence
   */
  async searchMarketResearch(topic: string): Promise<TavilySearchResult> {
    const query = `${topic} market research trends analysis report 2024`;
    
    return this.search({
      query,
      searchDepth: 'advanced',
      maxResults: 7,
      includeAnswer: true,
      includeDomains: [
        'gartner.com',
        'forrester.com',
        'mckinsey.com',
        'statista.com'
      ]
    });
  }

  /**
   * Call Tavily API
   */
  private async callTavilyAPI(payload: any): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!(this.config.apiKey && this.requestCount < this.monthlyLimit);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    monthlyLimit: number;
    remainingRequests: number;
    utilizationPercent: number;
  } {
    const remainingRequests = Math.max(0, this.monthlyLimit - this.requestCount);
    const utilizationPercent = (this.requestCount / this.monthlyLimit) * 100;
    
    return {
      requestCount: this.requestCount,
      monthlyLimit: this.monthlyLimit,
      remainingRequests,
      utilizationPercent
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        latency: 0,
        error: 'Service not available (no API key or limit reached)'
      };
    }

    const startTime = Date.now();
    
    try {
      await this.search({
        query: 'test connectivity',
        searchDepth: 'basic',
        maxResults: 1
      });
      
      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Reset monthly usage (would typically be called by a cron job)
   */
  resetMonthlyUsage(): void {
    this.requestCount = 0;
    console.log('[Tavily] Monthly usage reset');
  }
}

// Export singleton instance
export const tavilySearchService = new TavilySearchService();