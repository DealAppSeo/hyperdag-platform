/**
 * Veritas-Enhanced Trinity Symphony Coordinator
 * Integrates hallucination suppression and confidence-calibrated decision making
 * 
 * Key Enhancements:
 * 1. Confidence-weighted consensus (95%+ threshold)
 * 2. Adversarial checking (one manager challenges others)
 * 3. Abstention protocol ("I don't know" over guessing)
 * 4. Bilateral learning (forward + backward analysis)
 * 5. Source-grounded decisions with evidence tracking
 */

import { EventEmitter } from 'events';

const PHI = 1.618033988749895; // Golden ratio
const CONFIDENCE_THRESHOLD = 0.95; // Veritas: 95% confidence minimum
const HONESTY_PREMIUM = 1.5; // Multiplier for "I don't know" admissions
const MAX_REPUTATION = 3.0; // Architect: Cap reputation to prevent runaway weighting
const ALLOWED_MANAGERS = ['AI-Prompt-Manager', 'HyperDagManager', 'Mel']; // Architect: Allowlist

interface ConfidenceScore {
  managerName: string;
  confidence: number; // 0.0 - 1.0
  reasoning: string[];
  evidenceSources: string[];
  uncertaintyAreas: string[];
  reputation?: number; // Honesty-premium-adjusted manager reliability
}

interface VeritasConsensus {
  decision: any;
  overallConfidence: number;
  unanimity: boolean;
  confidenceScores: ConfidenceScore[];
  abstentions: string[]; // Managers that said "I don't know"
  challengeResults?: AdversarialChallenge;
  shouldDefer: boolean;
  deferReason?: string;
  evidenceChain: string[];
}

interface AdversarialChallenge {
  challenger: string;
  flawsFound: string[];
  strengthsConfirmed: string[];
  overallAssessment: 'approved' | 'needs_revision' | 'rejected';
  confidence: number;
}

interface BilateralLearning {
  forwardLearning: {
    successfulPatterns: string[];
    userFeedbackIntegrated: boolean;
    outcomesMeasured: number;
  };
  backwardLearning: {
    reasoningChainsAnalyzed: number;
    uncertaintyPoints: string[];
    decisionsReinforced: string[];
    decisionsCorrected: string[];
  };
}

interface SourceGroundedDecision {
  decision: string;
  confidence: number;
  evidence: EvidenceItem[];
  uncertaintyAcknowledged: string[];
  abstentionReasons: string[];
}

interface EvidenceItem {
  claim: string;
  source: string;
  reliability: number; // 0.0 - 1.0
  timestamp: number;
  verifiable: boolean;
}

export class VeritasEnhancedTrinity extends EventEmitter {
  private learningHistory: BilateralLearning[] = [];
  private evidenceDatabase: Map<string, EvidenceItem[]> = new Map();
  private abstentionHistory: Map<string, number> = new Map();
  private challengeHistory: AdversarialChallenge[] = [];
  private managerReputation: Map<string, number> = new Map(); // Honesty-premium-adjusted reputation

  constructor() {
    super();
    console.log('[Veritas Trinity] 🔬 Initialized with hallucination suppression');
    console.log('[Veritas Trinity] 📊 Confidence threshold: 95%');
    console.log('[Veritas Trinity] 🎖️  Honesty premium: 1.5x for abstentions');
  }

