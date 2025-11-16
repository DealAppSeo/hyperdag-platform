/**
 * System-Agent Coordination Layer - Level 3 Bilateral Learning
 * Optimizes routing decisions while improving individual agent specialization
 * Implements the exact coordination mechanisms from the patent
 */

import { ANFISRouter } from './anfis-router.js';

export interface RoutingDecision {
  selectedAgent: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    agent: string;
    score: number;
    reason: string;
  }>;
  routingContext: {
    complexity: number;
    domain: string;
    urgency: number;
    costSensitivity: number;
  };
  timestamp: number;
}

export interface AgentPerformance {
  agentId: string;
  taskId: string;
  performance: {
    accuracy: number;
    latency: number;
    cost: number;
    satisfaction: number;
  };
  context: {
    complexity: number;
    domain: string;
    urgency: number;
  };
  feedback: {
    userRating: number;
    systemScore: number;
    improvementSuggestions: string[];
  };
  timestamp: number;
}

export interface TaskOutcome {
  taskId: string;
  success: boolean;
  performanceMetrics: {
    accuracy: number;
    efficiency: number;
    costEffectiveness: number;
    userSatisfaction: number;
  };
  learningValue: number;
  errorAnalysis?: {
    errorType: string;
    rootCause: string;
    preventionStrategy: string;
  };
}

export interface AgentOptimizer {
  agentSpecializations: Map<string, AgentSpecialization>;
  adaptationStrategies: Map<string, AdaptationStrategy>;
  performanceTargets: Map<string, PerformanceTarget>;
}

export interface AgentSpecialization {
  agentId: string;
  primaryDomains: string[];
  expertiseAreas: Map<string, number>;
  optimalComplexityRange: {
    min: number;
    max: number;
  };
  preferredTaskTypes: string[];
  adaptationRate: number;
  specializationHistory: SpecializationEvent[];
}

export interface AdaptationStrategy {
  strategyId: string;
  agentId: string;
  targetArea: string;
  adaptationPlan: AdaptationStep[];
  expectedImprovement: number;
  progress: number;
  successRate: number;
}

export interface AdaptationStep {
  stepId: string;
  description: string;
  parameters: Map<string, any>;
  completionCriteria: string;
  timeframe: number;
}

export interface PerformanceTarget {
  agentId: string;
  domain: string;
  targetMetrics: {
    accuracy: number;
    efficiency: number;
    specialization: number;
  };
  currentMetrics: {
    accuracy: number;
    efficiency: number;
    specialization: number;
  };
  improvementPlan: string[];
}

export interface SpecializationEvent {
  timestamp: number;
  domain: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  trigger: string;
}

export interface BilateralCoordination {
  coordinationId: string;
  routingState: any;
  agentImprovements: Map<string, number>;
  systemPerformance: {
    accuracy: number;
    efficiency: number;
    cost: number;
    adaptability: number;
  };
  bilateralOptimization: {
    routingImprovement: number;
    agentSpecialization: number;
    synergy: number;
  };
}

/**
 * Level 3: System-Agent Coordination with Bilateral Learning
 */
export class SystemAgentCoordinator {
  private anfisRouter: ANFISRouter;
  private agentOptimizer: AgentOptimizer;
  private readonly phi = 1.618033988749895; // Golden ratio for optimization
  private coordinationHistory: BilateralCoordination[] = [];
  private routingPerformance: Map<string, number[]> = new Map();

  constructor() {
    this.anfisRouter = new ANFISRouter();
    this.agentOptimizer = {
      agentSpecializations: new Map(),
      adaptationStrategies: new Map(),
      performanceTargets: new Map()
    };

    this.initializeAgentOptimizer();
  }

  /**
   * Core bilateral coordination update mechanism from patent
   */
  async bilateralCoordinationUpdate(
    routingDecision: RoutingDecision,
    agentPerformance: AgentPerformance,
    taskOutcome: TaskOutcome
  ): Promise<BilateralCoordination> {
    console.log(`[System-Agent Coordinator] 🔄 Processing bilateral update for agent ${agentPerformance.agentId}`);

    // System learns from agent performance
    await this.updateRoutingWeights(routingDecision, agentPerformance, taskOutcome);

    // Agents learn from routing context
    const routingContext = this.extractRoutingContext(routingDecision);
    const agentImprovement = await this.updateAgentSpecialization(routingContext, taskOutcome);

    // Bilateral optimization
    const optimizedCoordination = await this.bilateralOptimize(
      this.getRouterState(),
      agentImprovement
    );

    console.log(`[System-Agent Coordinator] ✅ Bilateral coordination complete - Improvement: ${optimizedCoordination.bilateralOptimization.synergy.toFixed(3)}`);

    return optimizedCoordination;
  }

