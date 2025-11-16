/**
 * ANFIS-Semantic RAG Integration
 * Creates the intelligent feedback loop between semantic retrieval and ANFIS routing
 * This is the missing link that makes our patent claims real and defensible
 */

import { semanticRAG } from '../optimization/semantic-rag-enhancer';
import { ANFISRouter } from './anfis-router';

interface SemanticRoutingContext {
  originalQuery: string;
  semanticContext: string[];
  relevantKnowledge: string[];
  confidenceBoost: number;
  suggestedProvider: string;
  reasoning: string;
}

interface RoutingFeedback {
  providerId: string;
  performance: number;
  contextRelevance: number;
  userSatisfaction: number;
  semanticAccuracy: number;
}

export class ANFISSemanticIntegration {
  private anfisRouter: ANFISRouter;
  private feedbackHistory: Map<string, RoutingFeedback[]> = new Map();
  private contextCache: Map<string, SemanticRoutingContext> = new Map();

  constructor() {
    this.anfisRouter = new ANFISRouter();
    console.log('[ANFIS-Semantic] Integration layer initialized');
  }

  /**
   * Enhanced routing with semantic context retrieval
   * This is where ANFIS → Semantic RAG → Enhanced ANFIS happens
   */
  async enhancedRouting(query: string, userContext?: string): Promise<{
    provider: string;
    confidence: number;
    reasoning: string;
    semanticContext: SemanticRoutingContext;
    anticipatedPerformance: number;
  }> {
    console.log(`[ANFIS-Semantic] Processing enhanced routing for: "${query}"`);

    // Step 1: Get semantic context using RAG
    const semanticContext = await this.retrieveSemanticContext(query, userContext);

    // Step 2: Use semantic context to enhance ANFIS analysis
    const enhancedCharacteristics = await this.enhanceQuestionAnalysis(query, semanticContext);

    // Step 3: Get ANFIS provider recommendation
    const anfisRecommendation = this.anfisRouter.selectOptimalProvider(enhancedCharacteristics);

    // Step 4: Apply semantic intelligence boost
    const semanticBoost = this.calculateSemanticBoost(semanticContext, anfisRecommendation.provider);

    // Step 5: Generate anticipation of performance
    const anticipatedPerformance = await this.anticipatePerformance(
      anfisRecommendation.provider,
      query,
      semanticContext
    );

    const finalConfidence = Math.min(0.95, anfisRecommendation.confidence + semanticBoost);
    const enhancedReasoning = this.generateEnhancedReasoning(
      anfisRecommendation.reasoning,
      semanticContext
    );

    // Cache for feedback loop
    const cacheKey = this.generateCacheKey(query, anfisRecommendation.provider);
    this.contextCache.set(cacheKey, semanticContext);

    return {
      provider: anfisRecommendation.provider,
      confidence: finalConfidence,
      reasoning: enhancedReasoning,
      semanticContext,
      anticipatedPerformance
    };
  }

  /**
   * Retrieve semantic context that informs routing decisions
   */
  private async retrieveSemanticContext(
    query: string, 
    userContext?: string
  ): Promise<SemanticRoutingContext> {
    try {
      // Query our semantic RAG system
      const ragResponse = await semanticRAG.query({
        query,
        context: userContext,
        domain: this.classifyQueryDomain(query),
        maxResults: 3,
        threshold: 0.6
      });

      // Extract actionable routing context
      const semanticContext = ragResponse.sources.map(source => source.text);
      const relevantKnowledge = ragResponse.knowledgeGraph?.map(node => 
        `${node.label}: ${node.properties.description}`
      ) || [];

      // Determine if semantic context suggests a specific provider
      const suggestedProvider = this.extractProviderSuggestion(ragResponse.answer, semanticContext);
      
      return {
        originalQuery: query,
        semanticContext,
        relevantKnowledge,
        confidenceBoost: ragResponse.confidence * 0.2, // Up to 20% boost
        suggestedProvider,
        reasoning: ragResponse.reasoning
      };

    } catch (error) {
      console.error('[ANFIS-Semantic] Context retrieval failed:', error);
      return {
        originalQuery: query,
        semanticContext: [],
        relevantKnowledge: [],
        confidenceBoost: 0,
        suggestedProvider: '',
        reasoning: 'No semantic context available'
      };
    }
  }

