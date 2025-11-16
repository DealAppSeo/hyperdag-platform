/**
 * AI Optimization Routes
 * 
 * API endpoints for the AI optimization system that analyzes system performance
 * and provides recommendations for resource allocation and performance improvements.
 */

import { Router, Request, Response } from 'express';
import { perplexityOptimizer } from '../../services/optimization/perplexity-optimizer';
import { metricsCollector } from '../../services/optimization/metrics-collector';
import { requireAuth } from '../../middleware/auth-middleware';
import { z } from 'zod';
import { logger } from '../../utils/logger';

// Create router
const router = Router();

/**
 * Get system optimization recommendations
 * GET /api/optimization/recommendations
 */
router.get('/recommendations', requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if the user is an admin or has the necessary permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can access optimization recommendations'
      });
    }
    
    // Get stored recommendations
    const recommendations = await perplexityOptimizer.getStoredRecommendations();
    
    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('[optimization-api] Error fetching recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch optimization recommendations',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate new system optimization recommendations
 * POST /api/optimization/analyze
 */
router.post('/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can run system optimization analysis'
      });
    }
    
    // Collect system metrics
    const metrics = await metricsCollector.collectMetrics();
    
    // Identify optimization targets
    const targets = await perplexityOptimizer.identifyOptimizationTargets(metrics);
    
    // Generate recommendations based on targets
    const recommendations = await perplexityOptimizer.generateRecommendations(targets, metrics);
    
    return res.status(200).json({
      success: true,
      data: {
        metrics,
        targets,
        recommendations
      }
    });
  } catch (error) {
    logger.error('[optimization-api] Error analyzing system:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze system for optimization',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Mark recommendation as implemented
 * POST /api/optimization/recommendations/:id/implement
 */
router.post('/recommendations/:id/implement', requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can mark recommendations as implemented'
      });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation ID'
      });
    }
    
    // Mark the recommendation as implemented
    await perplexityOptimizer.markRecommendationAsImplemented(id);
    
    return res.status(200).json({
      success: true,
      message: 'Recommendation marked as implemented'
    });
  } catch (error) {
    logger.error('[optimization-api] Error marking recommendation as implemented:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark recommendation as implemented',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Record recommendation effectiveness
 * POST /api/optimization/recommendations/:id/effectiveness
 */
router.post('/recommendations/:id/effectiveness', requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can record recommendation effectiveness'
      });
    }
    
    // Validate request body
    const schema = z.object({
      effectiveness: z.number().min(0).max(1)
    });
    
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: validationResult.error.format()
      });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation ID'
      });
    }
    
    // Record the effectiveness
    await perplexityOptimizer.recordRecommendationEffectiveness(id, validationResult.data.effectiveness);
    
    return res.status(200).json({
      success: true,
      message: 'Recommendation effectiveness recorded'
    });
  } catch (error) {
    logger.error('[optimization-api] Error recording recommendation effectiveness:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record recommendation effectiveness',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get current system metrics
 * GET /api/optimization/metrics
 */
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can access system metrics'
      });
    }
    
    // Collect system metrics
    const metrics = await metricsCollector.collectMetrics();
    
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('[optimization-api] Error collecting system metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to collect system metrics',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;