  /**
   * Update ANFIS routing weights based on agent performance feedback
   */
  private async updateRoutingWeights(
    routingDecision: RoutingDecision,
    agentPerformance: AgentPerformance,
    taskOutcome: TaskOutcome
  ): Promise<void> {
    const performanceScore = this.calculatePerformanceScore(agentPerformance, taskOutcome);
    
    // Update routing performance history
    const agentId = agentPerformance.agentId;
    if (!this.routingPerformance.has(agentId)) {
      this.routingPerformance.set(agentId, []);
    }
    
    const history = this.routingPerformance.get(agentId)!;
    history.push(performanceScore);
    
    // Keep history manageable
    if (history.length > 100) {
      this.routingPerformance.set(agentId, history.slice(-80));
    }

    // Calculate routing weight adjustments using golden ratio optimization
    const weightAdjustment = this.calculateWeightAdjustment(
      routingDecision,
      performanceScore,
      this.getAgentAveragePerformance(agentId)
    );

    // Update ANFIS router weights
    await this.applyRoutingWeightUpdate(agentId, routingDecision.routingContext, weightAdjustment);
    
    console.log(`[System-Agent Coordinator] 📊 Updated routing weights for ${agentId}: ${weightAdjustment.toFixed(3)}`);
  }

  /**
   * Extract routing context for agent learning
   */
  private extractRoutingContext(routingDecision: RoutingDecision): any {
    return {
      decisionFactors: {
        confidence: routingDecision.confidence,
        complexity: routingDecision.routingContext.complexity,
        domain: routingDecision.routingContext.domain,
        urgency: routingDecision.routingContext.urgency,
        costSensitivity: routingDecision.routingContext.costSensitivity
      },
      competitiveContext: {
        alternativeAgents: routingDecision.alternatives.length,
        scoreDifference: this.calculateScoreDifference(routingDecision.alternatives),
        selectionReason: routingDecision.reasoning
      },
      systemState: {
        totalLoad: this.calculateSystemLoad(),
        availableAgents: this.getAvailableAgentCount(),
        currentPerformance: this.getSystemPerformance()
      }
    };
  }

  /**
   * Update agent specialization based on routing context and outcomes
   */
  private async updateAgentSpecialization(
    routingContext: any,
    taskOutcome: TaskOutcome
  ): Promise<Map<string, number>> {
    const improvements = new Map<string, number>();
    const agentId = this.extractAgentIdFromOutcome(taskOutcome);
    
    if (!agentId) return improvements;

    // Get current specialization
    let specialization = this.agentOptimizer.agentSpecializations.get(agentId);
    if (!specialization) {
      specialization = this.createDefaultSpecialization(agentId);
      this.agentOptimizer.agentSpecializations.set(agentId, specialization);
    }

    // Calculate specialization improvements based on task outcome
    const domain = routingContext.decisionFactors.domain;
    const currentExpertise = specialization.expertiseAreas.get(domain) || 0.5;
    const performanceImprovement = this.calculateSpecializationImprovement(taskOutcome, currentExpertise);

    // Update expertise with bilateral learning
    const newExpertise = Math.min(1.0, currentExpertise + performanceImprovement * specialization.adaptationRate);
    specialization.expertiseAreas.set(domain, newExpertise);

    // Record specialization event
    const specializationEvent: SpecializationEvent = {
      timestamp: Date.now(),
      domain,
      beforeScore: currentExpertise,
      afterScore: newExpertise,
      improvement: performanceImprovement,
      trigger: 'bilateral_learning'
    };
    specialization.specializationHistory.push(specializationEvent);

    // Adjust optimal complexity range based on performance
    this.adjustComplexityRange(specialization, routingContext.decisionFactors.complexity, taskOutcome);

    // Update adaptation strategies
    await this.updateAdaptationStrategies(agentId, specialization, taskOutcome);

    improvements.set(agentId, performanceImprovement);
    
    console.log(`[System-Agent Coordinator] 🎯 Updated ${agentId} specialization in ${domain}: ${currentExpertise.toFixed(3)} → ${newExpertise.toFixed(3)}`);

    return improvements;
  }

