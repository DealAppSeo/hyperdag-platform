/**
 * Weighted RepID Rating Service
 * Implements Adaptive Weighted Consensus (AWC) Model
 * 
 * Features:
 * - Multi-dimensional ratings (factual, truthful, authentic, helpful)
 * - RepID-weighted rating calculations
 * - Time decay (exponential moving average)
 * - ZKP proof bonuses
 * - Scripture/faith multipliers
 * - Self-rating penalty caps
 * - Bayesian priors for new entities
 * - Manipulation detection
 */

import { db } from '../../db';
import { repidRatings, repidAggregatedScores, repidManipulationAlerts, soulBoundTokens } from '../../../shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export interface RatingSubmission {
  raterType: 'user' | 'agent' | 'ai_model';
  raterId: number;
  raterWallet?: string;
  targetType: 'user' | 'agent' | 'ai_model';
  targetId: number;
  targetWallet?: string;
  
  // Multi-dimensional scores (0-10)
  factualScore: number;
  truthfulScore: number;
  authenticScore: number;
  helpfulScore: number;
  
  // Rating metadata
  ratingType?: 'peer' | 'self' | 'challenge';
  confidence?: number; // 0-1
  
  // ZKP verification
  zkpProofHash?: string;
  zkpVerified?: boolean;
  
  // Scripture/faith context
  scriptureReference?: string;
  faithContext?: string;
  
  // Evidence
  context?: string;
  evidence?: {
    verificationTaskId?: string;
    factCheckSource?: string;
    interactionLog?: string;
    userFeedback?: string;
  };
}

export interface WeightCalculation {
  baseWeight: number; // Rater's RepID / max RepID
  zkpBonus: number; // +0.5 if ZKP verified
  faithMultiplier: number; // +0.2 for scripture-based
  selfRatingPenalty: number; // -0.8 for self-ratings
  timeDecay: number; // e^(-t/τ) where τ=90 days
  finalWeight: number; // Combined weight
}

export class WeightedRatingService {
  private readonly MAX_REPID = 1000; // Normalization constant
  private readonly DECAY_TAU_DAYS = 90; // Time decay constant
  private readonly EMA_ALPHA = 0.2; // Exponential moving average factor
  private readonly BAYESIAN_PRIOR = 5.0; // Neutral baseline (0-10 scale)
  private readonly MIN_RATINGS_FOR_CONFIDENCE = 5;
  
  // Default dimension weights
  private readonly DEFAULT_WEIGHTS = {
    factual: 0.3,
    truthful: 0.3,
    authentic: 0.2,
    helpful: 0.2
  };
  
