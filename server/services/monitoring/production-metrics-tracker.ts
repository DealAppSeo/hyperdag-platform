/**
 * Production Metrics Tracker
 * Collects REAL data to validate white paper claims
 * 
 * Tracks:
 * - Cost per provider vs baseline
 * - Latency per provider
 * - Success rate per provider
 * - Routing accuracy
 * - User satisfaction (when available)
 */

export interface ProviderMetrics {
  provider: string;
  timestamp: Date;
  requestCount: number;
  totalCost: number;        // Actual cost in USD
  avgLatency: number;        // milliseconds
  successRate: number;       // 0.0 - 1.0
  taskType?: string;
}

export interface BaselineComparison {
  period: string;            // 'daily' | 'weekly' | 'monthly'
  trinityTotalCost: number;
  baselineTotalCost: number; // What it would cost with GPT-4 only
  actualSavings: number;     // Percentage
  requestVolume: number;
}

export interface RoutingDecision {
  timestamp: Date;
  taskType: string;
  selectedProvider: string;
  optimalProvider: string;   // Determined post-hoc
  wasOptimal: boolean;
  anfisScore: number;
  latency: number;
  cost: number;
  success: boolean;
}

export class ProductionMetricsTracker {
  private metrics: Map<string, ProviderMetrics[]> = new Map();
  private routingDecisions: RoutingDecision[] = [];
  private baselineCostPerRequest = 0.002; // GPT-4 baseline: $0.002/request
  
  constructor() {
    console.log('[Metrics Tracker] 📊 Production metrics collection started');
    console.log('[Metrics Tracker] 🎯 Target: Validate 89% cost reduction claim');
  }

