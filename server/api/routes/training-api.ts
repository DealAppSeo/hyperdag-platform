/**
 * Training API Routes
 * 
 * RESTful API for the Web3 Training Academy gasless learning environment
 */

import { Router, Request, Response } from 'express';
import { getSmartWalletService } from '../../services/smart-wallet-service.js';
import { logger } from '../../utils/logger.js';
import { requireAuth } from '../../middleware/auth.js';
import { strictLimiter } from '../../middleware/rate-limiter.js';

const router = Router();
const smartWalletService = getSmartWalletService();

/**
 * Start a new training session
 * @route POST /api/training/start
 */
router.post('/start', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { testMode = true } = req.body;

    // Create new training session
    const sessionId = smartWalletService.createTrainingSession(userId);
    
    logger.info(`[Training API] New training session created: ${sessionId} for user: ${String(userId)}`);

    res.json({
      success: true,
      sessionId,
      message: 'Training session started successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error starting training session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start training session'
    });
  }
});

/**
 * Get training session details
 * @route GET /api/training/session/:sessionId
 */
router.get('/session/:sessionId', [requireAuth], async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const session = smartWalletService.getTrainingSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found'
      });
    }

    // Verify session belongs to user
    if (session.userId !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to training session'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('[Training API] Error fetching training session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training session'
    });
  }
});

/**
 * Create a gasless training wallet
 * @route POST /api/training/create-wallet
 */
router.post('/create-wallet', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const { sessionId, testMode = true } = req.body;
    const userId = req.user?.id;

    const session = smartWalletService.getTrainingSession(sessionId);
    if (!session || session.userId !== String(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found or access denied'
      });
    }

    // Create smart wallet
    const wallet = await smartWalletService.createTrainingWallet({
      testMode,
      socialLogin: false
    });

    // Update session with wallet info
    session.walletAddress = wallet.address;
    session.smartAccount = wallet.smartAccount;

    logger.info(`[Training API] Smart wallet created: ${wallet.address} for session: ${sessionId}`);

    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        isGasless: wallet.isGasless,
        networkInfo: wallet.networkInfo
      },
      message: 'Smart wallet created successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error creating smart wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create smart wallet'
    });
  }
});

/**
 * Complete a training step
 * @route POST /api/training/complete-step
 */
router.post('/complete-step', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const { sessionId, stepId, transactionData } = req.body;
    const userId = req.user?.id;

    const session = smartWalletService.getTrainingSession(sessionId);
    if (!session || session.userId !== String(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found or access denied'
      });
    }

    // Complete the step
    const result = await smartWalletService.completeTrainingStep(sessionId, stepId, transactionData);

    logger.info(`[Training API] Training step completed: ${stepId} for session: ${sessionId}`);

    res.json({
      success: true,
      ...result,
      message: 'Training step completed successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error completing training step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete training step'
    });
  }
});

/**
 * Execute a gasless transaction (demo)
 * @route POST /api/training/gasless-transaction
 */
router.post('/gasless-transaction', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const { sessionId, to, data, value } = req.body;
    const userId = req.user?.id;

    const session = smartWalletService.getTrainingSession(sessionId);
    if (!session || session.userId !== String(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found or access denied'
      });
    }

    if (!session.smartAccount) {
      return res.status(400).json({
        success: false,
        message: 'No smart wallet found for this session'
      });
    }

    // Execute gasless transaction
    const result = await smartWalletService.executeGaslessTransaction(
      session.smartAccount,
      { to, data, value }
    );

    logger.info(`[Training API] Gasless transaction executed: ${result.transactionHash} for session: ${sessionId}`);

    res.json({
      success: true,
      result,
      message: 'Gasless transaction executed successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error executing gasless transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute gasless transaction'
    });
  }
});

/**
 * Get gasless transaction estimate
 * @route POST /api/training/estimate-gasless
 */
router.post('/estimate-gasless', [requireAuth], async (req: Request, res: Response) => {
  try {
    const { to, data, value } = req.body;

    // Get gasless estimate
    const estimate = await smartWalletService.getGaslessEstimate({ to, data, value });

    res.json({
      success: true,
      estimate,
      message: 'Gasless estimate calculated successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error getting gasless estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gasless estimate'
    });
  }
});

/**
 * Get training statistics
 * @route GET /api/training/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = smartWalletService.getTrainingStats();

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    logger.error('[Training API] Error fetching training stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training stats'
    });
  }
});

/**
 * Reset training session (for development/testing)
 * @route POST /api/training/reset/:sessionId
 */
router.post('/reset/:sessionId', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const session = smartWalletService.getTrainingSession(sessionId);
    if (!session || session.userId !== String(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found or access denied'
      });
    }

    // Reset session state
    session.steps.forEach(step => step.completed = false);
    session.currentStep = 0;
    session.completed = false;
    session.walletAddress = null;
    session.smartAccount = null;
    delete session.completedAt;

    logger.info(`[Training API] Training session reset: ${sessionId}`);

    res.json({
      success: true,
      session,
      message: 'Training session reset successfully'
    });
  } catch (error) {
    logger.error('[Training API] Error resetting training session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset training session'
    });
  }
});

export default router;