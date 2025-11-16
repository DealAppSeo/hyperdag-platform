/**
 * Trinity Distributed Communication API
 * 
 * Provides HTTP endpoints for distributed Trinity Symphony coordination
 * Enables manual task distribution and monitoring across deployments
 */

import { Router, type Request, type Response } from 'express';
import { getTrinityMessageQueue } from '../services/distributed/trinity-message-queue';
import { getTrinityTaskCoordinator } from '../services/distributed/trinity-task-coordinator';
import {
  createTrinityMessage,
  type TrinityDeployment,
  type MessageType,
} from '../services/distributed/trinity-message-protocol';

const router = Router();

/**
 * Initialize Trinity distributed messaging (called on server startup)
 */
export async function initializeTrinityDistributed(): Promise<void> {
  try {
    const coordinator = getTrinityTaskCoordinator();
    await coordinator.initialize();
    console.log('[Trinity Distributed API] ✅ Distributed coordination initialized');
  } catch (error) {
    console.error('[Trinity Distributed API] ❌ Initialization failed:', error);
  }
}

/**
 * GET /api/trinity/status
 * Get status of distributed Trinity system
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const messageQueue = getTrinityMessageQueue();
    const coordinator = getTrinityTaskCoordinator();

    const status = {
      messageQueue: messageQueue.getStatus(),
      taskCoordinator: coordinator.getStatus(),
      timestamp: Date.now(),
    };

    res.json(status);
  } catch (error) {
    console.error('[Trinity Distributed API] Status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

/**
 * POST /api/trinity/task/distribute
 * Distribute a task to another Trinity deployment
 */
router.post('/task/distribute', async (req: Request, res: Response) => {
  try {
    const { taskType, input, options } = req.body;

    if (!taskType || !input) {
      return res.status(400).json({ error: 'taskType and input required' });
    }

    const coordinator = getTrinityTaskCoordinator();
    const result = await coordinator.distributeTask(taskType, input, options);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[Trinity Distributed API] Task distribution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/trinity/message/send
 * Send a message to another deployment
 */
router.post('/message/send', async (req: Request, res: Response) => {
  try {
    const { to, type, payload, priority } = req.body;

    if (!to || !type || !payload) {
      return res.status(400).json({ error: 'to, type, and payload required' });
    }

    const messageQueue = getTrinityMessageQueue();
    const message = createTrinityMessage(
      messageQueue.getStatus().deployment,
      to as TrinityDeployment,
      type as MessageType,
      payload,
      { priority: priority || 'normal' }
    );

    const success = await messageQueue.sendMessage(message);

    res.json({
      success,
      messageId: message.messageId,
    });
  } catch (error) {
    console.error('[Trinity Distributed API] Message send error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/trinity/message/broadcast
 * Broadcast a message to all deployments
 */
router.post('/message/broadcast', async (req: Request, res: Response) => {
  try {
    const { type, payload, priority } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload required' });
    }

    const messageQueue = getTrinityMessageQueue();
    const success = await messageQueue.broadcast(
      type as MessageType,
      payload,
      priority || 'normal'
    );

    res.json({ success });
  } catch (error) {
    console.error('[Trinity Distributed API] Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/trinity/learning/share
 * Share a learning update with other deployments
 */
router.post('/learning/share', async (req: Request, res: Response) => {
  try {
    const { category, insights, confidence } = req.body;

    if (!category || !insights || confidence === undefined) {
      return res.status(400).json({ error: 'category, insights, and confidence required' });
    }

    const coordinator = getTrinityTaskCoordinator();
    await coordinator.shareLearning(category, insights, confidence);

    res.json({ success: true });
  } catch (error) {
    console.error('[Trinity Distributed API] Learning share error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/trinity/health
 * Health check endpoint for monitoring
 */
router.get('/health', (req: Request, res: Response) => {
  const messageQueue = getTrinityMessageQueue();
  const status = messageQueue.getStatus();

  res.json({
    healthy: status.connected,
    deployment: status.deployment,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

export default router;
