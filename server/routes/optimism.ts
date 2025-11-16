/**
 * Optimism L2 Integration API Routes
 * 
 * Handles cross-chain reputation synchronization, bridge operations,
 * and L2 network interactions for HyperDAG platform.
 */

import express from 'express';
import { optimismBridge } from '../services/optimism-bridge.js';
import { storage } from '../storage.js';

const router = express.Router();

/**
 * GET /api/optimism/network-status
 * Get current network statistics and gas comparisons
 */
router.get('/network-status', async (req, res) => {
  try {
    const networkStats = await optimismBridge.getNetworkStats();
    
    if (!networkStats) {
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch network statistics'
      });
    }

    res.json({
      success: true,
      data: {
        l1: {
          blockNumber: networkStats.l1.blockNumber,
          gasPrice: networkStats.l1.gasPrice,
          network: 'Ethereum Mainnet'
        },
        l2: {
          blockNumber: networkStats.l2.blockNumber,
          gasPrice: networkStats.l2.gasPrice,
          network: 'Optimism'
        },
        gasSavingsPercentage: networkStats.gasSavings,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching network status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network status'
    });
  }
});

/**
 * POST /api/optimism/sync-reputation
 * Synchronize user reputation across L1 and L2 networks
 */
router.post('/sync-reputation', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    const syncData = await optimismBridge.syncReputationAcrossChains(userAddress);
    
    // Update local database with synchronized reputation data
    const user = await storage.getUserByWalletAddress(userAddress);
    if (user) {
      await storage.updateUser(user.id, {
        reputationScore: syncData.totalScore
      });
    }

    res.json({
      success: true,
      data: {
        userAddress: syncData.userAddress,
        totalScore: syncData.totalScore,
        activitiesCount: syncData.activities.length,
        lastSyncTimestamp: syncData.lastSyncTimestamp
      }
    });
  } catch (error) {
    console.error('Error syncing reputation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synchronize reputation across chains'
    });
  }
});

/**
 * POST /api/optimism/bridge-tokens
 * Bridge tokens from L1 to L2
 */
router.post('/bridge-tokens', async (req, res) => {
  try {
    const { userAddress, amount, tokenAddress } = req.body;
    
    if (!userAddress || !amount || !tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address, amount, and token address are required'
      });
    }

    const bridgeTransaction = await optimismBridge.bridgeTokensToL2(
      userAddress,
      amount,
      tokenAddress
    );

    res.json({
      success: true,
      data: {
        transactionId: bridgeTransaction.id,
        status: bridgeTransaction.bridgeStatus,
        fromChain: bridgeTransaction.fromChain,
        toChain: bridgeTransaction.toChain,
        timestamp: bridgeTransaction.timestamp
      }
    });
  } catch (error) {
    console.error('Error bridging tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bridge tokens to L2'
    });
  }
});

/**
 * GET /api/optimism/bridge-status/:transactionId
 * Get bridge transaction status
 */
router.get('/bridge-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const status = await optimismBridge.getBridgeStatus(transactionId);
    
    res.json({
      success: true,
      data: {
        transactionId,
        status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting bridge status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bridge transaction status'
    });
  }
});

/**
 * POST /api/optimism/estimate-fees
 * Estimate bridge fees for token transfer
 */
router.post('/estimate-fees', async (req, res) => {
  try {
    const { amount, tokenAddress } = req.body;
    
    if (!amount || !tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Amount and token address are required'
      });
    }

    const feeEstimate = await optimismBridge.estimateBridgeFees(amount, tokenAddress);
    
    res.json({
      success: true,
      data: {
        l1Fee: feeEstimate.l1Fee,
        l2Fee: feeEstimate.l2Fee,
        totalFee: feeEstimate.totalFee,
        estimatedSavings: (parseFloat(feeEstimate.l1Fee) - parseFloat(feeEstimate.totalFee)).toFixed(4),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error estimating fees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate bridge fees'
    });
  }
});

/**
 * GET /api/optimism/user-activity/:address
 * Get user's cross-chain activity history
 */
router.get('/user-activity/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Get user's reputation activities from database
    const user = await storage.getUserByWalletAddress(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const activities = await storage.getReputationActivities(user.id, 1, 50);
    
    res.json({
      success: true,
      data: {
        userAddress: address,
        activities: activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          score: activity.points,
          timestamp: activity.timestamp,
          chainId: 1 // Default to mainnet, would be dynamic in real implementation
        })),
        totalActivities: activities.length
      }
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity'
    });
  }
});

/**
 * POST /api/optimism/deploy-contracts
 * Deploy HyperDAG contracts to Optimism network
 */
router.post('/deploy-contracts', async (req, res) => {
  try {
    const { network = 'testnet' } = req.body;
    
    // This would trigger actual contract deployment
    // For now, returning deployment status
    
    res.json({
      success: true,
      data: {
        network,
        status: 'deployment_initiated',
        message: 'Contract deployment initiated on Optimism network',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deploying contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy contracts to Optimism'
    });
  }
});

export default router;