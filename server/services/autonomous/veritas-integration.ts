/**
 * Veritas Integration with Autonomous Decision Engine
 * Combines Trinity's efficiency with Veritas's accuracy
 */

import { autonomousDecisionEngine, Decision } from './autonomous-decision-engine';
import { veritasEnhancedTrinity } from '../trinity/veritas-enhanced-trinity';
import { EventEmitter } from 'events';

export class VeritasAutonomousEngine extends EventEmitter {
  constructor() {
    super();
    this.integrateWithAutonomousEngine();
    console.log('[Veritas Autonomous] 🔬 Integrated hallucination suppression with autonomous decisions');
  }

  /**
   * Integrate Veritas confidence checking into autonomous decisions
   */
  private integrateWithAutonomousEngine(): void {
    // Hook into decision evaluation
    autonomousDecisionEngine.on('decision_evaluated', async (decision: Decision) => {
      // Only apply Veritas to high-stakes decisions
      if (decision.totalScore >= 80 || decision.type === 'fix') {
        await this.applyVeritasValidation(decision);
      }
    });

    console.log('[Veritas Autonomous] ✅ Hooked into autonomous decision engine');
  }

  /**
   * Apply Veritas validation to autonomous decisions
   */
  private async applyVeritasValidation(decision: Decision): Promise<void> {
    console.log(`\n[Veritas Autonomous] 🔍 Validating decision: "${decision.description}"`);

    // Get Trinity consensus with confidence scoring
    const consensus = await veritasEnhancedTrinity.getConfidenceWeightedConsensus(
      decision.description,
      ['AI-Prompt-Manager', 'HyperDagManager', 'Mel']
    );

    // Update decision based on Veritas results
    if (consensus.shouldDefer) {
      console.log(`[Veritas Autonomous] ⏸️  DEFERRING: ${consensus.deferReason}`);
      
      // Downgrade priority if confidence is too low
      if (decision.priority === 'auto_implement') {
        decision.priority = 'schedule_24h';
        decision.status = 'scheduled';
        decision.scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        console.log('[Veritas Autonomous] 📅 Downgraded from auto_implement to schedule_24h');
      }

      // Add defer reason to context
      decision.context.veritasDeferReason = consensus.deferReason;
      decision.context.veritasConfidence = consensus.overallConfidence;
    } else {
      console.log(`[Veritas Autonomous] ✅ APPROVED with ${(consensus.overallConfidence * 100).toFixed(1)}% confidence`);
      
      // Add evidence to decision
      decision.context.veritasEvidence = consensus.evidenceChain;
      decision.context.veritasConfidence = consensus.overallConfidence;
      decision.context.veritasUnanimity = consensus.unanimity;
    }

    // Track abstentions (Honesty Premium!)
    if (consensus.abstentions.length > 0) {
      console.log(`[Veritas Autonomous] 🎖️  Honesty premium: ${consensus.abstentions.join(', ')} abstained`);
      decision.context.veritasAbstentions = consensus.abstentions;
    }

    // Emit validation event
    this.emit('veritas_validation_complete', { decision, consensus });
  }

  /**
   * Create source-grounded decision with evidence
   */
  async createGroundedDecision(
    description: string,
    type: Decision['type'],
    context: Record<string, any>
  ): Promise<Decision> {
    console.log(`\n[Veritas Autonomous] 📝 Creating source-grounded decision...`);

    // Get Trinity consensus first
    const consensus = await veritasEnhancedTrinity.getConfidenceWeightedConsensus(
      description,
      ['AI-Prompt-Manager', 'HyperDagManager', 'Mel']
    );

    // Add Veritas context
    const enhancedContext = {
      ...context,
      veritasConfidence: consensus.overallConfidence,
      veritasEvidence: consensus.evidenceChain,
      veritasUnanimity: consensus.unanimity,
      veritasAbstentions: consensus.abstentions,
      veritasShouldDefer: consensus.shouldDefer,
      veritasDeferReason: consensus.deferReason
    };

    // Create decision through autonomous engine
    const decision = await autonomousDecisionEngine.evaluateDecision(
      type,
      description,
      enhancedContext
    );

    // Override priority if Veritas says defer
    if (consensus.shouldDefer && decision.priority === 'auto_implement') {
      decision.priority = 'schedule_24h';
      decision.status = 'scheduled';
      decision.scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log('[Veritas Autonomous] ⏸️  Overriding auto_implement due to low confidence');
    }

    return decision;
  }

  /**
   * Get combined Veritas + Autonomous health metrics
   */
  getSystemHealth(): {
    autonomous: any;
    veritas: any;
    combined: {
      decisionsWithHighConfidence: number;
      honestyRate: number;
      averageConfidence: number;
    };
  } {
    const autonomousMetrics = autonomousDecisionEngine.getMetrics();
    const veritasHealth = veritasEnhancedTrinity.getVeritasHealth();

    return {
      autonomous: autonomousMetrics,
      veritas: veritasHealth,
      combined: {
        decisionsWithHighConfidence: Math.floor(
          autonomousMetrics.totalDecisions * veritasHealth.averageConfidence
        ),
        honestyRate: veritasHealth.totalAbstentions / Math.max(autonomousMetrics.totalDecisions, 1),
        averageConfidence: veritasHealth.averageConfidence
      }
    };
  }
}

// Singleton instance
export const veritasAutonomousEngine = new VeritasAutonomousEngine();
