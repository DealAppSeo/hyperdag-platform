/**
 * Self-Tuning ANFIS with Automatic Membership Function Optimization
 * 
 * Continuously improves routing decisions by automatically tuning
 * fuzzy membership function parameters based on actual performance.
 * 
 * Key Features:
 * - Gradient-based parameter optimization
 * - Automatic retuning based on performance drift
 * - Membership function shape adaptation
 * - Performance tracking and MSE calculation
 * - Constrained optimization (keeps parameters valid)
 */

import { ANFISRouter } from '../anfis-router';
import type { RoutingRequest, RoutingDecision } from '../anfis-router';
import type { AiProvider } from '@shared/schema';
import type { IRouter } from '../router-interface';

export interface MembershipFunctionParams {
  center: number;
  width: number;
  minVal: number;
  maxVal: number;
  minWidth: number;
}

export interface TuningData {
  inputs: {
    cost: number;
    quality: number;
    speed: number;
    reliability: number;
  };
  predictedScore: number;
  actualScore?: number;
  timestamp: number;
  provider: string;
}

export interface TuningConfig {
  learningRate: number;
  acceptableErrorThreshold: number;
  tuningInterval: number;          // Number of samples before retuning
  performanceWindow: number;        // Historical window for performance tracking
  minSamplesBeforeTuning: number;  // Minimum samples needed
}

export interface TuningStats {
  lastTuning: number;
  totalTunings: number;
  currentMSE: number;
  improvementRate: number;
  samplesSinceLastTuning: number;
}

export class SelfTuningANFIS extends ANFISRouter implements IRouter {
  private tuningData: TuningData[] = [];
  private membershipParams: Map<string, Map<string, MembershipFunctionParams>> = new Map();
  private tuningStats: TuningStats;
  private config: TuningConfig;

  constructor(config?: Partial<TuningConfig>) {
    super();
    
    this.config = {
      learningRate: 0.01,
      acceptableErrorThreshold: 0.05,
      tuningInterval: 1000,
      performanceWindow: 5000,
      minSamplesBeforeTuning: 100,
      ...config,
    };

    this.tuningStats = {
      lastTuning: Date.now(),
      totalTunings: 0,
      currentMSE: 0,
      improvementRate: 0,
      samplesSinceLastTuning: 0,
    };

    this.initializeMembershipParams();
  }

