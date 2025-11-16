/**
 * Dynamic RepID Scoring with Temporal Dynamics
 * 
 * Enhances ZKP RepID system with:
 * - Temporal decay (old reputation fades)
 * - Recovery bonus (rewards improvement trends)
 * - Context-aware penalties (harsh for high-confidence mistakes, soft for edge cases)
 * - Difficulty-weighted rewards
 * 
 * Prevents permanent reputation damage from temporary provider issues
 * (API outages, model updates, etc.)
 */

export interface ValidationResult {
  correct: boolean;
  confidence: number;
  difficulty: number;
  isEdgeCase: boolean;
  timestamp: number;
  details?: string;
}

export interface RepIDUpdate {
  agentId: string;
  oldRepID: number;
  newRepID: number;
  change: number;
  reason: string;
  timestamp: number;
}

export interface RepIDConfig {
  decayRate: number;           // 0.95 = 5% daily decay
  recoveryBonus: number;        // 1.2 = 20% bonus when recovering
  baseReward: number;           // Base points for correct validation
  basePenalty: number;          // Base points penalty for incorrect
  minRepID: number;             // Minimum reputation (never fully distrust)
  maxRepID: number;             // Maximum reputation cap
}

export class DynamicRepIDScoring {
  private repidScores: Map<string, number> = new Map();
  private validationHistory: Map<string, ValidationResult[]> = new Map();
  private lastValidationTime: Map<string, number> = new Map();
  private updateHistory: Map<string, RepIDUpdate[]> = new Map();
  
  private config: RepIDConfig;

  constructor(config?: Partial<RepIDConfig>) {
    this.config = {
      decayRate: 0.95,
      recoveryBonus: 1.2,
      baseReward: 10,
      basePenalty: 15,
      minRepID: 10,
      maxRepID: 1000,
      ...config,
    };
  }

  /**
   * Update RepID with temporal dynamics and recovery detection
   */
  updateRepID(
    agentId: string,
    validationResult: ValidationResult
  ): RepIDUpdate {
    const currentRepID = this.getRepID(agentId);
    const lastValidation = this.lastValidationTime.get(agentId) || validationResult.timestamp;
    
    // Calculate time-based decay
    const decayedRepID = this.applyTemporalDecay(
      currentRepID,
      lastValidation,
      validationResult.timestamp
    );

    // Calculate new score based on validation
    let newRepID: number;
    
    if (validationResult.correct) {
      // Reward
      let reward = this.config.baseReward * validationResult.difficulty;
      
      // Recovery bonus if agent is improving
      if (this.isRecovering(agentId)) {
        reward *= this.config.recoveryBonus;
      }
      
      newRepID = decayedRepID + reward;
    } else {
      // Penalty
      const penalty = this.calculatePenalty(validationResult);
      newRepID = decayedRepID - penalty;
    }

    // Blend: more weight to recent performance
    const finalRepID = this.blendScores(decayedRepID, newRepID);

    // Enforce bounds
    const boundedRepID = Math.max(
      this.config.minRepID,
      Math.min(this.config.maxRepID, finalRepID)
    );

    // Record update
    const update: RepIDUpdate = {
      agentId,
      oldRepID: currentRepID,
      newRepID: boundedRepID,
      change: boundedRepID - currentRepID,
      reason: this.generateUpdateReason(validationResult, currentRepID, boundedRepID),
      timestamp: validationResult.timestamp,
    };

    // Commit changes
    this.repidScores.set(agentId, boundedRepID);
    this.lastValidationTime.set(agentId, validationResult.timestamp);
    this.recordValidation(agentId, validationResult);
    this.recordUpdate(agentId, update);

    return update;
  }

  /**
   * Apply temporal decay to reputation
   */
  private applyTemporalDecay(
    currentRepID: number,
    lastValidationTime: number,
    currentTime: number
  ): number {
    const hoursSinceLastValidation = (currentTime - lastValidationTime) / (1000 * 60 * 60);
    
    // Exponential decay: repid = repid * (decayRate ^ hours)
    const decayFactor = Math.pow(this.config.decayRate, hoursSinceLastValidation / 24); // Daily decay
    
    return currentRepID * decayFactor;
  }

  /**
   * Detect if agent is recovering from temporary degradation
   */
  private isRecovering(agentId: string): boolean {
    const history = this.getValidationHistory(agentId);
    
    if (history.length < 10) {
      return false;
    }

    // Compare first half vs second half of recent history
    const recentWindow = history.slice(-10);
    const firstHalf = recentWindow.slice(0, 5);
    const secondHalf = recentWindow.slice(5);

    const avgFirst = firstHalf.filter(v => v.correct).length / firstHalf.length;
    const avgSecond = secondHalf.filter(v => v.correct).length / secondHalf.length;

    // Recovering if second half significantly better (>15% improvement)
    return avgSecond > avgFirst + 0.15;
  }

  /**
   * Calculate context-aware penalty
   */
  private calculatePenalty(validationResult: ValidationResult): number {
    let penalty = this.config.basePenalty;

    // Harsher penalty for high-confidence mistakes
    if (validationResult.confidence > 0.9) {
      penalty *= 1.5;
    }

    // Softer penalty for edge cases (expected difficulty)
    if (validationResult.isEdgeCase) {
      penalty *= 0.7;
    }

    // Adjust for query difficulty (harder queries = softer penalty)
    penalty *= (2 - validationResult.difficulty); // difficulty 0-1, so 2-difficulty = 2 to 1

    return penalty;
  }

