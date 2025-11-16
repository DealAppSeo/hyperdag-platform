/**
 * Production-Ready Router System
 * 
 * Integrates all safety and optimization components:
 * - Circuit Breaker for failure protection
 * - SafeEnhancementWrapper for A/B testing
 * - Adaptive RSI Routing for temporal arbitrage
 * - Self-Tuning ANFIS for continuous improvement
 * - Dynamic RepID scoring for provider reputation
 * 
 * This is the complete system ready for production deployment.
 */

import { ANFISRouter } from './anfis-router';
import type { RoutingRequest, RoutingDecision } from './anfis-router';
import type { AiProvider } from '@shared/schema';

import { CircuitBreaker, globalCircuitBreaker } from './safety/circuit-breaker';
import { SafeEnhancementWrapper } from './safety/safe-enhancement-wrapper';
import { RegressionTestSuite } from './safety/regression-test-suite';

import { AdaptiveRSIRouter } from './optimization/adaptive-rsi-router';
import { SelfTuningANFIS } from './optimization/self-tuning-anfis';
import {
  DynamicRepIDScoring,
  globalRepIDScoring,
  type ValidationResult,
} from './optimization/dynamic-repid-scoring';

/**
 * Production Router Configuration
 */
export interface ProductionRouterConfig {
  // Safety settings
  circuitBreakerEnabled: boolean;
  safeEnhancementEnabled: boolean;
  shadowModeOnly: boolean;
  
  // Optimization settings
  rsiRoutingEnabled: boolean;
  selfTuningEnabled: boolean;
  repidScoringEnabled: boolean;
  
  // Performance thresholds
  rollbackThreshold: number;
  minSampleSize: number;
}

/**
 * Production Router System
 */
export class ProductionRouterSystem {
  private baseRouter: ANFISRouter;
  private enhancedRouter: AdaptiveRSIRouter | SelfTuningANFIS;
  private safetyWrapper?: SafeEnhancementWrapper;
  private circuitBreaker: CircuitBreaker;
  private repidScoring: DynamicRepIDScoring;
  private regressionSuite?: RegressionTestSuite;
  
  private config: ProductionRouterConfig;

  constructor(config?: Partial<ProductionRouterConfig>) {
    this.config = {
      circuitBreakerEnabled: true,
      safeEnhancementEnabled: true,
      shadowModeOnly: false,
      rsiRoutingEnabled: true,
      selfTuningEnabled: true,
      repidScoringEnabled: true,
      rollbackThreshold: 0.95,
      minSampleSize: 100,
      ...config,
    };

    // Initialize base router
    this.baseRouter = new ANFISRouter();

    // Initialize enhanced router (RSI + Self-Tuning)
    if (this.config.selfTuningEnabled && this.config.rsiRoutingEnabled) {
      // Combine both optimizations
      const selfTuning = new SelfTuningANFIS();
      this.enhancedRouter = new AdaptiveRSIRouter(selfTuning);
    } else if (this.config.selfTuningEnabled) {
      this.enhancedRouter = new SelfTuningANFIS();
    } else if (this.config.rsiRoutingEnabled) {
      this.enhancedRouter = new AdaptiveRSIRouter();
    } else {
      this.enhancedRouter = new AdaptiveRSIRouter(); // Fallback
    }

    // Initialize circuit breaker
    this.circuitBreaker = this.config.circuitBreakerEnabled
      ? globalCircuitBreaker
      : new CircuitBreaker();

    // Initialize RepID scoring
    this.repidScoring = this.config.repidScoringEnabled
      ? globalRepIDScoring
      : new DynamicRepIDScoring();

    // Initialize safety wrapper
    if (this.config.safeEnhancementEnabled) {
      this.safetyWrapper = new SafeEnhancementWrapper(
        this.baseRouter,
        this.enhancedRouter,
        {
          rollbackThreshold: this.config.rollbackThreshold,
          minimumSampleSize: this.config.minSampleSize,
          shadowModeOnly: this.config.shadowModeOnly,
        }
      );

      // Initialize regression suite
      this.regressionSuite = new RegressionTestSuite(
        this.baseRouter,
        this.enhancedRouter
      );
    }

    console.log('[ProductionRouter] Initialized with config:', {
      circuitBreaker: this.config.circuitBreakerEnabled,
      safeEnhancement: this.config.safeEnhancementEnabled,
      rsiRouting: this.config.rsiRoutingEnabled,
      selfTuning: this.config.selfTuningEnabled,
      repidScoring: this.config.repidScoringEnabled,
    });
  }

