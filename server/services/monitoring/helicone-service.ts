/**
 * Helicone.ai Monitoring Service
 * 
 * Provides comprehensive observability for AI provider usage across the ANFIS system
 * Features: Request tracking, cost analysis, performance monitoring, and usage analytics
 */

interface HeliconeMetrics {
  providerId: string;
  model: string;
  requestTime: number;
  responseTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  success: boolean;
  errorMessage?: string;
  heliconeRequestId?: string;
}

interface HeliconeAnalytics {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  providerDistribution: { [key: string]: number };
  costByProvider: { [key: string]: number };
  dailyUsage: { date: string; requests: number; cost: number }[];
}

export class HeliconeMonitoringService {
  private metrics: HeliconeMetrics[] = [];
  private isEnabled = false;

  constructor() {
    this.isEnabled = !!(process.env.ANTHROPIC_API_KEY && process.env.HELICONE_API_KEY);
    if (this.isEnabled) {
      console.log('[Helicone] Monitoring service initialized - authenticated tracking active');
    } else {
      console.log('[Helicone] Service disabled - requires both ANTHROPIC_API_KEY and HELICONE_API_KEY');
    }
  }

  /**
   * Record metrics from an AI request
   */
  recordRequest(metrics: HeliconeMetrics): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      ...metrics,
      requestTime: Date.now()
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    console.log(`[Helicone] Recorded ${metrics.providerId} request: ${metrics.tokenUsage.total} tokens, $${metrics.cost.toFixed(4)}, ${metrics.responseTime}ms`);
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(timeframe: 'hour' | 'day' | 'week' | 'all' = 'day'): HeliconeAnalytics {
    if (!this.isEnabled) {
      return this.getEmptyAnalytics();
    }

    const now = Date.now();
    const timeframePeriods = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      all: Infinity
    };

    const cutoff = now - timeframePeriods[timeframe];
    const filteredMetrics = this.metrics.filter(m => m.requestTime >= cutoff);

    if (filteredMetrics.length === 0) {
      return this.getEmptyAnalytics();
    }

    // Calculate analytics
    const totalRequests = filteredMetrics.length;
    const totalCost = filteredMetrics.reduce((sum, m) => sum + m.cost, 0);
    const averageResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const successRate = filteredMetrics.filter(m => m.success).length / totalRequests;

    // Provider distribution
    const providerDistribution: { [key: string]: number } = {};
    const costByProvider: { [key: string]: number } = {};

    filteredMetrics.forEach(metric => {
      providerDistribution[metric.providerId] = (providerDistribution[metric.providerId] || 0) + 1;
      costByProvider[metric.providerId] = (costByProvider[metric.providerId] || 0) + metric.cost;
    });

    // Daily usage (for last 7 days)
    const dailyUsage = this.calculateDailyUsage(filteredMetrics);

