/**
 * Blockchain API Routes
 * 
 * This file defines API routes for the blockchain redundancy layer that provides
 * failover support across multiple blockchain networks, including IOTA testnet.
 */

import { Router, Request, Response } from 'express';
import { redundantBlockchainService, BlockchainProvider } from '../../services/redundancy/blockchain/redundant-blockchain-service';
import { requireAuth } from '../../middleware/auth-middleware';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Simplified validation for blockchain routes
const validateRequest = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

const router = Router();

// Request validation schemas
const transferSchema = z.object({
  toAddress: z.string().min(1, "Recipient address is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  provider: z.enum(['polygon', 'solana', 'iota', 'stellar']).optional()
});

const providerSchema = z.object({
  provider: z.enum(['polygon', 'solana', 'iota', 'stellar']).optional()
});

/**
 * @route GET /api/blockchain/status
 * @desc Get blockchain redundancy status
 * @access Public
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = redundantBlockchainService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('Error getting blockchain redundancy status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting blockchain redundancy status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/accounts
 * @desc Create blockchain accounts for user
 * @access Private
 */
router.post('/accounts', requireAuth, async (req: Request, res: Response) => {
  try {
    // Type assertion for req.user since we know it exists due to requireAuth
    const userId = (req.user as any).id;
    
    const accounts = await redundantBlockchainService.createAccounts(userId);
    
    res.json({
      success: true,
      data: accounts,
      message: 'Blockchain accounts created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating blockchain accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating blockchain accounts',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/balances
 * @desc Get balances across all blockchain networks
 * @access Private
 */
router.get('/balances', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    const balances = await redundantBlockchainService.getBalances(userId);
    
    res.json({
      success: true,
      data: balances
    });
  } catch (error: any) {
    logger.error('Error getting blockchain balances:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting blockchain balances',
      error: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/transfer
 * @desc Transfer funds using the optimal blockchain
 * @access Private
 */
router.post('/transfer', 
  requireAuth, 
  validateRequest(transferSchema), 
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { toAddress, amount, provider } = req.body;
      
      const transaction = await redundantBlockchainService.transfer(
        userId, 
        toAddress, 
        amount, 
        provider as BlockchainProvider | undefined
      );
      
      if (!transaction) {
        return res.status(503).json({
          success: false,
          message: 'No available blockchain providers could process the transaction'
        });
      }
      
      res.json({
        success: true,
        data: transaction,
        message: 'Transaction submitted successfully'
      });
    } catch (error: any) {
      logger.error('Error transferring tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Error transferring tokens',
        error: error.message
      });
    }
});

/**
 * @route POST /api/blockchain/testnet/tokens
 * @desc Request testnet tokens from a faucet
 * @access Private
 */
router.post('/testnet/tokens', 
  requireAuth, 
  validateRequest(providerSchema), 
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { provider } = req.body;
      
      const result = await redundantBlockchainService.requestTestnetTokens(
        userId, 
        provider as BlockchainProvider | undefined
      );
      
      if (!result) {
        return res.status(503).json({
          success: false,
          message: 'Failed to request testnet tokens'
        });
      }
      
      res.json({
        success: true,
        message: 'Testnet tokens request submitted successfully'
      });
    } catch (error: any) {
      logger.error('Error requesting testnet tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Error requesting testnet tokens',
        error: error.message
      });
    }
});

/**
 * @route POST /api/blockchain/refresh
 * @desc Refresh blockchain provider status
 * @access Admin
 */
router.post('/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // Only allow admins to refresh the service status
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    await redundantBlockchainService.refreshProviderStatus();
    
    const status = redundantBlockchainService.getStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Blockchain provider status refreshed successfully'
    });
  } catch (error: any) {
    logger.error('Error refreshing blockchain provider status:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing blockchain provider status',
      error: error.message
    });
  }
});

export default router;