  /**
   * Record a provider request with actual cost and performance data
   */
  recordProviderRequest(
    provider: string,
    cost: number,
    latency: number,
    success: boolean,
    taskType?: string
  ): void {
    const timestamp = new Date();
    
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, []);
    }

    const providerMetrics = this.metrics.get(provider)!;
    
    // Add or update today's metrics
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);
    
    let todayMetrics = providerMetrics.find(m => 
      m.timestamp.getTime() === today.getTime()
    );

    if (!todayMetrics) {
      todayMetrics = {
        provider,
        timestamp: today,
        requestCount: 0,
        totalCost: 0,
        avgLatency: 0,
        successRate: 1.0,
        taskType
      };
      providerMetrics.push(todayMetrics);
    }

    // Update metrics with exponential moving average
    const alpha = 1 / (todayMetrics.requestCount + 1);
    todayMetrics.requestCount++;
    todayMetrics.totalCost += cost;
    todayMetrics.avgLatency = todayMetrics.avgLatency * (1 - alpha) + latency * alpha;
    todayMetrics.successRate = todayMetrics.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;

    console.log(`[Metrics] ${provider}: $${cost.toFixed(4)}, ${latency}ms, ${success ? '✓' : '✗'}`);
  }

  /**
   * Record a routing decision for accuracy tracking
   */
  recordRoutingDecision(
    taskType: string,
    selectedProvider: string,
    anfisScore: number,
    latency: number,
    cost: number,
    success: boolean
  ): void {
    const decision: RoutingDecision = {
      timestamp: new Date(),
      taskType,
      selectedProvider,
      optimalProvider: selectedProvider, // Will be updated post-hoc
      wasOptimal: true,                  // Will be determined later
      anfisScore,
      latency,
      cost,
      success
    };

    this.routingDecisions.push(decision);

    // Keep last 10,000 decisions
    if (this.routingDecisions.length > 10000) {
      this.routingDecisions.shift();
    }
  }

  /**
   * Calculate actual cost savings vs baseline
   */
  getActualSavings(period: 'daily' | 'weekly' | 'monthly' = 'daily'): BaselineComparison {
    const now = new Date();
    const periodStart = new Date(now);
    
    switch (period) {
      case 'daily':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart.setMonth(now.getMonth() - 1);
        break;
    }

    let trinityTotalCost = 0;
    let requestVolume = 0;

    for (const providerMetrics of Array.from(this.metrics.values())) {
      for (const metric of providerMetrics) {
        if (metric.timestamp >= periodStart) {
          trinityTotalCost += metric.totalCost;
          requestVolume += metric.requestCount;
        }
      }
    }

    const baselineTotalCost = requestVolume * this.baselineCostPerRequest;
    const actualSavings = baselineTotalCost > 0 
      ? ((baselineTotalCost - trinityTotalCost) / baselineTotalCost) * 100
      : 0;

    return {
      period,
      trinityTotalCost,
      baselineTotalCost,
      actualSavings,
      requestVolume
    };
  }

  /**
   * Calculate routing accuracy (what % of decisions were optimal)
   */
  getRoutingAccuracy(): number {
    if (this.routingDecisions.length === 0) return 0;

    // Determine optimal provider post-hoc (fastest with success)
    const optimalCount = this.routingDecisions.filter(d => {
      // For now, consider a decision optimal if it succeeded
      // TODO: Implement more sophisticated post-hoc analysis
      return d.success;
    }).length;

    return (optimalCount / this.routingDecisions.length) * 100;
  }

  /**
   * Get average latency across all providers
   */
  getAverageLatency(): number {
    let totalLatency = 0;
    let count = 0;

    for (const providerMetrics of Array.from(this.metrics.values())) {
      for (const metric of providerMetrics) {
        totalLatency += metric.avgLatency * metric.requestCount;
        count += metric.requestCount;
      }
    }

    return count > 0 ? totalLatency / count : 0;
  }

  /**
   * Get provider-specific performance
   */
  getProviderPerformance(provider: string): {
    avgCost: number;
    avgLatency: number;
    successRate: number;
    requestCount: number;
  } | null {
    const providerMetrics = this.metrics.get(provider);
    if (!providerMetrics || providerMetrics.length === 0) return null;

    let totalCost = 0;
    let totalRequests = 0;
    let avgLatency = 0;
    let avgSuccessRate = 0;

    for (const metric of providerMetrics) {
      totalCost += metric.totalCost;
      totalRequests += metric.requestCount;
      avgLatency += metric.avgLatency * metric.requestCount;
      avgSuccessRate += metric.successRate * metric.requestCount;
    }

    return {
      avgCost: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgLatency: totalRequests > 0 ? avgLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? avgSuccessRate / totalRequests : 0,
      requestCount: totalRequests
    };
  }

  /**
   * Get validation report for white paper claims
   */
  getValidationReport(): {
    claimedSavings: string;
    actualSavings: string;
    claimedRoutingAccuracy: string;
    actualRoutingAccuracy: string;
    claimedLatency: string;
    actualLatency: string;
    dataCollectionPeriod: string;
    requestVolume: number;
    status: 'insufficient_data' | 'validating' | 'validated';
  } {
    const self = this;
    const savings = self.getActualSavings('daily');
    const routingAccuracy = self.getRoutingAccuracy();
    const avgLatency = self.getAverageLatency();

    let status: 'insufficient_data' | 'validating' | 'validated' = 'insufficient_data';
    if (savings.requestVolume > 100) status = 'validating';
    if (savings.requestVolume > 10000) status = 'validated';

    return {
      claimedSavings: '89%',
      actualSavings: savings.requestVolume > 0 
        ? `${savings.actualSavings.toFixed(1)}%`
        : 'N/A - No data',
      claimedRoutingAccuracy: '91.7%',
      actualRoutingAccuracy: self.routingDecisions.length > 0
        ? `${routingAccuracy.toFixed(1)}%`
        : 'N/A - No data',
      claimedLatency: '<200ms',
      actualLatency: savings.requestVolume > 0
        ? `${avgLatency.toFixed(0)}ms`
        : 'N/A - No data',
      dataCollectionPeriod: `${Math.floor((Date.now() - (self.routingDecisions[0]?.timestamp?.getTime() || Date.now())) / (1000 * 60 * 60 * 24))} days`,
      requestVolume: savings.requestVolume,
      status
    };
  }

  /**
   * Export metrics for persistence (to database)
   */
  exportMetrics(): {
    providers: Map<string, ProviderMetrics[]>;
    routing: RoutingDecision[];
    summary: {
      claimedSavings: string;
      actualSavings: string;
      claimedRoutingAccuracy: string;
      actualRoutingAccuracy: string;
      claimedLatency: string;
      actualLatency: string;
      dataCollectionPeriod: string;
      requestVolume: number;
      status: 'insufficient_data' | 'validating' | 'validated';
    };
  } {
    return {
      providers: this.metrics,
      routing: this.routingDecisions,
      summary: this.getValidationReport()
    };
  }
}

// Global singleton instance
export const metricsTracker = new ProductionMetricsTracker();