    return {
      totalRequests,
      totalCost,
      averageResponseTime,
      successRate,
      providerDistribution,
      costByProvider,
      dailyUsage
    };
  }

  /**
   * Get ANFIS-specific metrics for optimization
   */
  getANFISMetrics(): {
    providerPerformance: { [key: string]: { avgResponseTime: number; successRate: number; avgCost: number } };
    costEfficiencyRanking: { providerId: string; efficiency: number }[];
    qualityMetrics: { [key: string]: number };
  } {
    if (!this.isEnabled || this.metrics.length === 0) {
      return {
        providerPerformance: {},
        costEfficiencyRanking: [],
        qualityMetrics: {}
      };
    }

    const providerMetrics: { [key: string]: HeliconeMetrics[] } = {};
    
    // Group metrics by provider
    this.metrics.forEach(metric => {
      if (!providerMetrics[metric.providerId]) {
        providerMetrics[metric.providerId] = [];
      }
      providerMetrics[metric.providerId].push(metric);
    });

    // Calculate performance metrics
    const providerPerformance: { [key: string]: { avgResponseTime: number; successRate: number; avgCost: number } } = {};
    const costEfficiencyRanking: { providerId: string; efficiency: number }[] = [];

    Object.entries(providerMetrics).forEach(([providerId, metrics]) => {
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const successRate = metrics.filter(m => m.success).length / metrics.length;
      const avgCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
      
      providerPerformance[providerId] = {
        avgResponseTime,
        successRate,
        avgCost
      };

      // Calculate efficiency (lower cost + higher success rate + faster response = higher efficiency)
      const efficiency = (successRate * 0.4) + ((1 / avgCost) * 0.3) + ((1 / avgResponseTime) * 0.3);
      costEfficiencyRanking.push({ providerId, efficiency });
    });

    // Sort by efficiency
    costEfficiencyRanking.sort((a, b) => b.efficiency - a.efficiency);

    return {
      providerPerformance,
      costEfficiencyRanking,
      qualityMetrics: {} // Placeholder for future quality scoring
    };
  }

  /**
   * Get real-time monitoring dashboard data
   */
  getDashboardData(): {
    currentStatus: string;
    recentRequests: HeliconeMetrics[];
    performanceAlerts: string[];
    costSummary: {
      todayCost: number;
      weekCost: number;
      projectedMonthlyCost: number;
    };
  } {
    const recentRequests = this.metrics.slice(-10);
    const performanceAlerts: string[] = [];
    
    // Check for performance issues
    const recentFailures = recentRequests.filter(m => !m.success);
    if (recentFailures.length > 3) {
      performanceAlerts.push(`High failure rate detected: ${recentFailures.length}/10 recent requests failed`);
    }

    const slowRequests = recentRequests.filter(m => m.responseTime > 10000);
    if (slowRequests.length > 2) {
      performanceAlerts.push(`Slow response times detected: ${slowRequests.length} requests > 10s`);
    }

    // Calculate cost summary
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);

    const todayCost = this.metrics
      .filter(m => m.requestTime >= todayStart)
      .reduce((sum, m) => sum + m.cost, 0);

    const weekCost = this.metrics
      .filter(m => m.requestTime >= weekStart)
      .reduce((sum, m) => sum + m.cost, 0);

    const projectedMonthlyCost = (weekCost / 7) * 30;

    return {
      currentStatus: this.isEnabled ? 'monitoring' : 'disabled',
      recentRequests,
      performanceAlerts,
      costSummary: {
        todayCost,
        weekCost,
        projectedMonthlyCost
      }
    };
  }

  private calculateDailyUsage(metrics: HeliconeMetrics[]): { date: string; requests: number; cost: number }[] {
    const dailyData: { [key: string]: { requests: number; cost: number } } = {};

    metrics.forEach(metric => {
      const date = new Date(metric.requestTime).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { requests: 0, cost: 0 };
      }
      dailyData[date].requests += 1;
      dailyData[date].cost += metric.cost;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getEmptyAnalytics(): HeliconeAnalytics {
    return {
      totalRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      providerDistribution: {},
      costByProvider: {},
      dailyUsage: []
    };
  }

  /**
   * Export metrics for external analytics
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    } else {
      // CSV format
      const headers = 'provider,model,responseTime,inputTokens,outputTokens,totalTokens,cost,success,timestamp';
      const rows = this.metrics.map(m => 
        `${m.providerId},${m.model},${m.responseTime},${m.tokenUsage.input},${m.tokenUsage.output},${m.tokenUsage.total},${m.cost},${m.success},${new Date(m.requestTime).toISOString()}`
      );
      return [headers, ...rows].join('\n');
    }
  }

  /**
   * Clear old metrics (for maintenance)
   */
  clearOldMetrics(daysToKeep: number = 30): number {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.requestTime >= cutoff);
    const clearedCount = initialCount - this.metrics.length;
    
    if (clearedCount > 0) {
      console.log(`[Helicone] Cleared ${clearedCount} old metrics (keeping ${daysToKeep} days)`);
    }
    
    return clearedCount;
  }
}

// Export singleton instance
export const heliconeService = new HeliconeMonitoringService();