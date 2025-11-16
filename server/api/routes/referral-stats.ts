/**
 * Referral Statistics API Routes
 * Provides endpoints for retrieving user referral statistics
 */

import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { logger } from '../../utils/logger';
import { isAuthenticated } from '../../middleware/auth';
import { tokenRewardService } from '../../services/token-reward-service';

const router = Router();

/**
 * Get detailed referral statistics for the authenticated user
 * Includes counts, referral statuses, and potential rewards
 */
router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    // Get basic referral stats
    const referralStats = await storage.getReferralStats(userId);
    
    // Get detailed list of referrals with their status
    const referrals = await storage.getReferralsByUserId(userId);
    
    // Get on-chain reward data if available
    let rewardState = null;
    if (req.user?.walletAddress && tokenRewardService.isReady()) {
      rewardState = await tokenRewardService.getUserRewardState(userId);
    }
    
    // Get current reward rates to show potential earnings
    let rewardRates = null;
    if (tokenRewardService.isReady()) {
      rewardRates = await tokenRewardService.getCurrentRewardRates();
    }
    
    // Calculate metrics
    const totalReferrals = referralStats.level1;
    const validatedReferrals = referrals.filter(r => 
      r.status === 'verified' || r.status === 'rewarded'
    ).length;
    
    const pendingValidation = referrals.filter(r => 
      r.status === 'recorded' || r.status === 'pending'
    ).length;
    
    const rewardedReferrals = referrals.filter(r => 
      r.status === 'rewarded'
    ).length;
    
    // Format response
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReferrals,
          validatedReferrals,
          pendingValidation,
          rewardedReferrals,
          // Include multi-level referrals
          level1Count: referralStats.level1,
          level2Count: referralStats.level2,
          level3Count: referralStats.level3,
          potentialRewards: referralStats.rewards
        },
        // Detailed referral list (to be displayed in a table)
        referrals: await Promise.all(referrals.map(async (r) => {
          // Get basic referee information
          const referee = await storage.getUser(r.refereeId);
          
          return {
            id: r.id,
            refereeId: r.refereeId,
            refereeUsername: referee?.username || 'Unknown User',
            refereeAvatar: referee?.profileImageUrl,
            status: r.status,
            joinedAt: r.createdAt,
            hasWallet: !!referee?.walletAddress,
            hasVerifiedEmail: !!referee?.emailVerified,
            has2fa: !!referee?.twoFactorEnabled,
            rewardIssued: !!r.rewardAmount,
            rewardAmount: r.rewardAmount
          };
        })),
        // On-chain reward information if available
        rewardState,
        rewardRates,
        // User's referral code for sharing
        referralCode: req.user?.referralCode || ''
      }
    });
    
  } catch (error) {
    logger.error('Error retrieving referral stats', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve referral statistics'
    });
  }
});

/**
 * Get simplified referral counts for display on profile/home page
 */
router.get('/counts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    // Get referral stats
    const referralStats = await storage.getReferralStats(userId);
    const referrals = await storage.getReferralsByUserId(userId);
    
    // Calculate metrics
    const totalReferrals = referralStats.level1;
    const validatedReferrals = referrals.filter(r => 
      r.status === 'verified' || r.status === 'rewarded'
    ).length;
    
    return res.status(200).json({
      success: true,
      data: {
        totalReferrals,
        validatedReferrals,
        totalRewards: referralStats.rewards
      }
    });
    
  } catch (error) {
    logger.error('Error retrieving referral counts', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve referral counts'
    });
  }
});

export default router;