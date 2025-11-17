/**
 * HyperDAG API Routes
 * 
 * This file defines the API routes for the HyperDAG platform.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { createProjectSchema } from '@shared/schema';
import { z } from 'zod';
import { moralisRouter } from './routes/moralis';

// Define the router
const apiRouter = Router();

// Response wrapper function
function apiResponse(success: boolean, data?: any, message?: string, error?: { code: string, message: string }) {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error })
  };
}

// Middleware to check API authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated via session
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check for API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    // In a real implementation, validate the API key against database
    // For now, we'll use a simple check (this should be improved for production)
    if (apiKey === 'test-api-key') {
      req.user = { id: 1, username: 'api-user', isAdmin: false };
      return next();
    }
  }
  
  // Check for Web3 authentication
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Web3 ')) {
    const walletAddress = authHeader.substring(5);
    // In a real implementation, verify the signature
    // For now, check if the wallet address is registered
    storage.getUserByWalletAddress(walletAddress)
      .then(user => {
        if (user) {
          req.user = user;
          next();
        } else {
          res.status(401).json(apiResponse(
            false, null, null, { code: 'UNAUTHORIZED', message: 'Invalid wallet address' }
          ));
        }
      })
      .catch(err => {
        res.status(500).json(apiResponse(
          false, null, null, { code: 'SERVER_ERROR', message: 'Server error' }
        ));
      });
    return;
  }
  
  // If no authentication method succeeded
  res.status(401).json(apiResponse(
    false, null, null, { code: 'UNAUTHORIZED', message: 'Authentication required' }
  ));
}

// Projects API Routes
apiRouter.get('/projects', requireAuth, async (req, res) => {
  try {
    const projects = await storage.getProjects();
    res.json(apiResponse(true, { projects }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch projects' }
    ));
  }
});

apiRouter.get('/projects/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = await storage.getProjectById(id);
    
    if (!project) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Project not found' }
      ));
    }
    
    res.json(apiResponse(true, { project }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch project' }
    ));
  }
});

apiRouter.post('/projects', requireAuth, async (req, res) => {
  try {
    const validationResult = createProjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'VALIDATION_ERROR', message: 'Validation failed', details: validationResult.error.errors }
      ));
    }
    
    const { stakeTokens, ...projectData } = validationResult.data;
    
    // If staking tokens, check if user has enough
    if (stakeTokens && req.user.tokens < 5) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'INSUFFICIENT_TOKENS', message: 'Not enough tokens to stake' }
      ));
    }
    
    // Create the project
    const project = await storage.createProject({
      ...projectData,
      creatorId: req.user.id
    });
    
    // If staking tokens, deduct from user's balance
    if (stakeTokens) {
      await storage.updateUserTokens(req.user.id, req.user.tokens - 5);
    }
    
    res.status(201).json(apiResponse(true, { id: project.id }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to create project' }
    ));
  }
});

// Team matching API route
apiRouter.get('/projects/:id/teams/match', requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Project not found' }
      ));
    }
    
    // In a real implementation, this would use a sophisticated matching algorithm
    // For now, we'll return a mock response
    const mockTeams = [
      {
        id: 'team-1',
        members: [
          {
            id: 1,
            username: 'dev1',
            skills: ['javascript', 'react', 'blockchain'],
            experience: 5,
            persona: 'developer',
            reputation: 85
          },
          {
            id: 2,
            username: 'designer1',
            skills: ['ui', 'ux', 'figma'],
            experience: 3,
            persona: 'designer',
            reputation: 78
          }
        ],
        matchScore: 0.87,
        requiredRoles: ['developer', 'designer', 'marketer'],
        completedRoles: ['developer', 'designer'],
        missingRoles: ['marketer']
      }
    ];
    
    res.json(apiResponse(true, { teams: mockTeams }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to match teams' }
    ));
  }
});

// Network metrics API route
apiRouter.get('/network/metrics', requireAuth, async (req, res) => {
  try {
    // In a real implementation, fetch these metrics from the actual network
    // For now, return mock metrics
    const mockMetrics = {
      tps: 9876, // Nearly 10K TPS as per MVP goals
      averageLatency: 138, // milliseconds
      confirmedTxs: 24156789,
      pendingTxs: 162,
      activeNodes: 347
    };
    
    res.json(apiResponse(true, mockMetrics));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch network metrics' }
    ));
  }
});

// Transactions API route
apiRouter.post('/transactions', requireAuth, async (req, res) => {
  try {
    // In a real implementation, this would validate and submit a transaction to the network
    // For now, return a mock transaction hash
    const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    res.json(apiResponse(true, { txHash: mockTxHash }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to submit transaction' }
    ));
  }
});

// Token balance API route
apiRouter.get('/tokens/balance', requireAuth, async (req, res) => {
  try {
    // Get the user's token balance
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'User not found' }
      ));
    }
    
    res.json(apiResponse(true, { balance: user.tokens }));
  } catch (err) {
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch token balance' }
    ));
  }
});

// Mount Moralis routes
apiRouter.use('/moralis', moralisRouter);

// Import and mount identity routes
import identityRouter from './routes/identity';
apiRouter.use('/identity', identityRouter);

// Import and mount ZKP identity routes
import identityZkpRouter from './routes/identity-zkp';
apiRouter.use('/identity-zkp', identityZkpRouter);

// Import and mount developer dashboard routes
import developerRouter from './routes/developer';
apiRouter.use('/developer', developerRouter);

// ========================================
// SHARE LINKS & REFERRAL ROUTES (Viral Growth)
// ========================================

// Create shareable link
apiRouter.post('/share/create', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId, title, description } = req.body;
    
    // Generate social media templates
    const twitterTemplate = `Check out my ${contentType} on HyperDAG! ${title} - ${description} #Web3 #AI`;
    const linkedinTemplate = `Excited to share my ${contentType}: ${title}\\n\\n${description}\\n\\nJoin me on HyperDAG to democratize AI and Web3!`;
    
    const shareLink = await storage.createShareLink({
      userId: req.user.id,
      contentType,
      contentId,
      title,
      description,
      twitterTemplate,
      linkedinTemplate,
      facebookTemplate: `${title} - ${description}`,
      previewGenerated: false,
      metadata: {}
    });
    
    res.json(apiResponse(true, { shareLink }));
  } catch (err) {
    console.error('[ERROR] Failed to create share link:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to create share link' }
    ));
  }
});

// Get share link (tracks views)
apiRouter.get('/share/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const shareLink = await storage.getShareLink(linkId);
    
    if (!shareLink) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Share link not found' }
      ));
    }
    
    // Increment view count
    await storage.incrementShareViews(linkId);
    
    res.json(apiResponse(true, { shareLink }));
  } catch (err) {
    console.error('[ERROR] Failed to fetch share link:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch share link' }
    ));
  }
});

// Track share count (authenticated to prevent bot spam)
apiRouter.post('/share/:linkId/shared', requireAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    
    // Verify share link exists
    const shareLink = await storage.getShareLink(linkId);
    if (!shareLink) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Share link not found' }
      ));
    }
    
    await storage.incrementShareCount(linkId);
    
    res.json(apiResponse(true, { message: 'Share tracked successfully' }));
  } catch (err) {
    console.error('[ERROR] Failed to track share:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to track share' }
    ));
  }
});

// Track conversion (someone signed up via share link) - SERVER ONLY
// This should be called internally during signup, not exposed as public API
apiRouter.post('/share/:linkId/conversion', requireAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { newUserId } = req.body;
    
    // Security: Verify this is a valid new user signup
    if (!newUserId || req.user.id !== newUserId) {
      return res.status(403).json(apiResponse(
        false, null, null, { code: 'FORBIDDEN', message: 'Invalid conversion request' }
      ));
    }
    
    const shareLink = await storage.getShareLink(linkId);
    if (!shareLink) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Share link not found' }
      ));
    }
    
    // Check if this user already converted for this link (prevent duplicate rewards)
    const existingConversion = shareLink.metadata?.conversions || [];
    if (existingConversion.includes(newUserId)) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'ALREADY_CONVERTED', message: 'Conversion already tracked' }
      ));
    }
    
    await storage.incrementShareConversions(linkId);
    
    // Award RepID rewards (10 RepID per conversion) and persist conversion record
    const rewardAmount = 10;
    const updatedLink = await storage.updateShareLinkRewards(linkId, rewardAmount, newUserId);
    
    res.json(apiResponse(true, { message: 'Conversion tracked', reward: rewardAmount, shareLink: updatedLink }));
  } catch (err) {
    console.error('[ERROR] Failed to track conversion:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to track conversion' }
    ));
  }
});

// Get user's share links
apiRouter.get('/share/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Only allow users to see their own share links
    if (req.user.id !== userId) {
      return res.status(403).json(apiResponse(
        false, null, null, { code: 'FORBIDDEN', message: 'Access denied' }
      ));
    }
    
    const shareLinks = await storage.getShareLinksByUserId(userId);
    res.json(apiResponse(true, { shareLinks }));
  } catch (err) {
    console.error('[ERROR] Failed to fetch user share links:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch share links' }
    ));
  }
});

// Create referral link
apiRouter.post('/referral/create', requireAuth, async (req, res) => {
  try {
    const referralCode = `${req.user.username || req.user.id}-${Date.now().toString(36)}`;
    
    const referral = await storage.createReferral({
      referrerId: req.user.id,
      referralCode,
      referralSource: req.body.source || 'direct_link',
      shareLinkId: req.body.shareLinkId || null,
      metadata: {}
    });
    
    res.json(apiResponse(true, { referral, referralUrl: `${process.env.APP_URL || 'https://hyperdag.io'}/signup?ref=${referralCode}` }));
  } catch (err) {
    console.error('[ERROR] Failed to create referral:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to create referral' }
    ));
  }
});

// Complete referral (when someone signs up via referral code) - SERVER ONLY
apiRouter.post('/referral/complete', requireAuth, async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    // Security: Verify this is a valid new user signup
    if (!newUserId || req.user.id !== newUserId) {
      return res.status(403).json(apiResponse(
        false, null, null, { code: 'FORBIDDEN', message: 'Invalid referral completion request' }
      ));
    }
    
    const referral = await storage.getReferralByCode(referralCode);
    
    if (!referral) {
      return res.status(404).json(apiResponse(
        false, null, null, { code: 'NOT_FOUND', message: 'Referral code not found' }
      ));
    }
    
    // Prevent self-referral
    if (referral.referrerId === newUserId) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'SELF_REFERRAL', message: 'Cannot refer yourself' }
      ));
    }
    
    // Check if already completed
    if (referral.status === 'completed') {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'ALREADY_COMPLETED', message: 'Referral already completed' }
      ));
    }
    
    // Award RepID bonuses and update referral status in a transaction
    const referrerReward = 15; // 15 RepID for successful referral
    const newUserReward = 5; // 5 RepID welcome bonus
    
    try {
      // Execute all operations in a single transaction for atomicity
      const result = await storage.completeReferralWithRewards(
        referral.id,
        referral.referrerId,
        newUserId,
        referrerReward,
        newUserReward
      );
      
      res.json(apiResponse(true, { 
        message: 'Referral completed', 
        referral: result.referral,
        referrerUser: result.referrerUser,
        newUser: result.newUser,
        rewards: {
          referrer: referrerReward,
          newUser: newUserReward
        }
      }));
    } catch (rewardError) {
      console.error('[ERROR] Failed to complete referral with rewards:', rewardError);
      throw rewardError;
    }
  } catch (err) {
    console.error('[ERROR] Failed to complete referral:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to complete referral' }
    ));
  }
});

// Get user's referrals
apiRouter.get('/referral/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Only allow users to see their own referrals
    if (req.user.id !== userId) {
      return res.status(403).json(apiResponse(
        false, null, null, { code: 'FORBIDDEN', message: 'Access denied' }
      ));
    }
    
    const referrals = await storage.getReferralsByUserId(userId);
    res.json(apiResponse(true, { referrals }));
  } catch (err) {
    console.error('[ERROR] Failed to fetch user referrals:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch referrals' }
    ));
  }
});

// Get referral performance and SBT upgrade eligibility
apiRouter.get('/referral/stats/:userId', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Only allow users to see their own stats
    if (req.user.id !== userId) {
      return res.status(403).json(apiResponse(
        false, null, null, { code: 'FORBIDDEN', message: 'Access denied' }
      ));
    }
    
    const referrals = await storage.getReferralsByUserId(userId);
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    
    // Calculate SBT tier eligibility based on referral performance
    let sbtTier = 'bronze';
    let nextTier = 'silver';
    let referralsForNextTier = 5;
    
    if (completedReferrals >= 50) {
      sbtTier = 'diamond';
      nextTier = 'maximum';
      referralsForNextTier = 0;
    } else if (completedReferrals >= 20) {
      sbtTier = 'platinum';
      nextTier = 'diamond';
      referralsForNextTier = 50 - completedReferrals;
    } else if (completedReferrals >= 10) {
      sbtTier = 'gold';
      nextTier = 'platinum';
      referralsForNextTier = 20 - completedReferrals;
    } else if (completedReferrals >= 5) {
      sbtTier = 'silver';
      nextTier = 'gold';
      referralsForNextTier = 10 - completedReferrals;
    } else {
      sbtTier = 'bronze';
      nextTier = 'silver';
      referralsForNextTier = 5 - completedReferrals;
    }
    
    // Calculate total RepID earned from referrals
    const totalRepIDEarned = completedReferrals * 15;
    
    res.json(apiResponse(true, { 
      stats: {
        totalReferrals: referrals.length,
        completedReferrals,
        pendingReferrals,
        totalRepIDEarned,
        sbtTier,
        nextTier,
        referralsForNextTier
      }
    }));
  } catch (err) {
    console.error('[ERROR] Failed to fetch referral stats:', err);
    res.status(500).json(apiResponse(
      false, null, null, { code: 'SERVER_ERROR', message: 'Failed to fetch referral stats' }
    ));
  }
});

export default apiRouter;
