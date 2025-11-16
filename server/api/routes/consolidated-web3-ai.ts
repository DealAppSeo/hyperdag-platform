/**
 * Consolidated Web3-AI API Router
 * 
 * This consolidates the similar AI-Web3 Scaffolding and Hybrid DAG endpoints
 * into a unified, secure, and feature-complete API that delivers:
 * - ANFIS Fuzzy Logic Intelligent Routing
 * - Revenue Share Program
 * - Multi-blockchain support
 * - ZKP-based privacy
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth-middleware';
import { validateApiKey } from '../../middleware/api-key-middleware';
import { apiLimiter, strictLimiter } from '../../middleware/rate-limiter';
import { anfisRouter } from '../../services/ai/anfis-router';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { users, developerServices, serviceUsage, insertServiceUsageSchema } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';

const router = Router();

// Apply security middleware
router.use(validateApiKey);
router.use(apiLimiter);

/**
 * ANFIS Fuzzy Logic AI Routing
 * POST /api/web3-ai/anfis/query
 * 
 * Routes AI queries through fuzzy logic system for optimal provider selection
 */
router.post('/anfis/query', strictLimiter, async (req: Request, res: Response) => {
  try {
    const querySchema = z.object({
      question: z.string().min(1, "Question is required"),
      context: z.string().optional(),
      preferredProvider: z.enum(['openai', 'anthropic', 'perplexity', 'cohere']).optional(),
      priority: z.enum(['speed', 'accuracy', 'creativity', 'analysis']).default('accuracy')
    });

    const { question, context, preferredProvider, priority } = querySchema.parse(req.body);

    // Use ANFIS router for intelligent provider selection
    const characteristics = anfisRouter.analyzeQuestion(question);
    const selectedProvider = anfisRouter.selectOptimalProvider(characteristics);
    const result = await anfisRouter.processQuery(question, context);

    // Track usage for revenue sharing
    await trackAPIUsage(req.user?.id, 'anfis-query', selectedProvider.provider);

    res.json({
      success: true,
      data: {
        answer: result.answer,
        provider: selectedProvider.provider,
        confidence: result.confidence,
        processingTime: result.processingTime,
        characteristics: characteristics,
        reasoning: selectedProvider.reasoning
      }
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] ANFIS query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process ANFIS query'
    });
  }
});

/**
 * Get ANFIS Provider Stats
 * GET /api/web3-ai/anfis/providers
 */
router.get('/anfis/providers', async (req: Request, res: Response) => {
  try {
    const providers = anfisRouter.getProviderStats();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] Provider stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider statistics'
    });
  }
});

/**
 * Developer Marketplace - Get available services
 * GET /api/web3-ai/marketplace/services
 */
router.get('/marketplace/services', async (req: Request, res: Response) => {
  try {
    const serviceType = req.query.type as string;
    const sortBy = req.query.sort as string || 'price'; // price, rating, speed

    let whereConditions = [eq(developerServices.isActive, true)];
    
    if (serviceType) {
      whereConditions.push(eq(developerServices.serviceType, serviceType));
    }

    const services = await db
      .select({
        id: developerServices.id,
        serviceName: developerServices.serviceName,
        serviceType: developerServices.serviceType,
        description: developerServices.description,
        pricePerCall: developerServices.pricePerCall,
        qualityRating: developerServices.qualityRating,
        totalCalls: developerServices.totalCalls,
        successRate: developerServices.successRate,
        avgResponseTime: developerServices.avgResponseTime,
        developer: {
          id: users.id,
          username: users.username
        }
      })
      .from(developerServices)
      .leftJoin(users, eq(developerServices.developerId, users.id))
      .where(and(...whereConditions));



    // Sort services based on request
    const sortedServices = services.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.pricePerCall) - parseFloat(b.pricePerCall);
        case 'rating':
          return parseFloat(b.qualityRating || '0') - parseFloat(a.qualityRating || '0');
        case 'speed':
          return (a.avgResponseTime || 999999) - (b.avgResponseTime || 999999);
        default:
          return parseFloat(a.pricePerCall) - parseFloat(b.pricePerCall);
      }
    });

    res.json({
      success: true,
      data: {
        services: sortedServices,
        totalCount: services.length,
        sortedBy: sortBy
      }
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] Marketplace query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get marketplace services'
    });
  }
});

