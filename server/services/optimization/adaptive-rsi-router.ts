/**
 * Adaptive RSI Routing with Dynamic Lookback Windows
 * 
 * Applies financial market technical analysis (RSI - Relative Strength Index)
 * to AI provider routing. Routes requests away from "overbought" (saturated)
 * providers to "oversold" (underutilized) high-quality providers.
 * 
 * Key Features:
 * - Multi-timeframe RSI analysis (short/medium/long)
 * - Divergence detection (strong contrarian signals)
 * - Adaptive window optimization per provider
 * - Volatility-aware weighting
 * - Momentum-based scoring
 */

import type { AiProvider } from '@shared/schema';
import type { RoutingRequest, RoutingDecision } from '../anfis-router';
import { ANFISRouter } from '../anfis-router';
import type { IRouter } from '../router-interface';

export interface ProviderPerformance {
  timestamp: number;
  provider: string;
  success: boolean;
  latency: number;
  cost: number;
  quality?: number;
}

export interface RSIMetrics {
  rsiShort: number;    // 5-period lookback
  rsiMedium: number;   // 10-period lookback
  rsiLong: number;     // 20-period lookback
  combinedRSI: number; // Weighted combination
  momentum: 'oversold' | 'neutral' | 'overbought';
  divergence?: 'bullish' | 'bearish' | null;
}

export interface AdaptiveWindow {
  providerId: string;
  optimalWindow: number;
  accuracy: number;
  lastOptimized: number;
}

export class AdaptiveRSIRouter implements IRouter {
  private baseRouter: ANFISRouter;
  private performanceHistory: Map<string, ProviderPerformance[]> = new Map();
  private windowOptimizer: Map<string, AdaptiveWindow> = new Map();
  
  private readonly HIGH_VOLATILITY_THRESHOLD = 0.3;
  private readonly RSI_OVERSOLD = 30;
  private readonly RSI_OVERBOUGHT = 70;
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly WINDOW_REOPTIMIZE_INTERVAL = 3600000; // 1 hour

  constructor(baseRouter?: ANFISRouter) {
    this.baseRouter = baseRouter || new ANFISRouter();
  }

  /**
   * Route request with RSI-based momentum optimization
   */
  async route(
    request: RoutingRequest,
    availableProviders: AiProvider[]
  ): Promise<RoutingDecision> {
    // Calculate RSI metrics for each provider
    const providerRSI = new Map<string, RSIMetrics>();
    
    for (const provider of availableProviders) {
      const rsi = this.calculateAdaptiveRSI(provider.providerName);
      providerRSI.set(provider.providerName, rsi);
    }

    // Adjust provider scores based on RSI momentum
    const adjustedProviders = this.adjustProviderScores(availableProviders, providerRSI);

    // Route using base ANFIS with RSI adjustments
    const decision = await this.baseRouter.route(request, adjustedProviders);

    // Add RSI metadata to decision
    const providerRSIData = providerRSI.get(decision.provider);
    
    return {
      ...decision,
      routingFactors: {
        ...decision.routingFactors,
        selectedReason: `${decision.routingFactors.selectedReason} (RSI: ${providerRSIData?.combinedRSI.toFixed(0)}, ${providerRSIData?.momentum})`,
      },
    };
  }

  /**
   * Calculate adaptive RSI for a provider
   */
  private calculateAdaptiveRSI(provider: string): RSIMetrics {
    const history = this.getProviderHistory(provider);
    
    if (history.length < 5) {
      // Insufficient data, return neutral
      return {
        rsiShort: 50,
        rsiMedium: 50,
        rsiLong: 50,
        combinedRSI: 50,
        momentum: 'neutral',
        divergence: null,
      };
    }

    const optimalWindow = this.getOptimalWindow(provider);
    const recentPerformance = history.slice(-Math.max(20, optimalWindow));
    const baselinePerformance = this.calculateBaseline(provider);

    // Calculate multi-timeframe RSI
    const rsiShort = this.calculateRSI(recentPerformance.slice(-5), baselinePerformance);
    const rsiMedium = this.calculateRSI(recentPerformance.slice(-10), baselinePerformance);
    const rsiLong = this.calculateRSI(recentPerformance.slice(-20), baselinePerformance);

    // Detect divergence
    const divergence = this.detectDivergence(rsiShort, rsiMedium, rsiLong);

    // Calculate volatility-aware weighted RSI
    const volatility = this.calculateVolatility(recentPerformance);
    const combinedRSI = this.combineRSI(rsiShort, rsiMedium, rsiLong, volatility);

    // Determine momentum
    let momentum: 'oversold' | 'neutral' | 'overbought';
    if (combinedRSI < this.RSI_OVERSOLD) {
      momentum = 'oversold';
    } else if (combinedRSI > this.RSI_OVERBOUGHT) {
      momentum = 'overbought';
    } else {
      momentum = 'neutral';
    }

    return {
      rsiShort,
      rsiMedium,
      rsiLong,
      combinedRSI,
      momentum,
      divergence,
    };
  }