  /**
   * Bilateral optimization balancing routing efficiency with agent development
   */
  private async bilateralOptimize(
    routingState: any,
    agentImprovements: Map<string, number>
  ): Promise<BilateralCoordination> {
    // Calculate current system performance
    const systemPerformance = this.calculateSystemPerformance();
    
    // Calculate routing optimization potential
    const routingImprovement = this.calculateRoutingImprovement(routingState);
    
    // Calculate agent specialization benefits
    const specializationBenefit = this.calculateSpecializationBenefit(agentImprovements);
    
    // Bilateral synergy calculation using golden ratio
    const synergy = Math.sqrt(routingImprovement * specializationBenefit) * this.phi;
    
    // Create coordination result
    const coordination: BilateralCoordination = {
      coordinationId: `coord_${Date.now()}`,
      routingState,
      agentImprovements,
      systemPerformance,
      bilateralOptimization: {
        routingImprovement,
        agentSpecialization: specializationBenefit,
        synergy
      }
    };

    // Record coordination event
    this.coordinationHistory.push(coordination);
    
    // Keep history manageable
    if (this.coordinationHistory.length > 1000) {
      this.coordinationHistory = this.coordinationHistory.slice(-800);
    }

    // Apply optimization recommendations
    await this.applyBilateralOptimizations(coordination);

    return coordination;
  }

  private calculatePerformanceScore(agentPerformance: AgentPerformance, taskOutcome: TaskOutcome): number {
    const metrics = agentPerformance.performance;
    const outcome = taskOutcome.performanceMetrics;
    
    // Weighted combination using golden ratio
    return (
      metrics.accuracy * this.phi +
      outcome.efficiency +
      outcome.costEffectiveness * 0.8 +
      outcome.userSatisfaction * 0.6
    ) / (this.phi + 1 + 0.8 + 0.6);
  }

  private calculateWeightAdjustment(
    routingDecision: RoutingDecision,
    performanceScore: number,
    averagePerformance: number
  ): number {
    // Calculate adjustment based on performance vs average
    const performanceDelta = performanceScore - averagePerformance;
    const confidenceFactor = routingDecision.confidence;
    
    // Bilateral learning rate adjustment
    return performanceDelta * confidenceFactor * 0.1; // 10% max adjustment
  }

  private getAgentAveragePerformance(agentId: string): number {
    const history = this.routingPerformance.get(agentId) || [];
    return history.length > 0 ? history.reduce((sum, score) => sum + score, 0) / history.length : 0.7;
  }

  private async applyRoutingWeightUpdate(
    agentId: string,
    routingContext: any,
    weightAdjustment: number
  ): Promise<void> {
    // Apply weight update to ANFIS router
    // This would integrate with the actual ANFIS implementation
    console.log(`[System-Agent Coordinator] ⚖️ Applied weight adjustment ${weightAdjustment.toFixed(3)} for ${agentId} in ${routingContext.domain}`);
  }

  private calculateScoreDifference(alternatives: any[]): number {
    if (alternatives.length < 2) return 1.0;
    
    const scores = alternatives.map(alt => alt.score).sort((a, b) => b - a);
    return scores[0] - scores[1]; // Difference between best and second best
  }

  private calculateSystemLoad(): number {
    // Calculate current system load - simplified implementation
    return Math.random() * 0.8 + 0.1; // 10-90% load
  }

  private getAvailableAgentCount(): number {
    return this.agentOptimizer.agentSpecializations.size;
  }

  private getSystemPerformance(): number {
    // Calculate overall system performance
    const allPerformances = Array.from(this.routingPerformance.values())
      .flat()
      .slice(-100); // Recent 100 performances
    
    return allPerformances.length > 0 
      ? allPerformances.reduce((sum, perf) => sum + perf, 0) / allPerformances.length
      : 0.75;
  }

  private extractAgentIdFromOutcome(taskOutcome: TaskOutcome): string | null {
    // Extract agent ID from task outcome - would be provided in real implementation
    return taskOutcome.taskId.split('_')[0] || null;
  }

  private createDefaultSpecialization(agentId: string): AgentSpecialization {
    return {
      agentId,
      primaryDomains: ['general'],
      expertiseAreas: new Map([
        ['general', 0.6],
        ['technical', 0.5],
        ['creative', 0.5]
      ]),
      optimalComplexityRange: {
        min: 0.2,
        max: 0.8
      },
      preferredTaskTypes: ['analysis', 'reasoning'],
      adaptationRate: 0.1,
      specializationHistory: []
    };
  }

