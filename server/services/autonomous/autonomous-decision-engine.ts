/**
 * Autonomous Decision Engine with "No-Downside, Do-Now" Principle
 * Implements automatic decision prioritization that tables improvements until "just before needed"
 * Follows the insight: "Executing tasks is cheap with AI, the real bottleneck is deciding"
 */

import { EventEmitter } from 'events';

export interface Decision {
  id: string;
  type: 'improvement' | 'optimization' | 'fix' | 'feature' | 'experiment';
  description: string;
  context: Record<string, any>;
  
  // Decision characteristics
  urgency: number;       // 0-40 points (how soon needed)
  impact: number;        // 0-30 points (positive effect)
  effort: number;        // 0-15 points (inverted - low effort = high score)
  risk: number;          // 0-15 points (inverted - low risk = high score)
  
  // Computed
  totalScore: number;    // 0-100
  priority: 'auto_implement' | 'schedule_24h' | 'schedule_week' | 'backlog';
  
  // Execution tracking
  status: 'pending' | 'scheduled' | 'implementing' | 'testing' | 'completed' | 'failed' | 'tabled';
  scheduledFor?: Date;
  completedAt?: Date;
  result?: any;
}

export interface NoDownsideHeuristic {
  cost: number;          // Estimated effort in hours (AI execution time)
  risk: number;          // 0-10 scale
  benefit: number;       // Future decisions prevented
  reversible: boolean;   // Can be rolled back?
  complexity: number;    // 0-10 scale
}

interface DecisionMetrics {
  totalDecisions: number;
  autoImplemented: number;
  scheduled: number;
  tabled: number;
  avgDecisionTime: number; // milliseconds
  avgImplementationTime: number;
  successRate: number;
}