  /**
   * Calculate RSI using performance data
   */
  private calculateRSI(
    recentPerformance: ProviderPerformance[],
    baseline: number
  ): number {
    if (recentPerformance.length === 0) return 50;

    // Calculate gains and losses relative to baseline
    let gains = 0;
    let losses = 0;
    let count = 0;

    for (const perf of recentPerformance) {
      const score = this.calculatePerformanceScore(perf);
      const change = score - baseline;
      
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
      count++;
    }

    if (count === 0) return 50;

    const avgGain = gains / count;
    const avgLoss = losses / count;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.max(0, Math.min(100, rsi));
  }

  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(perf: ProviderPerformance): number {
    // Higher is better: success rate, speed (inverse latency), cost efficiency
    const successScore = perf.success ? 100 : 0;
    const speedScore = Math.max(0, 100 - (perf.latency / 50)); // Normalize latency
    const costScore = Math.max(0, 100 - (perf.cost * 10000)); // Normalize cost
    const qualityScore = (perf.quality || 80);

    return (
      successScore * 0.4 +
      speedScore * 0.2 +
      costScore * 0.2 +
      qualityScore * 0.2
    );
  }

  /**
   * Calculate baseline performance for a provider
   */
  private calculateBaseline(provider: string): number {
    const history = this.getProviderHistory(provider);
    if (history.length === 0) return 70; // Default baseline

    const scores = history.map(h => this.calculatePerformanceScore(h));
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  /**
   * Calculate volatility of provider performance
   */
  private calculateVolatility(performance: ProviderPerformance[]): number {
    if (performance.length < 2) return 0;

    const scores = performance.map(p => this.calculatePerformanceScore(p));
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance) / 100; // Normalize to 0-1 range
  }

  /**
   * Combine multi-timeframe RSI with volatility weighting
   */
  private combineRSI(
    rsiShort: number,
    rsiMedium: number,
    rsiLong: number,
    volatility: number
  ): number {
    if (volatility > this.HIGH_VOLATILITY_THRESHOLD) {
      // High volatility: favor recent data
      return rsiShort * 0.5 + rsiMedium * 0.5;
    } else {
      // Low volatility: trust long-term trends
      return rsiShort * 0.2 + rsiMedium * 0.3 + rsiLong * 0.5;
    }
  }

  /**
   * Detect RSI divergence (contrarian signal)
   */
  private detectDivergence(
    rsiShort: number,
    rsiMedium: number,
    rsiLong: number
  ): 'bullish' | 'bearish' | null {
    // Bullish divergence: short-term oversold but long-term healthy
    if (rsiShort < this.RSI_OVERSOLD && rsiLong > 50) {
      return 'bullish';
    }

    // Bearish divergence: short-term overbought but long-term weak
    if (rsiShort > this.RSI_OVERBOUGHT && rsiLong < 50) {
      return 'bearish';
    }

    return null;
  }

