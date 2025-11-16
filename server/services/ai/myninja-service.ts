/**
 * MyNinja.ai Service Integration
 * AI-Prompt-Manager's Second Choice Provider for HyperDAG
 * Specialized in research, reasoning, and agent-based tasks
 */

export interface MyNinjaResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MyNinjaRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  stream_options?: {
    include_usage: boolean;
  };
  max_tokens?: number;
  temperature?: number;
}

class MyNinjaService {
  private apiKey: string;
  private baseUrl: string = 'https://api.myninja.ai/v1';
  private available: boolean = false;
  private models = {
    research: 'ninja-deep-research',
    turbo: 'ninja-super-agent:turbo',
    apex: 'ninja-super-agent:apex',
    reasoning: 'ninja-super-agent:reasoning'
  };

  constructor() {
    this.apiKey = process.env.MYNINJA_API_KEY || '';
    this.available = !!this.apiKey;
    
    if (this.available) {
      console.log('[INFO][MyNinja] MY-deFuzzyAI-Ninja service initialized');
      console.log('[INFO][MyNinja] Available models:', Object.keys(this.models).join(', '));
    } else {
      console.warn('[WARN][MyNinja] MY-deFuzzyAI-Ninja not configured - missing MYNINJA_API_KEY');
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  getAvailableModels(): string[] {
    return Object.values(this.models);
  }

  /**
   * Select optimal model based on request characteristics
   */
  private selectModel(prompt: string, context?: any): string {
    const promptLower = prompt.toLowerCase();
    
    // Deep research for research-oriented tasks
    if (promptLower.includes('research') || 
        promptLower.includes('analyze') || 
        promptLower.includes('investigation') ||
        promptLower.includes('study') ||
        promptLower.includes('findings')) {
      return this.models.research;
    }
    
    // Reasoning model for complex problem-solving
    if (promptLower.includes('reasoning') || 
        promptLower.includes('logic') || 
        promptLower.includes('solve') ||
        promptLower.includes('problem') ||
        promptLower.includes('calculate')) {
      return this.models.reasoning;
    }
    
    // Apex for high-performance tasks
    if (promptLower.includes('performance') || 
        promptLower.includes('optimization') || 
        promptLower.includes('complex') ||
        (prompt.length > 1000)) {
      return this.models.apex;
    }
    
    // Default to turbo for general tasks
    return this.models.turbo;
  }

  /**
   * Process AI request via MyNinja.ai API
   */
  async processRequest(prompt: string, context?: any): Promise<{
    response: string;
    model: string;
    tokens: number;
    cost: number;
    citations?: string[];
  }> {
    if (!this.available) {
      throw new Error('MyNinja.ai service not available - check MYNINJA_API_KEY');
    }

    const startTime = Date.now();
    const selectedModel = this.selectModel(prompt, context);

    const requestBody: MyNinjaRequest = {
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      max_tokens: 4000,
      temperature: 0.7
    };

    try {
      console.log(`[MyNinja] Processing request with ${selectedModel}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MyNinja] API Error ${response.status}:`, errorText);
        throw new Error(`MyNinja.ai API error: ${response.status} - ${errorText}`);
      }

      const data: MyNinjaResponse = await response.json();
      const responseTime = Date.now() - startTime;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from MyNinja.ai');
      }

      const responseContent = data.choices[0].message.content;
      const totalTokens = data.usage?.total_tokens || 0;
      
      // Estimate cost (approximate pricing - adjust based on actual MyNinja.ai pricing)
      const estimatedCost = this.calculateCost(selectedModel, totalTokens);

      // Extract citations if present (for research model)
      const citations = this.extractCitations(responseContent);

      console.log(`[MyNinja] Response completed in ${responseTime}ms using ${selectedModel}`);
      console.log(`[MyNinja] Tokens used: ${totalTokens}, Estimated cost: $${estimatedCost.toFixed(4)}`);

      return {
        response: responseContent,
        model: selectedModel,
        tokens: totalTokens,
        cost: estimatedCost,
        citations: citations.length > 0 ? citations : undefined
      };

    } catch (error) {
      console.error('[MyNinja] Request failed:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated cost based on model and token usage
   */
  private calculateCost(model: string, tokens: number): number {
    // Estimated pricing (adjust based on actual MyNinja.ai pricing)
    const pricing: Record<string, number> = {
      [this.models.research]: 0.008,   // Per 1K tokens
      [this.models.turbo]: 0.004,      // Per 1K tokens  
      [this.models.apex]: 0.012,       // Per 1K tokens
      [this.models.reasoning]: 0.010   // Per 1K tokens
    };

    const rate = pricing[model] || 0.006; // Default rate
    return (tokens / 1000) * rate;
  }

  /**
   * Extract citations from research model responses
   */
  private extractCitations(content: string): string[] {
    const citations: string[] = [];
    
    // Look for citation patterns [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g;
    const matches = content.match(citationPattern);
    
    if (matches) {
      citations.push(...matches);
    }

    // Look for URL patterns
    const urlPattern = /https?:\/\/[^\s\]]+/g;
    const urls = content.match(urlPattern);
    
    if (urls) {
      citations.push(...urls);
    }

    return [...new Set(citations)]; // Remove duplicates
  }

  /**
   * Health check for MyNinja.ai service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    if (!this.available) {
      return {
        status: 'unhealthy',
        error: 'Service not configured'
      };
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.turbo,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          responseTime
        };
      } else {
        const errorText = await response.text();
        return {
          status: 'unhealthy',
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get service metrics and statistics
   */
  getMetrics(): {
    available: boolean;
    models: string[];
    features: string[];
    specializations: string[];
  } {
    return {
      available: this.available,
      models: Object.values(this.models),
      features: [
        'Research with citations',
        'Complex reasoning',
        'High-performance processing',
        'OpenAI-compatible API',
        'Streaming support'
      ],
      specializations: [
        'Deep research tasks',
        'Agent-based processing', 
        'Complex problem solving',
        'Academic analysis',
        'Technical documentation'
      ]
    };
  }
}

export default MyNinjaService;