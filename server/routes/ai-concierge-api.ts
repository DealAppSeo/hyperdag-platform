import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  aiProviders,
  aiRequests,
  userCredits,
  creditTransactions,
  costSavingsAnalytics,
  developerApiKeys,
  users,
  type InsertAiProvider,
  type InsertAiRequest,
  type InsertUserCredits,
  type InsertCreditTransaction,
} from '@shared/schema';
import { anfisRouter } from '../services/anfis-router';
import { providerFactory } from '../services/ai-providers';
import { productionRouter } from '../services/production-router-system';
import crypto from 'crypto';

const router = Router();

/**
 * Initialize AI providers from database
 */
async function initializeProviders() {
  try {
    const providers = await db.select().from(aiProviders).where(eq(aiProviders.isActive, true));
    
    for (const provider of providers) {
      if (provider.apiKeyConfigured) {
        const apiKeyEnvMap: Record<string, string | undefined> = {
          openai: process.env.OPENAI_API_KEY,
          anthropic: process.env.ANTHROPIC_API_KEY,
          gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
          perplexity: process.env.PERPLEXITY_API_KEY,
        };

        const providerNameLower = provider.providerName.toLowerCase();
        const apiKey = apiKeyEnvMap[providerNameLower];
        if (apiKey) {
          providerFactory.registerProvider(provider.providerName, apiKey);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing AI providers:', error);
  }
}

initializeProviders();

/**
 * Middleware to validate API key
 */
async function validateApiKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const [keyRecord] = await db
      .select()
      .from(developerApiKeys)
      .where(and(eq(developerApiKeys.apiKey, apiKey), eq(developerApiKeys.isActive, true)));

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    (req as any).apiUser = { id: keyRecord.userId, apiKeyId: keyRecord.id };

    await db
      .update(developerApiKeys)
      .set({
        usageCount: sql`${developerApiKeys.usageCount} + 1`,
        lastUsed: new Date(),
      })
      .where(eq(developerApiKeys.id, keyRecord.id));

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get numeric user ID from API key's user ID (which is text)
 */
function getUserNumericId(userId: string): number {
  if (/^\d+$/.test(userId)) {
    return parseInt(userId, 10);
  }
  throw new Error(`Invalid user ID format: ${userId}`);
}

/**
 * Check user credits
 */
async function checkCredits(userId: string, estimatedCost: number): Promise<boolean> {
  const userNumId = getUserNumericId(userId);
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userNumId));

  if (!credits) {
    return false;
  }

  return parseFloat(credits.currentBalance) >= estimatedCost;
}

/**
 * Deduct credits and create transaction
 */
async function deductCredits(
  userId: string,
  amount: number,
  requestId: string,
  description: string
) {
  const userNumId = getUserNumericId(userId);
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userNumId));

  if (!credits) {
    throw new Error('User credits not found');
  }

  const balanceBefore = parseFloat(credits.currentBalance);
  const balanceAfter = balanceBefore - amount;

  await db
    .update(userCredits)
    .set({
      currentBalance: balanceAfter.toFixed(2),
      lifetimeSpent: (parseFloat(credits.lifetimeSpent) + amount).toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userNumId));

  await db.insert(creditTransactions).values({
    userId: userNumId,
    type: 'api_usage',
    amount: (-amount).toFixed(2),
    balanceBefore: balanceBefore.toFixed(2),
    balanceAfter: balanceAfter.toFixed(2),
    description,
    relatedRequestId: requestId,
  });
}

/**
 * Calculate OpenAI equivalent cost
 */
function calculateOpenAICost(promptTokens: number, completionTokens: number): number {
  const inputPricePerMillion = 0.15;
  const outputPricePerMillion = 0.60;

  const inputCost = (promptTokens / 1_000_000) * inputPricePerMillion;
  const outputCost = (completionTokens / 1_000_000) * outputPricePerMillion;

  return inputCost + outputCost;
}

/**
 * POST /api/ai/chat
 * Main AI chat completion endpoint with ANFIS routing
 */
