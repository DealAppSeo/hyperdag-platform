/**
 * ZKP RepID API - External API for HyperDAG Web3 ZKP RepID integration
 * 
 * Provides secure, scalable API for external apps to:
 * - Create and verify ZKP RepID NFTs
 * - Process contributions and update reputation scores  
 * - Perform zero-knowledge threshold verifications
 * - Access RepID data with privacy preservation
 */

import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { zkpRepIDService, ContributionEvent, ZKPProofRequest } from '../services/zkp-repid/zkp-repid-service';
import { MockRepIDService } from '../services/zkp-repid/mock-repid-service';
import { logger } from '../utils/logger';
import { apiLimiter } from '../middleware/rate-limiting';
import { validatePurposeHubAuth, optionalPurposeHubAuth } from '../../middleware/purposehub-auth';
import { purposeHubCorsMiddleware } from '../../config/purposehub-cors';

const router = Router();

// Apply CORS middleware to all RepID routes for PurposeHub.AI
router.use(purposeHubCorsMiddleware);

// Validation schemas
const createRepIDSchema = z.object({
  userId: z.number().positive(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  contributionType: z.enum(['code_contribution', 'governance_vote', 'community_help', 'mentorship', 'content_creation', 'bug_report', 'faith_tech_contribution']),
  contributionValue: z.number().min(1).max(100),
  impactScore: z.number().min(1).max(100),
  metadata: z.record(z.any()).optional()
});

const processContributionSchema = z.object({
  userId: z.number().positive(),
  contributionType: z.string().min(1),
  value: z.number().min(1).max(100),
  impactScore: z.number().min(1).max(100),
  metadata: z.record(z.any()).optional()
});

const verifyThresholdSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  threshold: z.number().min(1).max(300),
  category: z.enum(['governance', 'community', 'technical', 'total']).default('total'),
  proofData: z.object({
    proofType: z.enum(['threshold', 'contribution', 'eligibility']),
    claimData: z.record(z.any())
  }).optional()
});

const batchContributionsSchema = z.object({
  contributions: z.array(z.object({
    userId: z.number().positive(),
    contribution: processContributionSchema.omit({ userId: true })
  })).max(100, 'Batch size limited to 100')
});

// Enhanced rate limiting for different endpoint types
const createRepIDLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 RepID creations per minute
  message: { success: false, error: 'RepID creation rate limit exceeded' }
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 verifications per minute
  message: { success: false, error: 'Verification rate limit exceeded' }
});

/**
 * GET /api/web3-ai/repid/status
 * Health check and system status
 * Public endpoint - no auth required
 */
