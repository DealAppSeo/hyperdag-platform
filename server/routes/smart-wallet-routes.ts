import { Router } from 'express';
import { getAlchemySmartWalletService } from '../services/alchemy-smart-wallet-service.js';
import { requireAuth } from '../middleware/auth-guard.js';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Create smart wallet for authenticated user
router.post('/api/smart-wallet/create', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const smartWallet = await smartWalletService.createSmartWallet(userId);

    // Store smart wallet info in user record
    await db
      .update(users)
      .set({
        smartWalletAddress: smartWallet.smartAccountAddress,
        smartWalletPrivateKey: smartWallet.privateKey, // In production, encrypt this
        connectedWallets: [smartWallet.smartAccountAddress]
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      data: {
        address: smartWallet.smartAccountAddress,
        isDeployed: smartWallet.isDeployed,
        ownerAddress: smartWallet.address
      }
    });
  } catch (error) {
    console.error('Failed to create smart wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create smart wallet'
    });
  }
});

// Get smart wallet information
router.get('/api/smart-wallet/info', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get user's smart wallet info from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.smartWalletPrivateKey) {
      return res.status(404).json({
        success: false,
        error: 'Smart wallet not found. Create one first.'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const walletInfo = await smartWalletService.getSmartAccountInfo(user.smartWalletPrivateKey);

    res.json({
      success: true,
      data: {
        address: walletInfo.address,
        isDeployed: walletInfo.isDeployed,
        balance: walletInfo.balance.toString(),
        nonce: walletInfo.nonce,
        chainInfo: smartWalletService.getChainInfo()
      }
    });
  } catch (error) {
    console.error('Failed to get smart wallet info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get smart wallet information'
    });
  }
});

// Deploy smart wallet
router.post('/api/smart-wallet/deploy', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get user's smart wallet private key
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.smartWalletPrivateKey) {
      return res.status(404).json({
        success: false,
        error: 'Smart wallet not found. Create one first.'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const result = await smartWalletService.deploySmartAccount(user.smartWalletPrivateKey);

    res.json({
      success: true,
      data: {
        transactionHash: result.hash,
        deployed: result.success
      }
    });
  } catch (error) {
    console.error('Failed to deploy smart wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy smart wallet'
    });
  }
});

// Execute transaction (gasless for SBT operations)
router.post('/api/smart-wallet/execute', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { calls } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!calls || !Array.isArray(calls)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction calls'
      });
    }

    // Get user's smart wallet private key
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.smartWalletPrivateKey) {
      return res.status(404).json({
        success: false,
        error: 'Smart wallet not found. Create one first.'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const result = await smartWalletService.executeTransaction(
      user.smartWalletPrivateKey,
      calls.map((call: any) => ({
        target: call.target,
        data: call.data,
        value: BigInt(call.value || 0)
      }))
    );

    res.json({
      success: true,
      data: {
        transactionHash: result.hash,
        success: result.success,
        gasUsed: result.gasUsed?.toString(),
        effectiveGasPrice: result.effectiveGasPrice?.toString()
      }
    });
  } catch (error) {
    console.error('Failed to execute transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute transaction'
    });
  }
});

// Estimate gas for transaction
router.post('/api/smart-wallet/estimate-gas', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { calls } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!calls || !Array.isArray(calls)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction calls'
      });
    }

    // Get user's smart wallet private key
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.smartWalletPrivateKey) {
      return res.status(404).json({
        success: false,
        error: 'Smart wallet not found. Create one first.'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const gasEstimate = await smartWalletService.estimateGas(
      user.smartWalletPrivateKey,
      calls.map((call: any) => ({
        target: call.target,
        data: call.data,
        value: BigInt(call.value || 0)
      }))
    );

    res.json({
      success: true,
      data: {
        gasEstimate: gasEstimate.gasEstimate.toString(),
        gasPrice: gasEstimate.gasPrice.toString(),
        maxFeePerGas: gasEstimate.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas?.toString()
      }
    });
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate gas'
    });
  }
});

// Get smart wallet balance
router.get('/api/smart-wallet/balance', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get user's smart wallet address
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.smartWalletAddress) {
      return res.status(404).json({
        success: false,
        error: 'Smart wallet not found. Create one first.'
      });
    }

    const smartWalletService = getAlchemySmartWalletService();
    const balance = await smartWalletService.getBalance(user.smartWalletAddress as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance: balance.toString(),
        balanceInEth: (Number(balance) / 1e18).toFixed(6)
      }
    });
  } catch (error) {
    console.error('Failed to get balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
});

// Health check for smart wallet service
router.get('/api/smart-wallet/health', async (req, res) => {
  try {
    const smartWalletService = getAlchemySmartWalletService();
    const isReady = smartWalletService.isServiceReady();
    const chainInfo = smartWalletService.getChainInfo();

    res.json({
      success: true,
      data: {
        serviceReady: isReady,
        chainInfo
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Smart wallet service unavailable'
    });
  }
});

export default router;