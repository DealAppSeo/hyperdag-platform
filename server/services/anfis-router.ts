import type { AiProvider } from '@shared/schema';
import type { IRouter } from './router-interface';

/**
 * ANFIS (Adaptive Neuro-Fuzzy Inference System) Router
 * Intelligently routes AI requests to optimal providers based on:
 * - Cost efficiency (weight: 0.4)
 * - Quality (weight: 0.3)
 * - Speed (weight: 0.2)
 * - Reliability (weight: 0.1)
 */

export interface RoutingRequest {
  model?: string;
  messages?: { role: string; content: string }[];
  prompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  userPreferences?: {
    costWeight?: number;
    qualityWeight?: number;
    speedWeight?: number;
    reliabilityWeight?: number;
  };
}

export interface RoutingDecision {
  provider: string;
  actualModel: string;
  anfisScore: number;
  routingFactors: {
    costWeight: number;
    qualityWeight: number;
    speedWeight: number;
    reliabilityWeight: number;
    selectedReason: string;
  };
  estimatedCost: number;
  estimatedLatency: number;
}

export class ANFISRouter implements IRouter {
  // Default weights for routing factors
  private defaultWeights = {
    cost: 0.4,
    quality: 0.3,
    speed: 0.2,
    reliability: 0.1,
  };

