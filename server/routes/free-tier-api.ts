/**
 * Free-Tier Status API
 * Dashboard for monitoring autonomous free coding capabilities
 */

import { Router } from 'express';
import { freeTierMonitor } from '../services/autonomous/free-tier-quota-monitor';

const router = Router();

/**
 * GET /api/free-tier/status
 * Get current free-tier quota status
 */
router.get('/status', (req, res) => {
  try {
    const status = freeTierMonitor.getQuotaStatus();
    
    res.json({
      success: true,
      data: status,
      message: `${status.totalAvailable} providers available, $${status.estimatedDailySavings.toFixed(2)} saved today`
    });
  } catch (error) {
    console.error('[Free-Tier API] Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch free-tier status'
    });
  }
});

/**
 * GET /api/free-tier/can-run
 * Check if autonomous coding can run for free right now
 */
router.get('/can-run', (req, res) => {
  try {
    const result = freeTierMonitor.canRunForFree();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Free-Tier API] Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check free-tier availability'
    });
  }
});

/**
 * GET /api/free-tier/next-provider
 * Get optimal next provider for a task
 */
router.get('/next-provider', (req, res) => {
  try {
    const taskType = req.query.taskType as string | undefined;
    const rotation = freeTierMonitor.getNextFreeProvider(taskType);
    
    res.json({
      success: true,
      data: rotation,
      message: `Recommended: ${rotation.nextProvider} - ${rotation.switchReason}`
    });
  } catch (error) {
    console.error('[Free-Tier API] Error getting next provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to determine next provider'
    });
  }
});

/**
 * POST /api/free-tier/record-usage
 * Record usage of a free provider (for tracking)
 */
router.post('/record-usage', (req, res) => {
  try {
    const { provider, requestCount = 1, success = true } = req.body;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider name required'
      });
    }

    freeTierMonitor.recordUsage(provider, requestCount, success);
    
    res.json({
      success: true,
      message: `Recorded ${requestCount} request(s) for ${provider}`
    });
  } catch (error) {
    console.error('[Free-Tier API] Error recording usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record usage'
    });
  }
});

export default router;