router.get('/status', apiLimiter, async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      features: {
        zkp_verification: true,
        dynamic_evolution: true,
        batch_processing: true,
        multi_chain_support: true,
        anfis_integration: true
      },
      networks: {
        polygon_mumbai: true,
        polygon_mainnet: process.env.NODE_ENV === 'production'
      },
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('[ZKP RepID API] Status check failed:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/web3-ai/repid/create
 * Create initial RepID for user on first contribution
 * Requires PurposeHub.AI API key authentication
 */
router.post('/create', validatePurposeHubAuth, createRepIDLimiter, async (req, res) => {
  try {
    const validated = createRepIDSchema.parse(req.body);
    
    logger.info(`[ZKP RepID API] RepID creation request for user ${validated.userId}`);
    
    const contributionEvent: ContributionEvent = {
      userId: validated.userId,
      contributionType: validated.contributionType,
      value: validated.contributionValue,
      impactScore: validated.impactScore,
      metadata: validated.metadata
    };
    
    const result = await zkpRepIDService.createRepID(validated.userId, contributionEvent);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          tokenId: result.tokenId,
          walletAddress: validated.walletAddress,
          initialScores: {
            governance: 0,
            community: 0,
            technical: 0
          },
          contributionProcessed: {
            type: validated.contributionType,
            value: validated.contributionValue,
            impact: validated.impactScore
          }
        },
        message: 'RepID created successfully'
      });
      
      logger.info(`[ZKP RepID API] RepID created successfully for user ${validated.userId}, token: ${result.tokenId}`);
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'RepID creation failed'
      });
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('[ZKP RepID API] RepID creation error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/web3-ai/repid/update
 * Process contribution and update RepID scores
 * Requires PurposeHub.AI API key authentication
 */
router.post('/update', validatePurposeHubAuth, apiLimiter, async (req, res) => {
  try {
    const validated = processContributionSchema.parse(req.body);
    
    logger.info(`[ZKP RepID API] Contribution processing for user ${validated.userId}: ${validated.contributionType}`);
    
    const contributionEvent: ContributionEvent = {
      userId: validated.userId,
      contributionType: validated.contributionType,
      value: validated.value,
      impactScore: validated.impactScore,
      metadata: validated.metadata
    };
    
    const result = await zkpRepIDService.processContribution(validated.userId, contributionEvent);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          scoreIncrease: result.scoreIncrease,
          contributionType: validated.contributionType,
          impactScore: validated.impactScore,
          processed: true
        },
        message: 'Contribution processed successfully'
      });
      
      logger.info(`[ZKP RepID API] Contribution processed for user ${validated.userId}: +${result.scoreIncrease} points`);
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Contribution processing failed'
      });
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('[ZKP RepID API] Contribution processing error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/web3-ai/repid/verify
 * Verify RepID threshold using zero-knowledge proofs
 * Requires PurposeHub.AI API key authentication
 */
router.post('/verify', validatePurposeHubAuth, verificationLimiter, async (req, res) => {
  try {
    const validated = verifyThresholdSchema.parse(req.body);
    
    logger.info(`[ZKP RepID API] Threshold verification for ${validated.walletAddress}: ${validated.threshold} (${validated.category})`);
    
    const result = await zkpRepIDService.verifyThreshold(
      validated.walletAddress, 
      validated.threshold, 
      validated.category
    );
    
    if (result.valid) {
      res.json({
        success: true,
        data: {
          valid: true,
          threshold: validated.threshold,
          category: validated.category,
          proofHash: result.proof,
          verified: true
        },
        message: 'Threshold verification successful'
      });
    } else {
      res.json({
        success: true,
        data: {
          valid: false,
          threshold: validated.threshold,
          category: validated.category,
          verified: false
        },
        message: 'Threshold not met'
      });
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('[ZKP RepID API] Verification error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/web3-ai/repid/data/:walletAddress
 * Get RepID data for user (public scores only)
 */
router.get('/data/:walletAddress', apiLimiter, async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const repIDData = await zkpRepIDService.getRepIDData(walletAddress);
    
    if (repIDData) {
      const totalScore = repIDData.governanceScore + repIDData.communityScore + repIDData.technicalScore;
      
      res.json({
        success: true,
        data: {
          walletAddress,
          scores: {
            governance: repIDData.governanceScore,
            community: repIDData.communityScore,
            technical: repIDData.technicalScore,
            total: totalScore
          },
          activity: {
            lastUpdate: repIDData.lastUpdate,
            activityCount: repIDData.activityCount
          },
          metadata: {
            metadataURI: repIDData.metadataURI
          }
        },
        message: 'RepID data retrieved successfully'
      });
      
      logger.info(`[ZKP RepID API] RepID data retrieved for ${walletAddress}: total score ${totalScore}`);
    } else {
      res.status(404).json({
        success: false,
        error: 'RepID not found for this wallet address'
      });
    }
    
  } catch (error: any) {
    logger.error('[ZKP RepID API] Get RepID data error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/web3-ai/repid/batch
 * Batch process multiple contributions for gas efficiency
 * Requires PurposeHub.AI API key authentication
 */
router.post('/batch', validatePurposeHubAuth, apiLimiter, async (req, res) => {
  try {
    const validated = batchContributionsSchema.parse(req.body);
    
    logger.info(`[ZKP RepID API] Batch processing ${validated.contributions.length} contributions`);
    
    const result = await zkpRepIDService.batchProcessContributions(
      validated.contributions.map(item => ({
        userId: item.userId,
        contribution: {
          userId: item.userId,
          contributionType: item.contribution.contributionType,
          value: item.contribution.value,
          impactScore: item.contribution.impactScore,
          metadata: item.contribution.metadata
        }
      }))
    );
    
    res.json({
      success: result.success,
      data: {
        processed: result.processed,
        total: validated.contributions.length,
        errors: result.errors,
        batchSize: validated.contributions.length
      },
      message: `Batch processing completed: ${result.processed}/${validated.contributions.length} successful`
    });
    
    logger.info(`[ZKP RepID API] Batch processed: ${result.processed}/${validated.contributions.length} contributions`);
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      logger.error('[ZKP RepID API] Batch processing error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/web3-ai/repid/docs
 * API documentation and integration examples
 * Public endpoint with PurposeHub.AI-specific examples
 */
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      title: 'HyperDAG ZKP RepID API - PurposeHub.AI Integration',
      version: '1.0.0',
      description: 'Zero-Knowledge Proof Reputation Identity API for purpose-driven Web3 applications',
      baseUrl: process.env.API_BASE_URL || 'https://api.hyperdag.org',
      authentication: {
        method: 'API Key',
        headers: {
          authorization: 'Bearer purposehub_live_YOUR_API_KEY',
          alternative: 'X-API-Key: purposehub_live_YOUR_API_KEY'
        },
        note: 'Contact admin for PurposeHub.AI API key'
      },
      endpoints: {
        status: {
          method: 'GET',
          path: '/api/web3-ai/repid/status',
          description: 'Check API status and available features',
          auth: 'Not required',
          rateLimit: '1000/hour'
        },
        create: {
          method: 'POST',
          path: '/api/web3-ai/repid/create',
          description: 'Create initial RepID for user on first contribution',
          auth: 'Required',
          rateLimit: '5/minute',
          requiredFields: ['userId', 'walletAddress', 'contributionType', 'contributionValue', 'impactScore']
        },
        update: {
          method: 'POST',
          path: '/api/web3-ai/repid/update',
          description: 'Process contribution and update RepID scores',
          auth: 'Required',
          rateLimit: '100/hour',
          requiredFields: ['userId', 'contributionType', 'value', 'impactScore']
        },
        verify: {
          method: 'POST',
          path: '/api/web3-ai/repid/verify',
          description: 'Verify RepID threshold using zero-knowledge proofs',
          auth: 'Required',
          rateLimit: '100/minute',
          requiredFields: ['walletAddress', 'threshold'],
          optionalFields: ['category', 'proofData']
        },
        data: {
          method: 'GET',
          path: '/api/web3-ai/repid/data/:walletAddress',
          description: 'Get RepID data for wallet address',
          auth: 'Not required',
          rateLimit: '1000/hour'
        },
        batch: {
          method: 'POST',
          path: '/api/web3-ai/repid/batch',
          description: 'Batch process multiple contributions (max 100)',
          auth: 'Required',
          rateLimit: '10/hour'
        }
      },
      purposeHubExamples: {
        scriptureBasedMentoring: {
          description: 'Award RepID for scripture-based mentorship sessions',
          request: {
            userId: 12345,
            contributionType: 'faith_tech_contribution',
            value: 90,
            impactScore: 95,
            metadata: {
              activityType: 'scripture_mentoring',
              scripture: 'Proverbs 27:17',
              topic: 'Iron sharpens iron - bilateral learning',
              durationMinutes: 45,
              menteeImpact: 'high'
            }
          },
          response: {
            success: true,
            data: {
              scoreIncrease: 18,
              contributionType: 'faith_tech_contribution',
              impactScore: 95,
              processed: true
            }
          }
        },
        grantEligibilityCheck: {
          description: 'Verify user meets RepID threshold for grant eligibility',
          request: {
            walletAddress: '0x742d35Cc6635C0532925a3b8D4C1d5d8bE5d1234',
            threshold: 100,
            category: 'total'
          },
          response: {
            success: true,
            data: {
              valid: true,
              threshold: 100,
              category: 'total',
              proofHash: '0xzkp_proof_hash',
              verified: true
            }
          },
          useCases: [
            'Faith-based grant applications (>100 RepID)',
            'Community leadership roles (>150 RepID)',
            'Mentor certification (>200 RepID)'
          ]
        },
        purposeMatchContribution: {
          description: 'Update RepID when user discovers their purpose through AI matching',
          request: {
            userId: 67890,
            contributionType: 'community_help',
            value: 75,
            impactScore: 80,
            metadata: {
              activityType: 'purpose_discovery',
              matchType: 'biblical_calling',
              ikigaiScore: 0.92,
              decayResetApplied: true
            }
          },
          note: 'Purpose discoveries reset RepID decay and boost community scores'
        },
        hackathonTeamVerification: {
          description: 'Batch verify RepID for entire hackathon team eligibility',
          request: {
            contributions: [
              {
                userId: 1001,
                contribution: {
                  contributionType: 'code_contribution',
                  value: 85,
                  impactScore: 90,
                  metadata: { role: 'lead_developer', hackathon: 'faith_tech_2024' }
                }
              },
              {
                userId: 1002,
                contribution: {
                  contributionType: 'mentorship',
                  value: 80,
                  impactScore: 85,
                  metadata: { role: 'mentor', hackathon: 'faith_tech_2024' }
                }
              },
              {
                userId: 1003,
                contribution: {
                  contributionType: 'governance_vote',
                  value: 70,
                  impactScore: 75,
                  metadata: { role: 'team_coordinator', hackathon: 'faith_tech_2024' }
                }
              }
            ]
          },
          optimalBatchSize: '3-10 team members per batch for best gas efficiency'
        }
      },
      supportedContributionTypes: [
        { type: 'faith_tech_contribution', description: 'Scripture-based mentoring, faith-driven development' },
        { type: 'mentorship', description: 'Bilateral learning sessions, knowledge sharing' },
        { type: 'community_help', description: 'Purpose discovery, helping others find calling' },
        { type: 'code_contribution', description: 'Technical contributions, open source work' },
        { type: 'governance_vote', description: 'Community decision-making participation' },
        { type: 'content_creation', description: 'Educational content, documentation' },
        { type: 'bug_report', description: 'Quality improvement, issue reporting' }
      ],
      repIdScoreCategories: {
        governance: 'Leadership, decision-making, community governance',
        community: 'Helping others, mentoring, purpose discovery',
        technical: 'Code contributions, technical skills, problem-solving',
        total: 'Overall reputation score (sum of all categories)'
      },
      gasOptimization: {
        singleUpdate: '~0.018 USD per update on Polygon',
        batchUpdate: '~0.045 USD for 100 updates (0.00045 USD per update)',
        savings: '96% cost reduction using batch processing',
        recommendation: 'Use /batch endpoint for teams of 3+ members'
      },
      sdk: {
        javascript: 'npm install @hyperdag/zkp-repid-sdk',
        python: 'pip install hyperdag-zkp-repid'
      }
    }
  });
});

// Mock endpoints for developer onboarding and testing
const mockCreateSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  scores: z.array(z.object({
    category: z.string(),
    score: z.number().min(0).max(1000),
    weight: z.number().optional()
  }))
});

const mockVerifySchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  threshold: z.number().min(0),
  category: z.string().optional()
});

/**
 * POST /api/web3-ai/repid/create-mock
 * Create mock RepID instantly for testing (no ZKP generation)
 */
router.post('/create-mock', apiLimiter, async (req, res) => {
  try {
    const validated = mockCreateSchema.parse(req.body);
    
    const result = await MockRepIDService.createMockRepID(validated.wallet, validated.scores);
    
    res.json({
      success: true,
      data: result,
      mockMode: true,
      message: 'Mock RepID created instantly for testing'
    });
  } catch (error: any) {
    logger.error('[Mock RepID API] Create failed:', error);
    res.status(400).json({ 
      success: false, 
      error: error?.message || 'Invalid request data' 
    });
  }
});

/**
 * POST /api/web3-ai/repid/verify-mock
 * Verify mock RepID threshold instantly
 */
router.post('/verify-mock', apiLimiter, async (req, res) => {
  try {
    const validated = mockVerifySchema.parse(req.body);
    
    const verified = await MockRepIDService.verifyMockRepID(
      validated.wallet, 
      validated.threshold, 
      validated.category
    );
    
    res.json({
      success: true,
      verified,
      mockMode: true,
      message: 'Mock verification completed instantly'
    });
  } catch (error: any) {
    logger.error('[Mock RepID API] Verify failed:', error);
    res.status(400).json({ 
      success: false, 
      error: error?.message || 'Invalid request data' 
    });
  }
});

/**
 * PATCH /api/web3-ai/repid/update-mock
 * Update mock RepID scores instantly
 */
router.patch('/update-mock', apiLimiter, async (req, res) => {
  try {
    const { wallet, scores } = req.body;
    
    if (!wallet || !Array.isArray(scores)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing wallet or scores array' 
      });
    }
    
    const result = await MockRepIDService.updateMockRepID(wallet, scores);
    
    res.json({
      success: true,
      data: result,
      mockMode: true,
      message: 'Mock RepID updated instantly'
    });
  } catch (error: any) {
    logger.error('[Mock RepID API] Update failed:', error);
    res.status(400).json({ 
      success: false, 
      error: error?.message || 'Invalid request data' 
    });
  }
});

/**
 * POST /api/web3-ai/repid/batch-verify-mock
 * Batch verify mock RepIDs efficiently
 */
router.post('/batch-verify-mock', apiLimiter, async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or empty requests array' 
      });
    }
    
    if (requests.length > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Batch size limited to 100 requests' 
      });
    }
    
    const results = await MockRepIDService.batchVerifyMockRepIDs(requests);
    
    res.json({
      success: true,
      results,
      mockMode: true,
      batchSize: requests.length,
      message: 'Mock batch verification completed instantly'
    });
  } catch (error: any) {
    logger.error('[Mock RepID API] Batch verify failed:', error);
    res.status(400).json({ 
      success: false, 
      error: error?.message || 'Invalid request data' 
    });
  }
});

