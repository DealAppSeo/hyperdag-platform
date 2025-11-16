/**
 * Enhanced Bilateral Learning System - Core Patent Implementation
 * 3-Level bilateral learning: User-AI, AI-AI, and System-Agent
 * NOW INTEGRATED with Mutual Discovery Engine for communication refinement
 * 
 * Implements the exact algorithms from the provisional patent application
 */

import { mutualDiscoveryEngine } from './mutual-discovery-engine';

export interface UserAdaptationModel {
  userId: string;
  preferences: Map<string, number>;
  domainExpertise: Map<string, number>;
  interactionHistory: InteractionRecord[];
  learningRate: number;
}

export interface InteractionRecord {
  timestamp: number;
  userInput: string;
  aiResponse: string;
  outcomeMetrics: {
    satisfaction: number;
    effectiveness: number;
    efficiency: number;
  };
  improvementSuggestions: string[];
}

export interface AIOptimizationEngine {
  performanceHistory: Map<string, number[]>;
  optimizationStrategies: OptimizationStrategy[];
  learningPatterns: Map<string, LearningPattern>;
}

export interface OptimizationStrategy {
  strategyId: string;
  description: string;
  successRate: number;
  applicableScenarios: string[];
  parameters: Map<string, number>;
}

export interface LearningPattern {
  patternId: string;
  frequency: number;
  effectiveness: number;
  contextFactors: string[];
}

/**
 * Level 1: User-AI Bilateral Learning Subsystem
 */
export class UserAIBilateralLearner {
  private userModel: UserAdaptationModel;
  private aiOptimizationEngine: AIOptimizationEngine;
  private readonly phi = 1.618033988749895; // Golden ratio
  
  constructor(userId: string) {
    this.userModel = {
      userId,
      preferences: new Map(),
      domainExpertise: new Map(),
      interactionHistory: [],
      learningRate: 0.1
    };
    
    this.aiOptimizationEngine = {
      performanceHistory: new Map(),
      optimizationStrategies: this.initializeOptimizationStrategies(),
      learningPatterns: new Map()
    };
  }

  /**
   * Enhanced bilateral update mechanism with Mutual Discovery Engine
   * NOW ADDRESSES: Communication refinement and expectation management
   */
  async bilateralUpdate(userInput: string, aiResponse: string, outcomeMetrics: any): Promise<{
    optimizedInteraction: any;
    promptSuggestions: string[];
    learningProgress: number;
    communicationInsights: any[];
    expectationCalibration: any;
  }> {
    // User learning: AI suggests prompt improvements
    const promptSuggestions = this.generatePromptImprovements(userInput, outcomeMetrics);
    
    // AI learning: User feedback updates model preferences
    this.updateUserPreferences(userInput, aiResponse, outcomeMetrics);
    
    // Mutual optimization
    const optimizedInteraction = this.mutualOptimization(
      userInput, 
      promptSuggestions, 
      this.getUserPreferences()
    );

    // Calculate learning progress using golden ratio optimization
    const learningProgress = this.calculateLearningProgress(outcomeMetrics);
    
    // ENHANCED: Mutual discovery for communication and expectation management
    const discoveryResult = await mutualDiscoveryEngine.discoverAndRefine(
      this.userModel.userId,
      userInput,
      { response: aiResponse },
      outcomeMetrics
    );
    
    // Record interaction for continuous improvement
    this.recordInteraction(userInput, aiResponse, outcomeMetrics, promptSuggestions);
    
    return {
      optimizedInteraction,
      promptSuggestions: [...promptSuggestions, ...discoveryResult.suggestedImprovements],
      learningProgress,
      communicationInsights: discoveryResult.userInsights,
      expectationCalibration: discoveryResult.expectationCalibration
    };
  }

  private generatePromptImprovements(userInput: string, outcomeMetrics: any): string[] {
    const improvements: string[] = [];
    
    // Analyze input quality and suggest improvements
    if (outcomeMetrics.effectiveness < 0.7) {
      improvements.push("Try being more specific about your desired outcome");
      improvements.push("Include relevant context or examples");
    }
    
    if (outcomeMetrics.efficiency < 0.6) {
      improvements.push("Break complex requests into smaller, focused questions");
      improvements.push("Use clear, structured language");
    }
    
    // Domain-specific suggestions based on user expertise
    const domainSuggestions = this.getDomainSpecificSuggestions(userInput);
    improvements.push(...domainSuggestions);
    
    return improvements;
  }

