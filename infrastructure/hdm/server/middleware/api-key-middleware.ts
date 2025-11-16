/**
 * API Key Middleware for HyperDAG GrantFlow API
 * 
 * Provides authentication and rate limiting for external API access
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ApiKeyRequest extends Request {
  apiUser?: any;
}

export const validateApiKey = () => {
  return async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required',
          message: 'Please provide a valid API key in the x-api-key header'
        });
      }

      // For MVP, we'll use a simple API key validation
      // In production, this would be more sophisticated with proper API key management
      const validApiKeys = [
        'hyperdag-mvp-key-2024',
        'test-api-key-development',
        process.env.HYPERDAG_API_KEY || 'default-development-key'
      ];

      if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        });
      }

      // Set API user context for logging and analytics
      req.apiUser = {
        apiKey: apiKey.substring(0, 8) + '...',
        timestamp: new Date(),
        source: 'external-api'
      };

      next();
    } catch (error) {
      console.error('API key validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

export const rateLimitApiKey = () => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 100; // requests per hour
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    const now = Date.now();
    
    if (!requestCounts.has(apiKey)) {
      requestCounts.set(apiKey, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    const keyData = requestCounts.get(apiKey)!;
    
    if (now > keyData.resetTime) {
      keyData.count = 1;
      keyData.resetTime = now + WINDOW_MS;
      return next();
    }

    if (keyData.count >= RATE_LIMIT) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `API key has exceeded the rate limit of ${RATE_LIMIT} requests per hour`
      });
    }

    keyData.count++;
    next();
  };
};