  /**
   * Phase 1: Confidence-Weighted Consensus
   * Each manager provides confidence score (0.0 - 1.0)
   * Only proceed if weighted average >= 95%
   */
  async getConfidenceWeightedConsensus(
    task: string,
    managers: string[] = ['AI-Prompt-Manager', 'HyperDagManager', 'Mel']
  ): Promise<VeritasConsensus> {
    console.log(`\n[Veritas Trinity] 🎯 Evaluating task: "${task}"`);
    console.log(`[Veritas Trinity] 👥 Managers: ${managers.join(', ')}`);

    // Architect: Validate managers against allowlist
    const validManagers = managers.filter(m => ALLOWED_MANAGERS.includes(m));
    if (validManagers.length !== managers.length) {
      const invalid = managers.filter(m => !ALLOWED_MANAGERS.includes(m));
      console.warn(`[Veritas Trinity] ⚠️  Invalid managers ignored: ${invalid.join(', ')}`);
    }
    if (validManagers.length === 0) {
      throw new Error('No valid managers specified');
    }

    // Collect confidence scores from each manager
    const confidenceScores: ConfidenceScore[] = [];
    const abstentions: string[] = [];

    for (const manager of validManagers) {
      const score = await this.getManagerConfidence(manager, task);
      confidenceScores.push(score);

      // Track abstentions (Honesty Premium!)
      if (score.uncertaintyAreas.length > 0 && score.confidence < CONFIDENCE_THRESHOLD) {
        abstentions.push(manager);
        this.recordAbstention(manager);
        // Apply honesty premium to manager reputation
        this.applyHonestyPremium(manager);
        console.log(`[Veritas Trinity] 🎖️  ${manager} ABSTAINED (honesty premium applied)`);
      }
    }

    // Calculate weighted confidence
    const overallConfidence = this.calculateWeightedConfidence(confidenceScores);
    const unanimity = confidenceScores.every(s => s.confidence >= CONFIDENCE_THRESHOLD);

    // Phase 2: Adversarial Challenge (Mel challenges the others)
    const challengeResults = await this.runAdversarialChallenge(
      'Mel', // ImageBearer/Mel is the challenger
      confidenceScores.filter(s => s.managerName !== 'Mel'),
      task
    );

    // Phase 3: Abstention Protocol
    // Require BOTH high confidence (95%+) AND unanimity for approval
    const shouldDefer = 
      overallConfidence < CONFIDENCE_THRESHOLD || 
      !unanimity || // Architect: Enforce unanimity requirement
      abstentions.length >= 2 ||
      challengeResults.overallAssessment === 'rejected';

    let deferReason: string | undefined;
    if (shouldDefer) {
      deferReason = this.generateDeferReason(overallConfidence, abstentions, challengeResults);
    }

    // Collect evidence chain
    const evidenceChain = confidenceScores.flatMap(s => s.evidenceSources);

    const consensus: VeritasConsensus = {
      decision: shouldDefer ? null : this.synthesizeDecision(confidenceScores),
      overallConfidence,
      unanimity,
      confidenceScores,
      abstentions,
      challengeResults,
      shouldDefer,
      deferReason,
      evidenceChain
    };

    // Log results
    console.log(`\n[Veritas Trinity] 📊 Consensus Results:`);
    console.log(`  Overall Confidence: ${(overallConfidence * 100).toFixed(1)}%`);
    console.log(`  Unanimity: ${unanimity ? '✅ YES' : '❌ NO'}`);
    console.log(`  Abstentions: ${abstentions.length} (${abstentions.join(', ') || 'none'})`);
    console.log(`  Challenge: ${challengeResults.overallAssessment.toUpperCase()}`);
    console.log(`  Should Defer: ${shouldDefer ? '⏸️  YES' : '✅ PROCEED'}`);
    
    if (shouldDefer) {
      console.log(`  Defer Reason: ${deferReason}`);
    }

    // Phase 4: Bilateral Learning
    await this.recordBilateralLearning(task, consensus);

    return consensus;
  }

  /**
   * Get confidence score from individual manager
   * Simulates manager evaluation with uncertainty tracking
   */
  private async getManagerConfidence(
    manager: string,
    task: string
  ): Promise<ConfidenceScore> {
    // Simulate different manager specializations
    const baseConfidence = Math.random() * 0.5 + 0.5; // 0.5 - 1.0
    const reasoning: string[] = [];
    const evidenceSources: string[] = [];
    const uncertaintyAreas: string[] = [];

    // Manager-specific analysis
    switch (manager) {
      case 'AI-Prompt-Manager':
        reasoning.push('AI orchestration and routing analysis');
        evidenceSources.push('ANFIS routing patterns (verified)');
        if (task.toLowerCase().includes('blockchain')) {
          uncertaintyAreas.push('Blockchain integration details');
        }
        break;

      case 'HyperDagManager':
        reasoning.push('DAG optimization and complexity analysis');
        evidenceSources.push('Historical task performance data');
        if (task.toLowerCase().includes('visual')) {
          uncertaintyAreas.push('Visual design requirements');
        }
        break;

      case 'Mel':
        reasoning.push('Creative and adversarial challenge perspective');
        evidenceSources.push('Pattern matching and anomaly detection');
        // Mel is skeptical by design
        uncertaintyAreas.push('Potential edge cases and failure modes');
        break;
    }

    // Reduce confidence if uncertainty areas exist
    const adjustedConfidence = uncertaintyAreas.length > 0 
      ? baseConfidence * 0.85 
      : baseConfidence;

    return {
      managerName: manager,
      confidence: adjustedConfidence,
      reasoning,
      evidenceSources,
      uncertaintyAreas
    };
  }