  // Fuzzy membership functions
  private membershipFunctions = {
    cost: {
      low: (x: number) => Math.max(0, Math.min(1, (3 - x) / 3)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 5 ? (x - 2) / 3 : (8 - x) / 3)),
      high: (x: number) => Math.max(0, Math.min(1, (x - 5) / 5)),
    },
    quality: {
      low: (x: number) => Math.max(0, Math.min(1, (4 - x) / 4)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 6 ? (x - 3) / 3 : (9 - x) / 3)),
      high: (x: number) => Math.max(0, Math.min(1, (x - 6) / 4)),
    },
    speed: {
      slow: (x: number) => Math.max(0, Math.min(1, (4 - x) / 4)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 6 ? (x - 3) / 3 : (9 - x) / 3)),
      fast: (x: number) => Math.max(0, Math.min(1, (x - 6) / 4)),
    },
    reliability: {
      low: (x: number) => Math.max(0, Math.min(1, (7 - x) / 7)),
      medium: (x: number) => Math.max(0, Math.min(1, x < 8.5 ? (x - 6) / 2.5 : (10 - x) / 1.5)),
      high: (x: number) => Math.max(0, Math.min(1, (x - 8) / 2)),
    },
  };

  /**
   * Calculate ANFIS score for a provider based on routing factors
   */
  private calculateANFISScore(
    provider: AiProvider,
    weights: { cost: number; quality: number; speed: number; reliability: number }
  ): number {
    const costScore = this.normalizeCostEfficiency(Number(provider.costEfficiency));
    const qualityScore = this.normalizeQuality(Number(provider.qualityScore));
    const speedScore = this.normalizeSpeed(Number(provider.speedScore));
    const reliabilityScore = this.normalizeReliability(Number(provider.reliabilityScore));

    const fuzzyScore =
      this.fuzzifyAndAggregate('cost', costScore) * weights.cost +
      this.fuzzifyAndAggregate('quality', qualityScore) * weights.quality +
      this.fuzzifyAndAggregate('speed', speedScore) * weights.speed +
      this.fuzzifyAndAggregate('reliability', reliabilityScore) * weights.reliability;

    return Math.round(fuzzyScore * 1000) / 1000;
  }

  /**
   * Apply fuzzy logic aggregation
   */
  private fuzzifyAndAggregate(factor: string, value: number): number {
    const funcs = this.membershipFunctions[factor as keyof typeof this.membershipFunctions];
    if (!funcs) return value;

    let low: number, medium: number, high: number;

    if (factor === 'speed') {
      const speedFuncs = funcs as { slow: (x: number) => number; medium: (x: number) => number; fast: (x: number) => number };
      low = speedFuncs.slow(value);
      medium = speedFuncs.medium(value);
      high = speedFuncs.fast(value);
    } else {
      const regularFuncs = funcs as { low: (x: number) => number; medium: (x: number) => number; high: (x: number) => number };
      low = regularFuncs.low(value);
      medium = regularFuncs.medium(value);
      high = regularFuncs.high(value);
    }

    const lowContribution = low * 3;
    const mediumContribution = medium * 6;
    const highContribution = high * 9;

    const totalMembership = low + medium + high;
    if (totalMembership === 0) return value;

    return (lowContribution + mediumContribution + highContribution) / totalMembership;
  }

  /**
   * Normalize scores to 0-10 range
   */
  private normalizeCostEfficiency(score: number): number {
    return Math.max(0, Math.min(10, score));
  }

  private normalizeQuality(score: number): number {
    return Math.max(0, Math.min(10, score));
  }

  private normalizeSpeed(score: number): number {
    return Math.max(0, Math.min(10, score));
  }

  private normalizeReliability(score: number): number {
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Estimate cost for a request based on token count
   */
  private estimateCost(
    provider: AiProvider,
    model: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number
  ): number {
    const modelPricing = provider.pricing.find((p) => p.modelId === model);
    if (!modelPricing) return 0;

    const inputCost = (estimatedPromptTokens / 1_000_000) * modelPricing.inputPricePerMillion;
    const outputCost = (estimatedCompletionTokens / 1_000_000) * modelPricing.outputPricePerMillion;

    return inputCost + outputCost;
  }

  /**
   * Estimate token count from text (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get default model for a provider
   */
  private getDefaultModel(provider: AiProvider): string {
    if (provider.models.length === 0) return '';
    
    const preferredModels = ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-1.5-flash', 'llama-3.1-sonar-small-128k-online'];
    
    for (const preferred of preferredModels) {
      const model = provider.models.find((m) => m.modelId === preferred);
      if (model) return model.modelId;
    }

    return provider.models[0].modelId;
  }

  /**
   * Main routing decision function
   */
  async route(
    request: RoutingRequest,
    availableProviders: AiProvider[]
  ): Promise<RoutingDecision> {
    const activeProviders = availableProviders.filter(
      (p) => p.isActive && p.apiKeyConfigured
    );

    if (activeProviders.length === 0) {
      throw new Error('No active AI providers available');
    }

    const weights = {
      cost: request.userPreferences?.costWeight ?? this.defaultWeights.cost,
      quality: request.userPreferences?.qualityWeight ?? this.defaultWeights.quality,
      speed: request.userPreferences?.speedWeight ?? this.defaultWeights.speed,
      reliability: request.userPreferences?.reliabilityWeight ?? this.defaultWeights.reliability,
    };

    let bestProvider: AiProvider | null = null;
    let bestScore = -1;
    let bestModel = '';
    let bestCost = 0;

    const inputText = request.messages
      ? request.messages.map((m) => m.content).join(' ')
      : request.prompt || '';
    const estimatedPromptTokens = this.estimateTokens(inputText);
    const estimatedCompletionTokens = request.maxTokens || 500;

    for (const provider of activeProviders) {
      const model = request.model || this.getDefaultModel(provider);
      
      if (!provider.models.some((m) => m.modelId === model)) {
        continue;
      }

      const score = this.calculateANFISScore(provider, weights);
      const cost = this.estimateCost(provider, model, estimatedPromptTokens, estimatedCompletionTokens);

      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
        bestModel = model;
        bestCost = cost;
      }
    }

    if (!bestProvider) {
      throw new Error('No suitable provider found for request');
    }

    const reason = this.generateSelectionReason(bestProvider, weights);

    return {
      provider: bestProvider.providerName,
      actualModel: bestModel,
      anfisScore: bestScore,
      routingFactors: {
        costWeight: weights.cost,
        qualityWeight: weights.quality,
        speedWeight: weights.speed,
        reliabilityWeight: weights.reliability,
        selectedReason: reason,
      },
      estimatedCost: bestCost,
      estimatedLatency: bestProvider.averageLatency,
    };
  }

  /**
   * Generate human-readable selection reason
   */
  private generateSelectionReason(
    provider: AiProvider,
    weights: { cost: number; quality: number; speed: number; reliability: number }
  ): string {
    const dominantFactor = Object.entries(weights).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    
    const reasons: Record<string, string> = {
      cost: `Best cost efficiency (${Number(provider.costEfficiency).toFixed(1)}/10)`,
      quality: `Highest quality score (${Number(provider.qualityScore).toFixed(1)}/10)`,
      speed: `Fastest response time (${Number(provider.speedScore).toFixed(1)}/10)`,
      reliability: `Most reliable uptime (${Number(provider.reliabilityScore).toFixed(1)}/10)`,
    };

    return reasons[dominantFactor] || 'Balanced performance across all factors';
  }
}

export const anfisRouter = new ANFISRouter();
