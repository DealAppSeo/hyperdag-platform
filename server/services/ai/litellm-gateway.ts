/**
 * LiteLLM Gateway Service - Free AI API Gateway
 * Direct provider access with zero markup fees
 * Ultimate failover when OpenRouter/other gateways fail
 */

interface LiteLLMProvider {
  name: string;
  model: string;
  apiKey: string;
  endpoint?: string;
  enabled: boolean;
  costMultiplier: number;
}

interface LiteLLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LiteLLMGateway {
  private providers: LiteLLMProvider[] = [];
  private currentProviderIndex = 0;
  private usageStats = new Map<string, { requests: number; tokens: number; cost: number }>();
  private rateLimits = new Map<string, { limit: number; used: number; resetTime: number }>();

  constructor() {
    this.initializeProviders();
    this.initializeRateLimits();
  }

  private initializeProviders() {
    // Direct API access - no markup fees
    this.providers = [
      {
        name: 'anthropic',
        model: 'claude-3-haiku-20240307',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        endpoint: 'https://api.anthropic.com/v1/messages',
        enabled: !!process.env.ANTHROPIC_API_KEY,
        costMultiplier: 1.0
      },
      {
        name: 'openai',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        enabled: !!process.env.OPENAI_API_KEY,
        costMultiplier: 1.2
      },
      {
        name: 'groq',
        model: 'llama-3.1-8b-instant',
        apiKey: process.env.GROQ_API_KEY || '',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        enabled: !!process.env.GROQ_API_KEY,
        costMultiplier: 0.05
      }
    ];

    console.log(`[LiteLLM] Initialized with ${this.providers.filter(p => p.enabled).length} providers`);
  }

