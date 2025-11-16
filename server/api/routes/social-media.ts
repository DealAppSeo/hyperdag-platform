/**
 * Social Media API Routes
 * 
 * This file defines API routes for connecting and managing social media accounts:
 * - X (Twitter)
 * - Facebook
 * - LinkedIn
 * 
 * These routes allow users to connect their social media accounts with HyperDAG,
 * verify connections, and view social media statistics.
 */

import express from 'express';
import { z } from 'zod';
import {
  generateVerificationCode,
  verifyCode,
  completeVerification,
  updateSocialStats,
  checkConnectionStatus,
  getUserSocialStats
} from '../../services/social-media-service';

const router = express.Router();

/**
 * Get social media connection status for the authenticated user
 */
router.get('/status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { platform } = req.query;
    
    // Validate platform parameter
    if (!platform || !['x', 'facebook', 'linkedin'].includes(platform as string)) {
      return res.status(400).json({ 
        message: 'Invalid platform. Must be one of: x, facebook, linkedin' 
      });
    }
    
    const status = await checkConnectionStatus(
      req.user.id, 
      platform as 'x' | 'facebook' | 'linkedin'
    );
    
    res.json(status);
  } catch (error) {
    console.error('[social-media] Error getting connection status:', error);
    res.status(500).json({ message: 'Error getting connection status' });
  }
});

/**
 * Get verification code for connecting a social media account
 */
router.get('/verification-code', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { platform } = req.query;
    
    // Validate platform parameter
    if (!platform || !['x', 'facebook', 'linkedin'].includes(platform as string)) {
      return res.status(400).json({ 
        message: 'Invalid platform. Must be one of: x, facebook, linkedin' 
      });
    }
    
    const code = generateVerificationCode(
      req.user.username, 
      platform as 'x' | 'facebook' | 'linkedin'
    );
    
    res.json({ code });
  } catch (error) {
    console.error('[social-media] Error generating verification code:', error);
    res.status(500).json({ message: 'Error generating verification code' });
  }
});

/**
 * Input validation schemas
 */
const verifyCodeSchema = z.object({
  platform: z.enum(['x', 'facebook', 'linkedin']),
  code: z.string().min(6).max(6),
  socialId: z.string().optional(),
  username: z.string().optional(),
  followerCount: z.number().optional()
});

const updateStatsSchema = z.object({
  platform: z.enum(['x', 'facebook', 'linkedin']),
  count: z.number().min(0)
});

/**
 * Verify a social media connection
 */
router.post('/verify', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body
    const validationResult = verifyCodeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }
    
    const { platform, code, socialId, username, followerCount } = validationResult.data;
    
    // First verify the code
    const isVerified = verifyCode(req.user.username, platform, code, socialId);
    
    if (!isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    if (!socialId) {
      return res.status(400).json({
        success: false,
        message: 'Social ID is required for verification'
      });
    }
    
    // Complete the verification process
    const success = await completeVerification(
      req.user.id,
      platform,
      socialId,
      username,
      followerCount
    );
    
    if (success) {
      // Award reputation points for verifying a social media account
      try {
        const { storage } = await import('../../storage');
        
        // Award points for this specific platform verification
        const platformPoints = 10;
        await storage.createReputationActivity({
          userId: req.user.id,
          type: `${platform}_verification`,
          points: platformPoints,
          description: `Verified ${platform} account`
        });
        
        // Check if this is their first verified social media account
        const user = await storage.getUser(req.user.id);
        const verifiedAccounts = [
          user.xVerified, 
          user.facebookVerified, 
          user.linkedinVerified, 
          user.instagramVerified, 
          user.telegramVerified
        ].filter(Boolean).length;
        
        let bonusPoints = 0;
        // If this is their first verification (including the one just completed), award bonus
        if (verifiedAccounts <= 1) {
          bonusPoints = 25;
          await storage.createReputationActivity({
            userId: req.user.id,
            type: 'first_social_verification',
            points: bonusPoints,
            description: 'First social media account verification'
          });
        }
        
        return res.json({
          success: true,
          message: `${platform.toUpperCase()} account connected successfully`,
          pointsEarned: platformPoints + bonusPoints,
          reputationActivities: [
            { type: `${platform}_verification`, points: platformPoints },
            ...(bonusPoints > 0 ? [{ type: 'first_social_verification', points: bonusPoints }] : [])
          ]
        });
      } catch (reputationError) {
        console.error('[social-media] Error awarding reputation points:', reputationError);
        // Still return success for the verification even if reputation update fails
        return res.json({
          success: true,
          message: `${platform.toUpperCase()} account connected successfully`
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to complete verification'
      });
    }
  } catch (error) {
    console.error('[social-media] Error verifying social account:', error);
    res.status(500).json({ message: 'Error verifying social account' });
  }
});

/**
 * Update social media stats
 */
router.post('/update-stats', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body
    const validationResult = updateStatsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }
    
    const { platform, count } = validationResult.data;
    
    // Get previous stats to see if this is an increase
    const { storage } = await import('../../storage');
    const previousUser = await storage.getUser(req.user.id);
    
    let previousCount = 0;
    switch (platform) {
      case 'x':
        previousCount = previousUser.xFollowers || 0;
        break;
      case 'facebook':
        previousCount = previousUser.facebookFriends || 0;
        break;
      case 'linkedin':
        previousCount = previousUser.linkedinConnections || 0;
        break;
    }
    
    const success = await updateSocialStats(req.user.id, platform, count);
    
    if (success) {
      let reputationPoints = 0;
      let reputationActivity = null;
      
      // Check if there's been an increase in followers/connections
      if (count > previousCount) {
        const increase = count - previousCount;
        
        // Award reputation points for growing social media presence
        // 1 point for every 10 new followers/connections (up to 50 points)
        reputationPoints = Math.min(50, Math.floor(increase / 10));
        
        if (reputationPoints > 0) {
          try {
            reputationActivity = await storage.createReputationActivity({
              userId: req.user.id,
              type: `${platform}_growth`,
              points: reputationPoints,
              description: `Gained ${increase} new ${platform === 'x' ? 'followers' : platform === 'facebook' ? 'friends' : 'connections'} on ${platform}`
            });
          } catch (reputationError) {
            console.error('[social-media] Error awarding reputation points:', reputationError);
          }
        }
      }
      
      return res.json({
        success: true,
        message: `${platform.toUpperCase()} stats updated successfully`,
        previousCount,
        newCount: count,
        increase: Math.max(0, count - previousCount),
        pointsEarned: reputationPoints,
        reputationActivity: reputationActivity ? {
          type: reputationActivity.type,
          points: reputationActivity.points,
          description: reputationActivity.description,
          timestamp: reputationActivity.timestamp
        } : null
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Failed to update ${platform.toUpperCase()} stats. Account may not be verified.`
      });
    }
  } catch (error) {
    console.error('[social-media] Error updating social stats:', error);
    res.status(500).json({ message: 'Error updating social stats' });
  }
});

/**
 * Get user's social media stats
 */
router.get('/stats', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const stats = await getUserSocialStats(req.user.id);
    
    res.json(stats);
  } catch (error) {
    console.error('[social-media] Error getting social stats:', error);
    res.status(500).json({ message: 'Error getting social stats' });
  }
});

export default router;