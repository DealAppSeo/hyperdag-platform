/**
 * Advanced Distributed AI Inference Router
 * 
 * Integrates DAG routing, ANFIS decision making, and consensus mechanisms
 * for sophisticated AI provider selection and request routing.
 */

import { DAGRouter } from './dag-router';
import { ANFISDecisionEngine } from './anfis-decision-engine';
import { ConsensusEngine } from './consensus-engine';

interface AdvancedRoutingRequest {
  question: string;
  context?: any;
  requirements: {
    priority: 'speed' | 'cost' | 'accuracy' | 'balanced';
    maxLatency?: number;
    maxCost?: number;
    minAccuracy?: number;
    geographicConstraints?: string[];
    consensusRequired?: boolean;
    consensusThreshold?: number;
  };
  userPreferences?: {
    preferredProviders?: string[];
    avoidProviders?: string[];
    qualityWeight?: number;
    costWeight?: number;
    speedWeight?: number;
  };
}

interface AdvancedRoutingResult {
  answer: string;
  provider: string;
  confidence: number;
  processingTime: number;
  totalCost: number;
  routing: {
    dagPath: any[];
    anfisScore: number;
    alternativePaths: any[];
  };
  consensus?: {
    agreementScore: number;
    participatingProviders: string[];
    responses: any[];
  };
  performance: {
    routingTime: number;
    inferenceTime: number;
    consensusTime?: number;
  };
  reasoning: string;
  quality: {
    estimatedAccuracy: number;
    responseRelevance: number;
    completeness: number;
  };
}

export class AdvancedRoutingEngine {
  private dagRouter: DAGRouter;
  private anfisEngine: ANFISDecisionEngine;
  private consensusEngine: ConsensusEngine;
  private requestHistory: Map<string, any[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.dagRouter = new DAGRouter();
    this.anfisEngine = new ANFISDecisionEngine();
    this.consensusEngine = new ConsensusEngine();
    
    console.log('[Advanced Router] Initialized with DAG + ANFIS + Consensus engines');
  }

