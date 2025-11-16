/**
 * Hugging Face Inference API Service
 * Free tier with rate limits, excellent model variety
 * Cost: Free tier with optional paid plans
 * Use case: Text generation, embeddings, specialized models, experimentation
 */

import { HfInference } from '@huggingface/inference';

interface HuggingFaceConfig {
  apiKey?: string;
  textModels: string[];
  embeddingModels: string[];
  requestsPerMinute: number;
  requestsPerDay: number;
  baseURL: string;
  retryAttempts: number;
  retryDelay: number;
}

interface HuggingFaceResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  retries?: number;
  coldStart?: boolean;
}

interface EmbeddingResponse {
  embedding: number[];
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  dimensions: number;
  retries?: number;
  coldStart?: boolean;
}

interface HuggingFaceUsageTracking {
  requestsThisMinute: number;
  requestsThisDay: number;
  lastRequestTime: number;
  minuteResetTime: number;
  dayResetTime: number;
  perModelUsage: Map<string, { requests: number; lastUsed: number }>;
}

interface HuggingFaceCircuitBreaker {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttemptTime: number;
  consecutiveColdStarts: number;
}

interface ModelLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  priority: number; // Lower number = higher priority
}

export class HuggingFaceService {
  private config: HuggingFaceConfig;
  private client?: HfInference;
  private isInitialized: boolean = false;
  private usage: HuggingFaceUsageTracking;
  private circuitBreaker: HuggingFaceCircuitBreaker;
  private modelLimits: Map<string, ModelLimits>;

