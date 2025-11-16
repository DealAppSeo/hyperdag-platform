import express from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { walletBridgeService } from '../../services/wallet-bridge-service';
import { logger } from '../../utils/logger';

const router = express.Router();

// Validation schemas
const executeTransactionSchema = z.object({
  toAddress: z.string().min(1),
  amount: z.number().positive(),
  tokenSymbol: z.string().min(1),
  useConnectedWallet: z.boolean().optional(),
  prioritizeBy: z.enum(['speed', 'cost', 'security', 'auto']).optional(),
  maxFeeAllowed: z.number().optional()
});

const connectWalletSchema = z.object({
  walletAddress: z.string().min(1),
  network: z.string().min(1),
  signature: z.string().min(1)
});

const disconnectWalletSchema = z.object({
  network: z.string().min(1)
});

/**
 * @route GET /api/wallet-bridge/balances
 * @desc Get all wallet balances for a user
 * @access Private
 */
router.get('/balances', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const balances = await walletBridgeService.getUserWalletBalances(userId);
    res.json(balances);
  } catch (error: any) {
    logger.error(`Error getting wallet balances: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting wallet balances',
      error: error.message
    });
  }
});

/**
 * @route POST /api/wallet-bridge/execute-transaction
 * @desc Execute a transaction using the optimal route
 * @access Private
 */
router.post(
  '/execute-transaction',
  requireAuth,
  validate(executeTransactionSchema),
  async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { toAddress, amount, tokenSymbol, useConnectedWallet, prioritizeBy, maxFeeAllowed } = req.body;

      const result = await walletBridgeService.executeTransaction(
        userId,
        toAddress,
        amount,
        tokenSymbol,
        {
          useConnectedWallet,
          prioritizeBy,
          maxFeeAllowed
        }
      );

      res.json(result);
    } catch (error: any) {
      logger.error(`Error executing transaction: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error executing transaction',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/wallet-bridge/connect-wallet
 * @desc Connect an external wallet to the user's account
 * @access Private
 */
router.post(
  '/connect-wallet',
  requireAuth,
  validate(connectWalletSchema),
  async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { walletAddress, network, signature } = req.body;

      const result = await walletBridgeService.connectExternalWallet(
        userId,
        walletAddress,
        network,
        signature
      );

      res.json(result);
    } catch (error: any) {
      logger.error(`Error connecting external wallet: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error connecting external wallet',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/wallet-bridge/disconnect-wallet
 * @desc Disconnect an external wallet from the user's account
 * @access Private
 */
router.post(
  '/disconnect-wallet',
  requireAuth,
  validate(disconnectWalletSchema),
  async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { network } = req.body;

      const result = await walletBridgeService.disconnectExternalWallet(userId, network);
      
      res.json(result);
    } catch (error: any) {
      logger.error(`Error disconnecting external wallet: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error disconnecting external wallet',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/wallet-bridge/available-networks
 * @desc Get list of available networks for transactions
 * @access Public
 */
router.get('/available-networks', async (req, res) => {
  try {
    // Return static list for now - could be made dynamic in the future
    res.json({
      success: true,
      data: [
        {
          id: 'polygon',
          name: 'Polygon zkEVM',
          type: 'blockchain',
          testnet: true,
          features: ['smart-contracts', 'nft', 'defi'],
          transactionSpeed: 'medium',
          transactionCost: 'low',
          securityLevel: 'high'
        },
        {
          id: 'solana',
          name: 'Solana',
          type: 'blockchain',
          testnet: true,
          features: ['smart-contracts', 'nft', 'defi'],
          transactionSpeed: 'high',
          transactionCost: 'very-low',
          securityLevel: 'medium-high'
        },
        {
          id: 'iota',
          name: 'IOTA',
          type: 'dag',
          testnet: true,
          features: ['feeless', 'microtransactions', 'data-transactions'],
          transactionSpeed: 'high',
          transactionCost: 'none',
          securityLevel: 'medium-high'
        }
      ]
    });
  } catch (error: any) {
    logger.error(`Error getting available networks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting available networks',
      error: error.message
    });
  }
});

export default router;