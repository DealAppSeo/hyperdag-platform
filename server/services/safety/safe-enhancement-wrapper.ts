/**
 * Safe Enhancement Wrapper for A/B Testing
 * 
 * Allows testing new routing optimizations alongside legacy system
 * without risking production. Automatically rolls back if performance degrades.
 * 
 * Key Features:
 * - Shadow mode: Run both systems in parallel
 * - Performance comparison tracking
 * - Automatic rollback on degradation
 * - Detailed metrics for decision-making
 */

import type { RoutingRequest, RoutingDecision } from '../anfis-router';
import type { IRouter } from '../router-interface';

export interface EnhancementConfig {
  rollbackThreshold: number;      // Win rate below which to rollback (e.g., 0.95 = 95%)
  minimumSampleSize: number;      // Minimum comparisons before making rollback decision
  shadowModeOnly: boolean;        // If true, always use legacy (pure testing)
  comparisonWindow: number;       // Number of recent comparisons to consider
}

export interface ComparisonResult {
  timestamp: number;
  query: string;
  legacyChoice: {
    provider: string;
    model: string;
    score: number;
    cost: number;
  };
  enhancedChoice: {
    provider: string;
    model: string;
    score: number;
    cost: number;
  };
  actualProvider: string;
  actualPerformance?: {
    success: boolean;
    latency: number;
    cost: number;
    quality?: number;
  };
}

export interface PerformanceStats {
  totalComparisons: number;
  enhancedWinRate: number;
  legacyWinRate: number;
  tieRate: number;
  averageCostSavings: number;
  averageLatencyDelta: number;
  recentWindowStats: {
    winRate: number;
    costSavings: number;
    latencyDelta: number;
  };
}

export class SafeEnhancementWrapper {
  private legacySystem: IRouter;
  private enhancedSystem: IRouter;
  private config: EnhancementConfig;
  private comparisonHistory: ComparisonResult[] = [];
  private performanceStats: PerformanceStats;

  constructor(
    legacySystem: IRouter,
    enhancedSystem: IRouter,
    config?: Partial<EnhancementConfig>
  ) {
    this.legacySystem = legacySystem;
    this.enhancedSystem = enhancedSystem;
    this.config = {
      rollbackThreshold: 0.95,
      minimumSampleSize: 100,
      shadowModeOnly: false,
      comparisonWindow: 500,
      ...config,
    };
    this.performanceStats = this.initializeStats();
  }

  /**
   * Route request with safety wrapper
   */
  async route(
    request: RoutingRequest,
    providers: any[]
  ): Promise<RoutingDecision> {
    // Run both systems in parallel
    const [legacyResult, enhancedResult] = await Promise.all([
      this.legacySystem.route(request, providers),
      this.enhancedSystem.route(request, providers),
    ]);

    // Record comparison
    const comparison: ComparisonResult = {
      timestamp: Date.now(),
      query: this.summarizeRequest(request),
      legacyChoice: {
        provider: legacyResult.provider,
        model: legacyResult.actualModel,
        score: legacyResult.anfisScore,
        cost: legacyResult.estimatedCost,
      },
      enhancedChoice: {
        provider: enhancedResult.provider,
        model: enhancedResult.actualModel,
        score: enhancedResult.anfisScore,
        cost: enhancedResult.estimatedCost,
      },
      actualProvider: this.config.shadowModeOnly ? legacyResult.provider : enhancedResult.provider,
    };

    this.recordComparison(comparison);

    // Decide which to use
    if (this.config.shadowModeOnly) {
      return legacyResult;
    }

    // Check if we should rollback
    if (this.shouldRollback()) {
      console.warn('[SafeEnhancementWrapper] Performance degradation detected, using legacy system');
      return legacyResult;
    }

    // Use enhanced system
    return enhancedResult;
  }

  /**
   * Record comparison result
   */
  private recordComparison(comparison: ComparisonResult): void {
    this.comparisonHistory.push(comparison);

    // Maintain rolling window
    if (this.comparisonHistory.length > this.config.comparisonWindow) {
      this.comparisonHistory.shift();
    }

    // Update stats
    this.updatePerformanceStats();
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    if (this.comparisonHistory.length === 0) {
      return;
    }

    let enhancedWins = 0;
    let legacyWins = 0;
    let ties = 0;
    let totalCostSavings = 0;
    let totalLatencyDelta = 0;

    for (const comparison of this.comparisonHistory) {
      // Compare costs (lower is better)
      if (comparison.enhancedChoice.cost < comparison.legacyChoice.cost * 0.95) {
        enhancedWins++;
      } else if (comparison.legacyChoice.cost < comparison.enhancedChoice.cost * 0.95) {
        legacyWins++;
      } else {
        ties++;
      }

      totalCostSavings += comparison.legacyChoice.cost - comparison.enhancedChoice.cost;
      
      // Note: Latency delta would be calculated from actual performance data
      // For now, we estimate based on provider characteristics
    }

    const total = this.comparisonHistory.length;
    this.performanceStats = {
      totalComparisons: total,
      enhancedWinRate: enhancedWins / total,
      legacyWinRate: legacyWins / total,
      tieRate: ties / total,
      averageCostSavings: totalCostSavings / total,
      averageLatencyDelta: totalLatencyDelta / total,
      recentWindowStats: this.calculateRecentWindowStats(),
    };
  }