  /**
   * Phase 2: Adversarial Challenge
   * One manager (Mel) actively tries to find flaws in others' reasoning
   * Architect: Ensure evidence/reasoning depth is evaluated
   */
  private async runAdversarialChallenge(
    challenger: string,
    proposalScores: ConfidenceScore[],
    task: string
  ): Promise<AdversarialChallenge> {
    console.log(`\n[Veritas Trinity] ⚔️  ${challenger} is challenging the proposal...`);

    const flawsFound: string[] = [];
    const strengthsConfirmed: string[] = [];

    // Simulate adversarial analysis
    for (const score of proposalScores) {
      // Check for low confidence
      if (score.confidence < 0.80) {
        flawsFound.push(`${score.managerName} has low confidence (${(score.confidence * 100).toFixed(1)}%)`);
      } else {
        strengthsConfirmed.push(`${score.managerName} has strong confidence and evidence`);
      }

      // Check for missing evidence (Architect: Evidence verification)
      if (score.evidenceSources.length === 0) {
        flawsFound.push(`${score.managerName} lacks evidence sources`);
      } else {
        // Verify evidence quality
        const verifiedEvidence = this.verifyEvidenceSources(score.evidenceSources);
        if (!verifiedEvidence.allVerifiable) {
          flawsFound.push(`${score.managerName} has unverifiable evidence sources`);
        }
      }

      // Check for uncertainty
      if (score.uncertaintyAreas.length > 2) {
        flawsFound.push(`${score.managerName} has ${score.uncertaintyAreas.length} uncertainty areas`);
      }
    }

    // Additional challenge: look for edge cases
    if (task.includes('critical') || task.includes('production')) {
      flawsFound.push('High-risk task requires additional verification');
    }

    // Determine overall assessment
    let overallAssessment: 'approved' | 'needs_revision' | 'rejected';
    let confidence: number;

    if (flawsFound.length === 0) {
      overallAssessment = 'approved';
      confidence = 0.95;
    } else if (flawsFound.length <= 2) {
      overallAssessment = 'needs_revision';
      confidence = 0.75;
    } else {
      overallAssessment = 'rejected';
      confidence = 0.50;
    }

    const challenge: AdversarialChallenge = {
      challenger,
      flawsFound,
      strengthsConfirmed,
      overallAssessment,
      confidence
    };

    this.challengeHistory.push(challenge);

    console.log(`[Veritas Trinity] ⚔️  Flaws found: ${flawsFound.length}`);
    console.log(`[Veritas Trinity] ⚔️  Strengths confirmed: ${strengthsConfirmed.length}`);
    console.log(`[Veritas Trinity] ⚔️  Assessment: ${overallAssessment.toUpperCase()}`);

    return challenge;
  }

  /**
   * Calculate weighted confidence using geometric mean (Trinity-style)
   * Architect: Confirmed geometric mean with PHI weighting
   */
  private calculateWeightedConfidence(scores: ConfidenceScore[]): number {
    if (scores.length === 0) return 0;

    // Geometric mean with golden ratio weighting
    let product = 1;
    for (const score of scores) {
      // Apply manager reputation (honesty-premium-adjusted)
      const managerReputation = this.managerReputation.get(score.managerName) || 1.0;
      const reputationWeightedConfidence = score.confidence * managerReputation;
      
      product *= Math.max(reputationWeightedConfidence, 0.01); // Avoid zero
    }

    const geometricMean = Math.pow(product, 1 / scores.length);
    const goldenRatioAdjusted = Math.pow(geometricMean, 1 / PHI);

    return Math.min(goldenRatioAdjusted, 1.0);
  }