  private updateUserPreferences(userInput: string, aiResponse: string, outcomeMetrics: any): void {
    // Extract patterns from successful interactions
    if (outcomeMetrics.satisfaction > 0.8) {
      const patterns = this.extractSuccessfulPatterns(userInput, aiResponse);
      this.reinforcePatterns(patterns);
    }
    
    // Update domain expertise based on interaction
    const domain = this.classifyDomain(userInput);
    const currentExpertise = this.userModel.domainExpertise.get(domain) || 0.5;
    const expertiseUpdate = this.calculateExpertiseUpdate(outcomeMetrics);
    
    this.userModel.domainExpertise.set(
      domain, 
      Math.min(1.0, currentExpertise + expertiseUpdate)
    );
  }

  private mutualOptimization(userInput: string, aiSuggestions: string[], userPreferences: Map<string, number>): any {
    // Combine user domain knowledge with AI optimization capabilities
    const optimizationVector = this.calculateOptimizationVector(userPreferences, aiSuggestions);
    return this.applyOptimization(userInput, optimizationVector);
  }

  private calculateOptimizationVector(preferences: Map<string, number>, suggestions: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    
    // Weight suggestions based on user preferences and golden ratio
    suggestions.forEach((suggestion, index) => {
      const preferenceWeight = preferences.get(`suggestion_${index}`) || 0.5;
      const goldenWeight = Math.pow(this.phi, -index); // Decay by golden ratio
      vector.set(suggestion, preferenceWeight * goldenWeight);
    });
    
    return vector;
  }

  private calculateLearningProgress(outcomeMetrics: any): number {
    // Calculate bilateral learning effectiveness using golden ratio optimization
    const satisfaction = outcomeMetrics.satisfaction || 0;
    const effectiveness = outcomeMetrics.effectiveness || 0;
    const efficiency = outcomeMetrics.efficiency || 0;
    
    return (satisfaction * this.phi + effectiveness + efficiency) / (1 + this.phi + 1);
  }

  private initializeOptimizationStrategies(): OptimizationStrategy[] {
    return [
      {
        strategyId: 'context-enhancement',
        description: 'Enhance prompts with relevant context',
        successRate: 0.75,
        applicableScenarios: ['technical', 'research', 'analysis'],
        parameters: new Map([['context_weight', 0.8], ['relevance_threshold', 0.6]])
      },
      {
        strategyId: 'specificity-increase',
        description: 'Increase prompt specificity and detail',
        successRate: 0.82,
        applicableScenarios: ['creative', 'technical', 'planning'],
        parameters: new Map([['specificity_factor', 1.3], ['detail_level', 0.7]])
      },
      {
        strategyId: 'multi-step-breakdown',
        description: 'Break complex tasks into steps',
        successRate: 0.78,
        applicableScenarios: ['complex', 'planning', 'analysis'],
        parameters: new Map([['step_count', 3], ['complexity_threshold', 0.7]])
      }
    ];
  }

  private getDomainSpecificSuggestions(userInput: string): string[] {
    const domain = this.classifyDomain(userInput);
    const expertise = this.userModel.domainExpertise.get(domain) || 0.5;
    
    const suggestions: string[] = [];
    
    if (expertise < 0.6) {
      suggestions.push("Consider asking for explanations of technical terms");
      suggestions.push("Request step-by-step guidance for complex topics");
    }
    
    if (expertise > 0.8) {
      suggestions.push("You can use more technical language");
      suggestions.push("Consider asking for advanced applications or edge cases");
    }
    
    return suggestions;
  }

  private classifyDomain(input: string): string {
    // Simple domain classification - in production, use more sophisticated NLP
    const technicalTerms = ['API', 'algorithm', 'database', 'code', 'programming'];
    const creativeTerms = ['design', 'creative', 'story', 'art', 'visual'];
    const businessTerms = ['strategy', 'market', 'revenue', 'customer', 'growth'];
    
    if (technicalTerms.some(term => input.toLowerCase().includes(term.toLowerCase()))) {
      return 'technical';
    }
    if (creativeTerms.some(term => input.toLowerCase().includes(term.toLowerCase()))) {
      return 'creative';
    }
    if (businessTerms.some(term => input.toLowerCase().includes(term.toLowerCase()))) {
      return 'business';
    }
    
    return 'general';
  }