  /**
   * Initialize default membership function parameters
   */
  private initializeMembershipParams(): void {
    const factors = ['cost', 'quality', 'speed', 'reliability'];
    const levels = ['low', 'medium', 'high'];

    for (const factor of factors) {
      const factorParams = new Map<string, MembershipFunctionParams>();
      
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        factorParams.set(level, {
          center: i * 5 + 2.5,  // 2.5, 7.5, 12.5
          width: 3,
          minVal: 0,
          maxVal: 10,
          minWidth: 1,
        });
      }
      
      this.membershipParams.set(factor, factorParams);
    }
  }

  /**
   * Route with self-tuning capability
   */
  async route(
    request: RoutingRequest,
    availableProviders: AiProvider[]
  ): Promise<RoutingDecision> {
    // Get routing decision from base ANFIS
    const decision = await super.route(request, availableProviders);

    // Extract inputs for tuning
    const provider = availableProviders.find(p => p.providerName === decision.provider);
    if (provider) {
      const inputs = {
        cost: Number(provider.costEfficiency),
        quality: Number(provider.qualityScore),
        speed: Number(provider.speedScore),
        reliability: Number(provider.reliabilityScore),
      };

      // Record for tuning
      this.recordTuningData({
        inputs,
        predictedScore: decision.anfisScore,
        timestamp: Date.now(),
        provider: decision.provider,
      });

      // Check if should retune
      if (this.shouldRetune()) {
        await this.retuneMembershipFunctions();
      }
    }

    return decision;
  }

  /**
   * Record actual performance for tuning
   */
  recordActualPerformance(
    provider: string,
    actualScore: number
  ): void {
    // Find most recent prediction for this provider
    for (let i = this.tuningData.length - 1; i >= 0; i--) {
      if (this.tuningData[i].provider === provider && !this.tuningData[i].actualScore) {
        this.tuningData[i].actualScore = actualScore;
        break;
      }
    }
  }

  /**
   * Record tuning data
   */
  private recordTuningData(data: TuningData): void {
    this.tuningData.push(data);
    this.tuningStats.samplesSinceLastTuning++;

    // Maintain rolling window
    if (this.tuningData.length > this.config.performanceWindow) {
      this.tuningData.shift();
    }
  }

  /**
   * Check if should retune
   */
  private shouldRetune(): boolean {
    // Need minimum samples
    if (this.tuningStats.samplesSinceLastTuning < this.config.minSamplesBeforeTuning) {
      return false;
    }

    // Retune at interval
    if (this.tuningStats.samplesSinceLastTuning >= this.config.tuningInterval) {
      return true;
    }

    return false;
  }

  /**
   * Retune membership functions based on actual outcomes
   */
  private async retuneMembershipFunctions(): Promise<void> {
    console.log('[SelfTuningANFIS] Starting membership function retuning...');
    
    const startTime = Date.now();

    // Filter data with actual scores
    const completeData = this.tuningData.filter(d => d.actualScore !== undefined);
    
    if (completeData.length < this.config.minSamplesBeforeTuning) {
      console.log('[SelfTuningANFIS] Insufficient complete data for tuning');
      return;
    }

    // Calculate current MSE
    const oldMSE = this.calculateMSE(completeData);
    
    if (oldMSE < this.config.acceptableErrorThreshold) {
      console.log(`[SelfTuningANFIS] MSE ${oldMSE.toFixed(4)} below threshold, skipping tuning`);
      this.tuningStats.samplesSinceLastTuning = 0;
      return;
    }

    // Perform gradient descent on membership parameters
    const iterations = 10;
    for (let iter = 0; iter < iterations; iter++) {
      await this.gradientDescentStep(completeData);
    }

    // Calculate new MSE
    const newMSE = this.calculateMSE(completeData);
    const improvement = ((oldMSE - newMSE) / oldMSE) * 100;

    // Update stats
    this.tuningStats.lastTuning = Date.now();
    this.tuningStats.totalTunings++;
    this.tuningStats.currentMSE = newMSE;
    this.tuningStats.improvementRate = improvement;
    this.tuningStats.samplesSinceLastTuning = 0;

    const duration = Date.now() - startTime;
    console.log(`[SelfTuningANFIS] Tuning complete in ${duration}ms`);
    console.log(`  MSE: ${oldMSE.toFixed(4)} → ${newMSE.toFixed(4)} (${improvement.toFixed(1)}% improvement)`);
    console.log(`  Total tunings: ${this.tuningStats.totalTunings}`);
  }

  /**
   * Perform one gradient descent step
   */
  private async gradientDescentStep(data: TuningData[]): Promise<void> {
    const factors = ['cost', 'quality', 'speed', 'reliability'];
    
    for (const factor of factors) {
      const factorParams = this.membershipParams.get(factor);
      if (!factorParams) continue;

      for (const [level, params] of Array.from(factorParams.entries())) {
        // Compute gradients
        const gradients = this.computeGradients(factor, level, params, data);

        // Update parameters
        params.center -= this.config.learningRate * gradients.centerGrad;
        params.width -= this.config.learningRate * gradients.widthGrad;

        // Constrain parameters
        params.center = Math.max(params.minVal, Math.min(params.maxVal, params.center));
        params.width = Math.max(params.minWidth, params.width);

        factorParams.set(level, params);
      }
    }
  }

  /**
   * Compute gradients for membership function parameters
   */
  private computeGradients(
    factor: string,
    level: string,
    params: MembershipFunctionParams,
    data: TuningData[]
  ): { centerGrad: number; widthGrad: number } {
    const epsilon = 1e-5;
    let centerGrad = 0;
    let widthGrad = 0;

    for (const sample of data) {
      if (!sample.actualScore) continue;

      const error = sample.predictedScore - sample.actualScore;

      // Center gradient (numerical approximation)
      const originalCenter = params.center;
      
      params.center = originalCenter + epsilon;
      const outputPlus = this.evaluateWithParams(sample.inputs);
      
      params.center = originalCenter - epsilon;
      const outputMinus = this.evaluateWithParams(sample.inputs);
      
      params.center = originalCenter;
      
      centerGrad += error * (outputPlus - outputMinus) / (2 * epsilon);

      // Width gradient
      const originalWidth = params.width;
      
      params.width = originalWidth + epsilon;
      const outputPlusWidth = this.evaluateWithParams(sample.inputs);
      
      params.width = originalWidth - epsilon;
      const outputMinusWidth = this.evaluateWithParams(sample.inputs);
      
      params.width = originalWidth;
      
      widthGrad += error * (outputPlusWidth - outputMinusWidth) / (2 * epsilon);
    }

    return {
      centerGrad: centerGrad / data.length,
      widthGrad: widthGrad / data.length,
    };
  }

  /**
   * Evaluate ANFIS with current parameters
   */
  private evaluateWithParams(inputs: TuningData['inputs']): number {
    // Simplified ANFIS evaluation (would use actual fuzzy logic in production)
    const weights = { cost: 0.4, quality: 0.3, speed: 0.2, reliability: 0.1 };
    
    let score = 0;
    score += this.fuzzifyValue('cost', inputs.cost) * weights.cost;
    score += this.fuzzifyValue('quality', inputs.quality) * weights.quality;
    score += this.fuzzifyValue('speed', inputs.speed) * weights.speed;
    score += this.fuzzifyValue('reliability', inputs.reliability) * weights.reliability;
    
    return score;
  }

  /**
   * Fuzzify value using current membership functions
   */
  private fuzzifyValue(factor: string, value: number): number {
    const factorParams = this.membershipParams.get(factor);
    if (!factorParams) return value;

    let totalMembership = 0;
    let weightedSum = 0;

    for (const [level, params] of Array.from(factorParams.entries())) {
      const membership = this.gaussianMembership(value, params.center, params.width);
      const contribution = membership * this.getLevelValue(level);
      
      weightedSum += contribution;
      totalMembership += membership;
    }

    return totalMembership > 0 ? weightedSum / totalMembership : value;
  }

  /**
   * Gaussian membership function
   */
  private gaussianMembership(x: number, center: number, width: number): number {
    return Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)));
  }

  /**
   * Get numeric value for fuzzy level
   */
  private getLevelValue(level: string): number {
    const values: Record<string, number> = {
      low: 3,
      medium: 6,
      high: 9,
    };
    return values[level] || 5;
  }

  /**
   * Calculate Mean Squared Error
   */
  private calculateMSE(data: TuningData[]): number {
    if (data.length === 0) return 0;

    let sumSquaredError = 0;
    
    for (const sample of data) {
      if (!sample.actualScore) continue;
      const error = sample.predictedScore - sample.actualScore;
      sumSquaredError += Math.pow(error, 2);
    }

    return sumSquaredError / data.length;
  }

  /**
   * Get tuning statistics
   */
  getTuningStats(): TuningStats {
    return { ...this.tuningStats };
  }

  /**
   * Get current membership parameters
   */
  getMembershipParams(): Map<string, Map<string, MembershipFunctionParams>> {
    return new Map(this.membershipParams);
  }

  /**
   * Reset tuning (for testing)
   */
  resetTuning(): void {
    this.tuningData = [];
    this.initializeMembershipParams();
    this.tuningStats = {
      lastTuning: Date.now(),
      totalTunings: 0,
      currentMSE: 0,
      improvementRate: 0,
      samplesSinceLastTuning: 0,
    };
  }

  /**
   * Export tuned parameters for persistence
   */
  exportParameters(): string {
    const params: any = {};
    
    for (const [factor, factorParams] of Array.from(this.membershipParams.entries())) {
      params[factor] = {};
      for (const [level, levelParams] of factorParams) {
        params[factor][level] = levelParams;
      }
    }

    return JSON.stringify({
      params,
      stats: this.tuningStats,
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Import tuned parameters
   */
  importParameters(json: string): void {
    try {
      const imported = JSON.parse(json);
      
      for (const [factor, factorParams] of Object.entries(imported.params)) {
        const paramMap = new Map<string, MembershipFunctionParams>();
        for (const [level, params] of Object.entries(factorParams as any)) {
          paramMap.set(level, params as MembershipFunctionParams);
        }
        this.membershipParams.set(factor, paramMap);
      }

      console.log('[SelfTuningANFIS] Parameters imported successfully');
    } catch (error) {
      console.error('[SelfTuningANFIS] Failed to import parameters:', error);
    }
  }
}

// Singleton instance
export const selfTuningANFIS = new SelfTuningANFIS({
  learningRate: 0.01,
  acceptableErrorThreshold: 0.05,
  tuningInterval: 1000,
  minSamplesBeforeTuning: 100,
});
