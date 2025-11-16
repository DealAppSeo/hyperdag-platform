/**
 * AI Orchestration API Routes
 * 
 * Provides endpoints for AI-powered transaction optimization with HDAG token discounts
 */

import { Router } from 'express';
import { aiTransactionOrchestrator } from '../../services/ai-transaction-orchestrator';
import { crossChainReputationService } from '../../services/cross-chain-reputation-service';
import { storage } from '../../storage';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/ai-orchestration/fee-estimate
 * 
 * Calculate fee estimates with HDAG token discounts for a transaction
 */
router.get('/fee-estimate', async (req, res) => {
  try {
    const { operation, paymentMethod = 'ETH', urgency = 'medium' } = req.query;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user's reputation metrics for discount eligibility
    const requiredFields = ['email', 'bio', 'skills', 'interests'];
    const completedFields = requiredFields.filter(field => 
      user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : user[field].trim().length > 0)
    );
    const profileCompletion = (completedFields.length / requiredFields.length) * 100;

    const reputationMetrics = {
      profileCompletion,
      reputationScore: user.reputationScore || 0,
      crossChainActivity: 0,
      aiContributions: 0,
      communityEngagement: 0,
      grantSuccessRate: 0
    };

    // Calculate fee discount
    const feeDiscount = crossChainReputationService.calculateFeeDiscount(
      reputationMetrics,
      paymentMethod as 'HDAG' | 'ETH'
    );

    // Get optimized transaction route
    const optimizedRoute = await aiTransactionOrchestrator.optimizeTransaction({
      userId: user.id.toString(),
      operation: operation as any,
      paymentMethod: paymentMethod as any,
      urgency: urgency as any
    });

    res.json({
      success: true,
      data: {
        user: {
          profileCompletion: Math.round(profileCompletion),
          reputationScore: user.reputationScore || 0,
          discountEligible: {
            hdagPayment: true,
            profileComplete: profileCompletion >= 95,
            highReputation: (user.reputationScore || 0) >= 80
          }
        },
        feeStructure: {
          baseDiscount: `${(feeDiscount.baseDiscount * 100).toFixed(0)}%`,
          profileBonus: `${(feeDiscount.profileBonus * 100).toFixed(0)}%`,
          reputationBonus: `${(feeDiscount.reputationBonus * 100).toFixed(0)}%`,
          totalDiscount: `${(feeDiscount.totalDiscount * 100).toFixed(1)}%`
        },
        optimizedRoute,
        recommendations: [
          profileCompletion < 95 ? "Complete your profile to unlock an additional 50% fee discount" : null,
          (user.reputationScore || 0) < 80 ? "Build your reputation score to 80+ for maximum discounts" : null,
          paymentMethod !== 'HDAG' ? "Pay with HDAG tokens to get 50% off all transaction fees" : null
        ].filter(Boolean)
      }
    });

  } catch (error) {
    logger.error('[ai-orchestration] Fee estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fee estimate',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-orchestration/user-discount-status
 * 
 * Get current user's discount eligibility and recommendations
 */
router.get('/user-discount-status', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate profile completion
    const requiredFields = ['email', 'bio', 'skills', 'interests'];
    const completedFields = requiredFields.filter(field => 
      user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : user[field].trim().length > 0)
    );
    const profileCompletion = (completedFields.length / requiredFields.length) * 100;
    const reputationScore = user.reputationScore || 0;

    // Calculate potential savings
    const baseTransactionCost = 100; // Example: $100 transaction
    const hdagSavings = baseTransactionCost * 0.5; // 50% with HDAG
    const profileSavings = profileCompletion >= 95 ? (baseTransactionCost - hdagSavings) * 0.5 : 0;
    const reputationSavings = reputationScore >= 80 ? (baseTransactionCost - hdagSavings - profileSavings) * 0.25 : 0;
    const totalSavings = hdagSavings + profileSavings + reputationSavings;

    res.json({
      success: true,
      data: {
        currentStatus: {
          profileCompletion: Math.round(profileCompletion),
          reputationScore,
          eligibleForMaxDiscount: profileCompletion >= 95 && reputationScore >= 80
        },
        discountBreakdown: {
          hdagPayment: {
            discount: "50%",
            eligible: true,
            savings: `$${hdagSavings}`
          },
          profileComplete: {
            discount: "Additional 50%",
            eligible: profileCompletion >= 95,
            savings: profileCompletion >= 95 ? `$${profileSavings}` : "$0",
            requirement: "95% profile completion"
          },
          highReputation: {
            discount: "Additional 25%",
            eligible: reputationScore >= 80,
            savings: reputationScore >= 80 ? `$${reputationSavings}` : "$0",
            requirement: "Reputation score 80+"
          }
        },
        potentialSavings: {
          current: `$${totalSavings} (${((totalSavings / baseTransactionCost) * 100).toFixed(1)}%)`,
          maximum: `$87.50 (87.5%)`,
          nextMilestone: profileCompletion < 95 
            ? { action: "Complete profile", additionalSavings: `$${(baseTransactionCost - hdagSavings) * 0.5}` }
            : reputationScore < 80 
            ? { action: "Reach reputation 80+", additionalSavings: `$${(baseTransactionCost - hdagSavings - profileSavings) * 0.25}` }
            : null
        },
        actionItems: [
          ...(profileCompletion < 95 ? [{
            action: "Complete your profile",
            benefit: "Unlock additional 50% fee discount",
            missingFields: requiredFields.filter(field => 
              !user[field] || (Array.isArray(user[field]) ? user[field].length === 0 : user[field].trim().length === 0)
            )
          }] : []),
          ...(reputationScore < 80 ? [{
            action: "Build reputation to 80+",
            benefit: "Unlock maximum fee discounts",
            currentScore: reputationScore,
            targetScore: 80,
            suggestions: [
              "Participate in community discussions",
              "Contribute to open-source projects", 
              "Apply for and successfully complete grants",
              "Collaborate on platform projects"
            ]
          }] : [])
        ]
      }
    });

  } catch (error) {
    logger.error('[ai-orchestration] Discount status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discount status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai-orchestration/optimize-transaction
 * 
 * Get AI-optimized transaction routing recommendation
 */
router.post('/optimize-transaction', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { operation, paymentMethod = 'HDAG', urgency = 'medium', targetChain } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation type is required'
      });
    }

    const optimizedRoute = await aiTransactionOrchestrator.optimizeTransaction({
      userId: req.user.id.toString(),
      operation,
      paymentMethod,
      urgency,
      targetChain
    });

    res.json({
      success: true,
      data: {
        optimization: optimizedRoute,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('[ai-orchestration] Transaction optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize transaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;