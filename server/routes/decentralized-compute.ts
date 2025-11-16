/**
 * Decentralized Compute API Routes
 * Provides endpoints for distributed computation with persistent state and arbitrage pricing
 */

import { Router } from 'express';
// import { decentralizedCompute } from '../services/decentralized-compute.js';

const router = Router();

/**
 * GET /api/decentralized-compute/status
 * Get comprehensive compute infrastructure status
 */
router.get('/status', async (req, res) => {
  try {
    const status = decentralizedCompute.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compute status'
    });
  }
});

/**
 * GET /api/decentralized-compute/pricing
 * Get current pricing across all compute providers
 */
router.get('/pricing', async (req, res) => {
  try {
    const pricing = decentralizedCompute.getCurrentPricing();
    res.json({
      success: true,
      data: {
        pricing,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Pricing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing information'
    });
  }
});

/**
 * GET /api/decentralized-compute/arbitrage
 * Get current arbitrage opportunities for cost optimization
 */
router.get('/arbitrage', async (req, res) => {
  try {
    const opportunities = decentralizedCompute.getArbitrageOpportunities();
    res.json({
      success: true,
      data: {
        opportunities,
        totalOpportunities: opportunities.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Arbitrage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get arbitrage opportunities'
    });
  }
});

/**
 * POST /api/decentralized-compute/submit-task
 * Submit a compute task with optimal provider selection
 */
router.post('/submit-task', async (req, res) => {
  try {
    const { type, requirements, persistentState, costBudget } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required'
      });
    }

    const taskId = await decentralizedCompute.submitTask({
      type,
      requirements,
      persistentState,
      costBudget
    });

    res.json({
      success: true,
      data: {
        taskId,
        message: 'Task submitted successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Submit task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit task'
    });
  }
});

/**
 * GET /api/decentralized-compute/task/:taskId
 * Get task status and results
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = (decentralizedCompute as any).tasks?.get(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const persistentState = decentralizedCompute.getPersistentState(taskId);

    res.json({
      success: true,
      data: {
        task,
        persistentState,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task information'
    });
  }
});

/**
 * PUT /api/decentralized-compute/task/:taskId/state
 * Update persistent state for a task
 */
router.put('/task/:taskId/state', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'State data is required'
      });
    }

    decentralizedCompute.updatePersistentState(taskId, state);

    res.json({
      success: true,
      data: {
        message: 'Persistent state updated successfully',
        taskId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] Update state error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persistent state'
    });
  }
});

/**
 * POST /api/decentralized-compute/ai-inference
 * Submit AI inference task with automatic provider selection
 */
router.post('/ai-inference', async (req, res) => {
  try {
    const { prompt, modelRequirements, budget = 5.0 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required for AI inference'
      });
    }

    const taskId = await decentralizedCompute.submitTask({
      type: 'ai-inference',
      requirements: {
        cpu: modelRequirements?.cpu || 4,
        memory: modelRequirements?.memory || 8,
        storage: modelRequirements?.storage || 20,
        duration: modelRequirements?.duration || 0.5, // 30 minutes
        priority: modelRequirements?.priority || 'medium'
      },
      persistentState: {
        prompt,
        modelType: modelRequirements?.modelType || 'general',
        requestTime: new Date()
      },
      costBudget: budget
    });

    res.json({
      success: true,
      data: {
        taskId,
        message: 'AI inference task submitted',
        estimatedCompletion: '2-5 minutes',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedCompute API] AI inference error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit AI inference task'
    });
  }
});

export default router;