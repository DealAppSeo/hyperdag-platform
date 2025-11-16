/**
 * Google Gemini Service
 * Ultra-high volume free tier: 1M tokens/min
 * Cost: $0 (generous free tier)
 * Use case: High-volume text generation, multimodal tasks
 */

import { GoogleGenAI } from '@google/genai';

interface GeminiConfig {
  apiKey?: string;
  models: string[];
  freeTokensPerMinute: number;
}

interface GeminiResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
}

export class GeminiService {
  private config: GeminiConfig;
  private client?: GoogleGenAI;
  private isInitialized: boolean = false;
  private tokensUsedThisMinute = 0;
  private minuteResetTime = Date.now() + 60000;

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY,
      models: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash-preview-exp',
        'gemma-3-9b-it',
        'gemma-3-27b-it'
      ],
      freeTokensPerMinute: 1000000 // 1M tokens/min
    };

    if (this.config.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
      this.isInitialized = true;
      console.log('[Gemini] Service initialized with API key');
      console.log('[Gemini] Free tier: 1M tokens/minute');
      console.log('[Gemini] Available models:', this.config.models.length);
    } else {
      console.log('[Gemini] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    this.resetMinuteCounterIfNeeded();
    return this.isInitialized && this.tokensUsedThisMinute < this.config.freeTokensPerMinute;
  }

  /**
   * Get remaining quota for this minute
   */
  getRemainingQuota(): number {
    this.resetMinuteCounterIfNeeded();
    return Math.max(0, this.config.freeTokensPerMinute - this.tokensUsedThisMinute);
  }

  /**
   * Reset token counter every minute
   */
  private resetMinuteCounterIfNeeded(): void {
    if (Date.now() > this.minuteResetTime) {
      this.tokensUsedThisMinute = 0;
      this.minuteResetTime = Date.now() + 60000;
    }
  }

  /**
   * Generate text using Gemini
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemInstruction?: string;
    } = {}
  ): Promise<GeminiResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'gemini-2.5-flash';

    try {
      const modelInstance = this.client!.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          systemInstruction: options.systemInstruction,
          maxOutputTokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7
        }
      });

      const response = await modelInstance;
      const latency = Date.now() - startTime;
      const content = response.text || '';
      const estimatedTokens = Math.ceil((prompt.length + content.length) / 4);

      // Update usage tracking
      this.tokensUsedThisMinute += estimatedTokens;

      console.log(`[Gemini] Generated ${estimatedTokens} tokens in ${latency}ms`);
      console.log(`[Gemini] Remaining quota: ${this.getRemainingQuota()}`);

      return {
        content,
        latency,
        cost: 0, // Free tier
        provider: 'gemini',
        model,
        success: true,
        tokens: estimatedTokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Gemini] Generation error:', error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'gemini',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Generate content with multimodal capabilities
   */
  async generateMultimodal(
    prompt: string,
    mediaData?: {
      type: 'image' | 'video' | 'audio';
      data: string; // base64 encoded
      mimeType: string;
    },
    options: {
      model?: string;
      temperature?: number;
    } = {}
  ): Promise<GeminiResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini service not available or quota exceeded');
    }

    const startTime = Date.now();
    const model = options.model || 'gemini-2.5-pro';

    try {
      const contents: any[] = [];
      
      if (mediaData) {
        contents.push({
          inlineData: {
            data: mediaData.data,
            mimeType: mediaData.mimeType
          }
        });
      }
      
      contents.push({ text: prompt });

      const response = await this.client!.models.generateContent({
        model,
        contents,
        config: {
          temperature: options.temperature || 0.7
        }
      });

      const latency = Date.now() - startTime;
      const content = response.text || '';
      const estimatedTokens = Math.ceil((prompt.length + content.length) / 4);

      // Update usage tracking
      this.tokensUsedThisMinute += estimatedTokens;

      return {
        content,
        latency,
        cost: 0,
        provider: 'gemini',
        model,
        success: true,
        tokens: estimatedTokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Gemini] Multimodal generation error:', error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'gemini',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    this.resetMinuteCounterIfNeeded();
    
    return {
      provider: 'Google Gemini',
      tier: 'free',
      minuteLimit: this.config.freeTokensPerMinute,
      tokensUsedThisMinute: this.tokensUsedThisMinute,
      remainingQuota: this.getRemainingQuota(),
      quotaPercentage: (this.tokensUsedThisMinute / this.config.freeTokensPerMinute) * 100,
      available: this.isAvailable(),
      models: this.config.models,
      capabilities: [
        'text_generation',
        'multimodal',
        'high_volume',
        'reasoning',
        'code_generation',
        'multilingual'
      ]
    };
  }
}

export const geminiService = new GeminiService();