  /**
   * Blend old and new scores (more weight to recent)
   */
  private blendScores(decayedOld: number, newScore: number): number {
    return newScore * 0.7 + decayedOld * 0.3;
  }

  /**
   * Generate human-readable update reason
   */
  private generateUpdateReason(
    validation: ValidationResult,
    oldRepID: number,
    newRepID: number
  ): string {
    const change = newRepID - oldRepID;
    const direction = change > 0 ? 'increased' : 'decreased';
    
    if (validation.correct) {
      const agentId = ''; // Would be passed from context
      const recovering = false; // this.isRecovering(agentId);
      return `Correct validation (difficulty ${validation.difficulty.toFixed(2)})${recovering ? ' with recovery bonus' : ''}: RepID ${direction} by ${Math.abs(change).toFixed(1)}`;
    } else {
      const edgeCase = validation.isEdgeCase ? ' (edge case, reduced penalty)' : '';
      const confident = validation.confidence > 0.9 ? ' (high confidence error, increased penalty)' : '';
      return `Incorrect validation${edgeCase}${confident}: RepID ${direction} by ${Math.abs(change).toFixed(1)}`;
    }
  }

  /**
   * Get current RepID for agent
   */
  getRepID(agentId: string): number {
    return this.repidScores.get(agentId) || 100; // Default starting reputation
  }

  /**
   * Get validation history for agent
   */
  getValidationHistory(agentId: string): ValidationResult[] {
    if (!this.validationHistory.has(agentId)) {
      this.validationHistory.set(agentId, []);
    }
    return this.validationHistory.get(agentId)!;
  }

  /**
   * Record validation in history
   */
  private recordValidation(agentId: string, validation: ValidationResult): void {
    const history = this.getValidationHistory(agentId);
    history.push(validation);

    // Keep only recent history (last 100 validations)
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Record RepID update in history
   */
  private recordUpdate(agentId: string, update: RepIDUpdate): void {
    if (!this.updateHistory.has(agentId)) {
      this.updateHistory.set(agentId, []);
    }
    
    const history = this.updateHistory.get(agentId)!;
    history.push(update);

    // Keep last 50 updates
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Get update history for agent
   */
  getUpdateHistory(agentId: string): RepIDUpdate[] {
    return this.updateHistory.get(agentId) || [];
  }

  /**
   * Get performance statistics for agent
   */
  getAgentStats(agentId: string): {
    currentRepID: number;
    avgRepID: number;
    totalValidations: number;
    correctRate: number;
    recentCorrectRate: number;
    isRecovering: boolean;
    trend: 'improving' | 'declining' | 'stable';
  } {
    const currentRepID = this.getRepID(agentId);
    const history = this.getValidationHistory(agentId);
    const updates = this.getUpdateHistory(agentId);

    if (history.length === 0) {
      return {
        currentRepID,
        avgRepID: currentRepID,
        totalValidations: 0,
        correctRate: 0,
        recentCorrectRate: 0,
        isRecovering: false,
        trend: 'stable',
      };
    }

    const avgRepID = updates.reduce((sum, u) => sum + u.newRepID, 0) / updates.length;
    const correctRate = history.filter(v => v.correct).length / history.length;
    
    const recentHistory = history.slice(-10);
    const recentCorrectRate = recentHistory.filter(v => v.correct).length / recentHistory.length;

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable';
    if (updates.length >= 5) {
      const recentUpdates = updates.slice(-5);
      const avgChange = recentUpdates.reduce((sum, u) => sum + u.change, 0) / recentUpdates.length;
      
      if (avgChange > 2) {
        trend = 'improving';
      } else if (avgChange < -2) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
    } else {
      trend = 'stable';
    }

    return {
      currentRepID,
      avgRepID,
      totalValidations: history.length,
      correctRate,
      recentCorrectRate,
      isRecovering: this.isRecovering(agentId),
      trend,
    };
  }

  /**
   * Reset agent RepID (admin function)
   */
  resetRepID(agentId: string, newRepID?: number): void {
    this.repidScores.set(agentId, newRepID || 100);
    this.validationHistory.delete(agentId);
    this.updateHistory.delete(agentId);
    this.lastValidationTime.delete(agentId);
  }

  /**
   * Get leaderboard of top agents
   */
  getLeaderboard(limit: number = 10): Array<{ agentId: string; repid: number; stats: ReturnType<typeof this.getAgentStats> }> {
    const agents = Array.from(this.repidScores.entries())
      .map(([agentId, repid]) => ({
        agentId,
        repid,
        stats: this.getAgentStats(agentId),
      }))
      .sort((a, b) => b.repid - a.repid)
      .slice(0, limit);

    return agents;
  }
}

// Singleton instance for global RepID scoring
export const globalRepIDScoring = new DynamicRepIDScoring({
  decayRate: 0.95,
  recoveryBonus: 1.2,
  baseReward: 10,
  basePenalty: 15,
  minRepID: 10,
  maxRepID: 1000,
});