  /**
   * Enhance ANFIS question analysis with semantic intelligence
   */
  private async enhanceQuestionAnalysis(
    query: string, 
    semanticContext: SemanticRoutingContext
  ) {
    // Get base ANFIS analysis
    const baseCharacteristics = this.anfisRouter.analyzeQuestion(query);

    // Enhance with semantic intelligence
    const semanticEnhancements = this.analyzeSemanticComplexity(semanticContext);

    // Combine base + semantic analysis
    return {
      ...baseCharacteristics,
      complexity: Math.min(1.0, baseCharacteristics.complexity + semanticEnhancements.complexityBoost),
      creativityRequired: Math.min(1.0, baseCharacteristics.creativityRequired + semanticEnhancements.creativityBoost),
      technicalDepth: Math.min(1.0, baseCharacteristics.technicalDepth + semanticEnhancements.technicalBoost),
      analysisIntensive: Math.min(1.0, baseCharacteristics.analysisIntensive + semanticEnhancements.analysisBoost),
      semanticEnhanced: true,
      semanticConfidence: semanticContext.confidenceBoost
    };
  }

  /**
   * Analyze semantic context to determine complexity boosts
   */
  private analyzeSemanticComplexity(context: SemanticRoutingContext) {
    let complexityBoost = 0;
    let creativityBoost = 0;
    let technicalBoost = 0;
    let analysisBoost = 0;

    // Analyze semantic context for complexity indicators
    const allContext = [...context.semanticContext, ...context.relevantKnowledge].join(' ').toLowerCase();

    // Technical complexity indicators
    const technicalTerms = ['neural network', 'fuzzy logic', 'blockchain', 'machine learning', 'algorithm'];
    technicalTerms.forEach(term => {
      if (allContext.includes(term)) technicalBoost += 0.1;
    });

    // Creative complexity indicators  
    const creativeTerms = ['design', 'innovative', 'creative', 'generate', 'synthesis'];
    creativeTerms.forEach(term => {
      if (allContext.includes(term)) creativityBoost += 0.1;
    });

    // Analysis complexity indicators
    const analysisTerms = ['analyze', 'compare', 'evaluate', 'research', 'investigation'];
    analysisTerms.forEach(term => {
      if (allContext.includes(term)) analysisBoost += 0.1;
    });

    // Overall complexity boost based on context richness
    complexityBoost = context.semanticContext.length * 0.05 + context.relevantKnowledge.length * 0.03;

    return {
      complexityBoost: Math.min(0.3, complexityBoost),
      creativityBoost: Math.min(0.3, creativityBoost),
      technicalBoost: Math.min(0.3, technicalBoost),
      analysisBoost: Math.min(0.3, analysisBoost)
    };
  }

  /**
   * Calculate semantic intelligence boost for provider confidence
   */
  private calculateSemanticBoost(context: SemanticRoutingContext, selectedProvider: string): number {
    let boost = context.confidenceBoost;

    // Boost if semantic context suggests this provider
    if (context.suggestedProvider === selectedProvider) {
      boost += 0.15;
    }

    // Boost based on context richness
    if (context.semanticContext.length >= 2) {
      boost += 0.05;
    }

    // Historical performance boost
    const historicalBoost = this.getHistoricalSemanticBoost(selectedProvider);
    boost += historicalBoost;

    return Math.min(0.3, boost); // Cap at 30% boost
  }

