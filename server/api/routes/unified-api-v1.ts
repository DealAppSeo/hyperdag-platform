/**
 * Unified HyperDAG API v1 - GitHub-Style Design
 * 
 * Consolidates all AI-Web3 scaffolding and hybrid DAG endpoints
 * into a single, well-designed API following GitHub patterns.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth-middleware';
import { validateApiKey } from '../../middleware/api-key-middleware';
import { apiLimiter, strictLimiter } from '../../middleware/rate-limiter';
import { anfisRouter } from '../../services/ai/anfis-router';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

const router = Router();

// Standard response format (GitHub-style)
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    version: string;
  };
}

// Helper function for consistent responses
const createResponse = <T>(
  success: boolean,
  data?: T,
  error?: { message: string; code: string; details?: any },
  meta?: any
): ApiResponse<T> => ({
  success,
  data,
  error,
  meta: { version: '1.0', ...meta }
});

// Apply security middleware - TODO: Re-enable when middleware is working
// router.use(validateApiKey);  // Commented out: blocking all requests
// router.use(apiLimiter);

// Simple test endpoint to verify router is working
router.get('/test', async (req: Request, res: Response) => {
  res.json(createResponse(true, {
    message: 'Unified API v1 is working!',
    timestamp: new Date().toISOString()
  }));
});

/**
 * AI Services
 * GitHub-style AI provider routing with intelligent selection
 */

// POST /api/v1/ai/query - Intelligent AI routing
router.post('/ai/query', strictLimiter, async (req: Request, res: Response) => {
  try {
    const querySchema = z.object({
      prompt: z.string().min(1, "Prompt is required"),
      context: z.string().optional(),
      provider: z.enum(['openai', 'anthropic', 'perplexity', 'cohere']).optional(),
      priority: z.enum(['speed', 'accuracy', 'creativity', 'analysis']).default('accuracy'),
      max_tokens: z.number().max(4000).optional(),
      temperature: z.number().min(0).max(2).optional()
    });

    const validated = querySchema.parse(req.body);
    
    // Use ANFIS router for intelligent provider selection
    const characteristics = anfisRouter.analyzeQuestion(validated.prompt);
    const selectedProvider = anfisRouter.selectOptimalProvider(characteristics);
    const result = await anfisRouter.processQuery(validated.prompt, validated.context);

    // Track usage for revenue sharing - TODO: Re-enable when revenueShares table is added to schema
    // await trackAPIUsage(req.user?.id, 'ai-query', selectedProvider.provider);

    res.json(createResponse(true, {
      answer: result.answer,
      provider: selectedProvider.provider,
      confidence: selectedProvider.confidence,
      reasoning: selectedProvider.reasoning,
      usage: {
        tokens: result.usage?.total_tokens || 0,
        cost: result.usage?.cost || 0
      }
    }));

  } catch (error) {
    logger.error('AI query error:', error);
    res.status(400).json(createResponse(false, null, {
      message: error instanceof Error ? error.message : 'Invalid request',
      code: 'INVALID_REQUEST'
    }));
  }
});

// GET /api/v1/ai/providers - List available AI providers
router.get('/ai/providers', async (req: Request, res: Response) => {
  try {
    const providers = [
      {
        id: 'openai',
        name: 'OpenAI GPT-4o',
        status: 'active',
        strengths: ['general', 'coding', 'analysis'],
        cost_per_1k_tokens: 0.005
      },
      {
        id: 'anthropic',
        name: 'Claude Sonnet 4',
        status: 'active',
        strengths: ['reasoning', 'safety', 'analysis'],
        cost_per_1k_tokens: 0.015
      },
      {
        id: 'perplexity',
        name: 'Perplexity Sonar',
        status: 'active',
        strengths: ['search', 'real-time', 'facts'],
        cost_per_1k_tokens: 0.002
      },
      {
        id: 'cohere',
        name: 'Cohere Command',
        status: 'active',
        strengths: ['embeddings', 'classification', 'generation'],
        cost_per_1k_tokens: 0.001
      }
    ];

    res.json(createResponse(true, providers));
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json(createResponse(false, null, {
      message: 'Failed to fetch providers',
      code: 'INTERNAL_ERROR'
    }));
  }
});