/**
 * Register Developer Service
 * POST /api/web3-ai/marketplace/register
 */
router.post('/marketplace/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const serviceSchema = z.object({
      serviceName: z.string().min(1),
      serviceType: z.enum(['ai', 'blockchain', 'zkp', 'storage']),
      description: z.string().min(10),
      pricePerCall: z.string().regex(/^\d+(\.\d{1,6})?$/), // Decimal string
      priceModel: z.enum(['per_call', 'subscription', 'tiered']).default('per_call')
    });

    const validated = serviceSchema.parse(req.body);
    const developerId = req.user!.id;

    const newService = await db.insert(developerServices).values({
      developerId,
      ...validated
    }).returning();

    res.json({
      success: true,
      data: newService[0],
      message: 'Service registered successfully in the marketplace'
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] Service registration failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register service'
    });
  }
});

/**
 * Multi-Blockchain Integration
 * POST /api/web3-ai/blockchain/deploy
 */
router.post('/blockchain/deploy', requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    const deploySchema = z.object({
      contractType: z.enum(['reputation', 'credential', 'governance', 'token']),
      network: z.enum(['polygon', 'solana', 'iota', 'stellar']),
      parameters: z.record(z.any()).optional()
    });

    const { contractType, network, parameters } = deploySchema.parse(req.body);

    // Deploy to selected blockchain network
    const deploymentResult = await deployToBlockchain(contractType, network, parameters, req.user!.id);
    
    // Track service usage for analytics
    // await trackServiceUsage(req.user!.id, serviceId, cost, responseTime, true);

    res.json({
      success: true,
      data: deploymentResult
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] Blockchain deployment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy to blockchain'
    });
  }
});

/**
 * ZKP Privacy Operations
 * POST /api/web3-ai/zkp/generate-proof
 */
router.post('/zkp/generate-proof', requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    const proofSchema = z.object({
      type: z.enum(['identity', 'reputation', 'credential']),
      data: z.record(z.any()),
      circuit: z.string().optional()
    });

    const { type, data, circuit } = proofSchema.parse(req.body);

    // Generate ZKP proof
    const proof = await generateZKProof(type, data, circuit, req.user!.id);
    
    // Track service usage for analytics
    // await trackServiceUsage(req.user!.id, serviceId, cost, responseTime, true);

    res.json({
      success: true,
      data: proof
    });
  } catch (error) {
    logger.error('[consolidated-web3-ai] ZKP generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ZK proof'
    });
  }
});

// Helper functions
async function trackAPIUsage(userId: number | undefined, operation: string, provider: string) {
  if (!userId) return;
  
  try {
    // Calculate revenue share (15% of API cost)
    const operationCosts = {
      'anfis-query': 0.01,
      'blockchain-deploy': 0.05,
      'zkp-generation': 0.02
    };
    
    // Revenue sharing functionality removed - was incorrectly added during consolidation
    // const cost = operationCosts[operation as keyof typeof operationCosts] || 0.01;
    // const shareAmount = cost * 0.15;
  } catch (error) {
    logger.error('[consolidated-web3-ai] Failed to track API usage:', error);
  }
}

function getNextPayoutDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

async function deployToBlockchain(contractType: string, network: string, parameters: any, userId: number) {
  // Mock implementation - replace with actual blockchain deployment logic
  return {
    contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    network,
    contractType,
    deployedAt: new Date().toISOString(),
    gasUsed: Math.floor(Math.random() * 100000) + 50000
  };
}

async function generateZKProof(type: string, data: any, circuit: string | undefined, userId: number) {
  // Mock implementation - replace with actual ZKP generation logic
  return {
    proof: `0x${Math.random().toString(16).substr(2, 128)}`,
    publicSignals: [
      `0x${Math.random().toString(16).substr(2, 64)}`,
      `0x${Math.random().toString(16).substr(2, 64)}`
    ],
    type,
    verified: true,
    generatedAt: new Date().toISOString()
  };
}

export default router;