  /**
   * Anticipate performance based on semantic context and historical data
   */
  private async anticipatePerformance(
    providerId: string,
    query: string,
    context: SemanticRoutingContext
  ): Promise<number> {
    // Base anticipation from historical performance
    const historicalPerformance = this.getHistoricalPerformance(providerId);
    
    // Semantic context relevance factor
    const contextRelevance = context.semanticContext.length > 0 ? 0.8 : 0.5;
    
    // Query-provider matching factor
    const providerMatch = this.calculateProviderContextMatch(providerId, context);
    
    // Combined anticipation score
    const anticipatedScore = (historicalPerformance * 0.5 + contextRelevance * 0.3 + providerMatch * 0.2);
    
    console.log(`[ANFIS-Semantic] Anticipated performance for ${providerId}: ${(anticipatedScore * 100).toFixed(1)}%`);
    
    return anticipatedScore;
  }

  /**
   * Provide feedback to improve semantic-ANFIS integration
   */
  async provideFeedback(
    query: string,
    providerId: string,
    actualPerformance: number,
    userSatisfaction: number
  ) {
    const cacheKey = this.generateCacheKey(query, providerId);
    const context = this.contextCache.get(cacheKey);
    
    if (!context) return;

    // Calculate semantic accuracy
    const semanticAccuracy = this.evaluateSemanticAccuracy(context, actualPerformance);
    
    const feedback: RoutingFeedback = {
      providerId,
      performance: actualPerformance,
      contextRelevance: context.confidenceBoost,
      userSatisfaction,
      semanticAccuracy
    };

    // Store feedback
    if (!this.feedbackHistory.has(providerId)) {
      this.feedbackHistory.set(providerId, []);
    }
    this.feedbackHistory.get(providerId)!.push(feedback);

    // Update semantic knowledge
    await this.updateSemanticKnowledge(context, feedback);

    console.log(`[ANFIS-Semantic] Feedback recorded for ${providerId} - Performance: ${(actualPerformance * 100).toFixed(1)}%`);
  }

  /**
   * Extract provider suggestions from semantic context
   */
  private extractProviderSuggestion(answer: string, context: string[]): string {
    const providerMap = {
      'anthropic': ['claude', 'anthropic', 'reasoning', 'analysis'],
      'openai': ['gpt', 'openai', 'creative', 'general'],
      'deepseek': ['code', 'programming', 'development'],
      'perplexity': ['research', 'knowledge', 'search'],
      'myninja': ['specialized', 'research', 'agent']
    };

    const allText = (answer + ' ' + context.join(' ')).toLowerCase();

    for (const [provider, keywords] of Object.entries(providerMap)) {
      const matches = keywords.filter(keyword => allText.includes(keyword)).length;
      if (matches >= 2) {
        return provider;
      }
    }

    return '';
  }

