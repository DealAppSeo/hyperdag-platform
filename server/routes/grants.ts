import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { findAIEnhancedGrantMatches, findRuleBasedMatches } from '../services/grant-matching';
import { log } from '../vite';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Request validation schemas
const findMatchesSchema = z.object({
  rfpId: z.number().int().positive(),
  options: z.object({
    threshold: z.number().min(0).max(1).optional(),
    maxResults: z.number().int().positive().max(50).optional(),
    includeReputation: z.boolean().optional(),
    semanticMatching: z.boolean().optional(),
    enhancementLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional()
  }).optional()
});

const createGrantMatchSchema = z.object({
  rfpId: z.number().int().positive(),
  grantSourceId: z.number().int().positive(),
  matchScore: z.string(),
  matchReason: z.string(),
  potentialFunding: z.number().optional()
});

/**
 * Find grant matches for an RFP using AI-enhanced algorithms
 * POST /api/grants/find-matches
 */
router.post('/find-matches', requireAuth, async (req, res) => {
  try {
    const { rfpId, options = {} } = findMatchesSchema.parse(req.body);
    
    // Get the RFP
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({
        success: false,
        message: 'RFP not found'
      });
    }
    
    // Check if user has permission to access this RFP
    if (req.user && (rfp.creatorId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    log(`Finding grant matches for RFP ${rfpId} with options: ${JSON.stringify(options)}`, 'grants-api');
    
    // Find matches using AI-enhanced algorithm
    const matches = await findAIEnhancedGrantMatches(rfp, options);
    
    log(`Found ${matches.length} grant matches for RFP ${rfpId}`, 'grants-api');
    
    res.json({
      success: true,
      data: {
        rfpId,
        matches,
        options,
        totalFound: matches.length,
        enhancedWithAI: matches.some(match => (match as any).aiRecommended)
      }
    });
  } catch (error: any) {
    log(`Error finding grant matches: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to find grant matches',
      error: error.message
    });
  }
});

/**
 * Get all grant matches for an RFP
 * GET /api/grants/matches/:rfpId
 */
router.get('/matches/:rfpId', requireAuth, async (req, res) => {
  try {
    const rfpId = parseInt(req.params.rfpId);
    if (isNaN(rfpId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RFP ID'
      });
    }
    
    // Get the RFP to check permissions
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({
        success: false,
        message: 'RFP not found'
      });
    }
    
    // Check permissions
    if (req.user && (rfp.creatorId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get existing matches
    const matches = await storage.getGrantMatchesByRfpId(rfpId);
    
    res.json({
      success: true,
      data: {
        rfpId,
        matches,
        totalMatches: matches.length
      }
    });
  } catch (error: any) {
    log(`Error getting grant matches: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to get grant matches',
      error: error.message
    });
  }
});

/**
 * Save a grant match
 * POST /api/grants/matches
 */
router.post('/matches', requireAuth, async (req, res) => {
  try {
    const matchData = createGrantMatchSchema.parse(req.body);
    
    // Get the RFP to check permissions
    const rfp = await storage.getRfpById(matchData.rfpId);
    if (!rfp) {
      return res.status(404).json({
        success: false,
        message: 'RFP not found'
      });
    }
    
    // Check permissions
    if (req.user && (rfp.creatorId !== req.user.id && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get the grant source to include in the match
    const grantSource = await storage.getGrantSourceById(matchData.grantSourceId);
    if (!grantSource) {
      return res.status(404).json({
        success: false,
        message: 'Grant source not found'
      });
    }
    
    // Create the grant match
    const grantMatch = await storage.createGrantMatch({
      ...matchData,
      status: 'suggested',
      grantSource,
      aiRecommended: false,
      tags: []
    });
    
    log(`Created grant match ${grantMatch.id} for RFP ${matchData.rfpId}`, 'grants-api');
    
    res.json({
      success: true,
      data: grantMatch
    });
  } catch (error: any) {
    log(`Error creating grant match: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to create grant match',
      error: error.message
    });
  }
});

/**
 * Update grant match status
 * PATCH /api/grants/matches/:matchId
 */
router.patch('/matches/:matchId', requireAuth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match ID'
      });
    }
    
    const { status } = z.object({
      status: z.enum(['suggested', 'accepted', 'rejected', 'applied'])
    }).parse(req.body);
    
    // Get the match to check permissions
    const match = await storage.getGrantMatchById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Grant match not found'
      });
    }
    
    // Get the RFP to check permissions
    const rfp = await storage.getRfpById(match.rfpId);
    if (!rfp || (req.user && (rfp.creatorId !== req.user.id && !req.user.isAdmin))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update the match status
    const updatedMatch = await storage.updateGrantMatch(matchId, { status });
    
    log(`Updated grant match ${matchId} status to ${status}`, 'grants-api');
    
    res.json({
      success: true,
      data: updatedMatch
    });
  } catch (error: any) {
    log(`Error updating grant match: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to update grant match',
      error: error.message
    });
  }
});

/**
 * Get all available grant sources
 * GET /api/grants/sources
 */
router.get('/sources', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const category = req.query.category as string;
    const search = req.query.search as string;
    
    const grantSources = await storage.getGrantSources();
    
    res.json({
      success: true,
      data: grantSources
    });
  } catch (error: any) {
    log(`Error getting grant sources: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to get grant sources',
      error: error.message
    });
  }
});

/**
 * Get grant source details
 * GET /api/grants/sources/:sourceId
 */
router.get('/sources/:sourceId', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    if (isNaN(sourceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid source ID'
      });
    }
    
    const grantSource = await storage.getGrantSourceById(sourceId);
    if (!grantSource) {
      return res.status(404).json({
        success: false,
        message: 'Grant source not found'
      });
    }
    
    res.json({
      success: true,
      data: grantSource
    });
  } catch (error: any) {
    log(`Error getting grant source: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to get grant source',
      error: error.message
    });
  }
});

/**
 * Test grant matching algorithms
 * POST /api/grants/test-matching
 */
router.post('/test-matching', requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { rfpId } = z.object({
      rfpId: z.number().int().positive()
    }).parse(req.body);
    
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({
        success: false,
        message: 'RFP not found'
      });
    }
    
    // Test both AI-enhanced and rule-based matching
    const [aiMatches, ruleMatches] = await Promise.allSettled([
      findAIEnhancedGrantMatches(rfp, { maxResults: 5 }),
      findRuleBasedMatches(rfp, { maxResults: 5 })
    ]);
    
    res.json({
      success: true,
      data: {
        rfpId,
        aiMatches: aiMatches.status === 'fulfilled' ? aiMatches.value : [],
        ruleMatches: ruleMatches.status === 'fulfilled' ? ruleMatches.value : [],
        aiError: aiMatches.status === 'rejected' ? aiMatches.reason.message : null,
        ruleError: ruleMatches.status === 'rejected' ? ruleMatches.reason.message : null
      }
    });
  } catch (error: any) {
    log(`Error testing grant matching: ${error.message}`, 'grants-api');
    res.status(500).json({
      success: false,
      message: 'Failed to test grant matching',
      error: error.message
    });
  }
});

export default router;