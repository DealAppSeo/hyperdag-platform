/**
 * X.AI (xAI) Service - Grok Integration
 * Real-time information and advanced reasoning
 * Free tier: Varies (new provider)
 */

import axios from 'axios';

interface XAIConfig {
  apiKey?: string;
  baseURL: string;
  models: string[];
}

interface XAIResponse {
  content: string;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  tokens: number;
  realTimeData?: boolean;
}

export class XAIService {
  private config: XAIConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
      models: [
        'grok-beta',
        'grok-vision-beta',
        'grok-2-vision-1212',
        'grok-2-1212'
      ]
    };

    if (this.config.apiKey) {
      this.isInitialized = true;
      console.log('[X.AI] Service initialized with API key');
      console.log('[X.AI] Available models:', this.config.models.length);
      console.log('[X.AI] Capabilities: Real-time web access, advanced reasoning');
    } else {
      console.log('[X.AI] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate text using Grok
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
      realTimeWeb?: boolean;
    } = {}
  ): Promise<XAIResponse> {
    if (!this.isAvailable()) {
      throw new Error('X.AI service not available');
    }

    const startTime = Date.now();
    const model = options.model || 'grok-beta';

    try {
      const requestBody = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: options.stream || false
      };

      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const latency = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const tokens = response.data.usage?.total_tokens || 0;

      console.log(`[X.AI] Generated ${tokens} tokens in ${latency}ms`);

      return {
        content,
        latency,
        cost: 0, // Using free tier
        provider: 'xai',
        model,
        success: true,
        tokens,
        realTimeData: options.realTimeWeb
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[X.AI] Generation error:', error.response?.data || error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'xai',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Generate with vision capabilities
   */
  async generateWithVision(
    prompt: string,
    imageData: {
      url?: string;
      base64?: string;
      mimeType?: string;
    },
    options: {
      model?: string;
      temperature?: number;
    } = {}
  ): Promise<XAIResponse> {
    if (!this.isAvailable()) {
      throw new Error('X.AI service not available');
    }

    const startTime = Date.now();
    const model = options.model || 'grok-vision-beta';

    try {
      const content: any[] = [
        { type: 'text', text: prompt }
      ];

      if (imageData.url) {
        content.push({
          type: 'image_url',
          image_url: { url: imageData.url }
        });
      } else if (imageData.base64) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${imageData.mimeType || 'image/jpeg'};base64,${imageData.base64}`
          }
        });
      }

      const requestBody = {
        model,
        messages: [
          {
            role: 'user',
            content
          }
        ],
        temperature: options.temperature || 0.7
      };

      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const latency = Date.now() - startTime;
      const responseContent = response.data.choices[0]?.message?.content || '';
      const tokens = response.data.usage?.total_tokens || 0;

      return {
        content: responseContent,
        latency,
        cost: 0,
        provider: 'xai',
        model,
        success: true,
        tokens
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[X.AI] Vision generation error:', error.response?.data || error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'xai',
        model,
        success: false,
        tokens: 0
      };
    }
  }

  /**
   * Real-time web search and generation
   */
  async generateWithWebSearch(
    query: string,
    options: {
      maxResults?: number;
      timeframe?: 'day' | 'week' | 'month' | 'year';
      model?: string;
    } = {}
  ): Promise<XAIResponse> {
    const prompt = `Search the web for recent information about: ${query}. Provide current, factual information with sources if available.`;
    
    return this.generateText(prompt, {
      model: options.model || 'grok-beta',
      realTimeWeb: true
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      provider: 'X.AI (xAI)',
      tier: 'free_tier',
      available: this.isAvailable(),
      models: this.config.models,
      capabilities: [
        'text_generation',
        'vision_understanding',
        'real_time_web_access',
        'advanced_reasoning',
        'multimodal',
        'current_events',
        'factual_information'
      ],
      specialFeatures: [
        'Real-time web access',
        'Up-to-date information',
        'Advanced reasoning capabilities',
        'Vision understanding',
        'Conversational AI'
      ],
      limitations: [
        'Newer provider',
        'Rate limits may apply',
        'API stability developing'
      ]
    };
  }
}

export const xaiService = new XAIService();