  constructor() {
    this.config = {
      apiKey: process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY,
      textModels: [
        // Popular text generation models
        'microsoft/DialoGPT-medium',
        'gpt2',
        'distilgpt2',
        'EleutherAI/gpt-neo-2.7B',
        'microsoft/DialoGPT-large',
        'facebook/blenderbot-400M-distill',
        'microsoft/DialoGPT-small',
        'EleutherAI/gpt-j-6b',
        'bigscience/bloom-560m',
        'facebook/opt-350m',
        'facebook/opt-1.3b',
        'google/flan-t5-base',
        'google/flan-t5-large',
        'mistralai/Mixtral-8x7B-Instruct-v0.1',
        'mistralai/Mistral-7B-Instruct-v0.1',
        'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
        'meta-llama/Llama-2-7b-chat-hf',
        'codellama/CodeLlama-7b-Python-hf'
      ],
      embeddingModels: [
        // Popular embedding models
        'sentence-transformers/all-MiniLM-L6-v2',
        'sentence-transformers/all-mpnet-base-v2',
        'sentence-transformers/all-roberta-large-v1',
        'sentence-transformers/paraphrase-MiniLM-L6-v2',
        'sentence-transformers/distilbert-base-nli-stsb-mean-tokens',
        'sentence-transformers/multi-qa-MiniLM-L6-cos-v1',
        'BAAI/bge-small-en-v1.5',
        'BAAI/bge-base-en-v1.5',
        'thenlper/gte-small',
        'thenlper/gte-base'
      ],
      requestsPerMinute: 1000, // Conservative estimate for free tier
      requestsPerDay: 10000, // Daily limit
      baseURL: 'https://api-inference.huggingface.co',
      retryAttempts: 3,
      retryDelay: 1000 // 1 second base delay
    };

    this.usage = {
      requestsThisMinute: 0,
      requestsThisDay: 0,
      lastRequestTime: 0,
      minuteResetTime: Date.now() + 60000,
      dayResetTime: this.getNextDayTimestamp(),
      perModelUsage: new Map()
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
      nextAttemptTime: 0,
      consecutiveColdStarts: 0
    };

    // Define per-model limits (some models are more popular and have stricter limits)
    this.modelLimits = new Map([
      // High-priority, well-cached models
      ['sentence-transformers/all-MiniLM-L6-v2', { requestsPerMinute: 100, requestsPerDay: 1000, priority: 1 }],
      ['distilgpt2', { requestsPerMinute: 60, requestsPerDay: 600, priority: 1 }],
      ['gpt2', { requestsPerMinute: 30, requestsPerDay: 300, priority: 2 }],
      
      // Medium-priority models
      ['microsoft/DialoGPT-medium', { requestsPerMinute: 20, requestsPerDay: 200, priority: 3 }],
      ['sentence-transformers/all-mpnet-base-v2', { requestsPerMinute: 40, requestsPerDay: 400, priority: 2 }],
      ['google/flan-t5-base', { requestsPerMinute: 25, requestsPerDay: 250, priority: 3 }],
      
      // Lower-priority, potentially cold models
      ['EleutherAI/gpt-j-6b', { requestsPerMinute: 5, requestsPerDay: 50, priority: 4 }],
      ['mistralai/Mixtral-8x7B-Instruct-v0.1', { requestsPerMinute: 3, requestsPerDay: 30, priority: 5 }],
      ['meta-llama/Llama-2-7b-chat-hf', { requestsPerMinute: 3, requestsPerDay: 30, priority: 5 }]
    ]);

    if (this.config.apiKey) {
      this.client = new HfInference(this.config.apiKey);
      this.isInitialized = true;
      console.log('[HuggingFace] Service initialized with API key');
      console.log('[HuggingFace] Free tier: ~1K requests/minute, 10K requests/day');
      console.log('[HuggingFace] Text models:', this.config.textModels.length);
      console.log('[HuggingFace] Embedding models:', this.config.embeddingModels.length);
      console.log('[HuggingFace] Per-model rate limiting enabled');
    } else {
      console.log('[HuggingFace] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is ready (initialized)
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(model?: string): boolean {
    this.resetCountersIfNeeded();
    
    // Check circuit breaker
    if (this.circuitBreaker.state === 'open') {
      if (Date.now() > this.circuitBreaker.nextAttemptTime) {
        this.circuitBreaker.state = 'half-open';
        console.log('[HuggingFace] Circuit breaker: Attempting recovery');
      } else {
        return false;
      }
    }

    // Check global quotas
    if (!this.isInitialized || 
        this.usage.requestsThisMinute >= this.config.requestsPerMinute ||
        this.usage.requestsThisDay >= this.config.requestsPerDay) {
      return false;
    }

    // Check per-model quotas if model specified
    if (model) {
      const modelLimits = this.modelLimits.get(model);
      if (modelLimits) {
        const modelUsage = this.usage.perModelUsage.get(model);
        if (modelUsage) {
          // Reset model usage counters
          const now = Date.now();
          if (now - modelUsage.lastUsed > 60000) {
            this.usage.perModelUsage.set(model, { requests: 0, lastUsed: now });
          } else if (modelUsage.requests >= modelLimits.requestsPerMinute) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(model?: string): {
    requestsPerMinute: number;
    requestsPerDay: number;
    percentage: number;
    modelSpecific?: { requests: number; limit: number };
  } {
    this.resetCountersIfNeeded();
    
    const remainingMinute = Math.max(0, this.config.requestsPerMinute - this.usage.requestsThisMinute);
    const remainingDay = Math.max(0, this.config.requestsPerDay - this.usage.requestsThisDay);
    const percentageUsed = (this.usage.requestsThisDay / this.config.requestsPerDay) * 100;

    const result: any = {
      requestsPerMinute: remainingMinute,
      requestsPerDay: remainingDay,
      percentage: percentageUsed
    };

    if (model) {
      const modelLimits = this.modelLimits.get(model);
      const modelUsage = this.usage.perModelUsage.get(model);
      if (modelLimits) {
        const used = modelUsage?.requests || 0;
        result.modelSpecific = {
          requests: Math.max(0, modelLimits.requestsPerMinute - used),
          limit: modelLimits.requestsPerMinute
        };
      }
    }

    return result;
  }

  /**
   * Generate text using Hugging Face models
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
      repetitionPenalty?: number;
      doSample?: boolean;
      useCache?: boolean;
      waitForModel?: boolean;
    } = {}
  ): Promise<HuggingFaceResponse> {
    const model = options.model || 'distilgpt2';
    
    if (!this.isAvailable(model)) {
      throw new Error(`HuggingFace service not available or quota exceeded for model: ${model}`);
    }

    const startTime = Date.now();
    let retries = 0;
    let coldStart = false;

    const performRequest = async (): Promise<HuggingFaceResponse> => {
      try {
        const parameters: any = {
          max_new_tokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
          do_sample: options.doSample !== false,
          use_cache: options.useCache !== false,
          wait_for_model: options.waitForModel || true
        };

        if (options.topK) parameters.top_k = options.topK;
        if (options.topP) parameters.top_p = options.topP;
        if (options.repetitionPenalty) parameters.repetition_penalty = options.repetitionPenalty;

        const response = await this.client!.textGeneration({
          model,
          inputs: prompt,
          parameters
        });

        const latency = Date.now() - startTime;
        const content = response.generated_text || '';
        const estimatedTokens = Math.ceil((prompt.length + content.length) / 4);

        // Update usage tracking
        this.updateUsageTracking(model);
        this.handleSuccess();

        console.log(`[HuggingFace] Generated ${estimatedTokens} tokens in ${latency}ms using ${model}`);
        console.log(`[HuggingFace] Retries: ${retries}, Cold start: ${coldStart}`);

        return {
          content,
          latency,
          cost: 0, // Free tier
          provider: 'huggingface',
          model,
          success: true,
          tokens: estimatedTokens,
          retries,
          coldStart
        };

      } catch (error: any) {
        const is503 = error.message?.includes('503') || error.status === 503;
        const isLoading = error.message?.includes('loading') || error.message?.includes('currently loading');
        
        if ((is503 || isLoading) && retries < this.config.retryAttempts) {
          coldStart = true;
          retries++;
          console.log(`[HuggingFace] Model ${model} cold start detected. Retry ${retries}/${this.config.retryAttempts}`);
          
          // Exponential backoff for cold starts
          const delay = this.config.retryDelay * Math.pow(2, retries - 1);
          await this.sleep(delay);
          
          // Track consecutive cold starts for circuit breaker
          this.circuitBreaker.consecutiveColdStarts++;
          
          return performRequest();
        }

        throw error;
      }
    };

    try {
      return await performRequest();
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.handleFailure(error);
      
      console.error(`[HuggingFace] Generation error with ${model}:`, error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'huggingface',
        model,
        success: false,
        tokens: 0,
        retries,
        coldStart
      };
    }
  }

  /**
   * Generate embeddings using Hugging Face models
   */
  async generateEmbedding(
    text: string,
    options: {
      model?: string;
      waitForModel?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<EmbeddingResponse> {
    const model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
    
    if (!this.isAvailable(model)) {
      throw new Error(`HuggingFace service not available or quota exceeded for model: ${model}`);
    }

    const startTime = Date.now();
    let retries = 0;
    let coldStart = false;

    const performRequest = async (): Promise<EmbeddingResponse> => {
      try {
        const response = await this.client!.featureExtraction({
          model,
          inputs: text,
          options: {
            wait_for_model: options.waitForModel || true,
            use_cache: options.useCache !== false
          }
        });

        const latency = Date.now() - startTime;
        
        // Handle different response formats
        let embedding: number[];
        if (Array.isArray(response) && Array.isArray(response[0])) {
          // 2D array - take first row
          embedding = response[0] as number[];
        } else if (Array.isArray(response)) {
          // 1D array
          embedding = response as number[];
        } else {
          throw new Error('Unexpected embedding response format');
        }

        // Update usage tracking
        this.updateUsageTracking(model);
        this.handleSuccess();

        console.log(`[HuggingFace] Generated ${embedding.length}D embedding in ${latency}ms using ${model}`);
        console.log(`[HuggingFace] Retries: ${retries}, Cold start: ${coldStart}`);

        return {
          embedding,
          latency,
          cost: 0, // Free tier
          provider: 'huggingface',
          model,
          success: true,
          dimensions: embedding.length,
          retries,
          coldStart
        };

      } catch (error: any) {
        const is503 = error.message?.includes('503') || error.status === 503;
        const isLoading = error.message?.includes('loading') || error.message?.includes('currently loading');
        
        if ((is503 || isLoading) && retries < this.config.retryAttempts) {
          coldStart = true;
          retries++;
          console.log(`[HuggingFace] Model ${model} cold start detected. Retry ${retries}/${this.config.retryAttempts}`);
          
          // Exponential backoff for cold starts
          const delay = this.config.retryDelay * Math.pow(2, retries - 1);
          await this.sleep(delay);
          
          this.circuitBreaker.consecutiveColdStarts++;
          
          return performRequest();
        }

        throw error;
      }
    };

    try {
      return await performRequest();
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.handleFailure(error);
      
      console.error(`[HuggingFace] Embedding error with ${model}:`, error.message);
      
      return {
        embedding: [],
        latency,
        cost: 0,
        provider: 'huggingface',
        model,
        success: false,
        dimensions: 0,
        retries,
        coldStart
      };
    }
  }

  /**
   * Get recommended model based on use case
   */
  getRecommendedModel(
    task: 'text-generation' | 'embeddings' | 'chat' | 'code' | 'fast-text' | 'high-quality-embeddings'
  ): string {
    const recommendations = {
      'text-generation': 'distilgpt2', // Fast, reliable
      'embeddings': 'sentence-transformers/all-MiniLM-L6-v2', // Fast, good quality
      'chat': 'microsoft/DialoGPT-medium', // Conversational
      'code': 'codellama/CodeLlama-7b-Python-hf', // Code-specialized
      'fast-text': 'distilgpt2', // Fastest text generation
      'high-quality-embeddings': 'sentence-transformers/all-mpnet-base-v2' // Higher quality embeddings
    };

    return recommendations[task] || recommendations['text-generation'];
  }

  /**
   * Batch process multiple texts
   */
  async batchGenerate(
    prompts: string[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      concurrency?: number;
    } = {}
  ): Promise<HuggingFaceResponse[]> {
    const concurrency = options.concurrency || 3; // Conservative concurrency
    const results: HuggingFaceResponse[] = [];
    
    // Process in chunks to respect rate limits
    for (let i = 0; i < prompts.length; i += concurrency) {
      const chunk = prompts.slice(i, i + concurrency);
      const promises = chunk.map(prompt => 
        this.generateText(prompt, options).catch(error => ({
          content: '',
          latency: 0,
          cost: 0,
          provider: 'huggingface',
          model: options.model || 'distilgpt2',
          success: false,
          tokens: 0,
          error: error.message
        }))
      );

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);

      // Brief delay between chunks to respect rate limits
      if (i + concurrency < prompts.length) {
        await this.sleep(200);
      }
    }

    return results;
  }

  /**
   * Update usage tracking
   */
  private updateUsageTracking(model: string): void {
    this.usage.requestsThisMinute += 1;
    this.usage.requestsThisDay += 1;
    this.usage.lastRequestTime = Date.now();

    // Update per-model usage
    const modelUsage = this.usage.perModelUsage.get(model);
    if (modelUsage) {
      modelUsage.requests += 1;
      modelUsage.lastUsed = Date.now();
    } else {
      this.usage.perModelUsage.set(model, { requests: 1, lastUsed: Date.now() });
    }
  }

  /**
   * Reset usage counters when time periods expire
   */
  private resetCountersIfNeeded(): void {
    const now = Date.now();
    
    // Reset minute counter
    if (now > this.usage.minuteResetTime) {
      this.usage.requestsThisMinute = 0;
      this.usage.minuteResetTime = now + 60000;
      
      // Reset per-model minute counters
      this.usage.perModelUsage.clear();
    }

    // Reset daily counter
    if (now > this.usage.dayResetTime) {
      this.usage.requestsThisDay = 0;
      this.usage.dayResetTime = this.getNextDayTimestamp();
    }
  }

  /**
   * Get next day timestamp
   */
  private getNextDayTimestamp(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Handle successful request for circuit breaker
   */
  private handleSuccess(): void {
    if (this.circuitBreaker.failures > 0) {
      console.log('[HuggingFace] Circuit breaker: Reset after successful request');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.consecutiveColdStarts = 0;
  }

  /**
   * Handle failed request for circuit breaker
   */
  private handleFailure(error: any): void {
    this.circuitBreaker.failures += 1;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Different thresholds for different error types
    const maxFailures = this.circuitBreaker.consecutiveColdStarts > 5 ? 3 : 8;
    const breakerTimeout = this.circuitBreaker.consecutiveColdStarts > 5 ? 60000 : 30000;

    if (this.circuitBreaker.failures >= maxFailures) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttemptTime = Date.now() + breakerTimeout;
      console.error(`[HuggingFace] Circuit breaker OPEN after ${maxFailures} failures. Retry in ${breakerTimeout/1000}s`);
    } else {
      console.warn(`[HuggingFace] Circuit breaker: ${this.circuitBreaker.failures}/${maxFailures} failures`);
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetCountersIfNeeded();
    const quota = this.getRemainingQuota();
    
    // Get model usage stats
    const modelStats = Array.from(this.usage.perModelUsage.entries()).map(([model, usage]) => ({
      model,
      requests: usage.requests,
      lastUsed: new Date(usage.lastUsed).toISOString(),
      limits: this.modelLimits.get(model)
    }));

    return {
      provider: 'Hugging Face',
      tier: 'free',
      dailyLimit: this.config.requestsPerDay,
      requestsUsedToday: this.usage.requestsThisDay,
      remainingQuota: quota.requestsPerDay,
      quotaPercentage: quota.percentage,
      requestsThisMinute: this.usage.requestsThisMinute,
      maxRequestsPerMinute: this.config.requestsPerMinute,
      available: this.isAvailable(),
      textModels: this.config.textModels,
      embeddingModels: this.config.embeddingModels,
      totalModels: this.config.textModels.length + this.config.embeddingModels.length,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures,
      consecutiveColdStarts: this.circuitBreaker.consecutiveColdStarts,
      modelUsage: modelStats,
      capabilities: [
        'text_generation',
        'embeddings',
        'feature_extraction',
        'conversational',
        'code_generation',
        'multilingual',
        'specialized_models',
        'batch_processing',
        'cold_start_handling'
      ],
      specialFeatures: [
        'Huge model variety (thousands of models)',
        'Free tier with generous limits',
        'Automatic cold start handling with retries',
        'Per-model rate limiting',
        'Batch processing support',
        'Circuit breaker for reliability',
        'Model recommendations by use case',
        'No setup required for most models'
      ],
      limitations: [
        'Cold starts for less popular models',
        'Rate limiting varies by model popularity',
        'Some models may be temporarily unavailable',
        'Quality varies significantly between models',
        'Limited context length for many models'
      ],
      recommendations: {
        'Fast & reliable text': 'distilgpt2',
        'Best embeddings': 'sentence-transformers/all-MiniLM-L6-v2',
        'Conversational': 'microsoft/DialoGPT-medium',
        'Code generation': 'codellama/CodeLlama-7b-Python-hf',
        'High-quality embeddings': 'sentence-transformers/all-mpnet-base-v2'
      }
    };
  }
}

export const huggingFaceService = new HuggingFaceService();
export default HuggingFaceService;