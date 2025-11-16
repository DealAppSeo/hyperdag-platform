/**
 * Anthropic Claude Service
 * High-quality reasoning and analysis with Claude 3.5 Sonnet and Haiku
 * Free tier: Limited monthly credits
 * Cost: Free tier with optional paid plans
 * Use case: Advanced reasoning, analysis, code generation, writing
 */

import Anthropic from '@anthropic-ai/sdk';

interface AnthropicConfig {
  apiKey?: string;
  models: string[];
  freeTokensPerMonth: number;
}

interface AnthropicResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  stopReason?: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AnthropicService {
  private config: AnthropicConfig;
  private client?: Anthropic;
  private isInitialized: boolean = false;
  private tokensUsedThisMonth = 0;
  private monthResetTime = this.getNextMonthTimestamp();

  constructor() {
    this.config = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      freeTokensPerMonth: 50000 // Estimated free tier limit
    };

    if (this.config.apiKey) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey
      });
      this.isInitialized = true;
      console.log('[Anthropic] Service initialized with API key');
      console.log('[Anthropic] Free tier: 50K tokens/month (estimated)');
      console.log('[Anthropic] Available models:', this.config.models.length);
    } else {
      console.log('[Anthropic] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    this.resetMonthCounterIfNeeded();
    return this.isInitialized && this.tokensUsedThisMonth < this.config.freeTokensPerMonth;
  }

  /**
   * Get remaining quota for this month
   */
  getRemainingQuota(): number {
    this.resetMonthCounterIfNeeded();
    return Math.max(0, this.config.freeTokensPerMonth - this.tokensUsedThisMonth);
  }

  /**
   * Reset token counter every month
   */
  private resetMonthCounterIfNeeded(): void {
    if (Date.now() > this.monthResetTime) {
      this.tokensUsedThisMonth = 0;
      this.monthResetTime = this.getNextMonthTimestamp();
    }
  }

  /**
   * Get timestamp for next month
   */
  private getNextMonthTimestamp(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  /**
   * Generate text using Claude
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemMessage?: string;
      messages?: AnthropicMessage[];
    } = {}
  ): Promise<AnthropicResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'claude-3-5-haiku-20241022';

    try {
      // Prepare messages array
      const messages: AnthropicMessage[] = options.messages || [];
      
      // Add the current prompt as user message if no messages provided
      if (messages.length === 0) {
        messages.push({
          role: 'user',
          content: prompt
        });
      }

      // Prepare the request
      const requestParams: any = {
        model,
        max_tokens: options.maxTokens || 4096,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      // Add system message if provided
      if (options.systemMessage) {
        requestParams.system = options.systemMessage;
      }

      // Add temperature if provided
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature;
      }

      const response = await this.client!.messages.create(requestParams);

      const latency = Date.now() - startTime;
      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      // Update usage tracking
      this.tokensUsedThisMonth += totalTokens;

      console.log(`[Anthropic] Generated ${totalTokens} tokens (${inputTokens} input, ${outputTokens} output) in ${latency}ms`);
      console.log(`[Anthropic] Remaining quota: ${this.getRemainingQuota()}`);

      return {
        content,
        latency,
        cost: 0, // Free tier
        provider: 'anthropic',
        model,
        success: true,
        tokens: totalTokens,
        stopReason: response.stop_reason
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Anthropic] Generation error:', error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'anthropic',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Generate text with conversation history
   */
  async generateWithConversation(
    messages: AnthropicMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemMessage?: string;
    } = {}
  ): Promise<AnthropicResponse> {
    return this.generateText('', {
      ...options,
      messages
    });
  }

  /**
   * Generate with analysis focus (uses Claude 3.5 Sonnet for better reasoning)
   */
  async generateAnalysis(
    prompt: string,
    options: {
      systemMessage?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AnthropicResponse> {
    const analysisSystem = options.systemMessage || 
      'You are Claude, an AI assistant created by Anthropic. You excel at analysis, reasoning, and providing detailed, thoughtful responses. Please analyze the given prompt thoroughly and provide a comprehensive response.';

    return this.generateText(prompt, {
      model: 'claude-3-5-sonnet-20241022',
      systemMessage: analysisSystem,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.3
    });
  }

  /**
   * Generate with fast response (uses Haiku for speed)
   */
  async generateQuick(
    prompt: string,
    options: {
      systemMessage?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AnthropicResponse> {
    return this.generateText(prompt, {
      model: 'claude-3-5-haiku-20241022',
      systemMessage: options.systemMessage,
      maxTokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7
    });
  }

  /**
   * Generate code with optimization for programming tasks
   */
  async generateCode(
    prompt: string,
    options: {
      language?: string;
      systemMessage?: string;
      maxTokens?: number;
    } = {}
  ): Promise<AnthropicResponse> {
    const codeSystem = options.systemMessage || 
      `You are Claude, an AI assistant specialized in programming and software development. ${options.language ? `Focus on ${options.language} programming.` : ''} Provide clean, efficient, and well-documented code with explanations.`;

    return this.generateText(prompt, {
      model: 'claude-3-5-sonnet-20241022',
      systemMessage: codeSystem,
      maxTokens: options.maxTokens || 4096,
      temperature: 0.1
    });
  }

  /**
   * Check if a specific model is available
   */
  isModelAvailable(model: string): boolean {
    return this.config.models.includes(model);
  }

  /**
   * Get optimal model for task type
   */
  getOptimalModel(taskType: 'analysis' | 'quick' | 'code' | 'creative' | 'general'): string {
    const modelMap = {
      'analysis': 'claude-3-5-sonnet-20241022',
      'quick': 'claude-3-5-haiku-20241022',
      'code': 'claude-3-5-sonnet-20241022',
      'creative': 'claude-3-5-sonnet-20241022',
      'general': 'claude-3-5-haiku-20241022'
    };

    return modelMap[taskType] || 'claude-3-5-haiku-20241022';
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetMonthCounterIfNeeded();
    
    return {
      provider: 'Anthropic Claude',
      tier: 'free',
      monthlyLimit: this.config.freeTokensPerMonth,
      tokensUsedThisMonth: this.tokensUsedThisMonth,
      remainingQuota: this.getRemainingQuota(),
      quotaPercentage: (this.tokensUsedThisMonth / this.config.freeTokensPerMonth) * 100,
      available: this.isAvailable(),
      models: this.config.models,
      capabilities: [
        'text_generation',
        'advanced_reasoning',
        'code_generation',
        'analysis',
        'conversation',
        'creative_writing',
        'question_answering',
        'summarization',
        'classification'
      ],
      specialFeatures: [
        'Constitutional AI training',
        'High-quality reasoning',
        'Safe and helpful responses',
        'Long context windows',
        'Conversation continuity'
      ],
      modelFeatures: {
        'claude-3-5-sonnet': 'Best reasoning and analysis',
        'claude-3-5-haiku': 'Fast responses and efficiency',
        'claude-3-opus': 'Highest capability model',
        'claude-3-sonnet': 'Balanced performance',
        'claude-3-haiku': 'Speed optimized'
      }
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    this.resetMonthCounterIfNeeded();
    
    return {
      tokensUsedThisMonth: this.tokensUsedThisMonth,
      monthlyLimit: this.config.freeTokensPerMonth,
      remainingQuota: this.getRemainingQuota(),
      usagePercentage: (this.tokensUsedThisMonth / this.config.freeTokensPerMonth) * 100,
      resetDate: new Date(this.monthResetTime).toISOString(),
      isAvailable: this.isAvailable()
    };
  }
}

export const anthropicService = new AnthropicService();