/**
 * GET /api/web3-ai/repid/gas-estimate/:operation
 * Get real-time gas cost estimates for operations
 */
router.get('/gas-estimate/:operation', apiLimiter, async (req, res) => {
  try {
    const operation = req.params.operation;
    const validOperations = ['create', 'update', 'verify', 'batch'];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid operation. Must be: create, update, verify, or batch' 
      });
    }
    
    // Simulate real-time gas estimation with realistic values
    const baseGasPrice = 30000000000; // 30 gwei base
    const variability = 0.2; // ±20% variation
    const gasPrice = Math.round(baseGasPrice * (1 + (Math.random() - 0.5) * variability));
    
    const operationCosts = {
      create: { gas: 250000, baseUSD: 0.025 },
      update: { gas: 180000, baseUSD: 0.018 },
      verify: { gas: 90000, baseUSD: 0.009 },
      batch: { gas: 450000, baseUSD: 0.045 }
    };
    
    const opCost = operationCosts[operation as keyof typeof operationCosts];
    const estimatedCostETH = (gasPrice * opCost.gas) / 1e18;
    const estimatedCostUSD = estimatedCostETH * 2500; // Rough ETH price
    
    res.json({
      success: true,
      operation,
      gasPrice: gasPrice.toString(),
      estimatedGas: opCost.gas,
      estimatedCost: estimatedCostETH.toFixed(6),
      costUSD: Math.round(estimatedCostUSD * 1000) / 1000,
      timestamp: Date.now(),
      network: 'Polygon',
      note: 'Real-time estimates may vary'
    });
  } catch (error: any) {
    logger.error('[Gas Estimation API] Failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Gas estimation service unavailable' 
    });
  }
});