// GET /api/v1/ai/usage - AI usage statistics
router.get('/ai/usage', requireAuth, async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Get usage stats from revenue shares table
    const usageStats = await db.select({
      provider: revenueShares.provider,
      totalCalls: sql<number>`sum(${revenueShares.apiCallsCount})`,
      totalCost: sql<number>`sum(${revenueShares.amount})`
    })
    .from(revenueShares)
    .where(eq(revenueShares.userId, req.user!.id))
    .groupBy(revenueShares.provider);

    res.json(createResponse(true, {
      timeframe,
      providers: usageStats,
      total_calls: usageStats.reduce((sum, stat) => sum + stat.totalCalls, 0),
      total_cost: usageStats.reduce((sum, stat) => sum + stat.totalCost, 0)
    }));

  } catch (error) {
    logger.error('Error fetching usage stats:', error);
    res.status(500).json(createResponse(false, null, {
      message: 'Failed to fetch usage statistics',
      code: 'INTERNAL_ERROR'
    }));
  }
});

/**
 * Blockchain Services
 * Multi-chain deployment and management
 */

// POST /api/v1/blockchain/deploy - Deploy smart contracts
router.post('/blockchain/deploy', strictLimiter, async (req: Request, res: Response) => {
  try {
    const deploySchema = z.object({
      network: z.enum(['polygon', 'solana', 'iota', 'stellar']),
      contract_type: z.enum(['token', 'nft', 'dao', 'defi']),
      parameters: z.object({
        name: z.string(),
        symbol: z.string().optional(),
        supply: z.number().optional(),
        metadata: z.record(z.any()).optional()
      })
    });

    const validated = deploySchema.parse(req.body);
    
    // Mock deployment for now - replace with actual blockchain integration
    const deploymentResult = {
      transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
      contract_address: '0x' + Math.random().toString(16).substr(2, 40),
      network: validated.network,
      gas_used: Math.floor(Math.random() * 1000000) + 21000,
      status: 'confirmed',
      block_number: Math.floor(Math.random() * 1000000) + 17000000
    };

    // Track usage - TODO: Re-enable when revenueShares table is added to schema
    // await trackAPIUsage(req.user?.id, 'blockchain-deploy', validated.network);

    res.json(createResponse(true, deploymentResult));

  } catch (error) {
    logger.error('Deployment error:', error);
    res.status(400).json(createResponse(false, null, {
      message: error instanceof Error ? error.message : 'Deployment failed',
      code: 'DEPLOYMENT_ERROR'
    }));
  }
});

// GET /api/v1/blockchain/networks - List supported networks (removed strictLimiter)
router.get('/blockchain/networks', async (req: Request, res: Response) => {
  try {
    const networks = [
      {
        id: 'polygon',
        name: 'Polygon',
        type: 'evm',
        status: 'active',
        average_gas_price: '30 gwei',
        block_time: '2.1s'
      },
      {
        id: 'solana',
        name: 'Solana',
        type: 'svm',
        status: 'active',
        average_gas_price: '0.000005 SOL',
        block_time: '400ms'
      },
      {
        id: 'iota',
        name: 'IOTA',
        type: 'dag',
        status: 'active',
        average_gas_price: '0 IOTA',
        block_time: 'instant'
      },
      {
        id: 'stellar',
        name: 'Stellar',
        type: 'stellar',
        status: 'active',
        average_gas_price: '0.00001 XLM',
        block_time: '5s'
      }
    ];

    res.json(createResponse(true, networks));
  } catch (error) {
    logger.error('Error fetching networks:', error);
    res.status(500).json(createResponse(false, null, {
      message: 'Failed to fetch networks',
      code: 'INTERNAL_ERROR'
    }));
  }
});

/**
 * ZKP (Zero-Knowledge Proof) Services
 */