  /**
   * Route request through advanced AI inference system
   */
  async routeAdvancedRequest(request: AdvancedRoutingRequest): Promise<AdvancedRoutingResult> {
    const startTime = Date.now();
    const routingStartTime = Date.now();

    try {
      console.log(`[Advanced Router] Processing request with ${request.requirements.priority} priority`);

      // Step 1: DAG-based provider routing
      const dagResult = await this.performDAGRouting(request);
      const routingTime = Date.now() - routingStartTime;

      // Step 2: ANFIS decision refinement
      const anfisResult = await this.refineWithANFIS(dagResult, request);

      // Step 3: Execute inference or consensus
      let finalResult: AdvancedRoutingResult;
      
      if (request.requirements.consensusRequired) {
        finalResult = await this.executeWithConsensus(anfisResult, request, routingTime);
      } else {
        finalResult = await this.executeSingleProvider(anfisResult, request, routingTime);
      }

      // Step 4: Update performance metrics and learning
      await this.updatePerformanceMetrics(finalResult, request);

      const totalTime = Date.now() - startTime;
      console.log(`[Advanced Router] Request completed in ${totalTime}ms`);

      return finalResult;

    } catch (error) {
      console.error('[Advanced Router] Request failed:', error);
      throw new Error(`Advanced routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform DAG-based routing to find optimal paths
   */
  private async performDAGRouting(request: AdvancedRoutingRequest) {
    const dagRequest = {
      type: this.determineRequestType(request.question),
      priority: request.requirements.priority,
      requirements: {
        maxLatency: request.requirements.maxLatency,
        maxCost: request.requirements.maxCost,
        minAccuracy: request.requirements.minAccuracy,
        geographicConstraints: request.requirements.geographicConstraints
      },
      content: request.question,
      context: request.context
    };

    return await this.dagRouter.routeRequest(dagRequest);
  }

  /**
   * Refine DAG routing with ANFIS decision making
   */
  private async refineWithANFIS(dagResult: any, request: AdvancedRoutingRequest) {
    // Extract provider metrics from DAG result
    const providerMetrics = new Map();
    
    dagResult.path.forEach((node: any) => {
      if (node.type === 'provider' && node.provider) {
        providerMetrics.set(node.provider, {
          responseTime: node.metrics.responseTime,
          costEfficiency: 1 / (node.metrics.costPerToken * 1000 + 1),
          qualityScore: node.capabilities[this.determineRequestType(request.question)],
          availability: node.metrics.availability,
          gpuUtilization: node.metrics.gpuUtilization,
          errorRate: node.metrics.errorRate,
          reputation: node.reputation
        });
      }
    });

    // Create ANFIS decision context
    const decisionContext = {
      requestType: this.determineRequestType(request.question),
      priority: request.requirements.priority,
      requirements: request.requirements,
      historicalPerformance: this.getHistoricalPerformance(),
      currentLoad: this.getCurrentLoad(),
      userPreferences: request.userPreferences
    };

    // Get ANFIS decision
    const anfisDecision = this.anfisEngine.makeRoutingDecision(providerMetrics, decisionContext);

    return {
      dagResult,
      anfisDecision,
      providerMetrics
    };
  }

  /**
   * Execute with consensus across multiple providers
   */
  private async executeWithConsensus(
    refinedResult: any, 
    request: AdvancedRoutingRequest, 
    routingTime: number
  ): Promise<AdvancedRoutingResult> {
    const consensusStartTime = Date.now();

    // Select top providers for consensus
    const providers = this.selectConsensusProviders(refinedResult, request);
    
    const consensusRequest = {
      question: request.question,
      context: request.context,
      providers,
      consensusThreshold: request.requirements.consensusThreshold || 0.67,
      timeoutMs: request.requirements.maxLatency || 10000,
      requireConfidence: request.requirements.minAccuracy
    };

    const consensusResult = await this.consensusEngine.achieveConsensus(consensusRequest);
    const consensusTime = Date.now() - consensusStartTime;

    return {
      answer: consensusResult.finalAnswer,
      provider: `consensus(${consensusResult.participatingProviders.join(',')})`,
      confidence: consensusResult.confidence,
      processingTime: consensusResult.consensusMetrics.processingTime,
      totalCost: consensusResult.consensusMetrics.totalCost,
      routing: {
        dagPath: refinedResult.dagResult.path,
        anfisScore: refinedResult.anfisDecision.fuzzyScores.get(refinedResult.anfisDecision.provider) || 0,
        alternativePaths: refinedResult.dagResult.fallbackPaths
      },
      consensus: {
        agreementScore: consensusResult.agreementScore,
        participatingProviders: consensusResult.participatingProviders,
        responses: consensusResult.responses
      },
      performance: {
        routingTime,
        inferenceTime: consensusResult.consensusMetrics.processingTime,
        consensusTime
      },
      reasoning: this.generateAdvancedReasoning(refinedResult, consensusResult, 'consensus'),
      quality: this.assessResponseQuality(consensusResult.finalAnswer, request)
    };
  }

  /**
   * Execute with single optimal provider
   */
  private async executeSingleProvider(
    refinedResult: any, 
    request: AdvancedRoutingRequest, 
    routingTime: number
  ): Promise<AdvancedRoutingResult> {
    const inferenceStartTime = Date.now();
    
    const selectedProvider = refinedResult.anfisDecision.provider;
    
    // Execute query with selected provider (mock implementation)
    const providerResponse = await this.executeProviderQuery(selectedProvider, request.question, request.context);
    
    const inferenceTime = Date.now() - inferenceStartTime;

    return {
      answer: providerResponse.response,
      provider: selectedProvider,
      confidence: refinedResult.anfisDecision.confidence,
      processingTime: providerResponse.processingTime,
      totalCost: providerResponse.cost,
      routing: {
        dagPath: refinedResult.dagResult.path,
        anfisScore: refinedResult.anfisDecision.fuzzyScores.get(selectedProvider) || 0,
        alternativePaths: refinedResult.dagResult.fallbackPaths
      },
      performance: {
        routingTime,
        inferenceTime,
      },
      reasoning: this.generateAdvancedReasoning(refinedResult, providerResponse, 'single'),
      quality: this.assessResponseQuality(providerResponse.response, request)
    };
  }

  /**
   * Select providers for consensus based on routing results
   */
  private selectConsensusProviders(refinedResult: any, request: AdvancedRoutingRequest): string[] {
    const providers: string[] = [];
    
    // Add primary provider from ANFIS
    providers.push(refinedResult.anfisDecision.provider);

    // Add top alternative providers from DAG
    refinedResult.dagResult.fallbackPaths.forEach((path: any[]) => {
      const providerNode = path.find(node => node.type === 'provider');
      if (providerNode && providerNode.provider && !providers.includes(providerNode.provider)) {
        providers.push(providerNode.provider);
      }
    });

    // Add user preferred providers if specified
    if (request.userPreferences?.preferredProviders) {
      request.userPreferences.preferredProviders.forEach(provider => {
        if (!providers.includes(provider)) {
          providers.push(provider);
        }
      });
    }

    // Limit to top 3 providers for efficiency
    return providers.slice(0, 3);
  }

  /**
   * Execute query with specific provider (mock implementation)
   */
  private async executeProviderQuery(provider: string, question: string, context: any) {
    // Mock provider execution - replace with actual AI service integration
    const simulatedDelay = Math.random() * 1000 + 500;
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));

    const tokenEstimate = Math.ceil(question.length / 4);
    const costPerToken = this.getProviderCostPerToken(provider);

    return {
      response: `[${provider.toUpperCase()}] Advanced AI response to: ${question.substring(0, 50)}...`,
      confidence: 0.8 + Math.random() * 0.15,
      processingTime: simulatedDelay,
      tokens: tokenEstimate,
      cost: tokenEstimate * costPerToken,
      metadata: {
        model: this.getProviderModel(provider),
        reasoning: `Processed with ${provider} using advanced routing`
      }
    };
  }

  /**
   * Update performance metrics and learning systems
   */
  private async updatePerformanceMetrics(result: AdvancedRoutingResult, request: AdvancedRoutingRequest) {
    // Update DAG router metrics
    const performanceScore = this.calculatePerformanceScore(result, request);
    
    // Learn from the result
    this.anfisEngine.learnFromFeedback(
      result,
      performanceScore,
      {
        requestType: this.determineRequestType(request.question),
        priority: request.requirements.priority,
        requirements: request.requirements,
        historicalPerformance: this.getHistoricalPerformance(),
        currentLoad: this.getCurrentLoad()
      }
    );

    // Store performance metrics
    const providerKey = result.provider;
    if (!this.performanceMetrics.has(providerKey)) {
      this.performanceMetrics.set(providerKey, []);
    }
    
    this.performanceMetrics.get(providerKey)!.push({
      timestamp: Date.now(),
      confidence: result.confidence,
      processingTime: result.processingTime,
      cost: result.totalCost,
      quality: result.quality,
      userSatisfaction: performanceScore
    });

    // Keep only last 100 entries per provider
    const metrics = this.performanceMetrics.get(providerKey)!;
    if (metrics.length > 100) {
      this.performanceMetrics.set(providerKey, metrics.slice(-100));
    }
  }

  /**
   * Helper methods
   */
  private determineRequestType(question: string): 'llm' | 'vision' | 'code' | 'reasoning' {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('code') || lowerQuestion.includes('program') || lowerQuestion.includes('function')) {
      return 'code';
    } else if (lowerQuestion.includes('analyze') || lowerQuestion.includes('reason') || lowerQuestion.includes('logic')) {
      return 'reasoning';
    } else if (lowerQuestion.includes('image') || lowerQuestion.includes('visual') || lowerQuestion.includes('picture')) {
      return 'vision';
    } else {
      return 'llm';
    }
  }

  private getHistoricalPerformance(): Map<string, number[]> {
    const historical = new Map<string, number[]>();
    
    this.performanceMetrics.forEach((metrics, provider) => {
      const scores = metrics.map((m: any) => m.userSatisfaction);
      historical.set(provider, scores);
    });

    return historical;
  }

  private getCurrentLoad(): Map<string, number> {
    // Mock current load - would integrate with actual monitoring
    return new Map([
      ['openai', Math.random() * 0.8],
      ['anthropic', Math.random() * 0.7],
      ['runpod', Math.random() * 0.9],
      ['modal', Math.random() * 0.6],
      ['together', Math.random() * 0.5]
    ]);
  }

  private calculatePerformanceScore(result: AdvancedRoutingResult, request: AdvancedRoutingRequest): number {
    let score = result.confidence;

    // Adjust based on priority requirements
    if (request.requirements.priority === 'speed') {
      score *= result.processingTime < 2000 ? 1.2 : 0.8;
    } else if (request.requirements.priority === 'cost') {
      score *= result.totalCost < 0.01 ? 1.2 : 0.8;
    } else if (request.requirements.priority === 'accuracy') {
      score *= result.quality.estimatedAccuracy;
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateAdvancedReasoning(refinedResult: any, executionResult: any, mode: 'single' | 'consensus'): string {
    let reasoning = `Advanced routing selected ${refinedResult.anfisDecision.provider} via DAG path analysis. `;
    reasoning += `ANFIS confidence: ${(refinedResult.anfisDecision.confidence * 100).toFixed(1)}%. `;
    
    if (mode === 'consensus') {
      reasoning += `Consensus achieved with ${executionResult.agreementScore}% agreement across ${executionResult.participatingProviders.length} providers. `;
    } else {
      reasoning += `Single provider execution with ${(executionResult.confidence * 100).toFixed(1)}% confidence. `;
    }

    reasoning += `Total processing time: ${executionResult.processingTime}ms.`;

    return reasoning;
  }

  private assessResponseQuality(response: string, request: AdvancedRoutingRequest) {
    // Mock quality assessment - would use more sophisticated analysis
    const relevanceScore = this.calculateRelevance(response, request.question);
    const completenessScore = Math.min(1, response.length / 500); // Assume 500 chars for complete answer
    const accuracyScore = 0.8 + Math.random() * 0.15; // Mock accuracy

    return {
      estimatedAccuracy: accuracyScore,
      responseRelevance: relevanceScore,
      completeness: completenessScore
    };
  }

  private calculateRelevance(response: string, question: string): number {
    // Simple keyword overlap analysis
    const questionWords = question.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    const overlap = questionWords.filter(word => responseWords.includes(word)).length;
    return Math.min(1, overlap / questionWords.length);
  }

  private getProviderCostPerToken(provider: string): number {
    const costs = {
      openai: 0.00003,
      anthropic: 0.000035,
      runpod: 0.000015,
      modal: 0.000018,
      together: 0.000012
    };
    
    return costs[provider as keyof typeof costs] || 0.00002;
  }

  private getProviderModel(provider: string): string {
    const models = {
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4',
      runpod: 'llama-3.1-70b',
      modal: 'mixtral-8x7b',
      together: 'llama-3.1-8b'
    };
    
    return models[provider as keyof typeof models] || 'unknown';
  }

  /**
   * Get comprehensive system statistics
   */
  getAdvancedStats() {
    return {
      dag: this.dagRouter.getDAGStats(),
      anfis: this.anfisEngine.getANFISStats(),
      consensus: this.consensusEngine.getConsensusStats(),
      performance: {
        totalRequests: Array.from(this.performanceMetrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
        averageConfidence: this.calculateOverallAverageConfidence(),
        averageProcessingTime: this.calculateOverallAverageProcessingTime(),
        averageCost: this.calculateOverallAverageCost(),
        topPerformingProvider: this.getTopPerformingProvider()
      }
    };
  }

  private calculateOverallAverageConfidence(): number {
    let totalConfidence = 0;
    let count = 0;

    this.performanceMetrics.forEach(metrics => {
      metrics.forEach((metric: any) => {
        totalConfidence += metric.confidence;
        count++;
      });
    });

    return count > 0 ? totalConfidence / count : 0;
  }

  private calculateOverallAverageProcessingTime(): number {
    let totalTime = 0;
    let count = 0;

    this.performanceMetrics.forEach(metrics => {
      metrics.forEach((metric: any) => {
        totalTime += metric.processingTime;
        count++;
      });
    });

    return count > 0 ? totalTime / count : 0;
  }

  private calculateOverallAverageCost(): number {
    let totalCost = 0;
    let count = 0;

    this.performanceMetrics.forEach(metrics => {
      metrics.forEach((metric: any) => {
        totalCost += metric.cost;
        count++;
      });
    });

    return count > 0 ? totalCost / count : 0;
  }

  private getTopPerformingProvider(): string {
    let bestProvider = 'unknown';
    let bestScore = 0;

    this.performanceMetrics.forEach((metrics, provider) => {
      const avgScore = metrics.reduce((sum: number, metric: any) => sum + metric.userSatisfaction, 0) / metrics.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestProvider = provider;
      }
    });

    return bestProvider;
  }
}

export const advancedRoutingEngine = new AdvancedRoutingEngine();