  /**
   * Classify query domain for targeted semantic retrieval
   */
  private classifyQueryDomain(query: string): string {
    const domainKeywords = {
      'artificial_intelligence': ['ai', 'neural', 'machine learning', 'algorithm'],
      'blockchain_technology': ['blockchain', 'crypto', 'smart contract', 'web3'],
      'machine_learning': ['ml', 'training', 'model', 'prediction'],
      'web3_infrastructure': ['defi', 'dao', 'token', 'wallet']
    };

    const queryLower = query.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword => queryLower.includes(keyword)).length;
      if (matches > 0) {
        return domain;
      }
    }

    return 'artificial_intelligence'; // Default domain
  }

  /**
   * Generate enhanced reasoning combining ANFIS and semantic analysis
   */
  private generateEnhancedReasoning(
    anfisReasoning: string,
    semanticContext: SemanticRoutingContext
  ): string {
    let enhanced = anfisReasoning;

    if (semanticContext.semanticContext.length > 0) {
      enhanced += ` Semantic analysis found ${semanticContext.semanticContext.length} relevant context sources`;
    }

    if (semanticContext.suggestedProvider) {
      enhanced += `, with semantic intelligence suggesting optimal provider alignment`;
    }

    if (semanticContext.confidenceBoost > 0.1) {
      enhanced += ` (semantic confidence boost: +${(semanticContext.confidenceBoost * 100).toFixed(1)}%)`;
    }

    return enhanced;
  }

  /**
   * Utility methods for historical analysis
   */
  private getHistoricalPerformance(providerId: string): number {
    const history = this.feedbackHistory.get(providerId) || [];
    if (history.length === 0) return 0.75; // Default baseline

    const avgPerformance = history.reduce((sum, f) => sum + f.performance, 0) / history.length;
    return avgPerformance;
  }

  private getHistoricalSemanticBoost(providerId: string): number {
    const history = this.feedbackHistory.get(providerId) || [];
    if (history.length === 0) return 0;

    const avgSemanticAccuracy = history.reduce((sum, f) => sum + f.semanticAccuracy, 0) / history.length;
    return avgSemanticAccuracy * 0.1; // Convert to boost factor
  }

  private calculateProviderContextMatch(providerId: string, context: SemanticRoutingContext): number {
    // Simple provider-context matching based on keywords
    const providerStrengths = {
      'anthropic': ['reasoning', 'analysis', 'logical'],
      'openai': ['creative', 'general', 'versatile'],
      'deepseek': ['coding', 'technical', 'programming'],
      'perplexity': ['research', 'knowledge', 'information'],
      'myninja': ['specialized', 'agent', 'research']
    };

    const contextText = context.semanticContext.join(' ').toLowerCase();
    const strengths = providerStrengths[providerId as keyof typeof providerStrengths] || [];
    
    const matches = strengths.filter(strength => contextText.includes(strength)).length;
    return Math.min(1.0, matches * 0.3);
  }

  private evaluateSemanticAccuracy(context: SemanticRoutingContext, actualPerformance: number): number {
    // Evaluate how well semantic context predicted performance
    const expectedBoost = context.confidenceBoost;
    const actualSuccess = actualPerformance > 0.8 ? 1 : actualPerformance;
    
    return Math.abs(expectedBoost - (actualSuccess - 0.5)) < 0.2 ? 1 : 0.5;
  }

  private async updateSemanticKnowledge(context: SemanticRoutingContext, feedback: RoutingFeedback) {
    // Add successful routing patterns back to semantic knowledge base
    if (feedback.performance > 0.8 && feedback.userSatisfaction > 0.8) {
      const knowledgeText = `ANFIS routing with semantic context achieved high performance (${(feedback.performance * 100).toFixed(1)}%) for ${feedback.providerId}`;
      
      await semanticRAG.addKnowledge(
        'routing_intelligence',
        knowledgeText,
        {
          provider: feedback.providerId,
          performance: feedback.performance,
          contextType: 'routing_success',
          confidence: 0.9
        }
      );
    }
  }

  private generateCacheKey(query: string, provider: string): string {
    return `${query.substring(0, 50)}_${provider}_${Date.now()}`;
  }

  /**
   * Get system integration statistics
   */
  getIntegrationStats() {
    const totalFeedback = Array.from(this.feedbackHistory.values())
      .reduce((sum, history) => sum + history.length, 0);

    const avgPerformanceByProvider = new Map<string, number>();
    for (const [provider, history] of this.feedbackHistory.entries()) {
      const avg = history.reduce((sum, f) => sum + f.performance, 0) / history.length;
      avgPerformanceByProvider.set(provider, avg);
    }

    return {
      totalFeedbackRecords: totalFeedback,
      activeProviders: this.feedbackHistory.size,
      cacheSize: this.contextCache.size,
      avgPerformanceByProvider: Object.fromEntries(avgPerformanceByProvider),
      semanticSystemStats: semanticRAG.getSystemStats()
    };
  }
}

export const anfisSemanticIntegration = new ANFISSemanticIntegration();