router.post('/chat', validateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { messages, model, maxTokens, temperature, stream } = req.body;
    const apiUser = (req as any).apiUser;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const userNumId = getUserNumericId(apiUser.id);
    
    const [activeProviders, userObj] = await Promise.all([
      db.select().from(aiProviders).where(eq(aiProviders.isActive, true)),
      db.select().from(users).where(eq(users.id, userNumId)),
    ]);

    if (activeProviders.length === 0) {
      return res.status(503).json({ error: 'No AI providers available' });
    }

    // Use production router with safety + optimization layers
    const routingDecision = await productionRouter.route(
      { messages, model, maxTokens, temperature, stream },
      activeProviders
    );

    const hasEnoughCredits = await checkCredits(apiUser.id, routingDecision.estimatedCost);
    if (!hasEnoughCredits) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const provider = providerFactory.getProvider(routingDecision.provider);
    
    // Execute with circuit breaker protection
    const ttfbStart = Date.now();
    const response = await productionRouter.executeWithCircuitBreaker(
      routingDecision.provider,
      async () => provider.chat({
        model: routingDecision.actualModel,
        messages,
        maxTokens,
        temperature,
      }),
      activeProviders.filter(p => p.providerName !== routingDecision.provider).map(p => p.providerName)
    );
    const ttfb = Date.now() - ttfbStart;

    const actualCost = routingDecision.estimatedCost;
    const openaiCost = calculateOpenAICost(response.usage.promptTokens, response.usage.completionTokens);
    const savings = openaiCost - actualCost;
    const savingsPercentage = openaiCost > 0 ? (savings / openaiCost) * 100 : 0;

    const [requestRecord] = await db.insert(aiRequests).values({
      userId: userNumId,
      apiKeyId: apiUser.apiKeyId,
      endpoint: '/api/ai/chat',
      model,
      provider: routingDecision.provider,
      actualModel: routingDecision.actualModel,
      requestPayload: { messages, maxTokens, temperature },
      responsePayload: response,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      actualCost: actualCost.toFixed(6),
      openaiEquivalentCost: openaiCost.toFixed(6),
      costSavings: savings.toFixed(6),
      savingsPercentage: savingsPercentage.toFixed(2),
      anfisScore: routingDecision.anfisScore.toFixed(3),
      routingFactors: routingDecision.routingFactors,
      latencyMs: Date.now() - startTime,
      ttfbMs: ttfb,
      statusCode: 200,
      success: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).returning();

    await deductCredits(
      apiUser.id,
      actualCost,
      requestRecord.requestId,
      `AI chat completion - ${routingDecision.actualModel}`
    );

    // Record performance for optimization systems
    productionRouter.recordPerformance({
      provider: routingDecision.provider,
      success: true,
      latency: ttfb,
      cost: actualCost,
      quality: routingDecision.anfisScore / 10, // Normalize to 0-10 scale
      confidence: 0.9,
      difficulty: 0.5,
      isEdgeCase: false,
    });

    const [updatedCredits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userNumId));

    await db
      .update(userCredits)
      .set({
        totalSavings: (parseFloat(updatedCredits.totalSavings) + savings).toFixed(2),
        savingsThisMonth: (parseFloat(updatedCredits.savingsThisMonth) + savings).toFixed(2),
      })
      .where(eq(userCredits.userId, userNumId));

    res.json({
      id: response.id,
      model: response.model,
      choices: response.choices,
      usage: response.usage,
      _meta: {
        provider: routingDecision.provider,
        anfisScore: routingDecision.anfisScore,
        routingReason: routingDecision.routingFactors.selectedReason,
        costSavings: {
          actualCost: actualCost.toFixed(4),
          openaiEquivalentCost: openaiCost.toFixed(4),
          saved: savings.toFixed(4),
          savingsPercentage: savingsPercentage.toFixed(1) + '%',
        },
        creditsRemaining: updatedCredits.currentBalance,
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);

    const apiUser = (req as any).apiUser;
    let userNumId = 0;
    
    try {
      userNumId = apiUser ? getUserNumericId(apiUser.id) : 0;
    } catch {
      userNumId = 0;
    }

    await db.insert(aiRequests).values({
      userId: userNumId,
      apiKeyId: apiUser?.apiKeyId || 0,
      endpoint: '/api/ai/chat',
      model: req.body.model,
      provider: 'error',
      actualModel: req.body.model || 'unknown',
      requestPayload: req.body,
      responsePayload: { error: error.message },
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      actualCost: '0',
      openaiEquivalentCost: '0',
      costSavings: '0',
      savingsPercentage: '0',
      anfisScore: '0',
      routingFactors: null,
      latencyMs: Date.now() - startTime,
      statusCode: 500,
      success: false,
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

/**
 * GET /api/ai/providers
 * List available AI providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = await db
      .select({
        name: aiProviders.providerName,
        displayName: aiProviders.displayName,
        models: aiProviders.models,
        isActive: aiProviders.isActive,
        qualityScore: aiProviders.qualityScore,
        costEfficiency: aiProviders.costEfficiency,
        speedScore: aiProviders.speedScore,
        reliabilityScore: aiProviders.reliabilityScore,
      })
      .from(aiProviders)
      .where(eq(aiProviders.isActive, true));

    res.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

/**
 * GET /api/ai/analytics
 * Get user analytics and cost savings
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { period = 'all_time', userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const userNumId = parseInt(userId as string);

    const [credits, requests] = await Promise.all([
      db.select().from(userCredits).where(eq(userCredits.userId, userNumId)),
      db
        .select()
        .from(aiRequests)
        .where(and(eq(aiRequests.userId, userNumId), eq(aiRequests.success, true)))
        .orderBy(desc(aiRequests.createdAt))
        .limit(100),
    ]);

    const totalRequests = requests.length;
    const totalTokens = requests.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = requests.reduce((sum, r) => sum + parseFloat(r.actualCost), 0);
    const totalSavings = requests.reduce((sum, r) => sum + parseFloat(r.costSavings), 0);
    const avgLatency = requests.reduce((sum, r) => sum + r.latencyMs, 0) / totalRequests || 0;

    const providerBreakdown = requests.reduce((acc, r) => {
      const providerName = r.provider || 'unknown';
      if (!acc[providerName]) {
        acc[providerName] = { requests: 0, tokens: 0, cost: 0 };
      }
      acc[providerName].requests++;
      acc[providerName].tokens += r.totalTokens;
      acc[providerName].cost += parseFloat(r.actualCost);
      return acc;
    }, {} as Record<string, { requests: number; tokens: number; cost: number }>);

    res.json({
      credits: credits[0],
      analytics: {
        totalRequests,
        totalTokens,
        totalCost: totalCost.toFixed(4),
        totalSavings: totalSavings.toFixed(4),
        avgLatency: Math.round(avgLatency),
        providerBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * POST /api/ai/keys
 * Generate a new API key
 */
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const { userId, keyName } = req.body;

    if (!userId || !keyName) {
      return res.status(400).json({ error: 'userId and keyName required' });
    }

    const apiKey = `aitc_${crypto.randomBytes(32).toString('hex')}`;

    const [newKey] = await db.insert(developerApiKeys).values({
      userId: userId.toString(),
      keyName,
      apiKey,
      permissions: ['ai:chat', 'ai:analytics'],
      isActive: true,
    }).returning();

    const [userCreditRecord] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, parseInt(userId)));

    if (!userCreditRecord) {
      await db.insert(userCredits).values({
        userId: parseInt(userId),
        currentBalance: '5.00',
        lifetimeEarned: '5.00',
        lifetimeSpent: '0',
      });
    }

    res.json({
      success: true,
      apiKey,
      keyId: newKey.id,
      message: 'API key generated successfully. Store it securely - it won\'t be shown again.',
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

/**
 * GET /api/ai/keys
 * List user API keys
 */
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const keys = await db
      .select()
      .from(developerApiKeys)
      .where(eq(developerApiKeys.userId, userId.toString()));

    // Mask API keys for security (show first 12 chars and last 4)
    const maskedKeys = keys.map(key => ({
      ...key,
      apiKey: `${key.apiKey.substring(0, 12)}...${key.apiKey.substring(key.apiKey.length - 4)}`,
    }));

    res.json(maskedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

export default router;
