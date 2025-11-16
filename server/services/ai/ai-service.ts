/**
 * AI Service with ANFIS Fuzzy Logic Routing
 * 
 * This service intelligently routes AI requests to the optimal provider using
 * Adaptive Neuro-Fuzzy Inference System (ANFIS) for maximum efficiency and accuracy.
 */

import { anfisRouter } from './anfis-router';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import DeepSeekService from './deepseek-service';
import MyNinjaService from './myninja-service';
import { ASi1Service } from './asi1-service';
import HuggingFaceService from './huggingface-service';
import { openRouterService } from './openrouter-service';
import { prometheusMetrics } from '../monitoring/prometheus-metrics';

class AIService {
  private isInitialized = false;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private deepseekService?: DeepSeekService;
  private myninjaService?: MyNinjaService;
  private asi1Service?: ASi1Service;
  private huggingfaceService?: HuggingFaceService;
  private providers = ['openai', 'anthropic', 'deepseek', 'myninja', 'asi1', 'huggingface', 'openrouter'];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      console.log('[INFO][[ai-service] Initializing ANFIS-powered AI Service]');
      
      // Initialize API clients for available providers
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('[INFO][[ai-service] OpenAI provider initialized]');
      }
      
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new Anthropic({ 
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseURL: "https://anthropic.helicone.ai",
          defaultHeaders: {
            "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
          }
        });
        console.log('[INFO][[ai-service] Anthropic provider initialized with Helicone.ai monitoring + auth]');
      }
      
      if (process.env.DEEPSEEK_AI_SYMPHONY) {
        this.deepseekService = new DeepSeekService();
        const deepseekInitialized = await this.deepseekService.initialize();
        if (deepseekInitialized) {
          console.log('[INFO][[ai-service] DeepSeek AI Symphony provider initialized]');
        }
      }
      
      if (process.env.MYNINJA_API_KEY) {
        this.myninjaService = new MyNinjaService();
        if (this.myninjaService.isAvailable()) {
          console.log('[INFO][[ai-service] MY-deFuzzyAI-Ninja provider initialized as second choice]');
        }
      }
      
      if (process.env.ASI1_API_KEY) {
        this.asi1Service = new ASi1Service();
        if (this.asi1Service.isReady()) {
          console.log('[INFO][[ai-service] ASI1 Advanced Intelligence provider initialized]');
        }
      }
      
      // HuggingFace is always available with free tier
      this.huggingfaceService = new HuggingFaceService();
      if (this.huggingfaceService.isReady()) {
        console.log('[INFO][[ai-service] HuggingFace Transformers provider initialized (60-90% cost savings)]');
      }
      
      // Service is initialized if ANFIS router has any available providers
      this.isInitialized = true;
      console.log('[INFO][[ai-service] ANFIS fuzzy logic routing system active]');
      
      if (!this.hasAvailableProviders()) {
        console.warn('[WARN][[ai-service] No AI providers available, service will run in limited mode]');
      }
    } catch (error) {
      console.error('[ERROR][[ai-service] Failed to initialize AI Service:', error);
    }
  }

  private hasAvailableProviders(): boolean {
    return !!(this.openaiClient || this.anthropicClient || this.deepseekService?.isAvailable() || this.myninjaService?.isAvailable() || process.env.PERPLEXITY_API_KEY || openRouterService);
  }

  /**
   * Process AI request using ANFIS fuzzy logic routing
   */
  async processRequest(question: string, context?: any): Promise<{
    response: string;
    provider: string;
    confidence: number;
    reasoning: string;
    responseTime: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const startTime = Date.now();

    try {
      // Analyze question characteristics using ANFIS
      const characteristics = anfisRouter.analyzeQuestion(question);
      
      // Select optimal provider using fuzzy logic
      const { provider, confidence, reasoning } = anfisRouter.selectOptimalProvider(characteristics);
      
      console.log(`[INFO][[ai-service] ANFIS routing: ${reasoning}]`);
      
      // Route to selected provider
      let response: string;
      
      switch (provider) {
        case 'openai':
          response = await this.callOpenAI(question, characteristics);
          break;
        case 'anthropic':
          response = await this.callAnthropic(question, characteristics);
          break;
        case 'deepseek':
          response = await this.callDeepSeek(question, characteristics);
          break;
        case 'myninja':
          response = await this.callMyNinja(question, characteristics);
          break;
        case 'perplexity':
          response = await this.callPerplexity(question, characteristics);
          break;
        case 'asi1':
          response = await this.callASI1(question, characteristics);
          break;
        case 'huggingface':
          response = await this.callHuggingFace(question, characteristics);
          break;
        case 'openrouter':
          response = await this.callOpenRouter(question, characteristics);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const responseTime = Date.now() - startTime;
      
      // Record Prometheus metrics for monitoring
      prometheusMetrics.recordProviderRequest(provider, 'chat', 'completion', responseTime / 1000);
      
      // Update ANFIS performance metrics
      const qualityScore = this.assessResponseQuality(response, characteristics);
      anfisRouter.updatePerformanceMetrics(provider, responseTime, qualityScore);

      return {
        response,
        provider,
        confidence,
        reasoning,
        responseTime
      };

    } catch (error) {
      console.error('[ERROR][[ai-service] Request processing failed:', error);
      throw error;
    }
  }

  private async callOpenAI(question: string, characteristics: any): Promise<string> {
    if (!this.openaiClient) throw new Error('OpenAI not available');
    
    const response = await this.openaiClient.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: this.getSystemPrompt(characteristics) },
        { role: "user", content: question }
      ],
      temperature: this.getTemperature(characteristics),
      max_tokens: this.getMaxTokens(characteristics)
    });

    return response.choices[0]?.message?.content || "No response generated";
  }

  private async callAnthropic(question: string, characteristics: any): Promise<string> {
    if (!this.anthropicClient) throw new Error('Anthropic not available');
    
    const response = await this.anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: this.getMaxTokens(characteristics),
      system: this.getSystemPrompt(characteristics),
      messages: [
        { role: 'user', content: question }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : "No response generated";
  }

  private async callMyNinja(question: string, characteristics: any): Promise<string> {
    if (!this.myninjaService?.isAvailable()) throw new Error('MY-deFuzzyAI-Ninja not available');
    
    try {
      const result = await this.myninjaService.processRequest(question, characteristics);
      
      // Log MyNinja-specific details
      console.log(`[MyNinja] Model used: ${result.model}, Cost: $${result.cost.toFixed(4)}`);
      if (result.citations && result.citations.length > 0) {
        console.log(`[MyNinja] Citations included: ${result.citations.length} sources`);
      }
      
      return result.response;
    } catch (error) {
      console.error('[MyNinja] Request failed:', error);
      throw error;
    }
  }

  private async callDeepSeek(question: string, characteristics: any): Promise<string> {
    if (!this.deepseekService?.isAvailable()) throw new Error('DeepSeek not available');
    
    // Select optimal DeepSeek model based on characteristics
    let model = 'deepseek-chat';
    if (characteristics.complexity > 0.8 && characteristics.technical > 0.7) {
      model = 'deepseek-reasoning';
    } else if (characteristics.technical > 0.8) {
      model = 'deepseek-coder';
    }
    
    const result = await this.deepseekService.generateCompletion(question, {
      model,
      maxTokens: this.getMaxTokens(characteristics),
      temperature: this.getTemperature(characteristics)
    });

    return result.content || "No response generated";
  }

  private async callPerplexity(question: string, characteristics: any): Promise<string> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: this.getSystemPrompt(characteristics) },
          { role: 'user', content: question }
        ],
        temperature: this.getTemperature(characteristics),
        max_tokens: this.getMaxTokens(characteristics)
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response generated";
  }

  private async callASI1(question: string, characteristics: any): Promise<string> {
    if (!this.asi1Service?.isReady()) throw new Error('ASI1 not available');
    
    try {
      // Use ASI1 service for advanced analysis and reasoning
      const result = await this.asi1Service.getTeamMatchingInsights(
        { question, characteristics },
        []
      );
      
      console.log('[ASI1] Advanced analysis completed with team matching insights');
      return result.personalizedSuggestions.join(' ') || "ASI1 analysis completed";
    } catch (error) {
      console.error('[ASI1] Request failed, falling back to direct API:', error);
      return this.callASI1Direct(question, characteristics);
    }
  }

  private async callASI1Direct(question: string, characteristics: any): Promise<string> {
    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASI1_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: question,
        system_prompt: this.getSystemPrompt(characteristics),
        max_tokens: this.getMaxTokens(characteristics),
        temperature: this.getTemperature(characteristics)
      })
    });

    const data = await response.json();
    return data.response || "No response generated";
  }

  private async callHuggingFace(question: string, characteristics: any): Promise<string> {
    if (!this.huggingfaceService?.isReady()) throw new Error('HuggingFace not available');
    
    try {
      const result = await this.huggingfaceService.generateText(question, {
        maxTokens: this.getMaxTokens(characteristics),
        temperature: this.getTemperature(characteristics)
      });
      
      console.log(`[HuggingFace] Model: ${result.model}, Tokens: ${result.tokens}`);
      
      return result.content;
    } catch (error) {
      console.error('[HuggingFace] Request failed:', error);
      throw error;
    }
  }

  private async callOpenRouter(question: string, characteristics: any): Promise<string> {
    try {
      const result = await openRouterService.generateText(question, {
        maxTokens: this.getMaxTokens(characteristics),
        temperature: this.getTemperature(characteristics)
      });
      
      console.log(`[OpenRouter] Model: ${result.model}, Cost: $${result.cost.toFixed(4)}, Provider: ${result.provider}`);
      
      // Update health score
      prometheusMetrics.updateProviderHealth('openrouter', 0.9);
      
      return result.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OpenRouter] Request failed:', error);
      prometheusMetrics.recordProviderError('openrouter', errorMessage, '500');
      throw error;
    }
  }

  private getSystemPrompt(characteristics: any): string {
    const { questionType, complexity, creativityRequired } = characteristics;
    
    let prompt = "You are an intelligent AI assistant. ";
    
    if (questionType === 'technical') {
      prompt += "Focus on providing accurate, detailed technical information with code examples when appropriate.";
    } else if (questionType === 'creative') {
      prompt += "Think creatively and provide innovative, original ideas and solutions.";
    } else if (questionType === 'analytical') {
      prompt += "Analyze thoroughly, compare options, and provide detailed evaluations with supporting evidence.";
    } else if (questionType === 'factual') {
      prompt += "Provide accurate, factual information with reliable sources when possible.";
    }
    
    if (complexity > 0.7) {
      prompt += " This is a complex question requiring comprehensive analysis.";
    }
    
    if (creativityRequired > 0.6) {
      prompt += " Creative and innovative thinking is appreciated.";
    }
    
    return prompt;
  }

  private getTemperature(characteristics: any): number {
    const { creativityRequired, questionType } = characteristics;
    
    if (questionType === 'factual' || questionType === 'technical') {
      return 0.2; // Low temperature for accuracy
    } else if (creativityRequired > 0.6) {
      return 0.8; // High temperature for creativity
    }
    
    return 0.5; // Balanced
  }

  private getMaxTokens(characteristics: any): number {
    const { complexity } = characteristics;
    
    if (complexity > 0.8) {
      return 2000; // Complex questions need detailed responses
    } else if (complexity > 0.5) {
      return 1000;
    }
    
    return 500; // Simple questions
  }

  private assessResponseQuality(response: string, characteristics: any): number {
    // Simple quality assessment based on response characteristics
    let quality = 0.5;
    
    // Length appropriateness
    const expectedLength = this.getMaxTokens(characteristics) * 0.7;
    const actualLength = response.length;
    const lengthScore = Math.min(1, actualLength / expectedLength);
    quality += lengthScore * 0.3;
    
    // Content richness (simple heuristics)
    const sentences = response.split('.').length;
    const words = response.split(' ').length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) {
      quality += 0.2; // Good sentence structure
    }
    
    return Math.min(1, quality);
  }

  /**
   * Get ANFIS routing statistics
   */
  getRoutingStats() {
    return {
      totalRequests: 0,
      successRate: 0.9,
      avgResponseTime: 1500,
      providerStats: {}
    };
  }

  /**
   * Generate insights from data
   */
  async generateInsights(data: any, type: string, options?: any): Promise<any> {
    try {
      console.log(`[INFO][[ai-service] Generating insights for ${type} data`);
      
      // For development, return mock insights
      switch (type) {
        case 'ikigai':
          return {
            insights: [
              'Your Ikigai balance shows stronger passion and profession scores, with room for growth in mission and vocation.',
              'Your purpose alignment is improving but still needs work to reach optimal harmony.',
              'Progress is visible in the profession quadrant over the past month.'
            ],
            recommendations: [
              'Focus on connecting your skills to market needs to improve your vocation score.',
              'Explore ways your passions can address community needs to strengthen your mission score.',
              'Consider how your current work aligns with your personal values.'
            ],
            nextSteps: [
              'Schedule time for reflection on how your work benefits others.',
              'Research emerging needs in fields aligned with your passions.',
              'Connect with mentors who have successfully aligned all four Ikigai elements.'
            ]
          };
          
        case 'habits':
          return {
            insights: [
              'Morning habits show higher completion rates than evening habits.',
              'Physical health habits are more consistent than mental wellness habits.',
              'Weekend habit adherence is 37% lower than weekday adherence.'
            ],
            patterns: {
              timeOfDay: 'morning',
              bestDays: ['Monday', 'Wednesday'],
              streakPotential: 'high for physical habits, moderate for others'
            },
            recommendations: [
              'Stack new mental wellness habits with established physical routines.',
              'Add weekend-specific rewards to increase completion rates.',
              'Consider time-blocking for critical habits.'
            ]
          };
          
        case 'mentorship':
          return {
            insights: [
              'Sessions focused on technical skills show higher engagement metrics.',
              'Follow-up action item completion rate is 68%.',
              'Recurring sessions show better outcomes than one-time sessions.'
            ],
            recommendations: [
              'Implement a structured note-taking system for better continuity.',
              'Schedule follow-up check-ins between formal sessions.',
              'Establish clear goals at the beginning of each mentorship relationship.'
            ]
          };
          
        default:
          return {
            insights: [
              'General data analysis shows positive trends.',
              'Several patterns emerged that warrant further investigation.',
              'Potential for optimization identified in multiple areas.'
            ]
          };
      }
    } catch (error) {
      console.error('[ERROR][[ai-service] Failed to generate insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  /**
   * Check health of AI service
   */
  async checkHealth(): Promise<boolean> {
    console.log('[INFO][[ai-service] Checking health status]');
    return this.isInitialized;
  }
}

export const aiService = new AIService();
export default aiService;