  /**
   * Submit a new rating and update aggregated scores
   */
  async submitRating(submission: RatingSubmission): Promise<{
    success: boolean;
    ratingId?: string;
    updatedRepID?: number;
    error?: string;
  }> {
    try {
      // Validate scores (0-10 range)
      this.validateScores(submission);
      
      // Get rater's current RepID
      const raterRepID = await this.getEntityRepID(submission.raterType, submission.raterId);
      
      // Calculate weight for this rating
      const weight = await this.calculateWeight(submission, raterRepID);
      
      // Check for manipulation patterns
      const manipulationCheck = await this.checkManipulation(submission, weight);
      
      // Insert rating with calculated weight
      const [rating] = await db.insert(repidRatings).values({
        raterType: submission.raterType,
        raterId: submission.raterId,
        raterWallet: submission.raterWallet,
        raterRepID: raterRepID.toString(),
        targetType: submission.targetType,
        targetId: submission.targetId,
        targetWallet: submission.targetWallet,
        factualScore: submission.factualScore.toString(),
        truthfulScore: submission.truthfulScore.toString(),
        authenticScore: submission.authenticScore.toString(),
        helpfulScore: submission.helpfulScore.toString(),
        ratingType: submission.ratingType || 'peer',
        confidence: (submission.confidence || 1.0).toString(),
        calculatedWeight: weight.finalWeight.toString(),
        zkpBonus: weight.zkpBonus.toString(),
        faithMultiplier: weight.faithMultiplier.toString(),
        selfRatingPenalty: weight.selfRatingPenalty.toString(),
        zkpProofHash: submission.zkpProofHash,
        zkpVerified: submission.zkpVerified || false,
        scriptureReference: submission.scriptureReference,
        faithContext: submission.faithContext,
        context: submission.context,
        evidence: submission.evidence,
        flaggedAsManipulation: manipulationCheck.flagged,
        manipulationReason: manipulationCheck.reason,
      }).returning();
      
      // Update aggregated scores using EMA
      const updatedRepID = await this.updateAggregatedScores(submission.targetType, submission.targetId);
      
      return {
        success: true,
        ratingId: rating.ratingId,
        updatedRepID
      };
    } catch (error: any) {
      console.error('[WeightedRating] Submission failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate weight for a rating based on rater's RepID and bonuses
   */
  private async calculateWeight(
    submission: RatingSubmission,
    raterRepID: number
  ): Promise<WeightCalculation> {
    // Base weight: Rater's RepID normalized to 0-1
    const baseWeight = Math.min(raterRepID / this.MAX_REPID, 1.0);
    
    // ZKP bonus: +0.5 if proof is attached and verified
    const zkpBonus = (submission.zkpVerified && submission.zkpProofHash) ? 0.5 : 0;
    
    // Faith multiplier: +0.2 for scripture-based ratings
    const faithMultiplier = submission.scriptureReference ? 0.2 : 0;
    
    // Self-rating penalty: Cap weight at 0.2x for self-ratings
    const isSelfRating = (submission.ratingType === 'self') || 
                        (submission.raterId === submission.targetId);
    const selfRatingPenalty = isSelfRating ? 0.8 : 0; // Reduces weight by 80%
    
    // Calculate final weight
    let finalWeight = baseWeight * (1 + zkpBonus + faithMultiplier);
    if (isSelfRating) {
      finalWeight = finalWeight * 0.2; // Cap self-ratings at 20% of normal weight
    }
    
    // Ensure weight is within bounds [0, 2]
    finalWeight = Math.max(0, Math.min(2, finalWeight));
    
    return {
      baseWeight,
      zkpBonus,
      faithMultiplier,
      selfRatingPenalty,
      timeDecay: 1.0, // Applied during aggregation
      finalWeight
    };
  }
  
  /**
   * Update aggregated scores using Exponential Moving Average
   */
  private async updateAggregatedScores(
    entityType: string,
    entityId: number
  ): Promise<number> {
    // Get all recent ratings for this entity
    const ratings = await db.select().from(repidRatings)
      .where(and(
        eq(repidRatings.targetType, entityType),
        eq(repidRatings.targetId, entityId)
      ))
      .orderBy(desc(repidRatings.createdAt));
    
    if (ratings.length === 0) {
      return this.BAYESIAN_PRIOR; // Return neutral baseline
    }
    
    // Apply time decay to weights
    const now = new Date();
    const decayedRatings = ratings.map(r => {
      const ageInDays = (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-ageInDays / this.DECAY_TAU_DAYS);
      return {
        ...r,
        effectiveWeight: parseFloat(r.calculatedWeight) * decayFactor
      };
    });
    
    // Calculate weighted averages for each dimension
    const totalWeight = decayedRatings.reduce((sum, r) => sum + r.effectiveWeight, 0);
    
    const factualScore = decayedRatings.reduce((sum, r) => 
      sum + parseFloat(r.factualScore) * r.effectiveWeight, 0) / totalWeight;
    const truthfulScore = decayedRatings.reduce((sum, r) => 
      sum + parseFloat(r.truthfulScore) * r.effectiveWeight, 0) / totalWeight;
    const authenticScore = decayedRatings.reduce((sum, r) => 
      sum + parseFloat(r.authenticScore) * r.effectiveWeight, 0) / totalWeight;
    const helpfulScore = decayedRatings.reduce((sum, r) => 
      sum + parseFloat(r.helpfulScore) * r.effectiveWeight, 0) / totalWeight;
    
    // Apply Bayesian prior for entities with few ratings
    const bayesianWeight = Math.max(0, 1 - (ratings.length / this.MIN_RATINGS_FOR_CONFIDENCE));
    const factualWithPrior = factualScore * (1 - bayesianWeight) + this.BAYESIAN_PRIOR * bayesianWeight;
    const truthfulWithPrior = truthfulScore * (1 - bayesianWeight) + this.BAYESIAN_PRIOR * bayesianWeight;
    const authenticWithPrior = authenticScore * (1 - bayesianWeight) + this.BAYESIAN_PRIOR * bayesianWeight;
    const helpfulWithPrior = helpfulScore * (1 - bayesianWeight) + this.BAYESIAN_PRIOR * bayesianWeight;
    
    // Calculate composite RepID
    const compositeRepID = (
      factualWithPrior * this.DEFAULT_WEIGHTS.factual +
      truthfulWithPrior * this.DEFAULT_WEIGHTS.truthful +
      authenticWithPrior * this.DEFAULT_WEIGHTS.authentic +
      helpfulWithPrior * this.DEFAULT_WEIGHTS.helpful
    ) * 10; // Scale to 0-100
    
    // Get existing aggregated score
    const existing = await db.select().from(repidAggregatedScores)
      .where(and(
        eq(repidAggregatedScores.entityType, entityType),
        eq(repidAggregatedScores.entityId, entityId)
      )).limit(1);
    
    const countByType = {
      peer: ratings.filter(r => r.ratingType === 'peer').length,
      self: ratings.filter(r => r.ratingType === 'self').length,
      challenge: ratings.filter(r => r.ratingType === 'challenge').length,
    };
    
    if (existing.length > 0) {
      // Apply EMA: New = α * Latest + (1 - α) * Old
      const oldRepID = parseFloat(existing[0].compositeRepID);
      const emaRepID = this.EMA_ALPHA * compositeRepID + (1 - this.EMA_ALPHA) * oldRepID;
      
      await db.update(repidAggregatedScores)
        .set({
          factualScore: factualWithPrior.toFixed(2),
          truthfulScore: truthfulWithPrior.toFixed(2),
          authenticScore: authenticWithPrior.toFixed(2),
          helpfulScore: helpfulWithPrior.toFixed(2),
          compositeRepID: emaRepID.toFixed(3),
          previousRepID: oldRepID.toFixed(3),
          totalRatingsReceived: ratings.length,
          peerRatingsCount: countByType.peer,
          selfRatingsCount: countByType.self,
          challengeRatingsCount: countByType.challenge,
          bayesianPriorWeight: bayesianWeight.toFixed(4),
          lastUpdated: new Date(),
        })
        .where(eq(repidAggregatedScores.id, existing[0].id));
      
      return emaRepID;
    } else {
      // Create new aggregated score
      await db.insert(repidAggregatedScores).values({
        entityType,
        entityId,
        factualScore: factualWithPrior.toFixed(2),
        truthfulScore: truthfulWithPrior.toFixed(2),
        authenticScore: authenticWithPrior.toFixed(2),
        helpfulScore: helpfulWithPrior.toFixed(2),
        compositeRepID: compositeRepID.toFixed(3),
        dimensionWeights: this.DEFAULT_WEIGHTS,
        emaAlpha: this.EMA_ALPHA.toString(),
        totalRatingsReceived: ratings.length,
        peerRatingsCount: countByType.peer,
        selfRatingsCount: countByType.self,
        challengeRatingsCount: countByType.challenge,
        bayesianPriorWeight: bayesianWeight.toFixed(4),
      });
      
      return compositeRepID;
    }
  }
  
  /**
   * Get entity's current RepID
   */
  private async getEntityRepID(entityType: string, entityId: number): Promise<number> {
    const aggregated = await db.select().from(repidAggregatedScores)
      .where(and(
        eq(repidAggregatedScores.entityType, entityType),
        eq(repidAggregatedScores.entityId, entityId)
      )).limit(1);
    
    if (aggregated.length > 0) {
      return parseFloat(aggregated[0].compositeRepID);
    }
    
    // Fallback: Check SBT table
    if (entityType === 'user') {
      const sbt = await db.select().from(soulBoundTokens)
        .where(eq(soulBoundTokens.id, entityId)).limit(1);
      if (sbt.length > 0) {
        return parseFloat(sbt[0].reputationScore);
      }
    }
    
    return this.BAYESIAN_PRIOR * 10; // Return neutral baseline (50)
  }
  
  /**
   * Check for manipulation patterns
   */
  private async checkManipulation(
    submission: RatingSubmission,
    weight: WeightCalculation
  ): Promise<{ flagged: boolean; reason?: string }> {
    // Check 1: Excessive self-rating
    if (submission.ratingType === 'self') {
      const recentSelfRatings = await db.select().from(repidRatings)
        .where(and(
          eq(repidRatings.raterId, submission.raterId),
          eq(repidRatings.ratingType, 'self'),
          gte(repidRatings.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        ));
      
      if (recentSelfRatings.length > 3) {
        return {
          flagged: true,
          reason: 'Excessive self-rating (>3 in 24h)'
        };
      }
    }
    
    // Check 2: Suspiciously perfect scores
    const allPerfect = [
      submission.factualScore,
      submission.truthfulScore,
      submission.authenticScore,
      submission.helpfulScore
    ].every(score => score === 10);
    
    if (allPerfect && !submission.zkpVerified) {
      return {
        flagged: true,
        reason: 'Suspiciously perfect scores without ZKP verification'
      };
    }
    
    // Check 3: Rating spike detection (implement in background job)
    // TODO: Add statistical anomaly detection
    
    return { flagged: false };
  }
  
  /**
   * Validate rating scores are within bounds
   */
  private validateScores(submission: RatingSubmission): void {
    const scores = [
      { name: 'factual', value: submission.factualScore },
      { name: 'truthful', value: submission.truthfulScore },
      { name: 'authentic', value: submission.authenticScore },
      { name: 'helpful', value: submission.helpfulScore }
    ];
    
    for (const score of scores) {
      if (score.value < 0 || score.value > 10) {
        throw new Error(`${score.name} score must be between 0 and 10`);
      }
    }
    
    if (submission.confidence !== undefined) {
      if (submission.confidence < 0 || submission.confidence > 1) {
        throw new Error('Confidence must be between 0 and 1');
      }
    }
  }
  
  /**
   * Get aggregated scores for an entity
   */
  async getAggregatedScores(entityType: string, entityId: number) {
    const scores = await db.select().from(repidAggregatedScores)
      .where(and(
        eq(repidAggregatedScores.entityType, entityType),
        eq(repidAggregatedScores.entityId, entityId)
      )).limit(1);
    
    return scores[0] || null;
  }
}

export const weightedRatingService = new WeightedRatingService();
