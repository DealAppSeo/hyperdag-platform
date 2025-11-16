/**
 * Trinity Manager API Routes
 * 
 * Provides endpoints for Trinity Managers (APM, HDM, Mel) to:
 * - Update their configurations
 * - Update RepID scores for users
 * - Verify reputation
 * - Log interactions and activities
 * - Sync performance metrics
 */

import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { repidCredentials, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/trinity/managers
 * Get all Trinity Manager configurations
 */
router.get('/', async (req, res) => {
  try {
    const managers = await storage.getAllTrinityManagerConfigs();
    
    res.json({
      success: true,
      data: managers,
      message: `Retrieved ${managers.length} manager configurations`
    });
  } catch (error) {
    console.error('[Trinity Manager API] Error getting managers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve managers'
    });
  }
});

/**
 * GET /api/trinity/managers/:managerId
 * Get specific manager configuration
 */
router.get('/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const manager = await storage.getTrinityManagerConfig(managerId);
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    res.json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('[Trinity Manager API] Error getting manager:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve manager'
    });
  }
});

/**
 * POST /api/trinity/managers/:managerId/update-repid
 * Update RepID score for a user (for Mel to call when verifying work)
 */
router.post('/:managerId/update-repid', async (req, res) => {
  try {
    const { managerId } = req.params;
    const updateRepidSchema = z.object({
      userId: z.number().int().positive(),
      scoreChange: z.number().int(), // Can be positive or negative
      reason: z.string().min(5),
      confidence: z.number().min(0).max(1).optional(),
      metadata: z.record(z.any()).optional()
    });
    
    const parsed = updateRepidSchema.parse(req.body);
    
    // Verify manager exists
    const manager = await storage.getTrinityManagerConfig(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    // Get user's current RepID
    const user = await storage.getUser(parsed.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User ${parsed.userId} not found`
      });
    }
    
    // Fetch current RepID credentials
    let [repidCred] = await db
      .select()
      .from(repidCredentials)
      .where(eq(repidCredentials.userId, parsed.userId));
    
    // If user doesn't have RepID yet, create one
    if (!repidCred) {
      [repidCred] = await db
        .insert(repidCredentials)
        .values({
          userId: parsed.userId,
          walletAddress: user.serverWalletAddress || 'pending',
          repidScore: 0,
          network: 'polygon-cardona'
        })
        .returning();
    }
    
    const currentRepID = repidCred.repidScore;
    
    // Apply scoreChange with bounds checking (-100 to +100 per update)
    const boundedChange = Math.max(-100, Math.min(100, parsed.scoreChange));
    const newRepID = Math.max(0, currentRepID + boundedChange);
    
    // Update RepID in database
    const [updated] = await db
      .update(repidCredentials)
      .set({
        repidScore: newRepID,
        lastVerified: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...repidCred.metadata,
          lastUpdate: {
            timestamp: new Date(),
            updatedBy: managerId,
            scoreChange: boundedChange,
            reason: parsed.reason,
            confidence: parsed.confidence
          }
        }
      })
      .where(eq(repidCredentials.userId, parsed.userId))
      .returning();
    
    // Log the RepID update activity
    console.log(`[Trinity ${managerId}] RepID update for user ${parsed.userId}: ${boundedChange >= 0 ? '+' : ''}${boundedChange} (${parsed.reason}) - Score: ${currentRepID} → ${newRepID}`);
    
    res.json({
      success: true,
      data: {
        userId: parsed.userId,
        oldRepID: currentRepID,
        newRepID,
        scoreChange: boundedChange,
        reason: parsed.reason,
        updatedBy: managerId,
        confidence: parsed.confidence
      },
      message: `RepID ${boundedChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(boundedChange)}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    console.error('[Trinity Manager API] Error updating RepID:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update RepID'
    });
  }
});

/**
 * POST /api/trinity/managers/:managerId/verify-reputation
 * Verify reputation/confidence for a task or action
 */
router.post('/:managerId/verify-reputation', async (req, res) => {
  try {
    const { managerId } = req.params;
    const verifySchema = z.object({
      targetType: z.enum(['task', 'user', 'code', 'decision']),
      targetId: z.union([z.number(), z.string()]),
      confidence: z.number().min(0).max(1),
      verdict: z.enum(['approved', 'rejected', 'needs_review']),
      reasoning: z.string().min(10),
      metadata: z.record(z.any()).optional()
    });
    
    const parsed = verifySchema.parse(req.body);
    
    // Verify manager exists
    const manager = await storage.getTrinityManagerConfig(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    // Log verification activity
    console.log(`[Trinity ${managerId}] Verification: ${parsed.targetType} ${parsed.targetId} = ${parsed.verdict} (confidence: ${(parsed.confidence * 100).toFixed(1)}%)`);
    
    // Determine if challenge threshold is met
    const challengeThreshold = manager.thresholds?.challengeThreshold || 0.90;
    const needsChallenge = parsed.confidence < challengeThreshold;
    
    res.json({
      success: true,
      data: {
        targetType: parsed.targetType,
        targetId: parsed.targetId,
        confidence: parsed.confidence,
        verdict: parsed.verdict,
        reasoning: parsed.reasoning,
        verifiedBy: managerId,
        needsChallenge,
        challengeThreshold,
        timestamp: new Date()
      },
      message: needsChallenge 
        ? `Verification complete - confidence below threshold, challenge recommended`
        : `Verification complete - confidence acceptable`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    console.error('[Trinity Manager API] Error verifying reputation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify reputation'
    });
  }
});

/**
 * POST /api/trinity/managers/:managerId/log-interaction
 * Log an interaction or activity by a manager
 */
router.post('/:managerId/log-interaction', async (req, res) => {
  try {
    const { managerId } = req.params;
    const logSchema = z.object({
      interactionType: z.string(),
      description: z.string().min(5),
      targetId: z.union([z.number(), z.string()]).optional(),
      success: z.boolean(),
      duration: z.number().optional(), // milliseconds
      tokensUsed: z.number().optional(),
      costUsd: z.number().optional(),
      metadata: z.record(z.any()).optional()
    });
    
    const parsed = logSchema.parse(req.body);
    
    // Verify manager exists and get config
    const manager = await storage.getTrinityManagerConfig(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    // Update performance metrics if provided
    if (parsed.tokensUsed || parsed.costUsd || parsed.duration || parsed.success !== undefined) {
      const currentMetrics = manager.performanceMetrics || {};
      const updates: any = {
        lastActivity: new Date()
      };
      
      if (parsed.tokensUsed) {
        updates.tokensUsed = (currentMetrics.tokensUsed || 0) + parsed.tokensUsed;
      }
      if (parsed.costUsd) {
        updates.costUsd = (currentMetrics.costUsd || 0) + parsed.costUsd;
      }
      if (parsed.success !== undefined) {
        // Fix metrics calculation: use proper counters instead of errorRate fraction
        const tasksCompleted = currentMetrics.tasksCompleted || 0;
        const successRate = currentMetrics.successRate || 0;
        const previousSuccesses = Math.floor(tasksCompleted * successRate);
        const newSuccesses = previousSuccesses + (parsed.success ? 1 : 0);
        const newTotal = tasksCompleted + 1;
        
        updates.tasksCompleted = newTotal;
        updates.successRate = newTotal > 0 ? newSuccesses / newTotal : 0;
        
        if (!parsed.success) {
          updates.errorRate = ((currentMetrics.errorRate || 0) * tasksCompleted + 1) / newTotal;
        }
      }
      
      await storage.updateManagerPerformanceMetrics(managerId, updates);
    }
    
    console.log(`[Trinity ${managerId}] Interaction logged: ${parsed.interactionType} - ${parsed.description} (success: ${parsed.success})`);
    
    res.json({
      success: true,
      data: {
        managerId,
        interactionType: parsed.interactionType,
        description: parsed.description,
        success: parsed.success,
        timestamp: new Date()
      },
      message: 'Interaction logged successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    console.error('[Trinity Manager API] Error logging interaction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log interaction'
    });
  }
});

/**
 * PATCH /api/trinity/managers/:managerId/role
 * Update manager role (for role rotation system)
 */
router.patch('/:managerId/role', async (req, res) => {
  try {
    const { managerId } = req.params;
    const roleSchema = z.object({
      role: z.enum(['conductor', 'performer', 'learner', 'observer']),
      reason: z.string().optional()
    });
    
    const parsed = roleSchema.parse(req.body);
    
    const updated = await storage.updateManagerRole(managerId, parsed.role);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    console.log(`[Trinity ${managerId}] Role changed to: ${parsed.role}${parsed.reason ? ` (${parsed.reason})` : ''}`);
    
    res.json({
      success: true,
      data: updated,
      message: `Manager role updated to ${parsed.role}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    console.error('[Trinity Manager API] Error updating role:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role'
    });
  }
});

/**
 * PATCH /api/trinity/managers/:managerId/metrics
 * Update manager performance metrics
 */
router.patch('/:managerId/metrics', async (req, res) => {
  try {
    const { managerId } = req.params;
    const metricsSchema = z.object({
      tasksCompleted: z.number().optional(),
      tasksInProgress: z.number().optional(),
      successRate: z.number().min(0).max(1).optional(),
      tokensUsed: z.number().optional(),
      costUsd: z.number().optional(),
      errorRate: z.number().min(0).max(1).optional(),
      p50Latency: z.number().optional(),
      p95Latency: z.number().optional(),
      throughput: z.number().optional(),
      backlog: z.number().optional(),
      confidenceAvg: z.number().min(0).max(1).optional(),
      challengeRate: z.number().min(0).max(1).optional(),
      escalationCount: z.number().optional()
    });
    
    const parsed = metricsSchema.parse(req.body);
    
    const updated = await storage.updateManagerPerformanceMetrics(managerId, parsed);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Manager ${managerId} not found`
      });
    }
    
    res.json({
      success: true,
      data: updated.performanceMetrics,
      message: 'Manager metrics updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    console.error('[Trinity Manager API] Error updating metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metrics'
    });
  }
});

export default router;
