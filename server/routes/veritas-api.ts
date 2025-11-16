/**
 * Veritas-Enhanced Trinity API Routes
 * Exposes confidence-calibrated, hallucination-suppressed AI decision making
 */

import { Router } from 'express';
import { z } from 'zod';
import { veritasEnhancedTrinity } from '../services/trinity/veritas-enhanced-trinity';
import { veritasAutonomousEngine } from '../services/autonomous/veritas-integration';

const router = Router();

// Architect: Add Zod validation schemas
const ALLOWED_MANAGERS = ['AI-Prompt-Manager', 'HyperDagManager', 'Mel'];

const consensusSchema = z.object({
  task: z.string().min(1, 'Task description required'),
  managers: z.array(z.enum(ALLOWED_MANAGERS as [string, ...string[]])).optional()
});

const groundedDecisionSchema = z.object({
  description: z.string().min(1, 'Description required'),
  type: z.enum(['fix', 'optimization', 'feature']),
  context: z.record(z.any()).optional()
});

/**
 * POST /api/veritas/consensus (Architect: Fixed comment - was GET, is POST)
 * Get confidence-weighted consensus from Trinity managers
 */
router.post('/consensus', async (req, res) => {
  try {
    // Architect: Add Zod validation
    const validated = consensusSchema.parse(req.body);
    const { task, managers } = validated;

    const consensus = await veritasEnhancedTrinity.getConfidenceWeightedConsensus(
      task,
      managers
    );

    res.json({
      success: true,
      consensus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/veritas/grounded-decision
 * Create source-grounded decision with evidence tracking
 */
router.post('/grounded-decision', async (req, res) => {
  try {
    // Architect: Add Zod validation
    const validated = groundedDecisionSchema.parse(req.body);
    const { description, type, context } = validated;

    const decision = await veritasAutonomousEngine.createGroundedDecision(
      description,
      type,
      context || {}
    );

    res.json({
      success: true,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/veritas/health
 * Get Veritas system health metrics
 */
router.get('/health', async (req, res) => {
  try {
    const health = veritasAutonomousEngine.getSystemHealth();
    const veritasHealth = veritasEnhancedTrinity.getVeritasHealth();

    res.json({
      success: true,
      health,
      metrics: {
        ...veritasHealth,
        confidenceThreshold: 0.95,
        honestyPremium: 1.5
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/veritas/learning-history
 * Get bilateral learning history
 */
router.get('/learning-history', async (req, res) => {
  try {
    const history = veritasEnhancedTrinity.getLearningHistory();
    const limit = parseInt(req.query.limit as string) || 50;

    res.json({
      success: true,
      history: history.slice(-limit),
      total: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/veritas/abstention-stats
 * Get honesty premium statistics (who abstained and why)
 */
router.get('/abstention-stats', async (req, res) => {
  try {
    const stats = veritasEnhancedTrinity.getAbstentionStats();
    
    const statsArray = Array.from(stats.entries()).map(([manager, count]) => ({
      manager,
      abstentionCount: count,
      honestyScore: count * 1.5 // Honesty premium multiplier
    }));

    res.json({
      success: true,
      abstentionStats: statsArray,
      totalAbstentions: Array.from(stats.values()).reduce((sum, count) => sum + count, 0),
      honestyPremium: 1.5,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/veritas/challenge-history
 * Get adversarial challenge results
 */
router.get('/challenge-history', async (req, res) => {
  try {
    const history = veritasEnhancedTrinity.getChallengeHistory();
    const limit = parseInt(req.query.limit as string) || 50;

    const stats = {
      total: history.length,
      approved: history.filter(c => c.overallAssessment === 'approved').length,
      needsRevision: history.filter(c => c.overallAssessment === 'needs_revision').length,
      rejected: history.filter(c => c.overallAssessment === 'rejected').length
    };

    res.json({
      success: true,
      challenges: history.slice(-limit),
      stats,
      successRate: history.length > 0 ? stats.approved / history.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