  /**
   * Adjust provider scores based on RSI momentum
   */
  private adjustProviderScores(
    providers: AiProvider[],
    providerRSI: Map<string, RSIMetrics>
  ): AiProvider[] {
    return providers.map(provider => {
      const rsi = providerRSI.get(provider.providerName);
      if (!rsi) return provider;

      let scoreMultiplier = 1.0;

      // Boost oversold providers (underutilized, opportunity)
      if (rsi.momentum === 'oversold') {
        scoreMultiplier = 1.2;
        
        // Extra boost for bullish divergence
        if (rsi.divergence === 'bullish') {
          scoreMultiplier = 1.3;
        }
      }

      // Penalize overbought providers (saturated, avoid)
      if (rsi.momentum === 'overbought') {
        scoreMultiplier = 0.8;
        
        // Extra penalty for bearish divergence
        if (rsi.divergence === 'bearish') {
          scoreMultiplier = 0.7;
        }
      }

      // Apply multiplier to all quality metrics
      return {
        ...provider,
        costEfficiency: String(Number(provider.costEfficiency) * scoreMultiplier),
        qualityScore: String(Number(provider.qualityScore) * scoreMultiplier),
        speedScore: String(Number(provider.speedScore) * scoreMultiplier),
        reliabilityScore: String(Number(provider.reliabilityScore) * scoreMultiplier),
      };
    });
  }

  /**
   * Get optimal lookback window for a provider
   */
  private getOptimalWindow(provider: string): number {
    const cached = this.windowOptimizer.get(provider);
    
    // Return cached if recent
    if (cached && (Date.now() - cached.lastOptimized) < this.WINDOW_REOPTIMIZE_INTERVAL) {
      return cached.optimalWindow;
    }

    // Optimize window
    const optimal = this.findOptimalWindow(provider);
    this.windowOptimizer.set(provider, optimal);
    
    return optimal.optimalWindow;
  }

  /**
   * Find optimal RSI window for a provider
   */
  private findOptimalWindow(provider: string): AdaptiveWindow {
    const history = this.getProviderHistory(provider);
    const windows = [5, 10, 15, 20, 30];
    
    if (history.length < 30) {
      return {
        providerId: provider,
        optimalWindow: 10,
        accuracy: 0,
        lastOptimized: Date.now(),
      };
    }

    let bestWindow = 10;
    let bestAccuracy = 0;

    for (const window of windows) {
      let correct = 0;
      let total = 0;

      for (let i = window; i < history.length - 1; i++) {
        const lookback = history.slice(i - window, i);
        const baseline = this.calculateBaseline(provider);
        const rsi = this.calculateRSI(lookback, baseline);

        // Predict next performance direction
        const predicted = rsi < this.RSI_OVERSOLD ? 'up' : rsi > this.RSI_OVERBOUGHT ? 'down' : 'neutral';
        
        const currentScore = this.calculatePerformanceScore(history[i]);
        const nextScore = this.calculatePerformanceScore(history[i + 1]);
        const actual = nextScore > currentScore ? 'up' : nextScore < currentScore ? 'down' : 'neutral';

        if (predicted === actual) correct++;
        total++;
      }

      const accuracy = total > 0 ? correct / total : 0;
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestWindow = window;
      }
    }

    return {
      providerId: provider,
      optimalWindow: bestWindow,
      accuracy: bestAccuracy,
      lastOptimized: Date.now(),
    };
  }

  /**
   * Record provider performance for RSI calculation
   */
  recordPerformance(performance: ProviderPerformance): void {
    const history = this.getProviderHistory(performance.provider);
    history.push(performance);

    // Maintain rolling window
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }

    this.performanceHistory.set(performance.provider, history);
  }

  /**
   * Get provider performance history
   */
  private getProviderHistory(provider: string): ProviderPerformance[] {
    if (!this.performanceHistory.has(provider)) {
      this.performanceHistory.set(provider, []);
    }
    return this.performanceHistory.get(provider)!;
  }

  /**
   * Get RSI metrics for all providers
   */
  getAllRSIMetrics(): Map<string, RSIMetrics> {
    const metrics = new Map<string, RSIMetrics>();
    
    for (const provider of Array.from(this.performanceHistory.keys())) {
      metrics.set(provider, this.calculateAdaptiveRSI(provider));
    }
    
    return metrics;
  }

  /**
   * Get window optimization stats
   */
  getWindowOptimizationStats(): Map<string, AdaptiveWindow> {
    return new Map(this.windowOptimizer);
  }
}
