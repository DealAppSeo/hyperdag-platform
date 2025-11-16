/**
 * Problem Detection Layer
 * Continuously monitors system health and automatically detects problems
 * Runs every 5 minutes to catch issues before they become critical
 */

import { EventEmitter } from 'events';
import { autonomousDecisionEngine } from './autonomous-decision-engine';
import { realMetricsCollector, type SystemMetrics } from './real-metrics-collector';

export interface Problem {
  id: string;
  type: 'quota_exhaustion' | 'performance_degradation' | 'api_failure' | 
        'memory_leak' | 'bottleneck' | 'cost_spike' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  metrics: Record<string, any>;
  detectedAt: Date;
  predictedImpact: string;
}

export class ProblemDetector extends EventEmitter {
  private problems: Map<string, Problem> = new Map();
  private quotaSnapshots: Map<string, number[]> = new Map();
  private performanceBaselines: Map<string, number> = new Map();
  private detectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    
    // ⚠️ BLOAT PURGE: Disable auto-start to fix screen flashing
    // Re-enable by setting: ENABLE_PROBLEM_DETECTOR=true in .env
    if (process.env.ENABLE_PROBLEM_DETECTOR === 'true') {
      // Start real metrics collection
      realMetricsCollector.start(60000); // Collect every minute
      this.startContinuousDetection();
      console.log('[Problem Detector] ✅ Monitoring enabled - every 5 minutes with REAL metrics');
    } else {
      console.log('[Problem Detector] ⚙️  Auto-monitoring DISABLED (reduce server load)');
    }
  }

  /**
   * Start continuous problem detection
   */
  private startContinuousDetection() {
    // Run detection every 5 minutes
    this.detectionInterval = setInterval(() => {
      this.detectProblems();
    }, 5 * 60 * 1000);

    // Run immediately on startup
    setTimeout(() => this.detectProblems(), 5000);
  }

  /**
   * Main detection orchestrator
   */
  private async detectProblems() {
    console.log('[Problem Detector] 🔍 Running detection cycle...');

    const problems: Problem[] = [];

    // Run only REAL metrics detection (simulations removed)
    const detectionResults = await Promise.all([
      this.detectRealPerformanceIssues()
    ]);

    // Flatten results
    detectionResults.forEach(result => {
      if (result) {
        if (Array.isArray(result)) {
          problems.push(...result);
        } else {
          problems.push(result);
        }
      }
    });

    // Process detected problems
    for (const problem of problems) {
      this.processProblem(problem);
    }

    if (problems.length > 0) {
      console.log(`[Problem Detector] ⚠️  Found ${problems.length} problems`);
    } else {
      console.log('[Problem Detector] ✅ All systems healthy');
    }
  }

  /**
   * Detect performance degradation using REAL metrics
   */
  private async detectRealPerformanceIssues(): Promise<Problem[]> {
    const problems: Problem[] = [];
    
    // Get real system metrics
    const degradations = realMetricsCollector.detectDegradation();
    
    for (const degradation of degradations) {
      problems.push({
        id: `perf_${degradation.metric.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        type: 'performance_degradation',
        severity: degradation.degradationPercent > 50 ? 'high' : 'medium',
        component: degradation.metric,
        description: `${degradation.metric} degraded by ${degradation.degradationPercent.toFixed(1)}%`,
        metrics: {
          baseline: degradation.baseline,
          current: degradation.current,
          degradation: degradation.degradationPercent
        },
        detectedAt: new Date(),
        predictedImpact: degradation.degradationPercent > 50 ? 'User-facing performance issues' : 'Internal efficiency reduction'
      });
    }
    
    return problems;
  }

  // REMOVED: detectQuotaExhaustion() - was using simulated data
  // REMOVED: detectPerformanceDrift() - was using simulated data
  // REMOVED: detectAPIFailures() - was using simulated data
  // REMOVED: detectBottlenecks() - was using simulated data
  // REMOVED: detectOptimizationOpportunities() - was using simulated data
  
  /**
   * All detection now uses REAL metrics from realMetricsCollector
   * Future: Add back quota/bottleneck detection when wired to real data sources
   */

  /**
   * Process detected problem and create decision
   */
  private processProblem(problem: Problem) {
    // Store problem
    this.problems.set(problem.id, problem);

    // Emit event
    this.emit('problem_detected', problem);

    // Create autonomous decision for fixing
    autonomousDecisionEngine.evaluateDecision(
      problem.type === 'opportunity' ? 'improvement' : 'fix',
      problem.description,
      {
        problemId: problem.id,
        severity: problem.severity,
        component: problem.component,
        quotaExhausting: problem.type === 'quota_exhaustion',
        hoursRemaining: problem.metrics.hoursRemaining,
        performanceDegradation: problem.metrics.degradationPct,
        userFacing: problem.type === 'api_failure' || problem.type === 'performance_degradation',
        affectsAllUsers: problem.severity === 'critical',
        performanceImprovementPct: problem.type === 'opportunity' ? 0.15 : 0,
        preventsFutureIssues: true,
        estimatedHours: this.estimateFixTime(problem),
        riskLevel: this.assessRiskLevel(problem),
        reversible: true,
        pattern: this.identifyPattern(problem)
      }
    );
  }

  /**
   * Estimate time to fix problem
   */
  private estimateFixTime(problem: Problem): number {
    switch (problem.type) {
      case 'quota_exhaustion':
        return 0.05; // 3 minutes to switch provider
      case 'api_failure':
        return 0.10; // 6 minutes to add fallback
      case 'performance_degradation':
        return 0.50; // 30 minutes to optimize
      case 'bottleneck':
        return 1.00; // 1 hour to resolve
      case 'opportunity':
        return 0.25; // 15 minutes to implement
      default:
        return 1.00;
    }
  }

  /**
   * Assess risk level of fix
   */
  private assessRiskLevel(problem: Problem): string {
    switch (problem.type) {
      case 'quota_exhaustion':
        return 'zero'; // Switching providers is zero risk
      case 'api_failure':
        return 'low'; // Adding fallback is low risk
      case 'performance_degradation':
        return 'medium'; // Optimization has some risk
      case 'bottleneck':
        return 'medium';
      case 'opportunity':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Identify known problem patterns
   */
  private identifyPattern(problem: Problem): string | undefined {
    switch (problem.type) {
      case 'quota_exhaustion':
        return 'quota_switch_provider';
      case 'api_failure':
        return 'add_api_fallback';
      case 'performance_degradation':
        return 'add_caching_layer';
      default:
        return undefined;
    }
  }

  /**
   * Calculate trend from snapshots
   */
  private calculateTrend(snapshots: number[]): number {
    if (snapshots.length < 2) return 0;
    
    const recent = snapshots.slice(-3);
    const older = snapshots.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  /**
   * Get all detected problems
   */
  getAllProblems(): Problem[] {
    return Array.from(this.problems.values());
  }

  /**
   * Get problems by severity
   */
  getProblemsBySeverity(severity: Problem['severity']): Problem[] {
    return Array.from(this.problems.values())
      .filter(p => p.severity === severity);
  }

  /**
   * Stop detection
   */
  stop() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }
}

export const problemDetector = new ProblemDetector();
