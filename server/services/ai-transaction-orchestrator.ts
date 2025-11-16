/**
 * AI Transaction Orchestrator with HDAG Token Fee Optimization
 * 
 * This service uses AI to optimize transaction routing across chains while
 * implementing dynamic fee discounts based on HDAG token usage and reputation.
 * 
 * Fee Structure:
 * - Base: Full gas fees
 * - HDAG Payment: 50% discount
 * - Complete Profile + HDAG: 75% discount (50% + 50% of remaining)
 * - Rep Score 80+ + Complete Profile + HDAG: 87.5% discount
 */

import { crossChainReputationService, type ReputationMetrics } from './cross-chain-reputation-service';
import { storage } from '../storage';
import { logger } from '../utils/logger';

export interface TransactionRequest {
  userId: string;
  operation: 'grant_application' | 'reputation_update' | 'collaboration_invite' | 'nft_mint';
  targetChain?: number;
  paymentMethod: 'HDAG' | 'ETH' | 'MATIC' | 'AUTO';
  urgency: 'low' | 'medium' | 'high';
}

export interface ChainMetrics {
  chainId: number;
  name: string;
  currentGasPrice: bigint;
  congestionLevel: number; // 0-100
  avgConfirmationTime: number; // seconds
  totalCost: bigint;
  discountedCost: bigint;
}

export interface OptimizedRoute {
  recommendedChain: number;
  estimatedCost: bigint;
  discountedCost: bigint;
  feeDiscount: {
    baseDiscount: number;
    profileBonus: number;
    reputationBonus: number;
    totalDiscount: number;
  };
  estimatedTime: number;
  reasoning: string;
}

export class AITransactionOrchestrator {
  private chainProviders: Map<number, any> = new Map();
  private gasOracleCache: Map<number, { price: bigint; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.initializeChainProviders();
  }

  private initializeChainProviders() {
    // Initialize providers for supported chains
    const chains = [
      { id: 1, name: 'Ethereum', rpc: process.env.ETHEREUM_RPC_URL },
      { id: 137, name: 'Polygon', rpc: process.env.POLYGON_RPC_URL },
      { id: 8453, name: 'Base', rpc: process.env.BASE_RPC_URL }
    ];

    chains.forEach(chain => {
      if (chain.rpc) {
        // Would initialize ethers providers here
        logger.info(`[ai-orchestrator] Initialized provider for ${chain.name}`);
      }
    });
  }

  /**
   * Main orchestration method - finds optimal transaction route
   */
  async optimizeTransaction(request: TransactionRequest): Promise<OptimizedRoute> {
    try {
      // Get user reputation metrics
      const user = await storage.getUser(parseInt(request.userId));
      if (!user) {
        throw new Error('User not found');
      }

      const reputationMetrics = await this.calculateUserMetrics(user);
      
      // Get current gas prices and chain conditions
      const chainMetrics = await this.getChainMetrics();
      
      // Apply HDAG token discounts
      const discountedMetrics = this.applyHDAGDiscounts(chainMetrics, reputationMetrics, request.paymentMethod);
      
      // AI-powered chain selection
      const optimalRoute = this.selectOptimalChain(discountedMetrics, request);
      
      return optimalRoute;

    } catch (error) {
      logger.error('[ai-orchestrator] Failed to optimize transaction:', error);
      throw error;
    }
  }

  /**
   * Calculate user reputation metrics for fee discounts
   */
  private async calculateUserMetrics(user: any): Promise<ReputationMetrics> {
    // Calculate profile completion
    const requiredFields = ['email', 'bio', 'skills', 'interests'];
    const completedFields = requiredFields.filter(field => 
      user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : user[field].trim().length > 0)
    );
    const profileCompletion = (completedFields.length / requiredFields.length) * 100;

