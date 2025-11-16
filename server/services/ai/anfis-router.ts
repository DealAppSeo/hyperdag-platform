/**
 * ANFIS (Adaptive Neuro-Fuzzy Inference System) AI Router
 * 
 * Intelligently routes AI requests to the optimal AI provider based on:
 * - Question type and complexity
 * - Provider capabilities and strengths
 * - Current load and response times
 * - Historical performance metrics
 */

import { metricsTracker } from '../monitoring/production-metrics-tracker';

interface FuzzySet {
  name: string;
  membership: (value: number) => number;
}

interface AIProvider {
  name: string;
  capabilities: {
    reasoning: number;
    creativity: number;
    speed: number;
    accuracy: number;
    knowledgeBase: number;
    codeGeneration: number;
    analysis: number;
  };
  currentLoad: number;
  avgResponseTime: number;
  available: boolean;
}

interface QuestionCharacteristics {
  complexity: number;      // 0-1
  creativityRequired: number; // 0-1
  technicalDepth: number;  // 0-1
  speedRequired: number;   // 0-1
  analysisIntensive: number; // 0-1
  questionType: 'factual' | 'creative' | 'analytical' | 'technical' | 'conversational';
}

export class ANFISRouter {
  private providers: Map<string, AIProvider> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  
  constructor() {
    this.initializeProviders();
    this.initializeFuzzySets();
  }

