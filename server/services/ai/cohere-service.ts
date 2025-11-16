/**
 * Cohere AI Service
 * Command-R and Command-R-Plus models with /v2/chat endpoint
 * Cost-effective pricing with strong reasoning capabilities
 * Use case: Advanced reasoning, RAG, tool use, multilingual support
 */

import { CohereClientV2 } from 'cohere-ai';

interface CohereConfig {
  apiKey?: string;
  models: string[];
  requestsPerMinute: number;
  tokensPerMonth: number;
  baseURL: string;
}

interface CohereResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  inputTokens?: number;
  outputTokens?: number;
}

interface CohereUsageTracking {
  requestsThisMinute: number;
  tokensThisMonth: number;
  lastRequestTime: number;
  minuteResetTime: number;
  monthResetTime: number;
}

interface CohereCircuitBreaker {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttemptTime: number;
}

export class CohereService {
  private config: CohereConfig;
  private client?: CohereClientV2;
  private isInitialized: boolean = false;
  private usage: CohereUsageTracking;
  private circuitBreaker: CohereCircuitBreaker;

  constructor() {
    this.config = {
      apiKey: process.env.COHERE_API_KEY,
      models: [
        'command-r-plus-08-2024',
        'command-r-plus-04-2024', 
        'command-r-08-2024',
        'command-r-03-2024',
        'command-r7b-12-2024',
        'command-r-plus'
      ],
      requestsPerMinute: 1000, // Rate limit
      tokensPerMonth: 1000000, // Generous free tier
      baseURL: 'https://api.cohere.com'
    };

    this.usage = {
      requestsThisMinute: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      minuteResetTime: Date.now() + 60000,
      monthResetTime: this.getNextMonthResetTime()
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
      nextAttemptTime: 0
    };

    if (this.config.apiKey) {
      this.client = new CohereClientV2({
        token: this.config.apiKey,
        environment: 'production'
      });
      this.isInitialized = true;
      console.log('[Cohere] Service initialized with API key');
      console.log('[Cohere] Free tier: 1M tokens/month, 1000 requests/minute');
      console.log('[Cohere] Available models:', this.config.models.length);
      console.log('[Cohere] Using /v2/chat endpoint for Command-R models');
    } else {
      console.log('[Cohere] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    this.resetCountersIfNeeded();
    
    // Check circuit breaker
    if (this.circuitBreaker.state === 'open') {
      if (Date.now() > this.circuitBreaker.nextAttemptTime) {
        this.circuitBreaker.state = 'half-open';
        console.log('[Cohere] Circuit breaker: Attempting recovery');
      } else {
        return false;
      }
    }

    return (
      this.isInitialized && 
      this.usage.requestsThisMinute < this.config.requestsPerMinute &&
      this.usage.tokensThisMonth < this.config.tokensPerMonth
    );
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(): {
    requestsPerMinute: number;
    tokensPerMonth: number;
    percentage: number;
  } {
    this.resetCountersIfNeeded();
    
    const remainingRequests = Math.max(0, this.config.requestsPerMinute - this.usage.requestsThisMinute);
    const remainingTokens = Math.max(0, this.config.tokensPerMonth - this.usage.tokensThisMonth);
    const percentageUsed = (this.usage.tokensThisMonth / this.config.tokensPerMonth) * 100;

    return {
      requestsPerMinute: remainingRequests,
      tokensPerMonth: remainingTokens,
      percentage: percentageUsed
    };
  }

  /**
   * Generate text using Cohere Command-R models
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
      stream?: boolean;
    } = {}
  ): Promise<CohereResponse> {
    if (!this.isAvailable()) {
      throw new Error('Cohere service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'command-r-plus-08-2024';

    try {
      const response = await this.client!.chat({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        p: options.topP || 0.95,
        k: options.topK || 0,
        frequencyPenalty: options.frequencyPenalty || 0.0,
        presencePenalty: options.presencePenalty || 0.0,
        stopSequences: options.stopSequences || []
      });

      const latency = Date.now() - startTime;
      const content = response.message?.content?.[0]?.text || '';
      const usage = response.usage as any || {};
      const inputTokens = usage.inputTokens || usage.tokensInput || usage.input_tokens || 0;
      const outputTokens = usage.outputTokens || usage.tokensOutput || usage.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      // Update usage tracking
      this.usage.requestsThisMinute += 1;
      this.usage.tokensThisMonth += totalTokens;
      this.usage.lastRequestTime = Date.now();

      // Update circuit breaker on success
      this.handleSuccess();

      console.log(`[Cohere] Generated ${outputTokens} tokens in ${latency}ms`);
      console.log(`[Cohere] Remaining quota: ${this.getRemainingQuota().tokensPerMonth} tokens`);

      return {
        content,
        latency,
        cost: this.calculateCost(inputTokens, outputTokens, model),
        provider: 'cohere',
        model,
        success: true,
        tokens: totalTokens,
        inputTokens,
        outputTokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      // Update circuit breaker on failure
      this.handleFailure(error);

      console.error('[Cohere] Generation error:', error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'cohere',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Generate text with Retrieval-Augmented Generation (RAG)
   */
  async generateWithRAG(
    prompt: string,
    documents: Array<{ title: string; content: string }>,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      citationMode?: 'fast' | 'accurate';
    } = {}
  ): Promise<CohereResponse> {
    if (!this.isAvailable()) {
      throw new Error('Cohere service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'command-r-plus-08-2024';

    try {
      const response = await this.client!.chat({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        documents: documents.map(doc => ({
          id: doc.title,
          data: {
            title: doc.title,
            content: doc.content
          }
        })),
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.3
      });

      const latency = Date.now() - startTime;
      const content = response.message?.content?.[0]?.text || '';
      const usage = response.usage as any || {};
      const inputTokens = usage.inputTokens || usage.tokensInput || usage.input_tokens || 0;
      const outputTokens = usage.outputTokens || usage.tokensOutput || usage.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      // Update usage tracking
      this.usage.requestsThisMinute += 1;
      this.usage.tokensThisMonth += totalTokens;
      this.usage.lastRequestTime = Date.now();

      this.handleSuccess();

      return {
        content,
        latency,
        cost: this.calculateCost(inputTokens, outputTokens, model),
        provider: 'cohere',
        model,
        success: true,
        tokens: totalTokens,
        inputTokens,
        outputTokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.handleFailure(error);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'cohere',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Generate text with tool use capabilities
   */
  async generateWithTools(
    prompt: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<CohereResponse> {
    if (!this.isAvailable()) {
      throw new Error('Cohere service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'command-r-plus-08-2024';

    try {
      const response = await this.client!.chat({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        })),
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      });

      const latency = Date.now() - startTime;
      const content = response.message?.content?.[0]?.text || '';
      const usage = response.usage as any || {};
      const inputTokens = usage.inputTokens || usage.tokensInput || usage.input_tokens || 0;
      const outputTokens = usage.outputTokens || usage.tokensOutput || usage.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      // Update usage tracking
      this.usage.requestsThisMinute += 1;
      this.usage.tokensThisMonth += totalTokens;
      this.usage.lastRequestTime = Date.now();

      this.handleSuccess();

      return {
        content,
        latency,
        cost: this.calculateCost(inputTokens, outputTokens, model),
        provider: 'cohere',
        model,
        success: true,
        tokens: totalTokens,
        inputTokens,
        outputTokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.handleFailure(error);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'cohere',
        model,
        success: false,
        tokens: 0
      };
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
    }

    // Reset monthly counter
    if (now > this.usage.monthResetTime) {
      this.usage.tokensThisMonth = 0;
      this.usage.monthResetTime = this.getNextMonthResetTime();
    }
  }

  /**
   * Get next month reset time
   */
  private getNextMonthResetTime(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  /**
   * Handle successful request for circuit breaker
   */
  private handleSuccess(): void {
    if (this.circuitBreaker.failures > 0) {
      console.log('[Cohere] Circuit breaker: Reset after successful request');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  /**
   * Handle failed request for circuit breaker
   */
  private handleFailure(error: any): void {
    this.circuitBreaker.failures += 1;
    this.circuitBreaker.lastFailureTime = Date.now();

    const maxFailures = 5;
    const breakerTimeout = 30000; // 30 seconds

    if (this.circuitBreaker.failures >= maxFailures) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttemptTime = Date.now() + breakerTimeout;
      console.error(`[Cohere] Circuit breaker OPEN after ${maxFailures} failures. Retry in ${breakerTimeout/1000}s`);
    } else {
      console.warn(`[Cohere] Circuit breaker: ${this.circuitBreaker.failures}/${maxFailures} failures`);
    }
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    // Cohere pricing (per 1K tokens, as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'command-r-plus-08-2024': { input: 0.003, output: 0.015 },
      'command-r-plus-04-2024': { input: 0.003, output: 0.015 },
      'command-r-plus': { input: 0.003, output: 0.015 },
      'command-r-08-2024': { input: 0.00015, output: 0.0006 },
      'command-r-03-2024': { input: 0.0005, output: 0.0015 },
      'command-r7b-12-2024': { input: 0.00003, output: 0.00012 }
    };

    const rates = pricing[model] || pricing['command-r-08-2024'];
    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetCountersIfNeeded();
    const quota = this.getRemainingQuota();
    
    return {
      provider: 'Cohere',
      tier: 'free_trial',
      monthlyLimit: this.config.tokensPerMonth,
      tokensUsedThisMonth: this.usage.tokensThisMonth,
      remainingQuota: quota.tokensPerMonth,
      quotaPercentage: quota.percentage,
      requestsThisMinute: this.usage.requestsThisMinute,
      maxRequestsPerMinute: this.config.requestsPerMinute,
      available: this.isAvailable(),
      models: this.config.models,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures,
      capabilities: [
        'text_generation',
        'reasoning',
        'rag_retrieval',
        'tool_use',
        'multilingual',
        'code_generation',
        'summarization',
        'analysis',
        'citations',
        'structured_output'
      ],
      specialFeatures: [
        'Command-R models optimized for RAG',
        'Built-in citation generation',
        'Tool/function calling',
        'Multilingual support (10+ languages)',
        'Large context windows',
        'Cost-effective pricing',
        'Grounded generation'
      ],
      pricing: {
        'command-r-plus': 'Premium model - $0.003/$0.015 per 1K tokens',
        'command-r': 'Standard model - $0.00015/$0.0006 per 1K tokens',
        'command-r7b': 'Lightweight model - $0.00003/$0.00012 per 1K tokens'
      },
      limitations: [
        'Monthly token limits',
        'Rate limiting applies',
        'Circuit breaker for reliability'
      ]
    };
  }
}

export const cohereService = new CohereService();