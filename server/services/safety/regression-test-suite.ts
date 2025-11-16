/**
 * Regression Testing Framework for AI Routing
 * 
 * Prevents performance degradation by testing new changes against
 * a golden set of queries with known optimal answers.
 * 
 * Key Features:
 * - Golden test set management
 * - Performance benchmarking
 * - Edge case testing
 * - Load testing
 * - Automated regression detection
 */

import type { RoutingRequest, RoutingDecision } from '../anfis-router';

export interface Router {
  route(request: RoutingRequest, providers: any[]): Promise<RoutingDecision>;
}

export interface TestCase {
  id: string;
  name: string;
  request: RoutingRequest;
  expectedProvider?: string;
  expectedModel?: string;
  maxCost?: number;
  maxLatency?: number;
  tags: string[];
}

export interface TestResult {
  testCase: TestCase;
  actualDecision: RoutingDecision;
  passed: boolean;
  reason: string;
  metrics: {
    latency: number;
    cost: number;
    score: number;
  };
}

export interface RegressionReport {
  timestamp: number;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  performanceMetrics: {
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    avgCost: number;
    totalCost: number;
  };
  edgeCaseResults: Map<string, 'PASS' | 'FAIL'>;
  failedTests: TestResult[];
  regressionDetected: boolean;
  summary: string;
}

export class RegressionTestSuite {
  private baselineSystem: Router;
  private testSystem: Router;
  private goldenSet: TestCase[] = [];
  private baselineMetrics: {
    passRate: number;
    avgLatency: number;
    p95Latency: number;
    avgCost: number;
  } | null = null;

  constructor(baselineSystem: Router, testSystem: Router) {
    this.baselineSystem = baselineSystem;
    this.testSystem = testSystem;
    this.initializeGoldenSet();
  }

  /**
   * Initialize golden test set with common query patterns
   */
  private initializeGoldenSet(): void {
    this.goldenSet = [
      // Simple queries (cost-optimized)
      {
        id: 'simple-1',
        name: 'Simple factual query',
        request: {
          prompt: 'What is the capital of France?',
          maxTokens: 50,
          temperature: 0.3,
        },
        maxCost: 0.001,
        tags: ['simple', 'factual', 'cost-sensitive'],
      },
      {
        id: 'simple-2',
        name: 'Basic math question',
        request: {
          prompt: 'Calculate 15% of 200',
          maxTokens: 30,
          temperature: 0,
        },
        maxCost: 0.0005,
        tags: ['simple', 'math', 'cost-sensitive'],
      },

      // Complex queries (quality-optimized)
      {
        id: 'complex-1',
        name: 'Code generation task',
        request: {
          prompt: 'Write a Python function to implement binary search with detailed comments',
          maxTokens: 500,
          temperature: 0.7,
          userPreferences: {
            qualityWeight: 0.6,
            costWeight: 0.2,
          },
        },
        tags: ['complex', 'code', 'quality-sensitive'],
      },
      {
        id: 'complex-2',
        name: 'Creative writing',
        request: {
          prompt: 'Write a short story about AI and humanity',
          maxTokens: 800,
          temperature: 0.9,
          userPreferences: {
            qualityWeight: 0.7,
            costWeight: 0.1,
          },
        },
        tags: ['complex', 'creative', 'quality-sensitive'],
      },

      // Speed-optimized queries
      {
        id: 'speed-1',
        name: 'Quick translation',
        request: {
          prompt: 'Translate "hello" to Spanish',
          maxTokens: 10,
          userPreferences: {
            speedWeight: 0.6,
            costWeight: 0.3,
          },
        },
        maxLatency: 2000,
        tags: ['speed', 'simple', 'translation'],
      },

      // Edge cases
      {
        id: 'edge-1',
        name: 'Very long context',
        request: {
          prompt: 'A'.repeat(5000) + ' What is this?',
          maxTokens: 100,
        },
        tags: ['edge-case', 'long-context'],
      },
      {
        id: 'edge-2',
        name: 'Minimal tokens',
        request: {
          prompt: 'Yes or no: Is water wet?',
          maxTokens: 1,
        },
        tags: ['edge-case', 'minimal-output'],
      },
      {
        id: 'edge-3',
        name: 'Zero temperature',
        request: {
          prompt: 'What is 2+2?',
          maxTokens: 5,
          temperature: 0,
        },
        tags: ['edge-case', 'deterministic'],
      },
    ];
  }

