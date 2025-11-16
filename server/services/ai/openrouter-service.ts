/**
 * OpenRouter Service - Multi-Model AI Access
 * Unified access to 200+ AI models via single API
 * Pay-per-use pricing with competitive rates
 * Use case: Model arbitrage, specialized tasks, fallback routing
 */

import axios from 'axios';

interface OpenRouterConfig {
  apiKey?: string;
  baseURL: string;
  defaultModel: string;
  dailyBudget: number;
  costTrackingEnabled: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  top_provider: {
    max_completion_tokens?: number;
  };
  capabilities: string[];
  category: 'chat' | 'completion' | 'code' | 'vision' | 'audio' | 'embedding';
  provider: string;
}

interface OpenRouterResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  metadata?: {
    prompt_tokens: number;
    completion_tokens: number;
    finish_reason: string;
  };
}

interface GenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  stop?: string[];
  transforms?: string[];
}

export class OpenRouterService {
  private config: OpenRouterConfig;
  private isInitialized: boolean = false;
  private dailyCostUsed = 0;
  private dayResetTime = Date.now() + 24 * 60 * 60 * 1000;
  private modelCatalog: ModelInfo[] = [];
  private catalogLastUpdated = 0;

  constructor() {
    this.config = {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
      dailyBudget: 5.00, // $5 daily budget
      costTrackingEnabled: true
    };

    if (this.config.apiKey) {
      this.isInitialized = true;
      console.log('[OpenRouter] Service initialized with API key');
      console.log('[OpenRouter] Daily budget: $' + this.config.dailyBudget);
      console.log('[OpenRouter] Unified access to 200+ AI models');
      this.initializeModelCatalog();
    } else {
      console.log('[OpenRouter] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and within budget
   */
  isAvailable(): boolean {
    this.resetDayCounterIfNeeded();
    return this.isInitialized && this.dailyCostUsed < this.config.dailyBudget;
  }

  /**
   * Get remaining budget for today
   */
  getRemainingQuota(): number {
    this.resetDayCounterIfNeeded();
    return Math.max(0, this.config.dailyBudget - this.dailyCostUsed);
  }

  /**
   * Reset daily cost counter
   */
  private resetDayCounterIfNeeded(): void {
    if (Date.now() > this.dayResetTime) {
      this.dailyCostUsed = 0;
      this.dayResetTime = Date.now() + 24 * 60 * 60 * 1000;
      console.log('[OpenRouter] Daily budget reset');
    }
  }

  /**
   * Initialize model catalog from OpenRouter API
   */
  private async initializeModelCatalog(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://hyperdag.org',
          'X-Title': 'HyperDAG AI Orchestration Platform'
        }
      });

      this.modelCatalog = response.data.data.map((model: any) => this.enhanceModelWithCapabilities(model));
      this.catalogLastUpdated = Date.now();
      console.log(`[OpenRouter] Loaded ${this.modelCatalog.length} models`);

    } catch (error) {
      console.error('[OpenRouter] Failed to load model catalog:', error);
    }
  }

  /**
   * Enhance model with capability tags for intelligent arbitrage
   */
  private enhanceModelWithCapabilities(model: any): ModelInfo {
    const capabilities: string[] = [];
    const modelId = model.id.toLowerCase();
    const name = model.name?.toLowerCase() || '';

    // Code capabilities
    if (modelId.includes('code') || modelId.includes('deepseek') || 
        modelId.includes('claude') && modelId.includes('3.5')) {
      capabilities.push('code_generation', 'debugging', 'refactoring');
    }

    // Vision capabilities
    if (modelId.includes('vision') || modelId.includes('gpt-4o') || 
        modelId.includes('claude-3') || modelId.includes('gemini-pro-vision')) {
      capabilities.push('vision_understanding', 'image_analysis', 'multimodal');
    }

    // Reasoning capabilities
    if (modelId.includes('o1') || modelId.includes('reasoning') || 
        modelId.includes('claude-3-opus') || modelId.includes('gpt-4')) {
      capabilities.push('advanced_reasoning', 'complex_analysis', 'chain_of_thought');
    }

    // Fast generation
    if (modelId.includes('flash') || modelId.includes('turbo') || 
        modelId.includes('3.5-sonnet') || modelId.includes('llama') && modelId.includes('8b')) {
      capabilities.push('fast_generation', 'real_time', 'low_latency');
    }

    // Long context
    if (model.context_length > 100000) {
      capabilities.push('long_context', 'document_analysis', 'large_input');
    }

    // Free models
    if (modelId.includes('free') || model.pricing?.prompt === 0) {
      capabilities.push('free_tier', 'cost_efficient');
    }

    // Math and science
    if (modelId.includes('math') || modelId.includes('science') || 
        modelId.includes('deepseek') || modelId.includes('o1')) {
      capabilities.push('mathematics', 'scientific_reasoning', 'problem_solving');
    }

    // Determine category
    let category: ModelInfo['category'] = 'chat';
    if (capabilities.includes('code_generation')) category = 'code';
    if (capabilities.includes('vision_understanding')) category = 'vision';
    if (modelId.includes('embedding')) category = 'embedding';

    return {
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
      pricing: model.pricing,
      top_provider: model.top_provider || {},
      capabilities,
      category,
      provider: model.id.split('/')[0] || 'unknown'
    };
  }

  /**
   * Generate text using OpenRouter
   */
  async generateText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<OpenRouterResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter service not available or budget exceeded');
    }

    const startTime = Date.now();
    const model = options.model || this.config.defaultModel;

    try {
      const requestBody = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: options.stream || false,
        transforms: options.transforms
      };

      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://hyperdag.org',
            'X-Title': 'HyperDAG AI Orchestration Platform'
          },
          timeout: 60000
        }
      );

      const latency = Date.now() - startTime;
      const choice = response.data.choices[0];
      const content = choice?.message?.content || '';
      const usage = response.data.usage || {};
      const cost = this.calculateCost(model, usage.prompt_tokens || 0, usage.completion_tokens || 0);

      // Update cost tracking
      if (this.config.costTrackingEnabled) {
        this.dailyCostUsed += cost;
      }

      console.log(`[OpenRouter] Generated with ${model} in ${latency}ms, cost: $${cost.toFixed(4)}`);
      console.log(`[OpenRouter] Remaining budget: $${this.getRemainingQuota().toFixed(2)}`);

      return {
        content,
        latency,
        cost,
        provider: 'openrouter',
        model,
        success: true,
        tokens: usage.total_tokens || 0,
        metadata: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          finish_reason: choice?.finish_reason || 'unknown'
        }
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[OpenRouter] Generation error:', error.response?.data || error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'openrouter',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Calculate cost based on model pricing and token usage
   */
  private calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
    const model = this.modelCatalog.find(m => m.id === modelId);
    if (!model || !model.pricing) return 0;

    const promptCost = (promptTokens / 1000000) * model.pricing.prompt;
    const completionCost = (completionTokens / 1000000) * model.pricing.completion;
    
    return promptCost + completionCost;
  }

  /**
   * Find optimal model for specific task
   */
  findOptimalModel(requirements: {
    capability?: string;
    maxCost?: number;
    minContextLength?: number;
    preferFree?: boolean;
    maxLatency?: number;
  }): ModelInfo | null {
    let candidates = this.modelCatalog;

    // Filter by capability
    if (requirements.capability) {
      candidates = candidates.filter(m => m.capabilities.includes(requirements.capability!));
    }

    // Filter by context length
    if (requirements.minContextLength) {
      candidates = candidates.filter(m => m.context_length >= requirements.minContextLength!);
    }

    // Filter by cost preference
    if (requirements.preferFree) {
      const freeCandidates = candidates.filter(m => m.capabilities.includes('free_tier'));
      if (freeCandidates.length > 0) {
        candidates = freeCandidates;
      }
    }

    // Filter by max cost
    if (requirements.maxCost) {
      candidates = candidates.filter(m => 
        m.pricing.prompt <= requirements.maxCost! && 
        m.pricing.completion <= requirements.maxCost!
      );
    }

    // Sort by performance/cost ratio (simplified)
    candidates.sort((a, b) => {
      const scoreA = this.calculateModelScore(a);
      const scoreB = this.calculateModelScore(b);
      return scoreB - scoreA;
    });

    return candidates[0] || null;
  }

  /**
   * Calculate model performance score for ranking
   */
  private calculateModelScore(model: ModelInfo): number {
    let score = 0;
    
    // Capability bonus
    score += model.capabilities.length * 10;
    
    // Context length bonus
    score += Math.log(model.context_length) * 5;
    
    // Free tier bonus
    if (model.capabilities.includes('free_tier')) {
      score += 100;
    }
    
    // Cost penalty (lower cost = higher score)
    score -= (model.pricing.prompt + model.pricing.completion) * 1000;
    
    return score;
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: string): ModelInfo[] {
    return this.modelCatalog.filter(m => m.capabilities.includes(capability));
  }

  /**
   * Get free tier models
   */
  getFreeModels(): ModelInfo[] {
    return this.modelCatalog.filter(m => 
      m.capabilities.includes('free_tier') || m.pricing.prompt === 0
    );
  }

  /**
   * Generate with automatic model selection
   */
  async generateWithArbitrage(
    prompt: string,
    requirements: {
      capability?: string;
      preferFree?: boolean;
      maxCost?: number;
      fallbackModel?: string;
    } = {}
  ): Promise<OpenRouterResponse> {
    // Find optimal model
    const optimalModel = this.findOptimalModel(requirements);
    
    const selectedModel = optimalModel?.id || requirements.fallbackModel || this.config.defaultModel;
    
    console.log(`[OpenRouter] Auto-selected model: ${selectedModel}`);
    
    return this.generateText(prompt, { model: selectedModel });
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetDayCounterIfNeeded();
    
    return {
      provider: 'OpenRouter',
      tier: 'pay_per_use',
      dailyBudget: this.config.dailyBudget,
      dailyCostUsed: this.dailyCostUsed,
      remainingBudget: this.getRemainingQuota(),
      budgetPercentage: (this.dailyCostUsed / this.config.dailyBudget) * 100,
      available: this.isAvailable(),
      totalModels: this.modelCatalog.length,
      freeModels: this.getFreeModels().length,
      catalogLastUpdated: new Date(this.catalogLastUpdated).toISOString(),
      capabilities: [
        'multi_model_access',
        'model_arbitrage',
        'cost_optimization',
        'specialized_models',
        'unified_api',
        'real_time_pricing'
      ],
      modelCategories: {
        chat: this.modelCatalog.filter(m => m.category === 'chat').length,
        code: this.modelCatalog.filter(m => m.category === 'code').length,
        vision: this.modelCatalog.filter(m => m.category === 'vision').length,
        embedding: this.modelCatalog.filter(m => m.category === 'embedding').length
      },
      topCapabilities: this.getTopCapabilities(),
      costEfficiency: {
        cheapestModel: this.getCheapestModel(),
        averageCost: this.getAverageCost(),
        freeOptions: this.getFreeModels().length
      }
    };
  }

  /**
   * Get top capabilities across all models
   */
  private getTopCapabilities(): string[] {
    const capabilityCount = new Map<string, number>();
    
    this.modelCatalog.forEach(model => {
      model.capabilities.forEach(cap => {
        capabilityCount.set(cap, (capabilityCount.get(cap) || 0) + 1);
      });
    });

    return Array.from(capabilityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cap]) => cap);
  }

  /**
   * Get cheapest model info
   */
  private getCheapestModel(): { id: string; cost: number } | null {
    const paidModels = this.modelCatalog.filter(m => !m.capabilities.includes('free_tier'));
    if (paidModels.length === 0) return null;

    const cheapest = paidModels.reduce((min, model) => {
      const cost = model.pricing.prompt + model.pricing.completion;
      const minCost = min.pricing.prompt + min.pricing.completion;
      return cost < minCost ? model : min;
    });

    return {
      id: cheapest.id,
      cost: cheapest.pricing.prompt + cheapest.pricing.completion
    };
  }

  /**
   * Get average cost across all models
   */
  private getAverageCost(): number {
    const paidModels = this.modelCatalog.filter(m => !m.capabilities.includes('free_tier'));
    if (paidModels.length === 0) return 0;

    const totalCost = paidModels.reduce((sum, model) => 
      sum + model.pricing.prompt + model.pricing.completion, 0
    );

    return totalCost / paidModels.length;
  }

  /**
   * Refresh model catalog
   */
  async refreshModelCatalog(): Promise<void> {
    await this.initializeModelCatalog();
  }
}

export const openRouterService = new OpenRouterService();