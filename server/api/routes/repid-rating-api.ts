/**
 * RepID Rating API Endpoints
 * Implements multi-dimensional weighted rating system
 */

import { Router } from 'express';
import { weightedRatingService } from '../../services/repid/weighted-rating-service';
import { repidApiKeyService } from '../../services/repid/repid-apikey-service';
import { db } from '../../db';
import { repidUserApiKeys, repidAggregatedScores, users } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export const repidRatingRouter = Router();

/**
 * Extend Express Request type to include repidApiKey
 */
declare module 'express-serve-static-core' {
  interface Request {
    repidApiKey?: any;
  }
}

/**
 * Middleware: Validate RepID API key and secret
 */
async function validateRepIDApiKey(req: any, res: any, next: any) {
  try {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    const apiSecret = req.headers['x-api-secret'];
    
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        error: 'Missing API key or secret. Include Authorization: Bearer <key> and X-API-Secret: <secret> headers.'
      });
    }
    
    const validation = await repidApiKeyService.validateApiKey(apiKey, apiSecret);
    
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: validation.error
      });
    }
    
    // Attach key data to request for rate limiting
    req.repidApiKey = validation.keyData;
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'API key validation failed: ' + error.message
    });
  }
}

/**
 * POST /api/repid/ratings/submit
 * Submit a new multi-dimensional rating
 */
