/**
 * Enhanced HuggingFace Service with Zuplo Integration
 * Supports all 3 HuggingFace API types with cost optimization
 */

export interface HuggingFaceModel {
  name: string;
  task: string;
  api_type: 'inference' | 'endpoints' | 'providers';
  cost_per_token: number;
  free_quota: number;
  capabilities: {
    reasoning: number;
    creativity: number;
    speed: number;
    accuracy: number;
    codeGeneration: number;
  };
}

export interface HuggingFaceRequest {
  inputs: string;
  model: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    top_p?: number;
    return_full_text?: boolean;
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

export interface HuggingFaceResponse {
  generated_text?: string;
  score?: number;
  label?: string;
  error?: string;
  estimated_time?: number;
}

export class EnhancedHuggingFaceService {
  private apiKey: string;
  private isConfigured = false;
  private models: Map<string, HuggingFaceModel> = new Map();
  private usageTracking = {
    inference_api: { requests: 0, tokens: 0, cost: 0 },
    endpoints: { requests: 0, tokens: 0, cost: 0 },
    providers: { requests: 0, tokens: 0, cost: 0 }
  };

  // API Endpoints
  private readonly endpoints = {
    inference: 'https://api-inference.huggingface.co',
    endpoints: 'https://api.endpoints.huggingface.cloud',
    providers: 'https://api-inference.huggingface.co/providers'
  };

  constructor() {
    this.initializeService();
    this.initializeModels();
  }

  private initializeService() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    
    if (this.apiKey) {
      this.isConfigured = true;
      console.log('[Enhanced HuggingFace] Service configured with API key');
    } else {
      console.log('[Enhanced HuggingFace] Service initialized without API key (free tier mode)');
      this.isConfigured = false;
    }
  }

  private initializeModels() {
    // Inference API Models (Free tier optimized)
    this.models.set('gpt2', {
      name: 'GPT-2',
      task: 'text-generation',
      api_type: 'inference',
      cost_per_token: 0, // Free tier
      free_quota: 1000,
      capabilities: {
        reasoning: 0.65,
        creativity: 0.80,
        speed: 0.90,
        accuracy: 0.70,
        codeGeneration: 0.50
      }
    });

    this.models.set('distilbert-base-uncased', {
      name: 'DistilBERT Base',
      task: 'text-classification',
      api_type: 'inference',
      cost_per_token: 0, // Free tier
      free_quota: 2000,
      capabilities: {
        reasoning: 0.75,
        creativity: 0.60,
        speed: 0.95,
        accuracy: 0.85,
        codeGeneration: 0.30
      }
    });

    this.models.set('sentence-transformers/all-MiniLM-L6-v2', {
      name: 'All-MiniLM-L6-v2',
      task: 'embeddings',
      api_type: 'inference',
      cost_per_token: 0, // Free tier
      free_quota: 5000,
      capabilities: {
        reasoning: 0.70,
        creativity: 0.40,
        speed: 0.98,
        accuracy: 0.90,
        codeGeneration: 0.20
      }
    });

    // Inference Endpoints Models (Dedicated)
    this.models.set('meta-llama/Llama-2-7b-chat-hf', {
      name: 'Llama 2 7B Chat',
      task: 'text-generation',
      api_type: 'endpoints',
      cost_per_token: 0.0001, // Dedicated pricing
      free_quota: 0,
      capabilities: {
        reasoning: 0.85,
        creativity: 0.90,
        speed: 0.80,
        accuracy: 0.88,
        codeGeneration: 0.75
      }
    });

    // Inference Providers Models (Multi-provider)
    this.models.set('mistralai/Mixtral-8x7B-Instruct-v0.1', {
      name: 'Mixtral 8x7B Instruct',
      task: 'text-generation', 
      api_type: 'providers',
      cost_per_token: 0.0002,
      free_quota: 0,
      capabilities: {
        reasoning: 0.92,
        creativity: 0.88,
        speed: 0.75,
        accuracy: 0.91,
        codeGeneration: 0.85
      }
    });
  }