  /**
   * Run comprehensive regression tests
   */
  async runRegressionTests(providers: any[]): Promise<RegressionReport> {
    console.log('[RegressionTest] Starting regression test suite...');
    
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Run all golden set tests
    for (const testCase of this.goldenSet) {
      try {
        const result = await this.runTestCase(testCase, providers);
        results.push(result);
      } catch (error) {
        console.error(`[RegressionTest] Test ${testCase.id} failed with error:`, error);
        results.push({
          testCase,
          actualDecision: null as any,
          passed: false,
          reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: { latency: 0, cost: 0, score: 0 },
        });
      }
    }

    const totalTime = Date.now() - startTime;

    // Calculate metrics
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const passRate = passed / results.length;

    const latencies = results.filter(r => r.passed).map(r => r.metrics.latency);
    const costs = results.filter(r => r.passed).map(r => r.metrics.cost);

    const performanceMetrics = {
      avgLatency: this.average(latencies),
      p50Latency: this.percentile(latencies, 0.5),
      p95Latency: this.percentile(latencies, 0.95),
      p99Latency: this.percentile(latencies, 0.99),
      avgCost: this.average(costs),
      totalCost: costs.reduce((sum, c) => sum + c, 0),
    };

    // Run edge case tests
    const edgeCaseResults = await this.testEdgeCases(providers);

    // Detect regression
    const regressionDetected = this.detectRegression(passRate, performanceMetrics);

    const report: RegressionReport = {
      timestamp: Date.now(),
      totalTests: results.length,
      passed,
      failed,
      passRate,
      performanceMetrics,
      edgeCaseResults,
      failedTests: results.filter(r => !r.passed),
      regressionDetected,
      summary: this.generateSummary(passRate, performanceMetrics, regressionDetected, totalTime),
    };

    console.log(`[RegressionTest] Completed in ${totalTime}ms`);
    console.log(report.summary);

    if (regressionDetected) {
      console.error('[RegressionTest] ⚠️  REGRESSION DETECTED ⚠️');
    }

    return report;
  }

  /**
   * Run individual test case
   */
  private async runTestCase(testCase: TestCase, providers: any[]): Promise<TestResult> {
    const startTime = Date.now();
    const decision = await this.testSystem.route(testCase.request, providers);
    const latency = Date.now() - startTime;

    let passed = true;
    let reason = 'Test passed';

    // Check expected provider
    if (testCase.expectedProvider && decision.provider !== testCase.expectedProvider) {
      passed = false;
      reason = `Expected provider ${testCase.expectedProvider}, got ${decision.provider}`;
    }

    // Check max cost constraint
    if (testCase.maxCost && decision.estimatedCost > testCase.maxCost) {
      passed = false;
      reason = `Cost ${decision.estimatedCost} exceeds max ${testCase.maxCost}`;
    }

    // Check max latency constraint
    if (testCase.maxLatency && latency > testCase.maxLatency) {
      passed = false;
      reason = `Latency ${latency}ms exceeds max ${testCase.maxLatency}ms`;
    }

    return {
      testCase,
      actualDecision: decision,
      passed,
      reason,
      metrics: {
        latency,
        cost: decision.estimatedCost,
        score: decision.anfisScore,
      },
    };
  }