/**
 * GET /api/web3-ai/repid/mock-stats
 * Get mock database statistics for development
 */
router.get('/mock-stats', apiLimiter, (req, res) => {
  try {
    const stats = MockRepIDService.getStats();
    
    res.json({
      success: true,
      data: stats,
      mockMode: true,
      message: 'Mock database statistics'
    });
  } catch (error: any) {
    logger.error('[Mock Stats API] Failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Mock stats unavailable' 
    });
  }
});

/**
 * GET /api/web3-ai/repid/docs
 * API documentation and integration guide
 */
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    title: 'HyperDAG ZKP RepID API Documentation',
    version: '1.0.0',
    description: 'Zero-Knowledge Proof Reputation System for Web3 applications',
    endpoints: {
      production: {
        create: 'POST /api/web3-ai/repid/create - Create RepID with ZKP',
        verify: 'POST /api/web3-ai/repid/verify - Verify RepID threshold with ZKP',
        update: 'PATCH /api/web3-ai/repid/update - Update RepID scores',
        data: 'GET /api/web3-ai/repid/data/:wallet - Get RepID public data',
        batch: 'POST /api/web3-ai/repid/batch - Batch verify RepIDs'
      },
      development: {
        'create-mock': 'POST /api/web3-ai/repid/create-mock - Instant mock RepID creation',
        'verify-mock': 'POST /api/web3-ai/repid/verify-mock - Instant mock verification',
        'update-mock': 'PATCH /api/web3-ai/repid/update-mock - Instant mock updates',
        'batch-verify-mock': 'POST /api/web3-ai/repid/batch-verify-mock - Instant batch verification',
        'gas-estimate': 'GET /api/web3-ai/repid/gas-estimate/:operation - Real-time gas costs',
        'mock-stats': 'GET /api/web3-ai/repid/mock-stats - Mock database statistics'
      }
    },
    sdk: {
      npm: 'npm install @hyperdag/repid-sdk',
      github: 'https://github.com/hyperdag/repid-sdk',
      docs: 'https://docs.hyperdag.org/repid-sdk'
    },
    features: {
      'zero_knowledge_proofs': 'Privacy-preserving threshold verification',
      'dynamic_evolution': 'Time-based score decay and evolution',
      'anfis_optimization': 'Fuzzy logic routing for optimal performance',
      'multi_chain': 'Polygon, Ethereum, and other EVM chains',
      'developer_friendly': 'Mock mode for testing and easy integration'
    }
  });
});

export default router;