/**
 * API Middleware for Unified AI Ecosystem
 * Handles authentication, rate limiting, usage tracking, and billing
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Customer tier definitions
interface CustomerTier {
  name: string;
  monthly_requests: number;
  rate_limit_rpm: number;
  features: string[];
  pricing: number;
}

const CUSTOMER_TIERS: Record<string, CustomerTier> = {
  free: {
    name: 'Developer',
    monthly_requests: 1000,
    rate_limit_rpm: 10,
    features: ['Basic AI inference', 'Community support'],
    pricing: 0
  },
  startup: {
    name: 'Startup',
    monthly_requests: 25000,
    rate_limit_rpm: 100,
    features: ['Prompt optimization', 'Email support', 'Analytics'],
    pricing: 99
  },
  professional: {
    name: 'Professional',
    monthly_requests: 100000,
    rate_limit_rpm: 1000,
    features: ['Code generation', 'Priority support', 'Custom limits'],
    pricing: 299
  },
  enterprise: {
    name: 'Enterprise',
    monthly_requests: -1, // Unlimited
    rate_limit_rpm: -1,   // Unlimited
    features: ['White-label', 'Dedicated support', 'SLA'],
    pricing: -1 // Custom
  }
};

// Extended request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tier: string;
    email: string;
    organization?: string;
    usage_limits: CustomerTier;
    api_key: string;
  };
  startTime?: number;
}

/**
 * API Key Authentication Middleware
 */
export const validateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || 
                   req.headers.authorization?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY',
        message: 'Include your API key in X-API-Key header or Authorization Bearer token'
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('hd_') || apiKey.length < 32) {
      return res.status(401).json({
        error: 'Invalid API key format',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }

    // In production, query customer database
    // For now, simulate customer lookup
    const customer = await lookupCustomer(apiKey);
    if (!customer) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if customer account is active
    if (customer.status !== 'active') {
      return res.status(403).json({
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Contact support to reactivate your account'
      });
    }

    // Add customer info to request
    req.user = {
      id: customer.id,
      tier: customer.tier,
      email: customer.email,
      organization: customer.organization,
      usage_limits: CUSTOMER_TIERS[customer.tier] || CUSTOMER_TIERS.free,
      api_key: apiKey
    };

    req.startTime = Date.now();
    next();

  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Rate Limiting Middleware (Tier-based)
 */
export const checkRateLimit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id: userId, tier } = req.user;
    const tierConfig = CUSTOMER_TIERS[tier];
    
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier configuration' });
    }

    // Skip rate limiting for enterprise tier
    if (tier === 'enterprise') {
      return next();
    }

    // Check rate limit
    const rateLimit = tierConfig.rate_limit_rpm;
    const currentMinute = Math.floor(Date.now() / 60000);
    const rateLimitKey = `rate_limit:${userId}:${currentMinute}`;
    
    const currentRequests = await getRateLimitCount(rateLimitKey);
    
    if (currentRequests >= rateLimit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: rateLimit,
        reset_time: (currentMinute + 1) * 60000,
        upgrade_url: tier === 'free' ? '/pricing' : null
      });
    }

    // Increment rate limit counter
    await incrementRateLimit(rateLimitKey);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimit.toString(),
      'X-RateLimit-Remaining': (rateLimit - currentRequests - 1).toString(),
      'X-RateLimit-Reset': ((currentMinute + 1) * 60000).toString()
    });

    next();

  } catch (error) {
    console.error('[Rate Limit Middleware] Error:', error);
    // Continue on rate limit errors to avoid blocking service
    next();
  }
};

/**
 * Usage Tracking Middleware
 */
export const trackUsage = async (
  userId: string,
  serviceType: string,
  result: any
) => {
  try {
    const usage = {
      user_id: userId,
      service_type: serviceType,
      timestamp: new Date(),
      requests: 1,
      tokens: estimateTokens(result),
      cost: calculateCost(serviceType, result),
      savings: calculateSavings(serviceType, result),
      success: true
    };

    // In production, save to analytics database
    console.log('[Usage Tracking]', usage);
    
    // Update monthly usage counters
    await updateMonthlyUsage(userId, serviceType);
    
    // Check usage limits
    await checkUsageLimits(userId, serviceType);

  } catch (error) {
    console.error('[Usage Tracking] Error:', error);
    // Non-blocking - don't fail the request
  }
};