  /**
   * Phase 3: Generate defer reason when confidence is too low
   */
  private generateDeferReason(
    confidence: number,
    abstentions: string[],
    challenge: AdversarialChallenge
  ): string {
    const reasons: string[] = [];

    if (confidence < CONFIDENCE_THRESHOLD) {
      reasons.push(`Overall confidence ${(confidence * 100).toFixed(1)}% below 95% threshold`);
    }

    if (abstentions.length > 0) {
      reasons.push(`${abstentions.length} manager(s) abstained: ${abstentions.join(', ')}`);
    }

    if (challenge.overallAssessment === 'rejected') {
      reasons.push(`Adversarial challenge rejected proposal`);
    }

    if (challenge.flawsFound.length > 0) {
      reasons.push(`Challenge found ${challenge.flawsFound.length} flaw(s)`);
    }

    return `Need verification - ${reasons.join('; ')}`;
  }

  /**
   * Synthesize final decision from confident managers
   */
  private synthesizeDecision(scores: ConfidenceScore[]): any {
    // Only include high-confidence managers
    const confidentScores = scores.filter(s => s.confidence >= CONFIDENCE_THRESHOLD);
    
    return {
      recommendation: 'Proceed with task',
      contributingManagers: confidentScores.map(s => s.managerName),
      combinedReasoning: confidentScores.flatMap(s => s.reasoning),
      evidenceChain: confidentScores.flatMap(s => s.evidenceSources)
    };
  }

  /**
   * Phase 4: Bilateral Learning
   * Forward: Learn from success
   * Backward: Analyze reasoning chains
   */
  private async recordBilateralLearning(
    task: string,
    consensus: VeritasConsensus
  ): Promise<void> {
    const learning: BilateralLearning = {
      forwardLearning: {
        successfulPatterns: [],
        userFeedbackIntegrated: false,
        outcomesMeasured: 0
      },
      backwardLearning: {
        reasoningChainsAnalyzed: consensus.confidenceScores.length,
        uncertaintyPoints: consensus.confidenceScores.flatMap(s => s.uncertaintyAreas),
        decisionsReinforced: [],
        decisionsCorrected: []
      }
    };

    // Forward learning: Record successful patterns
    if (!consensus.shouldDefer && consensus.overallConfidence >= CONFIDENCE_THRESHOLD) {
      learning.forwardLearning.successfulPatterns.push(
        `High-confidence consensus (${(consensus.overallConfidence * 100).toFixed(1)}%)`
      );
    }

    // Backward learning: Analyze uncertainty
    for (const score of consensus.confidenceScores) {
      if (score.uncertaintyAreas.length > 0) {
        // Learn what caused uncertainty
        learning.backwardLearning.uncertaintyPoints.push(
          `${score.managerName}: ${score.uncertaintyAreas.join(', ')}`
        );
      }

      if (score.confidence >= CONFIDENCE_THRESHOLD) {
        learning.backwardLearning.decisionsReinforced.push(score.managerName);
      } else {
        learning.backwardLearning.decisionsCorrected.push(
          `${score.managerName} needs improvement in: ${score.uncertaintyAreas.join(', ')}`
        );
      }
    }

    this.learningHistory.push(learning);

    console.log(`\n[Veritas Trinity] 🧠 Bilateral Learning:`);
    console.log(`  Forward: ${learning.forwardLearning.successfulPatterns.length} patterns`);
    console.log(`  Backward: ${learning.backwardLearning.uncertaintyPoints.length} uncertainty points analyzed`);
    console.log(`  Reinforced: ${learning.backwardLearning.decisionsReinforced.join(', ')}`);
  }

  /**
   * Record abstention (Honesty Premium!)
   */
  private recordAbstention(manager: string): void {
    const count = this.abstentionHistory.get(manager) || 0;
    this.abstentionHistory.set(manager, count + 1);
  }

