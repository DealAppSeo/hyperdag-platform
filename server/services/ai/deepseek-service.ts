/**
 * DeepSeek AI Service for HyperDAG Symphony Orchestration
 * 
 * Integrates DeepSeek AI models into the ANFIS routing system
 * providing high-performance AI capabilities with cost optimization
 */

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  private models: string[];
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_AI_SYMPHONY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.models = [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoning'
    ];
  }

  /**
   * Initialize DeepSeek service and verify connectivity
   */
  async initialize(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('[DeepSeek] No API key provided, service disabled');
      return false;
    }

    try {
      // Test API connectivity
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[DeepSeek] Service initialized successfully');
        console.log(`[DeepSeek] Available models: ${data.data?.length || 'Unknown'}`);
        this.isInitialized = true;
        return true;
      } else {
        console.log(`[DeepSeek] API test failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('[DeepSeek] Initialization error:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Generate completion using DeepSeek models
   */
  async generateCompletion(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  } = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('DeepSeek service not initialized');
    }

    const {
      model = 'deepseek-chat',
      maxTokens = 1000,
      temperature = 0.7,
      stream = false
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stream
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        provider: 'deepseek'
      };

    } catch (error) {
      console.error('[DeepSeek] Generation error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return this.models;
  }

  /**
   * Check service health and performance
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    models: string[];
  }> {
    if (!this.isInitialized) {
      return {
        status: 'unhealthy',
        latency: -1,
        models: []
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          latency,
          models: this.models
        };
      } else {
        return {
          status: 'unhealthy',
          latency,
          models: []
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        models: []
      };
    }
  }

  /**
   * Get pricing information for ANFIS cost optimization
   */
  getPricing(): {
    inputCostPer1kTokens: number;
    outputCostPer1kTokens: number;
    currency: 'USD';
  } {
    // DeepSeek pricing (approximate, adjust based on actual rates)
    return {
      inputCostPer1kTokens: 0.0014,  // $0.0014 per 1k input tokens
      outputCostPer1kTokens: 0.0028, // $0.0028 per 1k output tokens
      currency: 'USD'
    };
  }

  /**
   * Get performance characteristics for ANFIS routing
   */
  getPerformanceProfile(): {
    averageLatency: number;
    reliability: number;
    qualityScore: number;
    specialties: string[];
  } {
    return {
      averageLatency: 800, // ms
      reliability: 0.95,   // 95% uptime
      qualityScore: 0.88,  // Quality rating
      specialties: [
        'reasoning',
        'coding',
        'analysis',
        'mathematical computation'
      ]
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.apiKey;
  }
}

export default DeepSeekService;