  /**
   * Main routing function with full safety and optimization
   */
  async route(
    request: RoutingRequest,
    availableProviders: AiProvider[]
  ): Promise<RoutingDecision> {
    try {
      // Apply RepID filtering if enabled
      let filteredProviders = availableProviders;
      if (this.config.repidScoringEnabled) {
        filteredProviders = this.applyRepIDFiltering(availableProviders);
      }

      // Apply circuit breaker filtering
      if (this.config.circuitBreakerEnabled) {
        filteredProviders = this.circuitBreaker.filterAvailableProviders(
          filteredProviders.map(p => ({
            provider: p.providerName,
            model: p.models[0]?.modelId || '',
            available: p.isActive && p.apiKeyConfigured,
          }))
        ).map(p => filteredProviders.find(fp => fp.providerName === p.provider)!);
      }

      if (filteredProviders.length === 0) {
        throw new Error('No available providers after filtering');
      }

      // Route with safety wrapper if enabled
      let decision: RoutingDecision;
      
      if (this.safetyWrapper) {
        decision = await this.safetyWrapper.route(request, filteredProviders);
      } else {
        decision = await this.enhancedRouter.route(request, filteredProviders);
      }

      return decision;

    } catch (error) {
      console.error('[ProductionRouter] Routing error:', error);
      throw error;
    }
  }

  /**
   * Execute request with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    provider: string,
    executeRequest: () => Promise<T>,
    fallbackProviders: string[] = []
  ): Promise<T> {
    if (!this.config.circuitBreakerEnabled) {
      return executeRequest();
    }

    return this.circuitBreaker.executeWithProtection(
      provider,
      executeRequest,
      fallbackProviders
    );
  }

  /**
   * Record actual performance for optimization
   */
  recordPerformance(params: {
    provider: string;
    success: boolean;
    latency: number;
    cost: number;
    quality?: number;
    confidence?: number;
    difficulty?: number;
    isEdgeCase?: boolean;
  }): void {
    const timestamp = Date.now();

    // Record for RSI router
    if (
      this.config.rsiRoutingEnabled &&
      this.enhancedRouter instanceof AdaptiveRSIRouter
    ) {
      this.enhancedRouter.recordPerformance({
        timestamp,
        provider: params.provider,
        success: params.success,
        latency: params.latency,
        cost: params.cost,
        quality: params.quality,
      });
    }

    // Record for self-tuning ANFIS
    if (
      this.config.selfTuningEnabled &&
      this.enhancedRouter instanceof SelfTuningANFIS
    ) {
      const actualScore = params.success ? (params.quality || 80) : 40;
      this.enhancedRouter.recordActualPerformance(params.provider, actualScore);
    }

    // Update RepID score
    if (this.config.repidScoringEnabled) {
      const validation: ValidationResult = {
        correct: params.success,
        confidence: params.confidence || 0.8,
        difficulty: params.difficulty || 0.5,
        isEdgeCase: params.isEdgeCase || false,
        timestamp,
      };
      
      this.repidScoring.updateRepID(params.provider, validation);
    }
  }

  /**
   * Apply RepID-based provider filtering
   */
  private applyRepIDFiltering(providers: AiProvider[]): AiProvider[] {
    const minRepIDScore = 50; // Minimum reputation to be considered
    
    return providers.filter(provider => {
      const repid = this.repidScoring.getRepID(provider.providerName);
      return repid >= minRepIDScore;
    }).sort((a, b) => {
      // Boost providers with higher RepID
      const repidA = this.repidScoring.getRepID(a.providerName);
      const repidB = this.repidScoring.getRepID(b.providerName);
      return repidB - repidA;
    });
  }