  private extractSuccessfulPatterns(userInput: string, aiResponse: string): LearningPattern[] {
    // Extract patterns that led to successful interactions
    return [
      {
        patternId: `pattern_${Date.now()}`,
        frequency: 1,
        effectiveness: 0.85,
        contextFactors: [this.classifyDomain(userInput), `length_${userInput.length}`]
      }
    ];
  }

  private reinforcePatterns(patterns: LearningPattern[]): void {
    patterns.forEach(pattern => {
      const existing = this.aiOptimizationEngine.learningPatterns.get(pattern.patternId);
      if (existing) {
        existing.frequency += 1;
        existing.effectiveness = (existing.effectiveness + pattern.effectiveness) / 2;
      } else {
        this.aiOptimizationEngine.learningPatterns.set(pattern.patternId, pattern);
      }
    });
  }

  private calculateExpertiseUpdate(outcomeMetrics: any): number {
    // Update expertise based on interaction success
    const baseUpdate = this.userModel.learningRate;
    const successMultiplier = (outcomeMetrics.satisfaction + outcomeMetrics.effectiveness) / 2;
    return baseUpdate * successMultiplier;
  }

  private applyOptimization(userInput: string, optimizationVector: Map<string, number>): any {
    // Apply optimization vector to improve interaction
    return {
      originalInput: userInput,
      optimizedInput: this.enhanceInput(userInput, optimizationVector),
      optimizationStrength: this.calculateOptimizationStrength(optimizationVector),
      expectedImprovement: this.predictImprovement(optimizationVector)
    };
  }

  private enhanceInput(input: string, optimizationVector: Map<string, number>): string {
    let enhanced = input;
    
    // Apply top optimizations based on vector weights
    const sortedOptimizations = Array.from(optimizationVector.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    sortedOptimizations.forEach(([suggestion, weight]) => {
      if (weight > 0.6) {
        enhanced += `\n\nOptimization: ${suggestion}`;
      }
    });
    
    return enhanced;
  }

  private calculateOptimizationStrength(optimizationVector: Map<string, number>): number {
    const values = Array.from(optimizationVector.values());
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private predictImprovement(optimizationVector: Map<string, number>): number {
    // Predict expected improvement based on historical data and optimization strength
    const strength = this.calculateOptimizationStrength(optimizationVector);
    return Math.min(0.9, 0.3 + strength * 0.6); // Cap at 90% improvement
  }

  private recordInteraction(userInput: string, aiResponse: string, outcomeMetrics: any, suggestions: string[]): void {
    const record: InteractionRecord = {
      timestamp: Date.now(),
      userInput,
      aiResponse,
      outcomeMetrics,
      improvementSuggestions: suggestions
    };
    
    this.userModel.interactionHistory.push(record);
    
    // Keep history manageable
    if (this.userModel.interactionHistory.length > 1000) {
      this.userModel.interactionHistory = this.userModel.interactionHistory.slice(-800);
    }
  }

  public getUserPreferences(): Map<string, number> {
    return this.userModel.preferences;
  }

  public getLearningStats(): {
    totalInteractions: number;
    averageSatisfaction: number;
    expertiseDomains: string[];
    learningVelocity: number;
  } {
    const history = this.userModel.interactionHistory;
    const totalInteractions = history.length;
    
    const averageSatisfaction = totalInteractions > 0 
      ? history.reduce((sum, record) => sum + record.outcomeMetrics.satisfaction, 0) / totalInteractions 
      : 0;
    
    const expertiseDomains = Array.from(this.userModel.domainExpertise.entries())
      .filter(([_, expertise]) => expertise > 0.7)
      .map(([domain, _]) => domain);
    
    // Calculate learning velocity based on recent improvement trends
    const recentHistory = history.slice(-10);
    const learningVelocity = recentHistory.length > 1 
      ? this.calculateLearningVelocity(recentHistory)
      : 0;
    
    return {
      totalInteractions,
      averageSatisfaction,
      expertiseDomains,
      learningVelocity
    };
  }

  private calculateLearningVelocity(recentHistory: InteractionRecord[]): number {
    if (recentHistory.length < 2) return 0;
    
    const improvements = [];
    for (let i = 1; i < recentHistory.length; i++) {
      const current = recentHistory[i].outcomeMetrics.effectiveness;
      const previous = recentHistory[i-1].outcomeMetrics.effectiveness;
      improvements.push(current - previous);
    }
    
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }
}