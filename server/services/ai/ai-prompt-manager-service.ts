/**
 * AI-Prompt-Manager Service
 * 
 * Integrates with AI-Prompt-Manager ANFIS for optimized AI/Web2 routing
 * Provides prompt optimization, text generation, and AI assistance
 */

import { aiPromptManagerANFIS } from './ai-prompt-manager-anfis';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import DeepSeekService from './deepseek-service';
import MyNinjaService from './myninja-service';
import HuggingFaceService from './huggingface-service';

class AIPromptManagerService {
  private isInitialized = false;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private deepseekService?: DeepSeekService;
  private myninjaService?: MyNinjaService;
  private huggingfaceService?: HuggingFaceService;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      console.log('[AI-Prompt-Manager] Initializing service with ANFIS optimization');
      
      // Initialize AI providers for prompt optimization
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('[AI-Prompt-Manager] OpenAI provider initialized for prompt optimization');
      }
      
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new Anthropic({ 
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseURL: "https://anthropic.helicone.ai",
          defaultHeaders: {
            "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
          }
        });
        console.log('[AI-Prompt-Manager] Anthropic provider initialized with Helicone.ai auth');
      }
      
      if (process.env.DEEPSEEK_AI_SYMPHONY) {
        this.deepseekService = new DeepSeekService();
        const deepseekInitialized = await this.deepseekService.initialize();
        if (deepseekInitialized) {
          console.log('[AI-Prompt-Manager] DeepSeek provider initialized for cost-effective AI');
        }
      }
      
      if (process.env.MYNINJA_API_KEY) {
        this.myninjaService = new MyNinjaService();
        if (this.myninjaService.isAvailable()) {
          console.log('[AI-Prompt-Manager] MyNinja provider initialized for specialized tasks');
        }
      }
      
      // HuggingFace for open-source models
      this.huggingfaceService = new HuggingFaceService();
      if (this.huggingfaceService.isReady()) {
        console.log('[AI-Prompt-Manager] HuggingFace provider initialized for cost-effective solutions');
      }
      
      this.isInitialized = true;
      console.log('[AI-Prompt-Manager] Service initialized with ANFIS fuzzy logic optimization');
      
    } catch (error) {
      console.error('[AI-Prompt-Manager] Failed to initialize service:', error);
    }
  }

  /**
   * Optimize a prompt using ANFIS routing
   */
  async optimizePrompt(originalPrompt: string, context?: string, options?: {
    targetTask?: 'code' | 'creative' | 'analysis' | 'general';
    prioritizeCost?: boolean;
    maxTokens?: number;
  }): Promise<{
    optimizedPrompt: string;
    improvementScore: number;
    provider: string;
    reasoning: string;
    recommendations: string[];
    cost: number;
    responseTime: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('AI-Prompt-Manager service not initialized');
    }

    const startTime = Date.now();

    try {
      // Get optimization recommendations from ANFIS
      const recommendations = aiPromptManagerANFIS.getOptimizationRecommendations(originalPrompt);
      
      // Create optimization request
      const optimizationPrompt = `Optimize this prompt for better AI performance:

Original Prompt: "${originalPrompt}"

Context: ${context || 'General purpose'}
Target Task: ${options?.targetTask || 'general'}

Requirements:
1. Make it more specific and actionable
2. Add relevant context and constraints
3. Structure for better AI understanding
4. Maintain the core intent and objectives

${recommendations.recommendations.length > 0 ? 
  `Specific improvements needed:\n- ${recommendations.recommendations.join('\n- ')}` : ''}

Return only the optimized prompt without explanations.`;

      // Process through ANFIS
      const result = await aiPromptManagerANFIS.processRequest(
        optimizationPrompt,
        context,
        { prioritizeCost: options?.prioritizeCost }
      );

      const responseTime = Date.now() - startTime;

      return {
        optimizedPrompt: result.response,
        improvementScore: recommendations.estimatedImprovement,
        provider: result.provider,
        reasoning: result.reasoning,
        recommendations: recommendations.recommendations,
        cost: result.actualCost || result.estimatedCost,
        responseTime
      };

    } catch (error) {
      console.error('[AI-Prompt-Manager] Prompt optimization failed:', error);
      throw error;
    }
  }

  /**
   * Generate text using ANFIS-optimized routing
   */
  async generateText(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    prioritizeCost?: boolean;
    taskType?: 'creative' | 'technical' | 'business' | 'general';
  }): Promise<{
    text: string;
    provider: string;
    confidence: number;
    reasoning: string;
    cost: number;
    responseTime: number;
    metadata: {
      tokens: number;
      qualityScore: number;
      costEfficiency: number;
    };
  }> {
    if (!this.isInitialized) {
      throw new Error('AI-Prompt-Manager service not initialized');
    }

    try {
      // Route through ANFIS for optimal provider selection
      const result = await aiPromptManagerANFIS.processRequest(
        prompt,
        `Task type: ${options?.taskType || 'general'}`,
        { prioritizeCost: options?.prioritizeCost }
      );

      // Estimate tokens and quality
      const estimatedTokens = Math.ceil(result.response.length / 4);
      const qualityScore = result.confidence;
      const costEfficiency = (result.actualCost || result.estimatedCost) > 0 ? 
        qualityScore / (result.actualCost || result.estimatedCost) : 1;

      return {
        text: result.response,
        provider: result.provider,
        confidence: result.confidence,
        reasoning: result.reasoning,
        cost: result.actualCost || result.estimatedCost,
        responseTime: result.responseTime,
        metadata: {
          tokens: estimatedTokens,
          qualityScore,
          costEfficiency
        }
      };

    } catch (error) {
      console.error('[AI-Prompt-Manager] Text generation failed:', error);
      throw error;
    }
  }

  /**
   * Provide AI assistance with ANFIS optimization
   */
  async assistWithTask(task: string, context?: string, options?: {
    assistanceType?: 'code' | 'writing' | 'analysis' | 'planning';
    prioritizeQuality?: boolean;
    maxCost?: number;
  }): Promise<{
    assistance: string;
    provider: string;
    confidence: number;
    reasoning: string;
    suggestions: string[];
    cost: number;
    responseTime: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('AI-Prompt-Manager service not initialized');
    }

    try {
      // Create assistance prompt
      const assistancePrompt = `Provide expert assistance with this task:

Task: ${task}
Context: ${context || 'No additional context provided'}
Assistance Type: ${options?.assistanceType || 'general'}

Please provide:
1. Direct assistance with the task
2. Step-by-step guidance if applicable
3. Best practices and recommendations
4. Potential pitfalls to avoid
5. Additional suggestions for improvement`;

      // Route through ANFIS
      const result = await aiPromptManagerANFIS.processRequest(
        assistancePrompt,
        context,
        { prioritizeCost: !options?.prioritizeQuality }
      );

      // Extract suggestions from response
      const suggestions = this.extractSuggestions(result.response);

      return {
        assistance: result.response,
        provider: result.provider,
        confidence: result.confidence,
        reasoning: result.reasoning,
        suggestions,
        cost: result.actualCost || result.estimatedCost,
        responseTime: result.responseTime
      };

    } catch (error) {
      console.error('[AI-Prompt-Manager] Task assistance failed:', error);
      throw error;
    }
  }

  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for numbered lists, bullet points, or suggestion keywords
    const lines = response.split('\n');
    lines.forEach(line => {
      if (line.match(/^\d+\./) || line.match(/^[-*•]/) || 
          line.toLowerCase().includes('suggest') || 
          line.toLowerCase().includes('recommend')) {
        suggestions.push(line.trim());
      }
    });

    // Limit to top 5 suggestions
    return suggestions.slice(0, 5);
  }

  /**
   * Analyze prompt performance and get optimization insights
   */
  async analyzePromptPerformance(prompt: string): Promise<{
    characteristics: {
      complexity: number;
      optimizationPotential: number;
      estimatedCost: number;
      recommendedProvider: string;
    };
    recommendations: string[];
    improvements: {
      clarity: number;
      specificity: number;
      structure: number;
      efficiency: number;
    };
  }> {
    const characteristics = aiPromptManagerANFIS.analyzePrompt(prompt);
    const selection = aiPromptManagerANFIS.selectOptimalProvider(characteristics);
    const recommendations = aiPromptManagerANFIS.getOptimizationRecommendations(prompt);

    return {
      characteristics: {
        complexity: characteristics.complexity,
        optimizationPotential: characteristics.optimizationRequired,
        estimatedCost: selection.estimatedCost,
        recommendedProvider: selection.provider
      },
      recommendations: recommendations.recommendations,
      improvements: {
        clarity: Math.random() * 0.3 + 0.6, // Mock scoring
        specificity: Math.random() * 0.3 + 0.5,
        structure: Math.random() * 0.4 + 0.5,
        efficiency: recommendations.estimatedImprovement
      }
    };
  }

  /**
   * Get AI/Web2 provider statistics from ANFIS
   */
  getProviderStatistics(): any {
    return aiPromptManagerANFIS.getProviderStats();
  }

  /**
   * Sync performance data with HyperDagManager
   */
  async syncWithHyperDAG(): Promise<void> {
    await aiPromptManagerANFIS.syncWithHyperDagManager();
  }

  /**
   * Health check for AI-Prompt-Manager service
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'error';
    providers: { [key: string]: boolean };
    anfisActive: boolean;
    lastSync: number;
  } {
    const providers = {
      openai: !!this.openaiClient,
      anthropic: !!this.anthropicClient,
      deepseek: !!this.deepseekService?.isAvailable(),
      myninja: !!this.myninjaService?.isAvailable(),
      huggingface: !!this.huggingfaceService?.isReady()
    };

    const activeProviders = Object.values(providers).filter(Boolean).length;
    const status = activeProviders >= 3 ? 'healthy' : activeProviders >= 1 ? 'degraded' : 'error';

    return {
      status,
      providers,
      anfisActive: this.isInitialized,
      lastSync: Date.now()
    };
  }
}

// Export singleton instance
export const aiPromptManagerService = new AIPromptManagerService();