  /**
   * Run regression tests before deployment
   */
  async runRegressionTests(providers: AiProvider[]) {
    if (!this.regressionSuite) {
      throw new Error('Regression suite not initialized');
    }

    return this.regressionSuite.runRegressionTests(providers);
  }

  /**
   * Get system statistics
   */
  getSystemStats(): {
    circuitBreaker: Map<string, any> | null;
    safetyWrapper: any | null;
    repidScoring: Map<string, any> | null;
    rsiMetrics: Map<string, any> | null;
    selfTuningStats: any | null;
  } {
    return {
      circuitBreaker: this.config.circuitBreakerEnabled
        ? this.circuitBreaker.getAllCircuitStats()
        : null,
      safetyWrapper: this.safetyWrapper
        ? this.safetyWrapper.getPerformanceStats()
        : null,
      repidScoring: this.config.repidScoringEnabled
        ? new Map(
            Array.from({ length: 5 }).map((_, i) => [
              `provider-${i}`,
              this.repidScoring.getAgentStats(`provider-${i}`),
            ])
          )
        : null,
      rsiMetrics:
        this.config.rsiRoutingEnabled &&
        this.enhancedRouter instanceof AdaptiveRSIRouter
          ? this.enhancedRouter.getAllRSIMetrics()
          : null,
      selfTuningStats:
        this.config.selfTuningEnabled &&
        this.enhancedRouter instanceof SelfTuningANFIS
          ? this.enhancedRouter.getTuningStats()
          : null,
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(): Promise<string> {
    const stats = this.getSystemStats();
    
    const lines = [
      '=== Production Router System Report ===',
      '',
      '## Configuration',
      `- Circuit Breaker: ${this.config.circuitBreakerEnabled ? 'Enabled' : 'Disabled'}`,
      `- Safe Enhancement: ${this.config.safeEnhancementEnabled ? 'Enabled' : 'Disabled'}`,
      `- RSI Routing: ${this.config.rsiRoutingEnabled ? 'Enabled' : 'Disabled'}`,
      `- Self-Tuning: ${this.config.selfTuningEnabled ? 'Enabled' : 'Disabled'}`,
      `- RepID Scoring: ${this.config.repidScoringEnabled ? 'Enabled' : 'Disabled'}`,
      '',
      '## Performance Metrics',
    ];

    if (stats.safetyWrapper) {
      lines.push(
        `- Enhanced Win Rate: ${(stats.safetyWrapper.enhancedWinRate * 100).toFixed(1)}%`,
        `- Avg Cost Savings: $${stats.safetyWrapper.averageCostSavings.toFixed(4)}`,
        `- Total Comparisons: ${stats.safetyWrapper.totalComparisons}`
      );
    }

    if (stats.selfTuningStats) {
      lines.push(
        '',
        '## Self-Tuning ANFIS',
        `- Total Tunings: ${stats.selfTuningStats.totalTunings}`,
        `- Current MSE: ${stats.selfTuningStats.currentMSE.toFixed(4)}`,
        `- Improvement Rate: ${stats.selfTuningStats.improvementRate.toFixed(1)}%`
      );
    }

    return lines.join('\n');
  }

  /**
   * Reset system (for testing)
   */
  reset(): void {
    if (this.safetyWrapper) {
      this.safetyWrapper.reset();
    }
    if (this.enhancedRouter instanceof SelfTuningANFIS) {
      this.enhancedRouter.resetTuning();
    }
  }
}

// Singleton instance for production use
export const productionRouter = new ProductionRouterSystem({
  circuitBreakerEnabled: true,
  safeEnhancementEnabled: false, // Start conservative
  shadowModeOnly: false,
  rsiRoutingEnabled: true,
  selfTuningEnabled: true,
  repidScoringEnabled: true,
  rollbackThreshold: 0.95,
  minSampleSize: 100,
});
