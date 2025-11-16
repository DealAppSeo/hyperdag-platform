import { db } from '../../db.js';
import { anfisFuzzyRules, anfisLearningHistory, soulBoundTokens, sbtContributions } from '../../../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import type { 
  AnfisFuzzyRule, 
  InsertAnfisFuzzyRule, 
  AnfisLearningHistory,
  InsertAnfisLearningHistory,
  SoulBoundToken, 
  SbtContribution 
} from '../../../shared/schema.js';

/**
 * ANFIS-Powered Reputation Engine for SBT System
 * 
 * Extends the existing DAG + ANFIS routing system to provide:
 * - Multi-dimensional reputation calculation
 * - Adaptive neural-fuzzy learning for reputation scoring
 * - Contribution impact assessment
 * - Purpose-weighted governance calculations
 */
export class ReputationANFIS {
  
  // Fuzzy input variable ranges
  private readonly fuzzyInputs = {
    technicalSkill: [0, 100],      // "novice", "competent", "expert"
    socialEngagement: [0, 100],    // "inactive", "moderate", "leader"  
    impactCreated: [0, 100],       // "minimal", "significant", "transformative"
    consistencyScore: [0, 100],    // "sporadic", "regular", "consistent"
    authenticityLevel: [0, 100]    // "unverified", "partial", "fully_verified"
  };

  // Fuzzy membership functions
  private readonly membershipFunctions = {
    low: (x: number, max: number) => Math.max(0, Math.min(1, (max * 0.4 - x) / (max * 0.4))),
    medium: (x: number, max: number) => {
      const mid = max * 0.5;
      const range = max * 0.3;
      return Math.max(0, Math.min(1, 1 - Math.abs(x - mid) / range));
    },
    high: (x: number, max: number) => Math.max(0, Math.min(1, (x - max * 0.6) / (max * 0.4)))
  };

  constructor() {
    this.initializeReputationRules();
  }

