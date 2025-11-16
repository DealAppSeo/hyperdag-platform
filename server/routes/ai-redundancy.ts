/**
 * AI Redundancy Routes
 * 
 * This file defines the API routes for the AI redundancy service, which allows
 * the system to fall back to alternative AI providers when the primary provider
 * is unavailable or fails.
 */

import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth-middleware';
import { rateLimit } from 'express-rate-limit';
import {
  generateTextCompletion,
  generateChatCompletion,
  callFunction,
  checkAIProvidersHealth,
  getAIProviderMetrics,
  getAIProviders,
  setPrimaryProvider,
  getPrimaryProvider
} from '../services/redundancy/ai';

const router = express.Router();

// Rate limiters
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests, please try again later" }
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin requests, please try again later" }
});

// Admin check
const isAdmin = (req: Request) => {
  return req.user?.isAdmin === true;
};

const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!isAdmin(req)) {
    return res.status(403).json({
      success: false,
      message: "Admin privileges required"
    });
  }
  next();
};

/**
 * Text completion endpoint
 * POST /api/ai/complete
 */
router.post('/complete', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }
    
    const result = await generateTextCompletion(prompt, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("AI text completion error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during text completion"
    });
  }
});

/**
 * Chat completion endpoint
 * POST /api/ai/chat
 */
router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, options } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid messages array is required"
      });
    }
    
    const result = await generateChatCompletion(messages, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("AI chat completion error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during chat completion"
    });
  }
});

/**
 * Function calling endpoint
 * POST /api/ai/function
 */
router.post('/function', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { name, parameters, prompt, options } = req.body;
    
    if (!name || !parameters) {
      return res.status(400).json({
        success: false,
        message: "Function name and parameters are required"
      });
    }
    
    const result = await callFunction({
      name,
      parameters,
      prompt: prompt || `Call the function ${name}`,
      options
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("AI function calling error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during function calling"
    });
  }
});

/**
 * Health check endpoint
 * GET /api/ai/health
 */
router.get('/health', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await checkAIProvidersHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error("AI health check error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during health check"
    });
  }
});

/**
 * Get metrics endpoint
 * GET /api/ai/metrics
 */
router.get('/metrics', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = getAIProviderMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("AI metrics error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred retrieving metrics"
    });
  }
});

/**
 * Get providers endpoint
 * GET /api/ai/providers
 */
router.get('/providers', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const providers = getAIProviders();
    const primary = getPrimaryProvider();
    
    res.json({
      success: true,
      data: {
        providers,
        primary
      }
    });
  } catch (error) {
    console.error("AI providers error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred retrieving providers"
    });
  }
});

/**
 * Set primary provider endpoint
 * POST /api/ai/set-primary
 */
router.post('/set-primary', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: "Provider name is required"
      });
    }
    
    const success = setPrimaryProvider(provider);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: `Provider "${provider}" not found`
      });
    }
    
    res.json({
      success: true,
      message: `Primary provider set to "${provider}"`
    });
  } catch (error) {
    console.error("Set primary provider error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred setting primary provider"
    });
  }
});

/**
 * Ask endpoint - simplified interface for general questions
 * POST /api/ai/ask
 */
router.post('/ask', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { question, options } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required"
      });
    }
    
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant that responds accurately and concisely.' },
      { role: 'user', content: question }
    ];
    
    const result = await generateChatCompletion(messages, options);
    
    res.json({
      success: true,
      data: {
        answer: result.text,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error("AI ask error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred processing your question"
    });
  }
});

/**
 * Grant-ready implementation for onboarding guides
 * GET /api/ai/onboarding/guide
 */
router.get('/onboarding/guide', async (req: Request, res: Response) => {
  try {
    const userType = req.query.type as string || 'default';
    const prompt = `Generate a brief onboarding guide for a ${userType} user of our blockchain/AI platform. Focus on the first three steps they should take to get started.`;
    
    const result = await generateTextCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 500
    });
    
    res.json({
      success: true,
      data: {
        guide: result.text,
        userType,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error("Onboarding guide error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred generating the onboarding guide"
    });
  }
});

/**
 * Feature recommendations for specific personas
 * GET /api/ai/onboarding/features/:persona
 */
router.get('/onboarding/features/:persona', async (req: Request, res: Response) => {
  try {
    const { persona } = req.params;
    const prompt = `List the top 5 features of our blockchain platform that would be most valuable to a ${persona} persona. Explain why each feature is beneficial for this type of user.`;
    
    const result = await generateTextCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 600
    });
    
    res.json({
      success: true,
      data: {
        features: result.text,
        persona,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error("Feature recommendations error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred generating feature recommendations"
    });
  }
});

/**
 * Skills assessment for specific personas
 * GET /api/ai/onboarding/skills/:persona
 */
router.get('/onboarding/skills/:persona', async (req: Request, res: Response) => {
  try {
    const { persona } = req.params;
    const prompt = `Create a brief skills assessment for a ${persona} using our blockchain platform. Include 5 questions that would help evaluate their current knowledge level.`;
    
    const result = await generateTextCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 600
    });
    
    res.json({
      success: true,
      data: {
        assessment: result.text,
        persona,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error("Skills assessment error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred generating the skills assessment"
    });
  }
});

export default router;