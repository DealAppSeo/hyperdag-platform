import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { iotaService } from '../../services/iota-service';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Authentication middleware
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  next();
};

// Validation middleware
const validate = (schema: z.ZodType<any, any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.errors,
      });
    }
    next(error);
  }
};

const router = Router();

// Create wallet schema
const createWalletSchema = z.object({});

// Transfer schema
const transferSchema = z.object({
  toAddress: z.string().min(1, "Recipient address is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

/**
 * @route GET /api/iota/status
 * @desc Get IOTA network status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await iotaService.getNetworkStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Error getting IOTA network status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting IOTA network status',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/iota/account
 * @desc Get user IOTA account
 * @access Private
 */
router.get('/account', ensureAuthenticated, async (req, res) => {
  try {
    // Type assertion for req.user since we've verified authentication with ensureAuthenticated
    const userId = (req.user as any).id;
    const account = await iotaService.getAccount(userId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'IOTA account not found for this user',
      });
    }
    
    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    logger.error(`Error getting IOTA account: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting IOTA account',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/iota/account
 * @desc Create IOTA account for user
 * @access Private
 */
router.post('/account', ensureAuthenticated, validate(createWalletSchema), async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const account = await iotaService.createAccount(userId);
    
    res.json({
      success: true,
      data: account,
      message: 'IOTA account created successfully',
    });
  } catch (error: any) {
    logger.error(`Error creating IOTA account: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error creating IOTA account',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/iota/balance
 * @desc Get IOTA account balance
 * @access Private
 */
router.get('/balance', ensureAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const balance = await iotaService.getBalance(userId);
    
    res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    logger.error(`Error getting IOTA balance: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting IOTA balance',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/iota/faucet
 * @desc Request IOTA testnet tokens from faucet
 * @access Private
 */
router.post('/faucet', ensureAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const result = await iotaService.requestFaucetTokens(userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Faucet request submitted successfully',
    });
  } catch (error: any) {
    logger.error(`Error requesting IOTA faucet tokens: ${error.message}`);
    res.status(500).json({
      success: false, 
      message: 'Error requesting IOTA faucet tokens',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/iota/transfer
 * @desc Transfer IOTA tokens
 * @access Private
 */
router.post('/transfer', ensureAuthenticated, validate(transferSchema), async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { toAddress, amount } = req.body;
    
    const transaction = await iotaService.transfer(userId, toAddress, amount);
    
    res.json({
      success: true,
      data: transaction,
      message: 'Transaction submitted successfully',
    });
  } catch (error: any) {
    logger.error(`Error transferring IOTA tokens: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error transferring IOTA tokens',
      error: error.message,
    });
  }
});

export default router;