  /**
   * Main inference method - automatically selects optimal API type
   */
  async performInference(request: HuggingFaceRequest, userTier: string = 'free'): Promise<HuggingFaceResponse> {
    try {
      const model = this.models.get(request.model);
      if (!model) {
        throw new Error(`Model ${request.model} not supported`);
      }

      // Route to appropriate API based on model type and user tier
      const apiType = this.selectOptimalAPI(model, userTier);
      
      console.log(`[Enhanced HF] Routing to ${apiType} API for model ${request.model}`);

      switch (apiType) {
        case 'inference':
          return await this.callInferenceAPI(request, model);
        case 'endpoints':
          return await this.callEndpointsAPI(request, model);
        case 'providers':
          return await this.callProvidersAPI(request, model);
        default:
          throw new Error(`Unsupported API type: ${apiType}`);
      }

    } catch (error) {
      console.error('[Enhanced HF] Inference error:', error);
      throw error;
    }
  }

  /**
   * Inference API (Serverless) - Free tier optimized
   */
  private async callInferenceAPI(request: HuggingFaceRequest, model: HuggingFaceModel): Promise<HuggingFaceResponse> {
    const url = `${this.endpoints.inference}/models/${request.model}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.inputs,
        parameters: request.parameters || {},
        options: {
          wait_for_model: true,
          use_cache: true,
          ...request.options
        }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - consider upgrading to Pro tier');
      }
      throw new Error(`Inference API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track usage
    this.trackUsage('inference_api', request.inputs, result);
    
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Inference Endpoints (Dedicated) - Production workloads
   */
  private async callEndpointsAPI(request: HuggingFaceRequest, model: HuggingFaceModel): Promise<HuggingFaceResponse> {
    // Note: Endpoints require deployment setup first
    const endpointUrl = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!endpointUrl) {
      console.warn('[Enhanced HF] No endpoint URL configured, falling back to Inference API');
      return await this.callInferenceAPI(request, model);
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.inputs,
        parameters: request.parameters || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Endpoints API error: ${response.statusText}`);
    }

    const result = await response.json();
    this.trackUsage('endpoints', request.inputs, result);
    
    return result;
  }

  /**
   * Inference Providers (Multi-provider) - Maximum model access
   */
  private async callProvidersAPI(request: HuggingFaceRequest, model: HuggingFaceModel): Promise<HuggingFaceResponse> {
    const url = `${this.endpoints.providers}/${request.model}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.inputs,
        parameters: request.parameters || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Providers API error: ${response.statusText}`);
    }

    const result = await response.json();
    this.trackUsage('providers', request.inputs, result);
    
    return result;
  }

  /**
   * Select optimal API type based on model, user tier, and current usage
   */
  private selectOptimalAPI(model: HuggingFaceModel, userTier: string): 'inference' | 'endpoints' | 'providers' {
    // Free tier users - use free quota models first
    if (userTier === 'free') {
      if (model.free_quota > 0 && this.canUseFreeQuota(model)) {
        return 'inference';
      }
      throw new Error('Free quota exceeded. Upgrade to continue using AI features.');
    }

    // Paid tiers - select based on requirements
    if (userTier === 'startup') {
      // Prioritize cost-effective options
      if (model.api_type === 'inference' && model.free_quota > 0) {
        return 'inference';
      }
      return model.api_type;
    }

    if (userTier === 'professional' || userTier === 'enterprise') {
      // Prioritize performance and reliability
      if (model.api_type === 'endpoints') {
        return 'endpoints';
      }
      if (model.api_type === 'providers') {
        return 'providers';
      }
      return 'inference';
    }

    // Default to original API type
    return model.api_type;
  }

  /**
   * Check if free quota is available for model
   */
  private canUseFreeQuota(model: HuggingFaceModel): boolean {
    const usage = this.usageTracking.inference_api;
    const estimatedTokens = 100; // Conservative estimate
    
    return (usage.tokens + estimatedTokens) <= model.free_quota;
  }

  /**
   * Track usage for billing and optimization
   */
  private trackUsage(apiType: keyof typeof this.usageTracking, input: string, result: any) {
    const tokens = this.estimateTokens(input + JSON.stringify(result));
    const cost = this.calculateCost(apiType, tokens);
    
    this.usageTracking[apiType].requests++;
    this.usageTracking[apiType].tokens += tokens;
    this.usageTracking[apiType].cost += cost;

    console.log(`[Enhanced HF] Usage: ${apiType} - ${tokens} tokens, $${cost.toFixed(6)} cost`);
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on API type and usage
   */
  private calculateCost(apiType: string, tokens: number): number {
    const costPerToken = {
      inference_api: 0,       // Free tier
      endpoints: 0.0001,      // Dedicated pricing
      providers: 0.0002       // Provider pricing
    };

    return (costPerToken[apiType as keyof typeof costPerToken] || 0) * tokens;
  }

  /**
   * Get available models for a specific API type
   */
  getAvailableModels(apiType?: 'inference' | 'endpoints' | 'providers'): Array<{name: string, model: HuggingFaceModel}> {
    const models: Array<{name: string, model: HuggingFaceModel}> = [];
    
    for (const [name, model] of this.models.entries()) {
      if (!apiType || model.api_type === apiType) {
        models.push({ name, model });
      }
    }
    
    return models;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageTracking,
      total_requests: Object.values(this.usageTracking).reduce((sum, usage) => sum + usage.requests, 0),
      total_tokens: Object.values(this.usageTracking).reduce((sum, usage) => sum + usage.tokens, 0),
      total_cost: Object.values(this.usageTracking).reduce((sum, usage) => sum + usage.cost, 0),
      cost_savings: this.calculateSavings()
    };
  }

  /**
   * Calculate cost savings vs direct API usage
   */
  private calculateSavings(): number {
    const directCost = 0.0008; // Estimated direct OpenAI cost per token
    const totalTokens = Object.values(this.usageTracking).reduce((sum, usage) => sum + usage.tokens, 0);
    const ourCost = Object.values(this.usageTracking).reduce((sum, usage) => sum + usage.cost, 0);
    
    const wouldHaveCost = totalTokens * directCost;
    return Math.max(0, wouldHaveCost - ourCost);
  }

  /**
   * Health check for all API types
   */
  async healthCheck(): Promise<{inference: boolean, endpoints: boolean, providers: boolean}> {
    const results = {
      inference: false,
      endpoints: false,
      providers: false
    };

    // Test Inference API
    try {
      const response = await fetch(`${this.endpoints.inference}/models/gpt2`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      results.inference = response.ok;
    } catch (error) {
      console.warn('[Enhanced HF] Inference API health check failed:', error);
    }

    // Test Endpoints API (if configured)
    if (process.env.HUGGINGFACE_ENDPOINT_URL) {
      try {
        const response = await fetch(process.env.HUGGINGFACE_ENDPOINT_URL, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        results.endpoints = response.ok;
      } catch (error) {
        console.warn('[Enhanced HF] Endpoints API health check failed:', error);
      }
    }

    // Test Providers API
    try {
      const response = await fetch(`${this.endpoints.providers}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      results.providers = response.ok;
    } catch (error) {
      console.warn('[Enhanced HF] Providers API health check failed:', error);
    }

    return results;
  }

  /**
   * Reset usage statistics (typically called monthly)
   */
  resetUsageStats() {
    this.usageTracking = {
      inference_api: { requests: 0, tokens: 0, cost: 0 },
      endpoints: { requests: 0, tokens: 0, cost: 0 },
      providers: { requests: 0, tokens: 0, cost: 0 }
    };
    console.log('[Enhanced HF] Usage statistics reset');
  }

  /**
   * Check service configuration
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      api_types: {
        inference: 'available',
        endpoints: process.env.HUGGINGFACE_ENDPOINT_URL ? 'configured' : 'not_configured',
        providers: 'available'
      },
      models_loaded: this.models.size,
      usage_stats: this.getUsageStats()
    };
  }
}

// Export singleton instance
export const enhancedHuggingFaceService = new EnhancedHuggingFaceService();