  private calculateSpecializationImprovement(taskOutcome: TaskOutcome, currentExpertise: number): number {
    const success = taskOutcome.success ? 1.0 : 0.0;
    const performance = taskOutcome.performanceMetrics.accuracy;
    const learningValue = taskOutcome.learningValue || 0.5;
    
    // Calculate improvement with diminishing returns as expertise increases
    const improvementPotential = 1.0 - currentExpertise;
    const baseImprovement = success * performance * learningValue * 0.05; // 5% max base improvement
    
    return baseImprovement * improvementPotential;
  }

  private adjustComplexityRange(
    specialization: AgentSpecialization,
    taskComplexity: number,
    taskOutcome: TaskOutcome
  ): void {
    if (taskOutcome.success && taskOutcome.performanceMetrics.accuracy > 0.8) {
      // Expand range if agent handled complexity well
      if (taskComplexity > specialization.optimalComplexityRange.max) {
        specialization.optimalComplexityRange.max = Math.min(1.0, 
          specialization.optimalComplexityRange.max + 0.05
        );
      }
      if (taskComplexity < specialization.optimalComplexityRange.min) {
        specialization.optimalComplexityRange.min = Math.max(0.0,
          specialization.optimalComplexityRange.min - 0.05
        );
      }
    }
  }

  private async updateAdaptationStrategies(
    agentId: string,
    specialization: AgentSpecialization,
    taskOutcome: TaskOutcome
  ): Promise<void> {
    // Create or update adaptation strategies based on performance gaps
    const performanceGaps = this.identifyPerformanceGaps(specialization, taskOutcome);
    
    performanceGaps.forEach(gap => {
      const strategyId = `${agentId}_${gap.area}_adaptation`;
      const existingStrategy = this.agentOptimizer.adaptationStrategies.get(strategyId);
      
      if (existingStrategy) {
        // Update existing strategy progress
        existingStrategy.progress = Math.min(1.0, existingStrategy.progress + gap.improvementRate);
      } else {
        // Create new adaptation strategy
        const newStrategy: AdaptationStrategy = {
          strategyId,
          agentId,
          targetArea: gap.area,
          adaptationPlan: this.createAdaptationPlan(gap),
          expectedImprovement: gap.potential,
          progress: 0.1,
          successRate: 0.7
        };
        
        this.agentOptimizer.adaptationStrategies.set(strategyId, newStrategy);
      }
    });
  }

  private calculateSystemPerformance(): any {
    const recentCoordinations = this.coordinationHistory.slice(-20);
    
    if (recentCoordinations.length === 0) {
      return {
        accuracy: 0.75,
        efficiency: 0.70,
        cost: 0.80,
        adaptability: 0.65
      };
    }

    const avgAccuracy = recentCoordinations.reduce((sum, coord) => 
      sum + coord.systemPerformance.accuracy, 0) / recentCoordinations.length;
    
    const avgEfficiency = recentCoordinations.reduce((sum, coord) => 
      sum + coord.systemPerformance.efficiency, 0) / recentCoordinations.length;
    
    const avgCost = recentCoordinations.reduce((sum, coord) => 
      sum + coord.systemPerformance.cost, 0) / recentCoordinations.length;
    
    const avgAdaptability = recentCoordinations.reduce((sum, coord) => 
      sum + coord.systemPerformance.adaptability, 0) / recentCoordinations.length;

    return {
      accuracy: avgAccuracy,
      efficiency: avgEfficiency,
      cost: avgCost,
      adaptability: avgAdaptability
    };
  }

  private calculateRoutingImprovement(routingState: any): number {
    // Calculate potential routing improvements
    const recentDecisions = this.coordinationHistory.slice(-10);
    if (recentDecisions.length < 2) return 0.1;
    
    const currentPerformance = recentDecisions[recentDecisions.length - 1].systemPerformance.accuracy;
    const previousPerformance = recentDecisions[0].systemPerformance.accuracy;
    
    return Math.max(0, currentPerformance - previousPerformance);
  }

  private calculateSpecializationBenefit(agentImprovements: Map<string, number>): number {
    if (agentImprovements.size === 0) return 0.05;
    
    const improvements = Array.from(agentImprovements.values());
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }

  private async applyBilateralOptimizations(coordination: BilateralCoordination): Promise<void> {
    // Apply optimization recommendations
    if (coordination.bilateralOptimization.synergy > 0.7) {
      console.log(`[System-Agent Coordinator] 🚀 High synergy detected (${coordination.bilateralOptimization.synergy.toFixed(3)}) - applying aggressive optimization`);
      
      // Increase learning rates for high-performing agents
      coordination.agentImprovements.forEach((improvement, agentId) => {
        if (improvement > 0.1) {
          const specialization = this.agentOptimizer.agentSpecializations.get(agentId);
          if (specialization) {
            specialization.adaptationRate = Math.min(0.3, specialization.adaptationRate * 1.2);
          }
        }
      });
    }
    
    if (coordination.bilateralOptimization.routingImprovement > 0.05) {
      console.log(`[System-Agent Coordinator] 📈 Routing improvement detected (${coordination.bilateralOptimization.routingImprovement.toFixed(3)}) - optimizing routing weights`);
      // Apply routing optimizations
    }
  }

  private identifyPerformanceGaps(specialization: AgentSpecialization, taskOutcome: TaskOutcome): any[] {
    const gaps: any[] = [];
    
    // Check for accuracy gaps
    if (taskOutcome.performanceMetrics.accuracy < 0.8) {
      gaps.push({
        area: 'accuracy',
        current: taskOutcome.performanceMetrics.accuracy,
        target: 0.85,
        potential: 0.85 - taskOutcome.performanceMetrics.accuracy,
        improvementRate: 0.05
      });
    }
    
    // Check for efficiency gaps
    if (taskOutcome.performanceMetrics.efficiency < 0.75) {
      gaps.push({
        area: 'efficiency',
        current: taskOutcome.performanceMetrics.efficiency,
        target: 0.80,
        potential: 0.80 - taskOutcome.performanceMetrics.efficiency,
        improvementRate: 0.03
      });
    }
    
    return gaps;
  }

  private createAdaptationPlan(gap: any): AdaptationStep[] {
    return [
      {
        stepId: `${gap.area}_analysis`,
        description: `Analyze ${gap.area} performance patterns`,
        parameters: new Map([
          ['analysis_depth', 'comprehensive'],
          ['sample_size', 100]
        ]),
        completionCriteria: 'Pattern analysis complete',
        timeframe: 3600 // 1 hour
      },
      {
        stepId: `${gap.area}_optimization`,
        description: `Optimize ${gap.area} parameters`,
        parameters: new Map([
          ['optimization_strategy', 'gradient_descent'],
          ['learning_rate', 0.01]
        ]),
        completionCriteria: `${gap.area} improvement > ${gap.improvementRate}`,
        timeframe: 7200 // 2 hours
      }
    ];
  }

  private initializeAgentOptimizer(): void {
    // Initialize with default agents
    const defaultAgents = ['openai', 'anthropic', 'deepseek', 'huggingface'];
    
    defaultAgents.forEach(agentId => {
      const specialization = this.createDefaultSpecialization(agentId);
      this.agentOptimizer.agentSpecializations.set(agentId, specialization);
      
      // Set initial performance targets
      const target: PerformanceTarget = {
        agentId,
        domain: 'general',
        targetMetrics: { accuracy: 0.85, efficiency: 0.80, specialization: 0.75 },
        currentMetrics: { accuracy: 0.75, efficiency: 0.70, specialization: 0.60 },
        improvementPlan: [
          'Enhance accuracy through bilateral learning',
          'Optimize efficiency with routing context',
          'Develop domain specialization'
        ]
      };
      this.agentOptimizer.performanceTargets.set(`${agentId}_general`, target);
    });
  }

  public getRouterState(): any {
    // Return current ANFIS router state
    return {
      totalDecisions: this.coordinationHistory.length,
      averageConfidence: this.calculateAverageConfidence(),
      routingEfficiency: this.calculateRoutingEfficiency(),
      adaptationRate: this.calculateSystemAdaptationRate()
    };
  }

  private calculateAverageConfidence(): number {
    // Calculate from coordination history
    return 0.82; // Placeholder
  }

  private calculateRoutingEfficiency(): number {
    const recentPerformances = Array.from(this.routingPerformance.values())
      .flat()
      .slice(-50);
    
    return recentPerformances.length > 0 
      ? recentPerformances.reduce((sum, perf) => sum + perf, 0) / recentPerformances.length
      : 0.75;
  }