/**
 * Request Validation Middleware
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      req.body = validation.data;
      next();

    } catch (error) {
      console.error('[Request Validation] Error:', error);
      res.status(400).json({
        error: 'Request validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Error Handler Middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[API Error]', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: (req as AuthenticatedRequest).user?.id
  });

  // Handle specific error types
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: 60
    });
  }

  if (error.code === 'USAGE_LIMIT_EXCEEDED') {
    return res.status(403).json({
      error: 'Usage limit exceeded',
      code: 'USAGE_LIMIT_EXCEEDED',
      upgrade_url: '/pricing'
    });
  }

  if (error.code === 'INSUFFICIENT_CREDITS') {
    return res.status(402).json({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
      billing_url: '/billing'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    request_id: generateRequestId(),
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
};

/**
 * CORS Middleware for API access
 */
export const corsHandler = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://hyperdag.org',
    'https://api.hyperdag.org',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.set('Access-Control-Allow-Origin', origin);
  }

  res.set({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400'
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Utility Functions
 */

async function lookupCustomer(apiKey: string) {
  // In production, query customer database
  // For development, simulate customer data
  const mockCustomers: Record<string, any> = {
    'hd_dev_1234567890abcdef1234567890abcdef': {
      id: 'customer_dev_001',
      tier: 'free',
      email: 'dev@example.com',
      status: 'active'
    },
    'hd_startup_1234567890abcdef1234567890ab': {
      id: 'customer_startup_001', 
      tier: 'startup',
      email: 'startup@example.com',
      organization: 'Startup Inc',
      status: 'active'
    },
    'hd_pro_1234567890abcdef1234567890abcdef': {
      id: 'customer_pro_001',
      tier: 'professional',
      email: 'pro@example.com',
      organization: 'Pro Corp',
      status: 'active'
    }
  };

  return mockCustomers[apiKey] || null;
}

async function getRateLimitCount(key: string): Promise<number> {
  // In production, use Redis or similar
  // For development, use in-memory storage
  return 0; // Mock implementation
}

async function incrementRateLimit(key: string): Promise<void> {
  // In production, increment Redis counter
  // Mock implementation for development
}

async function updateMonthlyUsage(userId: string, serviceType: string): Promise<void> {
  // Update monthly usage counters in database
  console.log(`[Usage] Updated monthly usage for ${userId}:${serviceType}`);
}

async function checkUsageLimits(userId: string, serviceType: string): Promise<void> {
  // Check if user has exceeded monthly limits
  // Throw error if limits exceeded
}

function estimateTokens(result: any): number {
  // Estimate token usage from result
  const text = JSON.stringify(result);
  return Math.ceil(text.length / 4); // Rough estimate: 4 chars per token
}

function calculateCost(serviceType: string, result: any): number {
  // Calculate cost based on service type and usage
  const baseCosts = {
    'inference': 0.0001,
    'prompt-optimization': 0.0005,
    'code-generation': 0.001,
    'full-workflow': 0.002
  };
  
  const tokens = estimateTokens(result);
  return (baseCosts[serviceType as keyof typeof baseCosts] || 0.0001) * tokens;
}

function calculateSavings(serviceType: string, result: any): number {
  // Calculate savings vs direct API usage
  const directCosts = {
    'inference': 0.0008,      // Direct OpenAI cost
    'prompt-optimization': 0.001,
    'code-generation': 0.01,
    'full-workflow': 0.02
  };
  
  const ourCost = calculateCost(serviceType, result);
  const directCost = (directCosts[serviceType as keyof typeof directCosts] || 0.001) * estimateTokens(result);
  
  return Math.max(0, directCost - ourCost);
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request validation schemas
export const chatCompletionSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional()
});

export const promptOptimizationSchema = z.object({
  prompt: z.string().min(1).max(10000),
  optimization_level: z.enum(['basic', 'advanced', 'custom']).optional(),
  target_model: z.string().optional()
});

export const codeGenerationSchema = z.object({
  description: z.string().min(1).max(5000),
  framework: z.enum(['react', 'vue', 'angular']).optional(),
  deploy: z.boolean().optional()
});

export const fullWorkflowSchema = z.object({
  description: z.string().min(1).max(5000),
  framework: z.enum(['react', 'vue', 'angular']).optional(),
  optimization_level: z.enum(['basic', 'advanced', 'custom']).optional(),
  deploy: z.boolean().optional()
});