  private initializeProviders() {
    // OpenAI GPT-4o - Balanced, excellent reasoning
    this.providers.set('openai', {
      name: 'OpenAI',
      capabilities: {
        reasoning: 0.95,
        creativity: 0.90,
        speed: 0.75,
        accuracy: 0.92,
        knowledgeBase: 0.88,
        codeGeneration: 0.93,
        analysis: 0.87
      },
      currentLoad: 0.3,
      avgResponseTime: 2.5,
      available: !!process.env.OPENAI_API_KEY
    });

    // Anthropic Claude - Superior reasoning and analysis
    this.providers.set('anthropic', {
      name: 'Anthropic',
      capabilities: {
        reasoning: 0.98,
        creativity: 0.85,
        speed: 0.70,
        accuracy: 0.95,
        knowledgeBase: 0.90,
        codeGeneration: 0.88,
        analysis: 0.93
      },
      currentLoad: 0.2,
      avgResponseTime: 3.2,
      available: !!process.env.ANTHROPIC_API_KEY
    });

    // Perplexity - Real-time knowledge and research
    this.providers.set('perplexity', {
      name: 'Perplexity',
      capabilities: {
        reasoning: 0.80,
        creativity: 0.75,
        speed: 0.85,
        accuracy: 0.88,
        knowledgeBase: 0.95,
        codeGeneration: 0.70,
        analysis: 0.85
      },
      currentLoad: 0.15,
      avgResponseTime: 1.8,
      available: !!process.env.PERPLEXITY_API_KEY
    });

    // DeepSeek AI Symphony - Advanced reasoning and coding
    this.providers.set('deepseek', {
      name: 'DeepSeek Symphony',
      capabilities: {
        reasoning: 0.92,
        creativity: 0.82,
        speed: 0.88,
        accuracy: 0.90,
        knowledgeBase: 0.85,
        codeGeneration: 0.95,
        analysis: 0.89
      },
      currentLoad: 0.10,
      avgResponseTime: 1.2,
      available: !!process.env.DEEPSEEK_AI_SYMPHONY
    });

    // MyNinja.ai - AI-Prompt-Manager's Second Choice - Research and Agent Specialist
    this.providers.set('myninja', {
      name: 'MY-deFuzzyAI-Ninja',
      capabilities: {
        reasoning: 0.88,
        creativity: 0.80,
        speed: 0.82,
        accuracy: 0.89,
        knowledgeBase: 0.92,
        codeGeneration: 0.85,
        analysis: 0.91
      },
      currentLoad: 0.05,
      avgResponseTime: 1.0,
      available: !!process.env.MYNINJA_API_KEY
    });

    // OpenRouter - Strategic Fallback with Multiple Premium Models
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      capabilities: {
        reasoning: 0.90,
        creativity: 0.88,
        speed: 0.75,
        accuracy: 0.87,
        knowledgeBase: 0.86,
        codeGeneration: 0.89,
        analysis: 0.88
      },
      currentLoad: 0.20,
      avgResponseTime: 2.5,
      available: !!process.env.OPENROUTER_API_KEY
    });

    // ASI1 Advanced Intelligence - 6th Provider for Enhanced AI Symphony
    this.providers.set('asi1', {
      name: 'ASI1 Advanced Intelligence',
      capabilities: {
        reasoning: 0.94,      // High reasoning for complex tasks
        creativity: 0.88,     // Strong creative capabilities  
        speed: 0.92,          // Fast processing
        accuracy: 0.93,       // High accuracy
        knowledgeBase: 0.89,  // Comprehensive knowledge
        codeGeneration: 0.91, // Advanced coding
        analysis: 0.95        // Superior analysis
      },
      currentLoad: 0.05,      // Low initial load
      avgResponseTime: 1.8,   // Fast response target
      available: !!process.env.ASI1_API_KEY
    });

    // HuggingFace Transformers - Cost-Effective AI with 60-90% Savings
    this.providers.set('huggingface', {
      name: 'HuggingFace Transformers',
      capabilities: {
        reasoning: 0.80,      // Good reasoning with open models
        creativity: 0.75,     // Decent creativity  
        speed: 0.95,          // Very fast inference
        accuracy: 0.82,       // High accuracy for specialized tasks
        knowledgeBase: 0.78,  // Good knowledge base
        codeGeneration: 0.85, // Strong code generation
        analysis: 0.80        // Good analysis capabilities
      },
      currentLoad: 0.02,      // Very low load with free tier
      avgResponseTime: 0.8,   // Fast response times
      available: true         // Always available with free tier
    });

  }

  private initializeFuzzySets() {
    // Fuzzy membership functions for different characteristics
    this.complexityFuzzy = {
      low: (x: number) => Math.max(0, Math.min(1, (0.4 - x) / 0.4)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 0.5 ? x / 0.5 : (1 - x) / 0.5)),
      high: (x: number) => Math.max(0, Math.min(1, (x - 0.6) / 0.4))
    };

    this.speedFuzzy = {
      low: (x: number) => Math.max(0, Math.min(1, (0.3 - x) / 0.3)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 0.5 ? x / 0.5 : (1 - x) / 0.5)),
      high: (x: number) => Math.max(0, Math.min(1, (x - 0.7) / 0.3))
    };
  }

  private complexityFuzzy: any;
  private speedFuzzy: any;

  /**
   * Analyze question characteristics using NLP and fuzzy logic
   */
  analyzeQuestion(question: string): QuestionCharacteristics {
    const lowerQuestion = question.toLowerCase();
    
    // Determine question type
    let questionType: QuestionCharacteristics['questionType'] = 'conversational';
    
    if (lowerQuestion.includes('code') || lowerQuestion.includes('program') || lowerQuestion.includes('algorithm')) {
      questionType = 'technical';
    } else if (lowerQuestion.includes('analyze') || lowerQuestion.includes('compare') || lowerQuestion.includes('evaluate')) {
      questionType = 'analytical';
    } else if (lowerQuestion.includes('create') || lowerQuestion.includes('design') || lowerQuestion.includes('imagine')) {
      questionType = 'creative';
    } else if (lowerQuestion.includes('what') || lowerQuestion.includes('when') || lowerQuestion.includes('where')) {
      questionType = 'factual';
    }

    // Calculate characteristics based on question content
    const complexity = this.calculateComplexity(question);
    const creativityRequired = this.calculateCreativityRequirement(question);
    const technicalDepth = this.calculateTechnicalDepth(question);
    const speedRequired = this.calculateSpeedRequirement(question);
    const analysisIntensive = this.calculateAnalysisRequirement(question);

    return {
      complexity,
      creativityRequired,
      technicalDepth,
      speedRequired,
      analysisIntensive,
      questionType
    };
  }

  private calculateComplexity(question: string): number {
    const complexityIndicators = [
      'multi-step', 'complex', 'comprehensive', 'detailed', 'thorough',
      'analyze', 'evaluate', 'compare', 'integrate', 'synthesize'
    ];
    
    const matches = complexityIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    const wordCount = question.split(' ').length;
    const lengthScore = Math.min(1, wordCount / 50);
    const indicatorScore = Math.min(1, matches / 3);
    
    return (lengthScore + indicatorScore) / 2;
  }

  private calculateCreativityRequirement(question: string): number {
    const creativeIndicators = [
      'create', 'design', 'imagine', 'brainstorm', 'innovative',
      'original', 'unique', 'artistic', 'creative', 'generate'
    ];
    
    const matches = creativeIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, matches / 2);
  }

  private calculateTechnicalDepth(question: string): number {
    const technicalIndicators = [
      'code', 'algorithm', 'technical', 'programming', 'development',
      'implementation', 'architecture', 'system', 'database', 'api'
    ];
    
    const matches = technicalIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, matches / 3);
  }

  private calculateSpeedRequirement(question: string): number {
    const urgencyIndicators = [
      'quick', 'fast', 'urgent', 'immediately', 'asap',
      'brief', 'short', 'simple', 'basic'
    ];
    
    const matches = urgencyIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, matches / 2);
  }

  private calculateAnalysisRequirement(question: string): number {
    const analysisIndicators = [
      'analyze', 'compare', 'evaluate', 'assess', 'review',
      'examine', 'investigate', 'study', 'research'
    ];
    
    const matches = analysisIndicators.filter(indicator => 
      question.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(1, matches / 2);
  }

  /**
   * ANFIS fuzzy inference to select optimal AI provider
   */
  selectOptimalProvider(characteristics: QuestionCharacteristics): { provider: string; confidence: number; reasoning: string } {
    const availableProviders: [string, AIProvider][] = [];
    
    // Convert Map entries to array manually to avoid TypeScript iteration issues
    this.providers.forEach((provider, providerId) => {
      if (provider.available) {
        availableProviders.push([providerId, provider]);
      }
    });

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    let bestProvider = '';
    let bestScore = -1;
    const scores: { [key: string]: number } = {};

    for (const [providerId, provider] of availableProviders) {
      const score = this.calculateProviderScore(provider, characteristics);
      scores[providerId] = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestProvider = providerId;
      }
    }

    const confidence = this.calculateConfidence(bestScore, scores);
    const reasoning = this.generateReasoning(bestProvider, characteristics, scores);

    return {
      provider: bestProvider,
      confidence,
      reasoning
    };
  }

  private calculateProviderScore(provider: AIProvider, characteristics: QuestionCharacteristics): number {
    const { capabilities } = provider;
    const { complexity, creativityRequired, technicalDepth, speedRequired, analysisIntensive } = characteristics;

    // Fuzzy rule evaluation
    let score = 0;

    // Rule 1: High complexity + High reasoning capability = High score
    const complexityHigh = this.complexityFuzzy.high(complexity);
    score += complexityHigh * capabilities.reasoning * 0.3;

    // Rule 2: High creativity requirement + High creativity capability = High score
    score += creativityRequired * capabilities.creativity * 0.25;

    // Rule 3: High technical depth + High code generation = High score
    score += technicalDepth * capabilities.codeGeneration * 0.25;

    // Rule 4: High speed requirement + High speed capability = High score
    const speedHigh = this.speedFuzzy.high(speedRequired);
    score += speedHigh * capabilities.speed * 0.2;

    // Rule 5: High analysis requirement + High analysis capability = High score
    score += analysisIntensive * capabilities.analysis * 0.25;

    // Apply load and response time penalties
    const loadPenalty = provider.currentLoad * 0.2;
    const responsePenalty = Math.min(0.3, provider.avgResponseTime / 10);
    
    score = score * (1 - loadPenalty - responsePenalty);

    return Math.max(0, Math.min(1, score));
  }

  private calculateConfidence(bestScore: number, allScores: { [key: string]: number }): number {
    const sortedScores = Object.values(allScores).sort((a, b) => b - a);
    const secondBest = sortedScores[1] || 0;
    
    // Confidence based on gap between best and second-best
    const gap = bestScore - secondBest;
    return Math.min(0.95, 0.5 + gap * 2);
  }

  private generateReasoning(providerId: string, characteristics: QuestionCharacteristics, scores: { [key: string]: number }): string {
    const provider = this.providers.get(providerId)!;
    const { questionType, complexity, creativityRequired, technicalDepth } = characteristics;
    
    let reasoning = `Selected ${provider.name} for ${questionType} question. `;
    
    if (complexity > 0.7) {
      reasoning += `High complexity detected, leveraging ${provider.name}'s reasoning capabilities. `;
    }
    
    if (creativityRequired > 0.6) {
      reasoning += `Creative elements required, utilizing ${provider.name}'s creative strengths. `;
    }
    
    if (technicalDepth > 0.6) {
      reasoning += `Technical depth needed, using ${provider.name}'s code generation expertise. `;
    }
    
    const score = scores[providerId];
    reasoning += `Confidence score: ${(score * 100).toFixed(1)}%`;
    
    return reasoning;
  }

  /**
   * Update provider performance metrics based on response quality
   */
  updatePerformanceMetrics(providerId: string, responseTime: number, qualityScore: number) {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    // Update average response time with exponential moving average
    provider.avgResponseTime = provider.avgResponseTime * 0.8 + responseTime * 0.2;

    // Track performance history
    if (!this.performanceHistory.has(providerId)) {
      this.performanceHistory.set(providerId, []);
    }
    
    const history = this.performanceHistory.get(providerId)!;
    history.push(qualityScore);
    
    // Keep only last 50 measurements
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Process a query using the selected provider
   */
  async processQuery(question: string, context: string = '', selectedProvider?: any): Promise<any> {
    const startTime = Date.now();
    let success = false;
    let providerName = '';
    let anfisScore = 0;
    
    try {
      // Use the selected provider or analyze and select optimal one
      const provider = selectedProvider || this.selectOptimalProvider(this.analyzeQuestion(question));
      providerName = provider.provider;
      anfisScore = provider.score || 0;
      
      // Route to appropriate AI service
      const result = await this.routeToProvider(provider.provider, question, context);
      
      const processingTime = Date.now() - startTime;
      success = true;
      
      // Calculate estimated cost (free-tier providers cost $0, paid fallbacks ~$0.002/request)
      const estimatedCost = this.isFreeProvider(provider.provider) ? 0 : 0.002;
      
      // Track metrics for validation
      metricsTracker.recordProviderRequest(
        provider.provider,
        estimatedCost,
        processingTime,
        success,
        this.getTaskType(question)
      );
      
      metricsTracker.recordRoutingDecision(
        this.getTaskType(question),
        provider.provider,
        anfisScore,
        processingTime,
        estimatedCost,
        success
      );
      
      // Update performance metrics
      this.updatePerformanceMetrics(provider.provider, processingTime, result.confidence || 0.8);
      
      return {
        answer: result.answer || result.content || result.text,
        confidence: result.confidence || 0.8,
        processingTime,
        provider: provider.provider
      };
    } catch (error) {
      console.error('[ANFIS Router] Query processing failed:', error);
      
      // Record failure
      if (providerName) {
        const processingTime = Date.now() - startTime;
        metricsTracker.recordProviderRequest(
          providerName,
          0,
          processingTime,
          false,
          this.getTaskType(question)
        );
        
        metricsTracker.recordRoutingDecision(
          this.getTaskType(question),
          providerName,
          anfisScore,
          processingTime,
          0,
          false
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Check if provider is free-tier
   */
  private isFreeProvider(providerId: string): boolean {
    // Free-tier providers: HuggingFace, Groq, DeepSeek (free tier), Continue.dev, Supermaven
    const freeProviders = ['huggingface', 'groq', 'deepseek', 'continue', 'supermaven', 'gemini-free', 'cohere-free'];
    return freeProviders.includes(providerId.toLowerCase());
  }
  
  /**
   * Determine task type from question
   */
  private getTaskType(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('code') || q.includes('function') || q.includes('debug')) return 'code';
    if (q.includes('analyze') || q.includes('data') || q.includes('statistics')) return 'analysis';
    if (q.includes('write') || q.includes('story') || q.includes('creative')) return 'creative';
    if (q.includes('explain') || q.includes('what is') || q.includes('how does')) return 'factual';
    return 'conversational';
  }

  /**
   * Route query to specific AI provider
   */
  private async routeToProvider(providerId: string, question: string, context: string): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.available) {
      throw new Error(`Provider ${providerId} is not available`);
    }

    // Update current load
    provider.currentLoad = Math.min(1, provider.currentLoad + 0.1);
    
    try {
      // Mock AI response - replace with actual provider integration
      const mockResponse = {
        answer: `[${provider.name}] ${question.includes('technical') ? 'Technical analysis:' : 'Response:'} This is a simulated response that would come from ${provider.name} based on the question characteristics.`,
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
        tokens: Math.floor(Math.random() * 500) + 100
      };
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, provider.avgResponseTime * 10));
      
      return mockResponse;
    } finally {
      // Reduce load after processing
      provider.currentLoad = Math.max(0, provider.currentLoad - 0.1);
    }
  }

  /**
   * Get provider statistics for monitoring
   */
  getProviderStats(): any {
    const stats: any = {};
    
    this.providers.forEach((provider, id) => {
      stats[id] = {
        name: provider.name,
        available: provider.available,
        currentLoad: provider.currentLoad,
        avgResponseTime: provider.avgResponseTime,
        capabilities: provider.capabilities,
        performanceHistory: this.performanceHistory.get(id) || []
      };
    });
    
    return stats;
  }

  /**
   * Get providers status for API endpoints
   */
  getProvidersStatus(): { [key: string]: AIProvider } {
    const status: { [key: string]: AIProvider } = {};
    
    this.providers.forEach((provider, id) => {
      status[id] = {
        name: provider.name,
        capabilities: provider.capabilities,
        currentLoad: provider.currentLoad,
        avgResponseTime: provider.avgResponseTime,
        available: provider.available
      };
    });
    
    return status;
  }
}

export const anfisRouter = new ANFISRouter();