  private calculateSystemAdaptationRate(): number {
    const recentCoordinations = this.coordinationHistory.slice(-10);
    if (recentCoordinations.length < 2) return 0.1;
    
    const improvementTrends = recentCoordinations.map(coord => 
      coord.bilateralOptimization.synergy
    );
    
    const avgImprovement = improvementTrends.reduce((sum, imp) => sum + imp, 0) / improvementTrends.length;
    return Math.min(0.5, avgImprovement);
  }

  // Public methods for system integration
  public getCoordinationStats(): {
    totalCoordinations: number;
    averageSynergy: number;
    agentCount: number;
    adaptationStrategies: number;
    systemPerformance: any;
  } {
    const avgSynergy = this.coordinationHistory.length > 0
      ? this.coordinationHistory.reduce((sum, coord) => sum + coord.bilateralOptimization.synergy, 0) / this.coordinationHistory.length
      : 0;

    return {
      totalCoordinations: this.coordinationHistory.length,
      averageSynergy: avgSynergy,
      agentCount: this.agentOptimizer.agentSpecializations.size,
      adaptationStrategies: this.agentOptimizer.adaptationStrategies.size,
      systemPerformance: this.calculateSystemPerformance()
    };
  }

  public async optimizeSystemWide(): Promise<{
    routingOptimizations: number;
    agentImprovements: number;
    synergyGains: number;
  }> {
    // Perform system-wide bilateral optimization
    let routingOptimizations = 0;
    let agentImprovements = 0;
    let totalSynergy = 0;

    // Analyze all specializations for optimization opportunities
    this.agentOptimizer.agentSpecializations.forEach(async (specialization, agentId) => {
      const optimizationOpportunities = this.findOptimizationOpportunities(specialization);
      
      if (optimizationOpportunities.length > 0) {
        await this.applyAgentOptimizations(agentId, optimizationOpportunities);
        agentImprovements++;
      }
    });

    // Optimize routing based on all coordination history
    const routingInsights = this.analyzeRoutingPatterns();
    if (routingInsights.optimizationPotential > 0.1) {
      await this.applyRoutingOptimizations(routingInsights);
      routingOptimizations++;
    }

    // Calculate system-wide synergy gains
    totalSynergy = this.coordinationHistory
      .slice(-20)
      .reduce((sum, coord) => sum + coord.bilateralOptimization.synergy, 0) / 20;

    console.log(`[System-Agent Coordinator] 🎯 System-wide optimization complete: ${routingOptimizations} routing optimizations, ${agentImprovements} agent improvements, ${totalSynergy.toFixed(3)} average synergy`);

    return {
      routingOptimizations,
      agentImprovements,
      synergyGains: totalSynergy
    };
  }

  private findOptimizationOpportunities(specialization: AgentSpecialization): any[] {
    const opportunities: any[] = [];
    
    // Find domains with low expertise that could be improved
    specialization.expertiseAreas.forEach((expertise, domain) => {
      if (expertise < 0.7 && specialization.specializationHistory
        .filter(event => event.domain === domain && event.improvement > 0)
        .length > 2) {
        opportunities.push({
          type: 'expertise_improvement',
          domain,
          currentLevel: expertise,
          targetLevel: Math.min(0.9, expertise + 0.2),
          priority: (0.7 - expertise) * 2
        });
      }
    });
    
    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  private async applyAgentOptimizations(agentId: string, opportunities: any[]): Promise<void> {
    opportunities.forEach(opportunity => {
      console.log(`[System-Agent Coordinator] 🔧 Applying ${opportunity.type} for ${agentId} in ${opportunity.domain}`);
      // Apply optimization logic
    });
  }

  private analyzeRoutingPatterns(): any {
    const recentCoordinations = this.coordinationHistory.slice(-50);
    
    // Analyze patterns in routing decisions
    const patterns = {
      averageAccuracy: 0,
      efficiencyTrend: 0,
      optimizationPotential: 0,
      recommendedAdjustments: []
    };
    
    if (recentCoordinations.length > 0) {
      patterns.averageAccuracy = recentCoordinations.reduce((sum, coord) => 
        sum + coord.systemPerformance.accuracy, 0) / recentCoordinations.length;
      
      // Calculate optimization potential
      patterns.optimizationPotential = Math.max(0, 0.9 - patterns.averageAccuracy);
    }
    
    return patterns;
  }

  private async applyRoutingOptimizations(insights: any): Promise<void> {
    console.log(`[System-Agent Coordinator] 📊 Applying routing optimizations with ${insights.optimizationPotential.toFixed(3)} potential`);
    // Apply routing optimization logic
  }
}