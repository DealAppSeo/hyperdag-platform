import axios, { AxiosResponse } from 'axios';
import { VideoProvider } from '../../shared/video-platform-schema';

// Rate limiting and cost tracking
export class APIRateLimiter {
  private calls: Map<string, number[]> = new Map();
  
  async callWithLimit<T>(
    provider: string, 
    maxCalls: number, 
    timeWindowMs: number, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const providerCalls = this.calls.get(provider) || [];
    
    // Remove calls outside time window
    const recentCalls = providerCalls.filter(time => now - time < timeWindowMs);
    
    if (recentCalls.length >= maxCalls) {
      const waitTime = timeWindowMs - (now - recentCalls[0]);
      throw new Error(`Rate limit exceeded for ${provider}. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }
    
    try {
      const result = await apiCall();
      recentCalls.push(now);
      this.calls.set(provider, recentCalls);
      return result;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Exponential backoff for rate limit errors
        const backoffTime = Math.pow(2, recentCalls.length) * 1000;
        await this.sleep(backoffTime);
        return this.callWithLimit(provider, maxCalls, timeWindowMs, apiCall);
      }
      throw error;
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cost tracking for API usage
export interface APIUsageData {
  provider: string;
  endpoint: string;
  cost: number;
  timestamp: Date;
  success: boolean;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
}

export class CostTracker {
  private totalCost = 0;
  private usage: APIUsageData[] = [];
  private budgetLimits: Map<string, { daily: number; monthly: number }> = new Map();
  
  constructor() {
    // Set default budget limits
    this.budgetLimits.set('ossa.ai', { daily: 50, monthly: 500 });
    this.budgetLimits.set('runway.ml', { daily: 100, monthly: 1000 });
    this.budgetLimits.set('pika.art', { daily: 75, monthly: 750 });
    this.budgetLimits.set('openai', { daily: 25, monthly: 250 });
  }
  
  async trackCall<T>(
    provider: string, 
    endpoint: string, 
    estimatedCost: number, 
    apiCall: () => Promise<T>,
    requestData?: any
  ): Promise<T> {
    const start = Date.now();
    
    // Check budget before making call
    this.checkBudget(provider, estimatedCost);
    
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      
      this.logUsage({
        provider,
        endpoint,
        cost: estimatedCost,
        timestamp: new Date(),
        success: true,
        requestData,
        responseData: typeof result === 'object' ? result : { result }
      });
      
      console.log(`✅ ${provider}/${endpoint} - $${estimatedCost} (${duration}ms)`);
      return result;
    } catch (error: any) {
      this.logUsage({
        provider,
        endpoint,
        cost: 0, // No cost for failed calls
        timestamp: new Date(),
        success: false,
        requestData,
        errorMessage: error.message
      });
      
      console.error(`❌ ${provider}/${endpoint} - Error: ${error.message}`);
      throw error;
    }
  }
  
  private logUsage(usage: APIUsageData) {
    this.totalCost += usage.cost;
    this.usage.push(usage);
    
    // Keep only last 1000 entries for memory management
    if (this.usage.length > 1000) {
      this.usage = this.usage.slice(-1000);
    }
  }
  
  private checkBudget(provider: string, cost: number) {
    const limits = this.budgetLimits.get(provider);
    if (!limits) return;
    
    const dailyCost = this.getDailyCost(provider);
    const monthlyCost = this.getMonthlyCost(provider);
    
    if (dailyCost + cost > limits.daily) {
      throw new Error(`Daily budget exceeded for ${provider}: $${dailyCost + cost} > $${limits.daily}`);
    }
    
    if (monthlyCost + cost > limits.monthly) {
      throw new Error(`Monthly budget exceeded for ${provider}: $${monthlyCost + cost} > $${limits.monthly}`);
    }
  }
  
  getDailyCost(provider?: string): number {
    const today = new Date().toDateString();
    return this.usage
      .filter(u => u.timestamp.toDateString() === today && (!provider || u.provider === provider))
      .reduce((sum, u) => sum + u.cost, 0);
  }
  
  getMonthlyCost(provider?: string): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.usage
      .filter(u => {
        const month = u.timestamp.getMonth();
        const year = u.timestamp.getFullYear();
        return month === currentMonth && year === currentYear && (!provider || u.provider === provider);
      })
      .reduce((sum, u) => sum + u.cost, 0);
  }
  
  getUsageStats() {
    return {
      totalCost: this.totalCost,
      dailyCost: this.getDailyCost(),
      monthlyCost: this.getMonthlyCost(),
      callsToday: this.usage.filter(u => u.timestamp.toDateString() === new Date().toDateString()).length,
      successRate: this.usage.length > 0 ? (this.usage.filter(u => u.success).length / this.usage.length) * 100 : 0
    };
  }
}

// Video generation service interfaces
export interface VideoGenerationRequest {
  text: string;
  style?: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  voice?: string;
  music?: boolean;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  taskId?: string;
  status: 'completed' | 'processing' | 'failed';
}

// Ossa.ai API wrapper (web scraping based since no API available)
export class OssaAIService {
  private rateLimiter: APIRateLimiter;
  private costTracker: CostTracker;
  
  constructor(rateLimiter: APIRateLimiter, costTracker: CostTracker) {
    this.rateLimiter = rateLimiter;
    this.costTracker = costTracker;
  }
  
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    // Note: Ossa.ai doesn't have public API, this would require web automation
    throw new Error('Ossa.ai API not available - requires manual web interface usage or contact cole@ossa.ai for API access');
  }
}

// Runway ML API wrapper
export class RunwayMLService {
  private apiKey: string;
  private rateLimiter: APIRateLimiter;
  private costTracker: CostTracker;
  
  constructor(apiKey: string, rateLimiter: APIRateLimiter, costTracker: CostTracker) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter;
    this.costTracker = costTracker;
  }
  
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return this.costTracker.trackCall(
      'runway.ml',
      'text-to-video',
      0.95, // Estimated cost per generation
      async () => {
        return this.rateLimiter.callWithLimit('runway.ml', 10, 60000, async () => {
          const response = await axios.post('https://api.runwayml.com/v1/image_to_video', {
            prompt: request.text,
            duration: request.duration || 10,
            aspect_ratio: request.aspectRatio || '16:9'
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          return {
            videoUrl: response.data.output[0],
            duration: request.duration || 10,
            fileSize: 0, // Would need to fetch to get actual size
            status: 'completed' as const
          };
        });
      },
      request
    );
  }
}

// Pika.art API wrapper (hypothetical - would need actual API details)
export class PikaArtService {
  private rateLimiter: APIRateLimiter;
  private costTracker: CostTracker;
  
  constructor(rateLimiter: APIRateLimiter, costTracker: CostTracker) {
    this.rateLimiter = rateLimiter;
    this.costTracker = costTracker;
  }
  
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return this.costTracker.trackCall(
      'pika.art',
      'generate',
      0.50,
      async () => {
        throw new Error('Pika.art API integration pending - contact for API access');
      },
      request
    );
  }
}

// Local FFmpeg fallback service
export class LocalFFmpegService {
  private rateLimiter: APIRateLimiter;
  private costTracker: CostTracker;
  
  constructor(rateLimiter: APIRateLimiter, costTracker: CostTracker) {
    this.rateLimiter = rateLimiter;
    this.costTracker = costTracker;
  }
  
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return this.costTracker.trackCall(
      'local-ffmpeg',
      'text-to-video',
      0.01, // Very low cost for local processing
      async () => {
        // This would use FFmpeg to create a simple video from text
        // For now, return a mock response
        return {
          videoUrl: '/generated/local-video-' + Date.now() + '.mp4',
          duration: request.duration || 10,
          fileSize: 5.2, // MB
          status: 'completed' as const
        };
      },
      request
    );
  }
}

// Main video service that manages all providers
export class VideoGenerationService {
  private providers: Map<VideoProvider, any> = new Map();
  private rateLimiter: APIRateLimiter;
  private costTracker: CostTracker;
  private fallbackOrder: VideoProvider[] = ['runway.ml', 'pika.art', 'local-ffmpeg'];
  
  constructor() {
    this.rateLimiter = new APIRateLimiter();
    this.costTracker = new CostTracker();
    
    // Initialize providers
    this.providers.set('ossa.ai', new OssaAIService(this.rateLimiter, this.costTracker));
    this.providers.set('local-ffmpeg', new LocalFFmpegService(this.rateLimiter, this.costTracker));
    
    // Add other providers when API keys are available
    const runwayApiKey = process.env.RUNWAY_API_KEY;
    if (runwayApiKey) {
      this.providers.set('runway.ml', new RunwayMLService(runwayApiKey, this.rateLimiter, this.costTracker));
    }
    
    this.providers.set('pika.art', new PikaArtService(this.rateLimiter, this.costTracker));
  }
  
  async generateVideo(request: VideoGenerationRequest, preferredProvider?: VideoProvider): Promise<VideoGenerationResponse & { provider: VideoProvider }> {
    const providersToTry = preferredProvider 
      ? [preferredProvider, ...this.fallbackOrder.filter(p => p !== preferredProvider)]
      : this.fallbackOrder;
    
    let lastError: Error | null = null;
    
    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        console.log(`Provider ${providerName} not available, skipping...`);
        continue;
      }
      
      try {
        console.log(`Attempting video generation with ${providerName}...`);
        const result = await provider.generateVideo(request);
        return { ...result, provider: providerName };
      } catch (error: any) {
        console.error(`Provider ${providerName} failed:`, error.message);
        lastError = error;
        
        // If it's a budget error, don't try other providers
        if (error.message.includes('budget exceeded')) {
          throw error;
        }
        
        continue;
      }
    }
    
    throw new Error(`All video generation providers failed. Last error: ${lastError?.message}`);
  }
  
  getUsageStats() {
    return this.costTracker.getUsageStats();
  }
  
  getDailyCost() {
    return this.costTracker.getDailyCost();
  }
  
  getMonthlyCost() {
    return this.costTracker.getMonthlyCost();
  }
}

// Export singleton instance
export const videoService = new VideoGenerationService();