    return {
      profileCompletion,
      reputationScore: user.reputationScore || 0,
      crossChainActivity: await this.getCrossChainActivityScore(user.id),
      aiContributions: await this.getAIContributionScore(user.id),
      communityEngagement: await this.getCommunityEngagementScore(user.id),
      grantSuccessRate: await this.getGrantSuccessRate(user.id)
    };
  }

  /**
   * Apply HDAG token fee discounts to chain metrics
   */
  private applyHDAGDiscounts(
    chainMetrics: ChainMetrics[], 
    reputation: ReputationMetrics, 
    paymentMethod: string
  ): ChainMetrics[] {
    return chainMetrics.map(chain => {
      const discount = crossChainReputationService.calculateFeeDiscount(
        reputation, 
        paymentMethod as 'HDAG' | 'ETH'
      );

      const discountedCost = chain.totalCost - (chain.totalCost * BigInt(Math.floor(discount.totalDiscount * 100)) / 100n);

      return {
        ...chain,
        discountedCost
      };
    });
  }

  /**
   * AI-powered optimal chain selection
   */
  private selectOptimalChain(chainMetrics: ChainMetrics[], request: TransactionRequest): OptimizedRoute {
    // Score each chain based on multiple factors
    const scoredChains = chainMetrics.map(chain => {
      let score = 0;
      
      // Cost efficiency (40% weight)
      const costScore = this.calculateCostScore(chain.discountedCost, chainMetrics);
      score += costScore * 0.4;
      
      // Speed (30% weight)
      const speedScore = this.calculateSpeedScore(chain.avgConfirmationTime, chain.congestionLevel);
      score += speedScore * 0.3;
      
      // Reliability (20% weight)
      const reliabilityScore = this.calculateReliabilityScore(chain.chainId);
      score += reliabilityScore * 0.2;
      
      // Urgency adjustment (10% weight)
      const urgencyScore = this.calculateUrgencyScore(request.urgency, chain);
      score += urgencyScore * 0.1;

      return { chain, score };
    });

    // Select highest scoring chain
    const optimal = scoredChains.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const selectedChain = optimal.chain;
    const feeDiscount = crossChainReputationService.calculateFeeDiscount(
      await this.calculateUserMetrics(await storage.getUser(parseInt(request.userId))),
      request.paymentMethod as 'HDAG' | 'ETH'
    );

    return {
      recommendedChain: selectedChain.chainId,
      estimatedCost: selectedChain.totalCost,
      discountedCost: selectedChain.discountedCost,
      feeDiscount,
      estimatedTime: selectedChain.avgConfirmationTime,
      reasoning: this.generateReasoning(selectedChain, feeDiscount, optimal.score)
    };
  }

  /**
   * Generate human-readable reasoning for chain selection
   */
  private generateReasoning(chain: ChainMetrics, discount: any, score: number): string {
    let reasoning = `Selected ${chain.name} (score: ${score.toFixed(2)}) - `;
    
    if (discount.totalDiscount > 0) {
      reasoning += `${(discount.totalDiscount * 100).toFixed(1)}% HDAG discount applied. `;
    }
    
    reasoning += `Estimated cost: ${chain.discountedCost} (${chain.avgConfirmationTime}s confirmation)`;
    
    return reasoning;
  }

  /**
   * Helper scoring methods
   */
  private calculateCostScore(cost: bigint, allChains: ChainMetrics[]): number {
    const costs = allChains.map(c => Number(c.discountedCost));
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    
    if (maxCost === minCost) return 100;
    
    // Invert score so lower cost = higher score
    return 100 - ((Number(cost) - minCost) / (maxCost - minCost)) * 100;
  }

  private calculateSpeedScore(confirmationTime: number, congestion: number): number {
    // Lower confirmation time and congestion = higher score
    const timeScore = Math.max(0, 100 - confirmationTime);
    const congestionScore = Math.max(0, 100 - congestion);
    return (timeScore + congestionScore) / 2;
  }

  private calculateReliabilityScore(chainId: number): number {
    // Reliability scores based on chain maturity and stability
    const reliabilityMap: { [key: number]: number } = {
      1: 95,    // Ethereum
      137: 90,  // Polygon
      8453: 85, // Base
    };
    return reliabilityMap[chainId] || 70;
  }

  private calculateUrgencyScore(urgency: string, chain: ChainMetrics): number {
    if (urgency === 'high') {
      return Math.max(0, 100 - chain.avgConfirmationTime);
    }
    return 50; // Neutral for medium/low urgency
  }

  /**
   * Get current gas prices and chain metrics
   */
  private async getChainMetrics(): Promise<ChainMetrics[]> {
    // This would integrate with real gas price oracles
    // For now, return representative data
    return [
      {
        chainId: 1,
        name: 'Ethereum',
        currentGasPrice: 20000000000n, // 20 gwei
        congestionLevel: 70,
        avgConfirmationTime: 60,
        totalCost: 100000000000000000n, // 0.1 ETH
        discountedCost: 100000000000000000n
      },
      {
        chainId: 137,
        name: 'Polygon',
        currentGasPrice: 30000000000n, // 30 gwei
        congestionLevel: 30,
        avgConfirmationTime: 3,
        totalCost: 1000000000000000n, // 0.001 MATIC
        discountedCost: 1000000000000000n
      }
    ];
  }

  /**
   * Reputation scoring helper methods
   */
  private async getCrossChainActivityScore(userId: number): Promise<number> {
    // Would analyze user's transaction history across chains
    return 0;
  }

  private async getAIContributionScore(userId: number): Promise<number> {
    // Would analyze AI model contributions, data labeling, etc.
    return 0;
  }

  private async getCommunityEngagementScore(userId: number): Promise<number> {
    // Would analyze forum participation, project collaborations
    return 0;
  }

  private async getGrantSuccessRate(userId: number): Promise<number> {
    // Would analyze grant application history
    return 0;
  }
}

export const aiTransactionOrchestrator = new AITransactionOrchestrator();