  async executeWithFailover(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    userId?: string;
  } = {}): Promise<{
    success: boolean;
    provider: string;
    cost: number;
    result: string;
    tokensUsed?: number;
    rateLimitRemaining?: number;
  }> {
    const availableProviders = this.providers.filter(p => p.enabled);
    
    if (availableProviders.length === 0) {
      throw new Error('[LiteLLM] No providers available');
    }

    // Try each provider in order of preference (cost optimization)
    const orderedProviders = availableProviders.sort((a, b) => a.costMultiplier - b.costMultiplier);
    
    for (const provider of orderedProviders) {
      try {
        console.log(`[LiteLLM] Attempting ${provider.name} (cost: ${provider.costMultiplier}x)`);
        
        const result = await this.callProvider(provider, prompt, options);
        
        const cost = this.calculateCost(provider, result.usage?.total_tokens || 500);
        const tokensUsed = result.usage?.total_tokens || 500;
        
        // Track usage for analytics (enterprise feature)
        this.trackUsage(provider.name, tokensUsed, cost);
        
        // Update rate limits
        const remaining = this.updateRateLimit(provider.name);
        
        console.log(`[LiteLLM] ✅ Success via ${provider.name} - Cost: $${cost.toFixed(4)}, Tokens: ${tokensUsed}`);
        return {
          success: true,
          provider: provider.name,
          cost,
          result: result.choices[0]?.message?.content || 'No response',
          tokensUsed,
          rateLimitRemaining: remaining
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`[LiteLLM] ❌ ${provider.name} failed: ${errorMessage}`);
        continue;
      }
    }

    throw new Error('[LiteLLM] All providers failed');
  }

  private async callProvider(provider: LiteLLMProvider, prompt: string, options: any): Promise<LiteLLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    let body: any = {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    };

    // Provider-specific configurations
    switch (provider.name) {
      case 'anthropic':
        headers['x-api-key'] = provider.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: provider.model,
          max_tokens: options.maxTokens || 500,
          messages: [{ role: 'user', content: prompt }]
        };
        break;
        
      case 'openai':
      case 'groq':
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
        body.model = provider.model;
        break;
    }

    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.name} API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Normalize Anthropic response format
    if (provider.name === 'anthropic') {
      return {
        choices: [{
          message: {
            content: data.content?.[0]?.text || 'No response'
          }
        }],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    }

    return data;
  }

  private calculateCost(provider: LiteLLMProvider, tokens: number): number {
    // Rough cost estimation (per 1K tokens)
    const baseCosts: Record<string, number> = {
      'anthropic': 0.00025, // Claude Haiku
      'openai': 0.00015,    // GPT-4o-mini
      'groq': 0.00005       // Llama-3.1-8b
    };
    
    const baseCost = baseCosts[provider.name] || 0.0001;
    return (tokens / 1000) * baseCost * provider.costMultiplier;
  }

  getProviderStatus(): Record<string, any> {
    return this.providers.reduce((status, provider) => {
      status[provider.name] = {
        enabled: provider.enabled,
        model: provider.model,
        costMultiplier: provider.costMultiplier,
        hasApiKey: !!provider.apiKey
      };
      return status;
    }, {} as Record<string, any>);
  }

  // Test all providers for health
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this.providers.filter(p => p.enabled)) {
      try {
        await this.callProvider(provider, 'test', { maxTokens: 1 });
        results[provider.name] = true;
      } catch (error) {
        results[provider.name] = false;
      }
    }
    
    return results;
  }

  // Enterprise features from LiteLLM Proxy
  private initializeRateLimits() {
    // Set reasonable rate limits per provider
    this.rateLimits.set('anthropic', { limit: 1000, used: 0, resetTime: Date.now() + 3600000 });
    this.rateLimits.set('openai', { limit: 500, used: 0, resetTime: Date.now() + 3600000 });
    this.rateLimits.set('groq', { limit: 6000, used: 0, resetTime: Date.now() + 3600000 });
  }

  private trackUsage(provider: string, tokens: number, cost: number) {
    const current = this.usageStats.get(provider) || { requests: 0, tokens: 0, cost: 0 };
    this.usageStats.set(provider, {
      requests: current.requests + 1,
      tokens: current.tokens + tokens,
      cost: current.cost + cost
    });
  }

  private updateRateLimit(provider: string): number {
    const limit = this.rateLimits.get(provider);
    if (!limit) return -1;

    // Reset if hour has passed
    if (Date.now() > limit.resetTime) {
      limit.used = 0;
      limit.resetTime = Date.now() + 3600000;
    }

    limit.used += 1;
    return Math.max(0, limit.limit - limit.used);
  }

  private checkRateLimit(provider: string): boolean {
    const limit = this.rateLimits.get(provider);
    if (!limit) return true;

    // Reset if hour has passed
    if (Date.now() > limit.resetTime) {
      limit.used = 0;
      limit.resetTime = Date.now() + 3600000;
    }

    return limit.used < limit.limit;
  }

  // Analytics and monitoring (enterprise features)
  getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [provider, usage] of Array.from(this.usageStats.entries())) {
      stats[provider] = {
        ...usage,
        averageCostPerRequest: usage.requests > 0 ? usage.cost / usage.requests : 0,
        averageTokensPerRequest: usage.requests > 0 ? usage.tokens / usage.requests : 0
      };
    }
    return stats;
  }

  getRateLimitStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [provider, limit] of Array.from(this.rateLimits.entries())) {
      status[provider] = {
        limit: limit.limit,
        used: limit.used,
        remaining: Math.max(0, limit.limit - limit.used),
        resetTime: new Date(limit.resetTime).toISOString()
      };
    }
    return status;
  }

  // Budget tracking
  getTotalCost(): number {
    return Array.from(this.usageStats.values()).reduce((total, stats) => total + stats.cost, 0);
  }

  // Streaming support (from LiteLLM docs)
  async executeStreamingWithFailover(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}): Promise<AsyncIterable<any>> {
    const availableProviders = this.providers.filter(p => p.enabled);
    
    if (availableProviders.length === 0) {
      throw new Error('[LiteLLM] No providers available for streaming');
    }

    // Use cheapest available provider for streaming
    const provider = availableProviders.sort((a, b) => a.costMultiplier - b.costMultiplier)[0];
    
    return this.callProviderStreaming(provider, prompt, options);
  }

  private async * callProviderStreaming(provider: LiteLLMProvider, prompt: string, options: any): AsyncIterable<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    let body: any = {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      stream: true
    };

    // Provider-specific configurations
    switch (provider.name) {
      case 'anthropic':
        headers['x-api-key'] = provider.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body.model = provider.model;
        break;
        
      case 'openai':
      case 'groq':
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
        body.model = provider.model;
        break;
    }

    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`${provider.name} streaming error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const liteLLMGateway = new LiteLLMGateway();