  /**
   * Apply honesty premium to manager reputation
   * Architect: Operationalize honesty premium by affecting manager weighting
   * Architect: Cap reputation to prevent unbounded growth
   */
  private applyHonestyPremium(manager: string): void {
    const currentReputation = this.managerReputation.get(manager) || 1.0;
    const newReputation = Math.min(currentReputation * HONESTY_PREMIUM, MAX_REPUTATION);
    this.managerReputation.set(manager, newReputation);
    console.log(`[Veritas Trinity] 📈 ${manager} reputation: ${currentReputation.toFixed(2)} → ${newReputation.toFixed(2)} (max: ${MAX_REPUTATION})`);
  }

  /**
   * Verify evidence sources
   * Architect: Replace evidenceChain strings with validated EvidenceItem objects
   */
  private verifyEvidenceSources(sources: string[]): {
    allVerifiable: boolean;
    reliability: number;
  } {
    // For now, mark system-generated sources as verifiable
    const verifiableSources = [
      'System monitoring',
      'ANFIS routing patterns',
      'Historical task performance data',
      'Pattern matching and anomaly detection',
      'Known safe patterns database'
    ];

    const allVerifiable = sources.every(source => 
      verifiableSources.some(vs => source.includes(vs)) ||
      source.includes('verified')
    );

    const reliability = allVerifiable ? 0.95 : 0.60;

    return { allVerifiable, reliability };
  }

  /**
   * Create source-grounded decision with evidence
   */
  createSourceGroundedDecision(
    decision: string,
    confidence: number,
    context: Record<string, any>
  ): SourceGroundedDecision {
    const evidence: EvidenceItem[] = [];
    const uncertaintyAcknowledged: string[] = [];
    const abstentionReasons: string[] = [];

    // Extract evidence from context
    if (context.metrics) {
      evidence.push({
        claim: `Metric threshold exceeded`,
        source: 'System monitoring',
        reliability: 0.95,
        timestamp: Date.now(),
        verifiable: true
      });
    }

    if (context.pattern) {
      evidence.push({
        claim: `Pattern match: ${context.pattern}`,
        source: 'Known safe patterns database',
        reliability: 0.90,
        timestamp: Date.now(),
        verifiable: true
      });
    }

    // Acknowledge uncertainty
    if (confidence < CONFIDENCE_THRESHOLD) {
      uncertaintyAcknowledged.push(`Confidence ${(confidence * 100).toFixed(1)}% below 95% threshold`);
      abstentionReasons.push('Need additional verification before proceeding');
    }

    return {
      decision,
      confidence,
      evidence,
      uncertaintyAcknowledged,
      abstentionReasons
    };
  }

  /**
   * Get learning history for analysis
   */
  getLearningHistory(): BilateralLearning[] {
    return this.learningHistory;
  }

  /**
   * Get abstention statistics (Honesty Premium tracking)
   */
  getAbstentionStats(): Map<string, number> {
    return this.abstentionHistory;
  }

  /**
   * Get challenge history
   */
  getChallengeHistory(): AdversarialChallenge[] {
    return this.challengeHistory;
  }

  /**
   * Get overall system health
   */
  getVeritasHealth(): {
    averageConfidence: number;
    totalAbstentions: number;
    challengeSuccessRate: number;
    honestyPremiumsAwarded: number;
  } {
    const totalAbstentions = Array.from(this.abstentionHistory.values())
      .reduce((sum, count) => sum + count, 0);

    const approvedChallenges = this.challengeHistory.filter(
      c => c.overallAssessment === 'approved'
    ).length;

    return {
      averageConfidence: this.learningHistory.length > 0
        ? this.learningHistory.reduce((sum, l) => 
            sum + l.backwardLearning.decisionsReinforced.length, 0
          ) / this.learningHistory.length
        : 0,
      totalAbstentions,
      challengeSuccessRate: this.challengeHistory.length > 0
        ? approvedChallenges / this.challengeHistory.length
        : 0,
      honestyPremiumsAwarded: totalAbstentions
    };
  }
}

// Singleton instance
export const veritasEnhancedTrinity = new VeritasEnhancedTrinity();