  /**
   * Calculate statistics for recent window
   */
  private calculateRecentWindowStats(): { winRate: number; costSavings: number; latencyDelta: number } {
    const windowSize = Math.min(100, this.comparisonHistory.length);
    if (windowSize === 0) {
      return { winRate: 0.5, costSavings: 0, latencyDelta: 0 };
    }

    const recentComparisons = this.comparisonHistory.slice(-windowSize);
    
    let enhancedWins = 0;
    let totalCostSavings = 0;

    for (const comparison of recentComparisons) {
      if (comparison.enhancedChoice.cost < comparison.legacyChoice.cost * 0.95) {
        enhancedWins++;
      }
      totalCostSavings += comparison.legacyChoice.cost - comparison.enhancedChoice.cost;
    }

    return {
      winRate: enhancedWins / windowSize,
      costSavings: totalCostSavings / windowSize,
      latencyDelta: 0, // Would be calculated from actual performance
    };
  }

  /**
   * Check if we should rollback to legacy system
   */
  private shouldRollback(): boolean {
    // Need minimum sample size
    if (this.comparisonHistory.length < this.config.minimumSampleSize) {
      return false;
    }

    // Check recent window performance
    const recentWinRate = this.performanceStats.recentWindowStats.winRate;
    
    if (recentWinRate < this.config.rollbackThreshold) {
      this.alertDegradation();
      return true;
    }

    return false;
  }

  /**
   * Alert about performance degradation
   */
  private alertDegradation(): void {
    console.error('[SafeEnhancementWrapper] ALERT: Enhanced system performance below threshold');
    console.error(`Recent win rate: ${(this.performanceStats.recentWindowStats.winRate * 100).toFixed(1)}%`);
    console.error(`Threshold: ${(this.config.rollbackThreshold * 100).toFixed(1)}%`);
    console.error(`Sample size: ${this.comparisonHistory.length}`);
    
    // In production, this would trigger alerts via monitoring system
  }

  /**
   * Record actual performance after request completion
   */
  recordActualPerformance(
    queryId: string,
    performance: {
      success: boolean;
      latency: number;
      cost: number;
      quality?: number;
    }
  ): void {
    // Find most recent comparison
    const comparison = this.comparisonHistory[this.comparisonHistory.length - 1];
    if (comparison) {
      comparison.actualPerformance = performance;
    }
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * Get comparison history
   */
  getComparisonHistory(limit?: number): ComparisonResult[] {
    if (limit) {
      return this.comparisonHistory.slice(-limit);
    }
    return [...this.comparisonHistory];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: string;
    stats: PerformanceStats;
    recommendation: 'use_enhanced' | 'use_legacy' | 'needs_more_data';
    details: {
      comparisonCount: number;
      totalCostSavings: number;
      avgSavingsPerQuery: number;
      confidenceLevel: number;
    };
  } {
    const stats = this.performanceStats;
    const totalSavings = stats.averageCostSavings * stats.totalComparisons;

    let recommendation: 'use_enhanced' | 'use_legacy' | 'needs_more_data' = 'needs_more_data';
    let summary = 'Insufficient data for recommendation';

    if (stats.totalComparisons >= this.config.minimumSampleSize) {
      if (stats.recentWindowStats.winRate >= this.config.rollbackThreshold) {
        recommendation = 'use_enhanced';
        summary = `Enhanced system performing well (${(stats.recentWindowStats.winRate * 100).toFixed(1)}% win rate)`;
      } else {
        recommendation = 'use_legacy';
        summary = `Enhanced system underperforming (${(stats.recentWindowStats.winRate * 100).toFixed(1)}% win rate)`;
      }
    }

    return {
      summary,
      stats,
      recommendation,
      details: {
        comparisonCount: stats.totalComparisons,
        totalCostSavings: totalSavings,
        avgSavingsPerQuery: stats.averageCostSavings,
        confidenceLevel: Math.min(1, stats.totalComparisons / this.config.minimumSampleSize),
      },
    };
  }

  /**
   * Reset comparison history
   */
  reset(): void {
    this.comparisonHistory = [];
    this.performanceStats = this.initializeStats();
  }

  /**
   * Initialize performance stats
   */
  private initializeStats(): PerformanceStats {
    return {
      totalComparisons: 0,
      enhancedWinRate: 0,
      legacyWinRate: 0,
      tieRate: 0,
      averageCostSavings: 0,
      averageLatencyDelta: 0,
      recentWindowStats: {
        winRate: 0.5,
        costSavings: 0,
        latencyDelta: 0,
      },
    };
  }

  /**
   * Summarize request for logging
   */
  private summarizeRequest(request: RoutingRequest): string {
    if (request.messages) {
      return `${request.messages.length} messages`;
    }
    if (request.prompt) {
      return request.prompt.substring(0, 50) + (request.prompt.length > 50 ? '...' : '');
    }
    return 'unknown request';
  }
}