  /**
   * Initialize fuzzy rules for reputation calculation
   */
  private async initializeReputationRules(): Promise<void> {
    const reputationRules = [
      {
        ruleName: 'expert_leader_rule',
        ruleType: 'reputation',
        antecedent: 'IF technical IS expert AND social IS leader',
        consequent: 'THEN reputation IS exceptional',
        confidence: '0.95',
        weights: [0.9, 0.8, 0.7, 0.6, 0.85],
        bias: '5.0',
        learningRate: '0.01'
      },
      {
        ruleName: 'impact_authenticity_rule',
        ruleType: 'reputation',
        antecedent: 'IF impact IS transformative AND authenticity IS fully_verified',
        consequent: 'THEN reputation IS high',
        confidence: '0.90',
        weights: [0.6, 0.7, 0.95, 0.8, 0.9],
        bias: '3.0',
        learningRate: '0.01'
      },
      {
        ruleName: 'consistency_impact_rule',
        ruleType: 'reputation',
        antecedent: 'IF consistency IS consistent AND impact IS significant',
        consequent: 'THEN reputation IS good',
        confidence: '0.85',
        weights: [0.5, 0.6, 0.8, 0.9, 0.7],
        bias: '2.0',
        learningRate: '0.01'
      },
      {
        ruleName: 'balanced_competent_rule',
        ruleType: 'reputation',
        antecedent: 'IF technical IS competent AND social IS moderate',
        consequent: 'THEN reputation IS average',
        confidence: '0.75',
        weights: [0.7, 0.6, 0.5, 0.6, 0.65],
        bias: '1.0',
        learningRate: '0.01'
      },
      {
        ruleName: 'low_verification_rule',
        ruleType: 'reputation',
        antecedent: 'IF authenticity IS unverified OR consistency IS sporadic',
        consequent: 'THEN reputation IS low',
        confidence: '0.80',
        weights: [0.3, 0.4, 0.3, 0.2, 0.25],
        bias: '-1.0',
        learningRate: '0.01'
      }
    ];

    for (const rule of reputationRules) {
      try {
        const existing = await db
          .select()
          .from(anfisFuzzyRules)
          .where(and(
            eq(anfisFuzzyRules.ruleName, rule.ruleName),
            eq(anfisFuzzyRules.ruleType, 'reputation')
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(anfisFuzzyRules).values(rule);
          console.log(`[Reputation ANFIS] Initialized rule: ${rule.ruleName}`);
        }
      } catch (error) {
        // Rule already exists, continue
      }
    }
  }

  /**
   * Calculate reputation score using ANFIS
   */
  async calculateReputation(
    contributions: SbtContribution[], 
    sbtData: SoulBoundToken
  ): Promise<{
    totalScore: number;
    dimensionalScores: {
      technical: number;
      social: number;
      creative: number;
      impact: number;
    };
    confidence: number;
    reasoning: string;
  }> {
    
    // Extract fuzzy input values from contributions and SBT data
    const fuzzyInputValues = this.extractFuzzyInputs(contributions, sbtData);
    
    // Get active reputation rules
    const rules = await db
      .select()
      .from(anfisFuzzyRules)
      .where(and(
        eq(anfisFuzzyRules.ruleType, 'reputation'),
        eq(anfisFuzzyRules.isActive, true)
      ));

    if (rules.length === 0) {
      console.log('[Reputation ANFIS] No active reputation rules found');
      return {
        totalScore: 10,
        dimensionalScores: { technical: 0, social: 0, creative: 0, impact: 0 },
        confidence: 0.1,
        reasoning: 'No active reputation rules available'
      };
    }

    // Calculate firing strength for each rule
    const ruleActivations = rules.map(rule => {
      const firingStrength = this.calculateFiringStrength(fuzzyInputValues, rule);
      return {
        rule,
        firingStrength,
        output: this.calculateRuleOutput(fuzzyInputValues, rule)
      };
    });

    // Apply neural network layer (weighted combination)
    const totalFiringStrength = ruleActivations.reduce((sum, activation) => sum + activation.firingStrength, 0);
    
    let weightedOutput = 0;
    let totalConfidence = 0;

    ruleActivations.forEach(activation => {
      const normalizedWeight = activation.firingStrength / (totalFiringStrength || 1);
      weightedOutput += normalizedWeight * activation.output;
      totalConfidence += normalizedWeight * parseFloat(activation.rule.confidence);
      
      // Update rule activation count
      this.updateRuleActivation(activation.rule.id);
    });

    // Calculate dimensional scores
    const dimensionalScores = this.calculateDimensionalScores(fuzzyInputValues, ruleActivations);
    
    // Apply bounds and scaling
    const totalScore = Math.max(0, Math.min(1000, weightedOutput * 100));
    const confidence = Math.max(0, Math.min(1, totalConfidence));

    // Generate reasoning
    const reasoning = this.generateReputationReasoning(ruleActivations, fuzzyInputValues);

    // Record learning history
    await this.recordLearningHistory(sbtData.id, fuzzyInputValues, totalScore, ruleActivations);

    console.log(`[Reputation ANFIS] Calculated reputation for SBT ${sbtData.id}: ${totalScore.toFixed(1)} (confidence: ${(confidence * 100).toFixed(1)}%)`);

    return {
      totalScore,
      dimensionalScores,
      confidence,
      reasoning
    };
  }

  /**
   * Update reputation weights based on feedback
   */
  async adaptWeights(
    sbtId: number,
    actualOutcome: number,
    expectedOutcome: number,
    feedback: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    
    const error = actualOutcome - expectedOutcome;
    const learningSignal = feedback === 'positive' ? 1 : feedback === 'negative' ? -1 : 0;

    // Get recent learning history for this SBT
    const recentLearning = await db
      .select()
      .from(anfisLearningHistory)
      .where(eq(anfisLearningHistory.sbtId, sbtId))
      .orderBy(desc(anfisLearningHistory.timestamp))
      .limit(10);

    // Update weights for involved rules
    for (const learning of recentLearning) {
      const rule = await db
        .select()
        .from(anfisFuzzyRules)
        .where(eq(anfisFuzzyRules.id, learning.ruleId))
        .limit(1);

      if (rule.length > 0) {
        const currentWeights = rule[0].weights || [0.5, 0.5, 0.5, 0.5, 0.5];
        const learningRate = parseFloat(rule[0].learningRate);
        
        // Gradient descent weight update
        const updatedWeights = currentWeights.map((weight, index) => {
          const gradient = error * learningSignal * (learning.inputValues as any)[`input_${index}`] || 0;
          return Math.max(0, Math.min(1, weight - learningRate * gradient));
        });

        // Update bias
        const currentBias = parseFloat(rule[0].bias);
        const updatedBias = currentBias - learningRate * error * learningSignal;

        await db
          .update(anfisFuzzyRules)
          .set({
            weights: updatedWeights,
            bias: updatedBias.toString(),
            updatedAt: new Date()
          })
          .where(eq(anfisFuzzyRules.id, rule[0].id));

        console.log(`[Reputation ANFIS] Updated weights for rule ${rule[0].ruleName} based on ${feedback} feedback`);
      }
    }
  }

  /**
   * Calculate purpose-weighted voting power
   */
  async calculateVotingPower(
    sbt: SoulBoundToken,
    proposalCategory: string,
    proposalType: string
  ): Promise<{
    baseWeight: number;
    purposeWeight: number;
    totalWeight: number;
    alignment: number;
    reasoning: string;
  }> {
    
    const baseWeight = parseFloat(sbt.votingWeight);
    const purposeAlignment = this.calculatePurposeAlignment(sbt, proposalCategory);
    const participationBonus = this.calculateParticipationBonus(sbt);
    
    // Use ANFIS for optimal weighting
    const fuzzyInputs = {
      baseReputation: parseFloat(sbt.reputationScore),
      purposeAlignment,
      participationHistory: parseFloat(sbt.governanceParticipation),
      authenticationLevel: sbt.authenticationLevel,
      proposalRelevance: this.getProposalRelevance(sbt, proposalType)
    };

    const votingRules = await db
      .select()
      .from(anfisFuzzyRules)
      .where(and(
        eq(anfisFuzzyRules.ruleType, 'governance'),
        eq(anfisFuzzyRules.isActive, true)
      ));

    let purposeWeight = 1.0;

    if (votingRules.length > 0) {
      const ruleOutputs = votingRules.map(rule => {
        const firingStrength = this.calculateFiringStrength(fuzzyInputs, rule);
        return firingStrength * this.calculateRuleOutput(fuzzyInputs, rule);
      });

      purposeWeight = ruleOutputs.reduce((sum, output) => sum + output, 0) / ruleOutputs.length;
      purposeWeight = Math.max(0.1, Math.min(3.0, purposeWeight)); // Bound between 0.1x and 3.0x
    }

    const totalWeight = baseWeight * purposeWeight * (1 + participationBonus);

    const reasoning = `Base weight: ${baseWeight.toFixed(2)}, Purpose alignment: ${(purposeAlignment * 100).toFixed(1)}%, Participation bonus: ${(participationBonus * 100).toFixed(1)}%, Final multiplier: ${purposeWeight.toFixed(2)}`;

    return {
      baseWeight,
      purposeWeight,
      totalWeight,
      alignment: purposeAlignment,
      reasoning
    };
  }

  // Private helper methods

  private extractFuzzyInputs(contributions: SbtContribution[], sbtData: SoulBoundToken): Record<string, number> {
    // Calculate technical skill from contributions
    const technicalContributions = contributions.filter(c => c.category === 'technical');
    const technicalSkill = Math.min(100, technicalContributions.reduce((sum, c) => sum + parseFloat(c.value), 0));

    // Calculate social engagement
    const socialContributions = contributions.filter(c => c.category === 'social');
    const socialEngagement = Math.min(100, socialContributions.reduce((sum, c) => sum + parseFloat(c.value), 0));

    // Calculate impact created
    const impactContributions = contributions.filter(c => c.category === 'impact');
    const impactCreated = Math.min(100, impactContributions.reduce((sum, c) => sum + parseFloat(c.value) * parseFloat(c.impactMultiplier), 0));

    // Calculate consistency (based on contribution frequency and verification)
    const verifiedContributions = contributions.filter(c => c.verificationStatus === 'verified');
    const consistencyScore = Math.min(100, (verifiedContributions.length / Math.max(1, contributions.length)) * 100);

    // Calculate authenticity level (based on auth level and verification)
    const authenticityLevel = Math.min(100, sbtData.authenticationLevel * 25);

    return {
      technicalSkill,
      socialEngagement,
      impactCreated,
      consistencyScore,
      authenticityLevel
    };
  }

  private calculateFiringStrength(inputs: Record<string, number>, rule: AnfisFuzzyRule): number {
    const weights = rule.weights || [0.5, 0.5, 0.5, 0.5, 0.5];
    
    // Calculate membership degrees for each input
    const membershipDegrees = Object.entries(inputs).map(([key, value], index) => {
      const maxValue = this.fuzzyInputs[key as keyof typeof this.fuzzyInputs]?.[1] || 100;
      
      // Determine linguistic term based on rule antecedent
      if (rule.antecedent.includes('expert') || rule.antecedent.includes('transformative') || rule.antecedent.includes('fully_verified')) {
        return this.membershipFunctions.high(value, maxValue);
      } else if (rule.antecedent.includes('competent') || rule.antecedent.includes('moderate') || rule.antecedent.includes('significant')) {
        return this.membershipFunctions.medium(value, maxValue);
      } else {
        return this.membershipFunctions.low(value, maxValue);
      }
    });

    // Weighted minimum for AND operations, weighted maximum for OR operations
    const isOrRule = rule.antecedent.includes(' OR ');
    
    if (isOrRule) {
      return membershipDegrees.reduce((max, degree, index) => 
        Math.max(max, degree * (weights[index] || 0.5)), 0
      );
    } else {
      return membershipDegrees.reduce((min, degree, index) => 
        Math.min(min, degree * (weights[index] || 0.5)), 1
      );
    }
  }

  private calculateRuleOutput(inputs: Record<string, number>, rule: AnfisFuzzyRule): number {
    const weights = rule.weights || [0.5, 0.5, 0.5, 0.5, 0.5];
    const bias = parseFloat(rule.bias);
    
    // Linear combination of inputs (Takagi-Sugeno style)
    const weightedSum = Object.values(inputs).reduce((sum, value, index) => 
      sum + value * (weights[index] || 0.5), 0
    );
    
    return weightedSum / Object.keys(inputs).length + bias;
  }

  private calculateDimensionalScores(
    inputs: Record<string, number>, 
    activations: Array<{rule: AnfisFuzzyRule; firingStrength: number; output: number}>
  ): { technical: number; social: number; creative: number; impact: number } {
    
    return {
      technical: Math.min(100, inputs.technicalSkill || 0),
      social: Math.min(100, inputs.socialEngagement || 0),
      creative: Math.min(100, (inputs.impactCreated || 0) * 0.5), // Creative derived from impact
      impact: Math.min(100, inputs.impactCreated || 0)
    };
  }

  private generateReputationReasoning(
    activations: Array<{rule: AnfisFuzzyRule; firingStrength: number; output: number}>,
    inputs: Record<string, number>
  ): string {
    const activeRules = activations
      .filter(a => a.firingStrength > 0.1)
      .sort((a, b) => b.firingStrength - a.firingStrength)
      .slice(0, 3);

    if (activeRules.length === 0) {
      return 'No significant rules activated for reputation calculation';
    }

    const topRule = activeRules[0];
    const strength = (topRule.firingStrength * 100).toFixed(1);
    
    return `Primary rule: ${topRule.rule.antecedent} (${strength}% activation). Technical: ${inputs.technicalSkill?.toFixed(0)}, Social: ${inputs.socialEngagement?.toFixed(0)}, Impact: ${inputs.impactCreated?.toFixed(0)}, Consistency: ${inputs.consistencyScore?.toFixed(0)}%, Auth: ${inputs.authenticityLevel?.toFixed(0)}%`;
  }

  private calculatePurposeAlignment(sbt: SoulBoundToken, proposalCategory: string): number {
    const technical = parseFloat(sbt.technicalSkill);
    const social = parseFloat(sbt.socialEngagement);
    const creative = parseFloat(sbt.creativeContribution);
    const impact = parseFloat(sbt.impactScore);

    switch (proposalCategory) {
      case 'technical':
        return Math.min(1, technical / 80);
      case 'social_impact':
        return Math.min(1, (social + impact) / 160);
      case 'creative':
        return Math.min(1, creative / 80);
      case 'governance':
        return Math.min(1, (social + parseFloat(sbt.governanceParticipation)) / 120);
      case 'funding':
        return Math.min(1, (impact + social) / 160);
      default:
        return 0.5; // Neutral alignment for unknown categories
    }
  }

  private calculateParticipationBonus(sbt: SoulBoundToken): number {
    const participation = parseFloat(sbt.governanceParticipation);
    
    if (participation >= 80) return 0.3;  // 30% bonus for high participation
    if (participation >= 50) return 0.2;  // 20% bonus for medium participation  
    if (participation >= 20) return 0.1;  // 10% bonus for low participation
    return 0; // No bonus for no participation
  }

  private getProposalRelevance(sbt: SoulBoundToken, proposalType: string): number {
    const metadata = sbt.metadata as any;
    
    // Check if SBT has relevant scope
    if (metadata?.governanceScope?.includes(proposalType)) {
      return 1.0;
    }
    
    // General relevance based on token type
    switch (sbt.tokenType) {
      case 'SBT': return 0.8; // Humans have general relevance
      case 'DBT': return proposalType === 'technical' ? 1.0 : 0.3; // AI agents for technical
      case 'CBT': return proposalType === 'funding' ? 1.0 : 0.5; // Nonprofits for funding
      default: return 0.5;
    }
  }

  private async updateRuleActivation(ruleId: number): Promise<void> {
    await db
      .update(anfisFuzzyRules)
      .set({
        activationCount: db.select().from(anfisFuzzyRules).where(eq(anfisFuzzyRules.id, ruleId)),
        lastActivation: new Date()
      })
      .where(eq(anfisFuzzyRules.id, ruleId));
  }

  private async recordLearningHistory(
    sbtId: number,
    inputs: Record<string, number>,
    output: number,
    activations: Array<{rule: AnfisFuzzyRule; firingStrength: number; output: number}>
  ): Promise<void> {
    
    for (const activation of activations.slice(0, 3)) { // Record top 3 activations
      const learningData: InsertAnfisLearningHistory = {
        ruleId: activation.rule.id,
        sbtId,
        inputValues: inputs,
        expectedOutput: output.toString(),
        actualOutput: activation.output.toString(),
        errorValue: Math.abs(output - activation.output).toString(),
        learningContext: 'reputation_calculation',
        feedback: activation.firingStrength > 0.5 ? 'high_activation' : 'low_activation',
        metadata: {
          firingStrength: activation.firingStrength,
          ruleConfidence: parseFloat(activation.rule.confidence),
          inputCount: Object.keys(inputs).length
        }
      };

      await db.insert(anfisLearningHistory).values(learningData);
    }
  }
}

// Export singleton instance
export const reputationANFIS = new ReputationANFIS();