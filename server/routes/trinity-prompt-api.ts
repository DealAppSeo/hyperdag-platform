/**
 * Trinity Prompt Distribution API
 * Endpoint for updating prompts across all 3 managers simultaneously
 */

import { Router } from 'express';
import { trinityCoordinator } from '../services/trinity/trinity-supabase-coordinator';

const router = Router();

/**
 * POST /api/trinity/prompt/update
 * Update the unified Trinity prompt for all managers
 */
router.post('/prompt/update', async (req, res) => {
  try {
    const { prompt_text, manager = 'HyperDAG' } = req.body;

    if (!prompt_text) {
      return res.status(400).json({
        success: false,
        error: 'prompt_text is required'
      });
    }

    // Update prompt in Supabase (broadcasts to all managers)
    await trinityCoordinator.updatePrompt(prompt_text, manager);

    res.json({
      success: true,
      message: 'Prompt updated and broadcast to all Trinity managers',
      data: {
        version: Date.now(),
        manager,
        broadcast: 'real-time'
      }
    });
  } catch (error) {
    console.error('[Trinity API] Error updating prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update prompt'
    });
  }
});

/**
 * GET /api/trinity/prompt/active
 * Get the currently active Trinity prompt
 */
router.get('/prompt/active', async (req, res) => {
  try {
    const prompt = await trinityCoordinator.getActivePrompt();

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'No active prompt found'
      });
    }

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    console.error('[Trinity API] Error fetching prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompt'
    });
  }
});

/**
 * GET /api/trinity/status
 * Get Trinity coordination status
 */
router.get('/status', (req, res) => {
  const status = trinityCoordinator.getStatus();
  
  res.json({
    success: true,
    data: {
      ...status,
      managers: {
        hyperdag: 'active',
        'ai-prompt-manager': 'active',
        mel: 'pending_connection'
      }
    }
  });
});

export default router;