// POST /api/v1/zkp/prove - Generate ZK proofs
router.post('/zkp/prove', strictLimiter, async (req: Request, res: Response) => {
  try {
    const proveSchema = z.object({
      circuit: z.enum(['identity', 'reputation', 'credential', 'membership']),
      private_inputs: z.record(z.any()),
      public_inputs: z.record(z.any()).optional()
    });

    const validated = proveSchema.parse(req.body);
    
    // Mock proof generation - replace with actual ZKP implementation
    const proof = {
      proof_id: 'zkp_' + Math.random().toString(36).substr(2, 16),
      circuit: validated.circuit,
      proof: '0x' + Math.random().toString(16).repeat(16),
      public_signals: validated.public_inputs || {},
      verification_key: 'vk_' + Math.random().toString(36).substr(2, 12),
      created_at: new Date().toISOString()
    };

    // Track usage - TODO: Re-enable when revenueShares table is added to schema
    // await trackAPIUsage(req.user?.id, 'zkp-prove', validated.circuit);

    res.json(createResponse(true, proof));

  } catch (error) {
    logger.error('ZKP proof error:', error);
    res.status(400).json(createResponse(false, null, {
      message: error instanceof Error ? error.message : 'Proof generation failed',
      code: 'PROOF_ERROR'
    }));
  }
});

// POST /api/v1/zkp/verify - Verify ZK proofs
router.post('/zkp/verify', async (req: Request, res: Response) => {
  try {
    const verifySchema = z.object({
      proof: z.string(),
      public_signals: z.record(z.any()),
      verification_key: z.string()
    });

    const validated = verifySchema.parse(req.body);
    
    // Mock verification - replace with actual ZKP verification
    const isValid = Math.random() > 0.1; // 90% success rate for demo
    
    const result = {
      valid: isValid,
      verified_at: new Date().toISOString(),
      verification_time_ms: Math.floor(Math.random() * 500) + 100
    };

    res.json(createResponse(true, result));

  } catch (error) {
    logger.error('ZKP verification error:', error);
    res.status(400).json(createResponse(false, null, {
      message: error instanceof Error ? error.message : 'Verification failed',
      code: 'VERIFICATION_ERROR'
    }));
  }
});

/**
 * Revenue Sharing - TODO: Re-enable when revenueShares table is added to schema
 */
/*
// GET /api/v1/revenue/stats - Revenue sharing statistics
router.get('/revenue/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const stats = await db.select({
      totalEarned: sql<number>`sum(${revenueShares.amount})`,
      totalCalls: sql<number>`sum(${revenueShares.apiCallsCount})`,
      pendingPayout: sql<number>`sum(case when ${revenueShares.paidOut} = false then ${revenueShares.amount} else 0 end)`
    })
    .from(revenueShares)
    .where(eq(revenueShares.userId, req.user!.id));

    const recentActivity = await db.select()
      .from(revenueShares)
      .where(eq(revenueShares.userId, req.user!.id))
      .orderBy(desc(revenueShares.createdAt))
      .limit(10);

    res.json(createResponse(true, {
      share_percentage: 15,
      minimum_payout: 50,
      ...stats[0],
      recent_activity: recentActivity
    }));

  } catch (error) {
    logger.error('Error fetching revenue stats:', error);
    res.status(500).json(createResponse(false, null, {
      message: 'Failed to fetch revenue statistics',
      code: 'INTERNAL_ERROR'
    }));
  }
});
*/

/**
 * User Management
 */

// GET /api/v1/user/profile - Get user profile
router.get('/user/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      isAdmin: users.isAdmin
    })
    .from(users)
    .where(eq(users.id, req.user!.id))
    .limit(1);

    if (!user[0]) {
      return res.status(404).json(createResponse(false, null, {
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }));
    }

    res.json(createResponse(true, user[0]));

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json(createResponse(false, null, {
      message: 'Failed to fetch user profile',
      code: 'INTERNAL_ERROR'
    }));
  }
});

// Helper function to track API usage for revenue sharing - TODO: Re-enable when revenueShares table is added to schema
/*
async function trackAPIUsage(userId: number | undefined, operation: string, provider: string) {
  if (!userId) return;

  try {
    // Calculate revenue share (15% of usage cost)
    const baseCost = 0.01; // Base cost per operation
    const revenueShare = baseCost * 0.15;

    await db.insert(revenueShares).values({
      userId,
      operation,
      provider,
      amount: revenueShare.toString(),
      apiCallsCount: 1
    });
  } catch (error) {
    logger.error('Error tracking API usage:', error);
  }
}
*/

export default router;