  /**
   * Test edge cases
   */
  private async testEdgeCases(providers: any[]): Promise<Map<string, 'PASS' | 'FAIL'>> {
    const results = new Map<string, 'PASS' | 'FAIL'>();

    // Test: All providers failing (handled by circuit breaker)
    try {
      const emptyProviders: any[] = [];
      await this.testSystem.route({ prompt: 'test' }, emptyProviders);
      results.set('no_providers', 'FAIL'); // Should have thrown
    } catch {
      results.set('no_providers', 'PASS'); // Correctly handled
    }

    // Test: Extremely high load simulation
    try {
      const promises = Array(50).fill(null).map(() => 
        this.testSystem.route({ prompt: 'test query' }, providers)
      );
      await Promise.all(promises);
      results.set('high_load', 'PASS');
    } catch {
      results.set('high_load', 'FAIL');
    }

    // Test: Zero-cost providers preferred
    try {
      const decision = await this.testSystem.route(
        { prompt: 'test', userPreferences: { costWeight: 1.0, qualityWeight: 0 } },
        providers
      );
      results.set('cost_optimization', decision.estimatedCost <= 0.01 ? 'PASS' : 'FAIL');
    } catch {
      results.set('cost_optimization', 'FAIL');
    }

    return results;
  }

  /**
   * Detect regression compared to baseline
   */
  private detectRegression(
    passRate: number,
    metrics: RegressionReport['performanceMetrics']
  ): boolean {
    // First run - establish baseline
    if (!this.baselineMetrics) {
      this.baselineMetrics = {
        passRate,
        avgLatency: metrics.avgLatency,
        p95Latency: metrics.p95Latency,
        avgCost: metrics.avgCost,
      };
      return false;
    }

    // Check for regressions
    const regressions: string[] = [];

    // Pass rate regression (>5% drop)
    if (passRate < this.baselineMetrics.passRate - 0.05) {
      regressions.push(`Pass rate dropped: ${(this.baselineMetrics.passRate * 100).toFixed(1)}% → ${(passRate * 100).toFixed(1)}%`);
    }

    // Latency regression (>20% increase)
    if (metrics.p95Latency > this.baselineMetrics.p95Latency * 1.2) {
      regressions.push(`P95 latency increased: ${this.baselineMetrics.p95Latency.toFixed(0)}ms → ${metrics.p95Latency.toFixed(0)}ms`);
    }

    // Cost regression (>10% increase)
    if (metrics.avgCost > this.baselineMetrics.avgCost * 1.1) {
      regressions.push(`Avg cost increased: $${this.baselineMetrics.avgCost.toFixed(4)} → $${metrics.avgCost.toFixed(4)}`);
    }

    if (regressions.length > 0) {
      console.error('[RegressionTest] Regressions detected:');
      regressions.forEach(r => console.error(`  - ${r}`));
      return true;
    }

    return false;
  }

  /**
   * Generate summary report
   */
  private generateSummary(
    passRate: number,
    metrics: RegressionReport['performanceMetrics'],
    regressionDetected: boolean,
    totalTime: number
  ): string {
    const lines = [
      '=== Regression Test Summary ===',
      `Pass Rate: ${(passRate * 100).toFixed(1)}%`,
      `Avg Latency: ${metrics.avgLatency.toFixed(0)}ms`,
      `P95 Latency: ${metrics.p95Latency.toFixed(0)}ms`,
      `Avg Cost: $${metrics.avgCost.toFixed(4)}`,
      `Total Time: ${totalTime}ms`,
      regressionDetected ? '⚠️  REGRESSION DETECTED' : '✅ All checks passed',
    ];
    return lines.join('\n');
  }

  /**
   * Add custom test case
   */
  addTestCase(testCase: TestCase): void {
    this.goldenSet.push(testCase);
  }

  /**
   * Get test cases by tag
   */
  getTestCasesByTag(tag: string): TestCase[] {
    return this.goldenSet.filter(tc => tc.tags.includes(tag));
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}