export class AutonomousDecisionEngine extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private knownPatterns: Map<string, NoDownsideHeuristic> = new Map();
  private metrics: DecisionMetrics = {
    totalDecisions: 0,
    autoImplemented: 0,
    scheduled: 0,
    tabled: 0,
    avgDecisionTime: 0,
    avgImplementationTime: 0,
    successRate: 0
  };

  constructor() {
    super();
    this.initializeKnownPatterns();
    this.startScheduledExecution();
    console.log('[Autonomous Decision Engine] 🤖 Initialized with no-downside heuristic');
  }

  /**
   * Initialize known low-risk, high-value patterns
   */
  private initializeKnownPatterns() {
    // Quota Management
    this.knownPatterns.set('quota_switch_provider', {
      cost: 0.01, // 30 seconds of AI time
      risk: 0,    // Zero risk (fallback ready)
      benefit: 1, // Prevents one outage decision
      reversible: true,
      complexity: 1
    });

    // Performance Optimization
    this.knownPatterns.set('add_caching_layer', {
      cost: 0.25, // 15 minutes
      risk: 2,    // Low risk (can disable)
      benefit: 3, // Prevents future performance decisions
      reversible: true,
      complexity: 3
    });

    // Monitoring Enhancement
    this.knownPatterns.set('add_monitoring_endpoint', {
      cost: 0.15, // 10 minutes
      risk: 1,    // Very low risk
      benefit: 5, // Prevents many debugging decisions
      reversible: true,
      complexity: 2
    });

    // API Fallback
    this.knownPatterns.set('add_api_fallback', {
      cost: 0.30, // 20 minutes
      risk: 1,    // Low risk
      benefit: 2, // Prevents failure scenarios
      reversible: true,
      complexity: 4
    });

    // Error Handling
    this.knownPatterns.set('add_error_recovery', {
      cost: 0.20, // 12 minutes
      risk: 2,    // Low risk
      benefit: 3, // Prevents crash decisions
      reversible: true,
      complexity: 3
    });
  }

  /**
   * Evaluate decision using comprehensive scoring system
   */
  async evaluateDecision(
    type: Decision['type'],
    description: string,
    context: Record<string, any> = {}
  ): Promise<Decision> {
    const startTime = Date.now();
    
    const decision: Decision = {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      context,
      urgency: 0,
      impact: 0,
      effort: 0,
      risk: 0,
      totalScore: 0,
      priority: 'backlog',
      status: 'pending'
    };

    // Calculate scores
    decision.urgency = this.calculateUrgency(decision);
    decision.impact = this.calculateImpact(decision);
    decision.effort = this.calculateEffort(decision);
    decision.risk = this.calculateRisk(decision);

    // Apply no-downside heuristic boost
    const heuristicBoost = this.applyNoDownsideHeuristic(decision);
    
    decision.totalScore = decision.urgency + decision.impact + decision.effort + decision.risk + heuristicBoost;

    // Determine priority
    if (decision.totalScore >= 80) {
      decision.priority = 'auto_implement';
    } else if (decision.totalScore >= 60) {
      decision.priority = 'schedule_24h';
      decision.scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (decision.totalScore >= 40) {
      decision.priority = 'schedule_week';
      decision.scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else {
      decision.priority = 'backlog';
      decision.status = 'tabled';
    }

    // Store decision
    this.decisions.set(decision.id, decision);
    
    // Update metrics
    this.metrics.totalDecisions++;
    const decisionTime = Date.now() - startTime;
    this.metrics.avgDecisionTime = 
      (this.metrics.avgDecisionTime * (this.metrics.totalDecisions - 1) + decisionTime) / 
      this.metrics.totalDecisions;

    // Emit event
    this.emit('decision_evaluated', decision);

    console.log(`[Decision Engine] 📊 Evaluated: "${description}" | Score: ${decision.totalScore}/100 | Priority: ${decision.priority}`);

    // Auto-implement if score is high enough
    if (decision.priority === 'auto_implement') {
      this.metrics.autoImplemented++;
      this.emit('auto_implement', decision);
      console.log(`[Decision Engine] 🚀 AUTO-IMPLEMENTING: ${description}`);
    } else if (decision.priority !== 'backlog') {
      this.metrics.scheduled++;
      console.log(`[Decision Engine] 📅 SCHEDULED for ${decision.scheduledFor?.toISOString()}: ${description}`);
    } else {
      this.metrics.tabled++;
      console.log(`[Decision Engine] 📋 TABLED: ${description} (score too low)`);
    }

    return decision;
  }

  /**
   * Calculate urgency score (0-40 points)
   */
  private calculateUrgency(decision: Decision): number {
    let score = 0;

    // Critical system failures
    if (decision.type === 'fix' && decision.context.severity === 'critical') {
      score = 40;
    }
    // User-facing errors
    else if (decision.type === 'fix' && decision.context.userFacing) {
      score = 35;
    }
    // Quota exhaustion imminent
    else if (decision.context.quotaExhausting && decision.context.hoursRemaining < 3) {
      score = 38;
    }
    // Performance degradation
    else if (decision.context.performanceDegradation > 0.20) {
      score = 30;
    }
    // Preventive improvements
    else if (decision.type === 'improvement' && decision.context.preventsFutureIssues) {
      score = 15;
    }
    // Nice-to-have optimizations
    else if (decision.type === 'optimization') {
      score = 8;
    }
    // Experimental features
    else if (decision.type === 'experiment') {
      score = 5;
    }

    return Math.min(40, score);
  }

  /**
   * Calculate impact score (0-30 points)
   */
  private calculateImpact(decision: Decision): number {
    let score = 0;

    // System-wide impact
    if (decision.context.affectsAllUsers) {
      score += 30;
    }
    // Performance improvement
    else if (decision.context.performanceImprovementPct > 0.20) {
      score += 25;
    }
    else if (decision.context.performanceImprovementPct > 0.10) {
      score += 20;
    }
    // Cost savings
    else if (decision.context.costSavings > 0) {
      score += 18;
    }
    // Quality improvement
    else if (decision.context.qualityImprovementPct > 0.15) {
      score += 22;
    }
    // Prevents future issues
    else if (decision.context.preventsFutureIssues) {
      score += 15;
    }
    // Single component improvement
    else {
      score += 10;
    }

    return Math.min(30, score);
  }

  /**
   * Calculate effort score (0-15 points, inverted)
   * Low effort = High score
   */
  private calculateEffort(decision: Decision): number {
    const estimatedHours = decision.context.estimatedHours || 1;

    // < 0.5 hours (30 min) = 15 points
    if (estimatedHours < 0.5) return 15;
    
    // 0.5-1 hours = 14 points
    if (estimatedHours < 1) return 14;
    
    // 1-2 hours = 12 points
    if (estimatedHours < 2) return 12;
    
    // 2-4 hours = 10 points
    if (estimatedHours < 4) return 10;
    
    // 4-8 hours = 6 points
    if (estimatedHours < 8) return 6;
    
    // > 8 hours = 3 points
    return 3;
  }

  /**
   * Calculate risk score (0-15 points, inverted)
   * Low risk = High score
   */
  private calculateRisk(decision: Decision): number {
    const riskLevel = decision.context.riskLevel || 'medium';
    const reversible = decision.context.reversible !== false; // Default true

    let score = 0;

    if (riskLevel === 'zero' || riskLevel === 'none') {
      score = 15;
    } else if (riskLevel === 'low') {
      score = 12;
    } else if (riskLevel === 'medium') {
      score = 8;
    } else if (riskLevel === 'high') {
      score = 4;
    } else if (riskLevel === 'critical') {
      score = 1;
    }

    // Bonus for reversible changes
    if (reversible && score < 15) {
      score += 2;
    }

    return Math.min(15, score);
  }

  /**
   * Apply no-downside heuristic (+0 to +30 bonus points)
   */
  private applyNoDownsideHeuristic(decision: Decision): number {
    // Check if this matches a known no-downside pattern
    const pattern = this.knownPatterns.get(decision.context.pattern || '');
    
    if (pattern) {
      // Known safe pattern - apply heuristic
      if (pattern.cost < 2 && pattern.risk < 3 && pattern.benefit > 0) {
        console.log(`[No-Downside Heuristic] ✅ Pattern "${decision.context.pattern}" qualifies: +25 points`);
        return 25;
      }
    }

    // General heuristic evaluation
    const cost = decision.context.estimatedHours || 1;
    const risk = decision.context.riskLevel === 'zero' ? 0 : 
                 decision.context.riskLevel === 'low' ? 2 :
                 decision.context.riskLevel === 'medium' ? 5 : 10;
    const benefit = decision.context.preventsFutureIssues ? 3 : 
                    decision.context.improvesMonitoring ? 2 : 1;

    // No-downside criteria: cost < 2h AND risk < 3 AND benefit > 0
    if (cost < 2 && risk < 3 && benefit > 0) {
      const boost = Math.min(30, benefit * 10);
      console.log(`[No-Downside Heuristic] ✅ Generic qualification: +${boost} points`);
      return boost;
    }

    return 0;
  }

  /**
   * Start scheduled execution timer
   */
  private startScheduledExecution() {
    // Check every 5 minutes for scheduled decisions
    setInterval(() => {
      this.executeScheduledDecisions();
    }, 5 * 60 * 1000);

    console.log('[Decision Engine] ⏰ Scheduled execution timer started');
  }

  /**
   * Execute decisions that are scheduled for now
   */
  private async executeScheduledDecisions() {
    const now = new Date();
    const dueDecisions = Array.from(this.decisions.values())
      .filter(d => 
        d.status === 'scheduled' && 
        d.scheduledFor && 
        d.scheduledFor <= now
      )
      .sort((a, b) => b.totalScore - a.totalScore); // Highest priority first

    if (dueDecisions.length > 0) {
      console.log(`[Decision Engine] 🔔 ${dueDecisions.length} decisions are due for execution`);
      
      for (const decision of dueDecisions) {
        this.emit('execute_scheduled', decision);
        console.log(`[Decision Engine] ⚡ Executing scheduled: ${decision.description}`);
      }
    }
  }

  /**
   * Mark decision as completed
   */
  markCompleted(decisionId: string, success: boolean, result?: any) {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;

    decision.status = success ? 'completed' : 'failed';
    decision.completedAt = new Date();
    decision.result = result;

    // Update success rate
    const completed = Array.from(this.decisions.values())
      .filter(d => d.status === 'completed' || d.status === 'failed');
    const successful = completed.filter(d => d.status === 'completed');
    this.metrics.successRate = successful.length / completed.length;

    this.emit('decision_completed', decision);
    console.log(`[Decision Engine] ${success ? '✅' : '❌'} Decision completed: ${decision.description}`);
  }

  /**
   * Learn from decision outcome
   */
  learnFromOutcome(decisionId: string, actualBenefit: number, actualCost: number) {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;

    // If this was a patterned decision, update the pattern
    if (decision.context.pattern) {
      const pattern = this.knownPatterns.get(decision.context.pattern);
      if (pattern) {
        // Exponential moving average for learning
        const alpha = 0.2;
        pattern.cost = pattern.cost * (1 - alpha) + actualCost * alpha;
        pattern.benefit = pattern.benefit * (1 - alpha) + actualBenefit * alpha;
        
        console.log(`[Decision Engine] 📚 Updated pattern "${decision.context.pattern}": cost=${pattern.cost.toFixed(2)}h, benefit=${pattern.benefit.toFixed(2)}`);
      }
    }

    this.emit('pattern_learned', {
      pattern: decision.context.pattern,
      expectedScore: decision.totalScore,
      actualBenefit,
      actualCost
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): DecisionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all decisions
   */
  getAllDecisions(): Decision[] {
    return Array.from(this.decisions.values());
  }

  /**
   * Get decisions by priority
   */
  getDecisionsByPriority(priority: Decision['priority']): Decision[] {
    return Array.from(this.decisions.values())
      .filter(d => d.priority === priority)
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get pending auto-implement decisions
   */
  getAutoImplementQueue(): Decision[] {
    return this.getDecisionsByPriority('auto_implement')
      .filter(d => d.status === 'pending');
  }
}

export const autonomousDecisionEngine = new AutonomousDecisionEngine();