repidRatingRouter.post('/ratings/submit', validateRepIDApiKey, async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      targetWallet,
      factualScore,
      truthfulScore,
      authenticScore,
      helpfulScore,
      ratingType,
      confidence,
      zkpProofHash,
      zkpVerified,
      scriptureReference,
      faithContext,
      context,
      evidence
    } = req.body;
    
    // Get rater info from API key
    const apiKey = req.repidApiKey;
    
    // Validate required fields
    if (!targetType || !targetId || 
        factualScore === undefined || truthfulScore === undefined ||
        authenticScore === undefined || helpfulScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: targetType, targetId, and all 4 dimension scores required'
      });
    }
    
    // Submit rating
    const result = await weightedRatingService.submitRating({
      raterType: 'user', // Assumes API key belongs to a user
      raterId: apiKey.userId,
      raterWallet: apiKey.walletAddress,
      targetType,
      targetId,
      targetWallet,
      factualScore: parseFloat(factualScore),
      truthfulScore: parseFloat(truthfulScore),
      authenticScore: parseFloat(authenticScore),
      helpfulScore: parseFloat(helpfulScore),
      ratingType: ratingType || 'peer',
      confidence: confidence ? parseFloat(confidence) : undefined,
      zkpProofHash,
      zkpVerified: zkpVerified || false,
      scriptureReference,
      faithContext,
      context,
      evidence
    });
    
    if (result.success) {
      // Update API key's RepID after rating
      await repidApiKeyService.updateRepIDForKey(apiKey.userId);
      
      res.json({
        success: true,
        ratingId: result.ratingId,
        updatedRepID: result.updatedRepID,
        message: scriptureReference 
          ? 'Rating submitted with faith bonus (+20% weight)' 
          : 'Rating submitted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('[RepIDRatingAPI] Submit failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/repid/scores/:userId
 * Get aggregated RepID scores for a user
 */
repidRatingRouter.get('/scores/:userId', validateRepIDApiKey, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const scores = await weightedRatingService.getAggregatedScores('user', userId);
    
    if (!scores) {
      return res.json({
        success: true,
        scores: {
          compositeRepID: 50.0, // Neutral baseline
          factualScore: 5.0,
          truthfulScore: 5.0,
          authenticScore: 5.0,
          helpfulScore: 5.0,
          totalRatingsReceived: 0,
          message: 'No ratings yet - showing neutral baseline'
        }
      });
    }
    
    res.json({
      success: true,
      scores: {
        compositeRepID: parseFloat(scores.compositeRepID),
        factualScore: parseFloat(scores.factualScore),
        truthfulScore: parseFloat(scores.truthfulScore),
        authenticScore: parseFloat(scores.authenticScore),
        helpfulScore: parseFloat(scores.helpfulScore),
        totalRatingsReceived: scores.totalRatingsReceived,
        peerRatingsCount: scores.peerRatingsCount,
        selfRatingsCount: scores.selfRatingsCount,
        challengeRatingsCount: scores.challengeRatingsCount,
        manipulationRiskScore: parseFloat(scores.manipulationRiskScore),
        confidenceInterval: scores.confidenceInterval ? parseFloat(scores.confidenceInterval) : null,
        scoreVariance: scores.scoreVariance ? parseFloat(scores.scoreVariance) : null,
        dimensionWeights: scores.dimensionWeights,
        lastUpdated: scores.lastUpdated
      }
    });
  } catch (error: any) {
    console.error('[RepIDRatingAPI] Get scores failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/repid/keys/generate
 * Generate a new RepID API key for a user
 */
repidRatingRouter.post('/keys/generate', async (req, res) => {
  try {
    const {
      userId,
      walletAddress,
      keyName,
      permissions,
      expiresInDays,
      isChurch // Special flag for church/nonprofit
    } = req.body;
    
    if (!userId || !walletAddress || !keyName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, walletAddress, keyName'
      });
    }
    
    // Generate API key
    const result = await repidApiKeyService.generateUserApiKey({
      userId,
      walletAddress,
      keyName,
      permissions: permissions || {
        repid: ['read'],
        ratings: ['submit', 'view'],
        dao: [],
        zkp: []
      },
      expiresInDays: expiresInDays || null
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    // If church, upgrade to unlimited tier
    if (isChurch) {
      await db.update(repidUserApiKeys)
        .set({
          rateLimitTier: 'unlimited',
          baseRateLimit: 10000, // Very high limit for churches
          metadata: { churchAccount: true, freeAccess: true }
        })
        .where(eq(repidUserApiKeys.apiKey, result.credentials!.apiKey));
    }
    
    res.json({
      success: true,
      credentials: {
        apiKey: result.credentials!.apiKey,
        apiSecret: result.credentials!.apiSecret, // ONLY SHOWN ONCE!
        keyId: result.credentials!.keyId,
        rateLimitTier: isChurch ? 'unlimited' : result.credentials!.rateLimitTier,
        effectiveRateLimit: isChurch ? 10000 : result.credentials!.effectiveRateLimit,
        permissions: result.credentials!.permissions
      },
      warning: '⚠️ Save your API secret now! It cannot be retrieved later.',
      churchStatus: isChurch ? '✝️ Church account - unlimited free access' : null
    });
  } catch (error: any) {
    console.error('[RepIDRatingAPI] Key generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/repid/keys/validate
 * Validate API key and get current rate limits
 */
repidRatingRouter.get('/keys/validate', validateRepIDApiKey, async (req, res) => {
  try {
    const apiKey = req.repidApiKey;
    const effectiveLimit = await repidApiKeyService.getEffectiveRateLimit(apiKey.apiKey);
    
    res.json({
      success: true,
      valid: true,
      keyInfo: {
        userId: apiKey.userId,
        walletAddress: apiKey.walletAddress,
        keyName: apiKey.keyName,
        currentRepID: parseFloat(apiKey.currentRepID),
        rateLimitTier: apiKey.rateLimitTier,
        effectiveRateLimit: effectiveLimit,
        permissions: apiKey.permissions,
        totalRequests: apiKey.totalRequests,
        lastUsed: apiKey.lastUsed,
        isChurch: apiKey.metadata?.churchAccount || false
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/repid/ratings/batch
 * Submit multiple ratings in one request (for efficiency)
 */
repidRatingRouter.post('/ratings/batch', validateRepIDApiKey, async (req, res) => {
  try {
    const { ratings } = req.body;
    
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ratings must be a non-empty array'
      });
    }
    
    const apiKey = req.repidApiKey;
    const results = [];
    
    for (const rating of ratings) {
      const result = await weightedRatingService.submitRating({
        raterType: 'user',
        raterId: apiKey.userId,
        raterWallet: apiKey.walletAddress,
        targetType: rating.targetType,
        targetId: rating.targetId,
        targetWallet: rating.targetWallet,
        factualScore: parseFloat(rating.factualScore),
        truthfulScore: parseFloat(rating.truthfulScore),
        authenticScore: parseFloat(rating.authenticScore),
        helpfulScore: parseFloat(rating.helpfulScore),
        ratingType: rating.ratingType || 'peer',
        scriptureReference: rating.scriptureReference,
        faithContext: rating.faithContext,
        context: rating.context
      });
      
      results.push({
        targetId: rating.targetId,
        success: result.success,
        ratingId: result.ratingId,
        error: result.error
      });
    }
    
    // Update rater's RepID after batch
    await repidApiKeyService.updateRepIDForKey(apiKey.userId);
    
    res.json({
      success: true,
      results,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error: any) {
    console.error('[RepIDRatingAPI] Batch submit failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
