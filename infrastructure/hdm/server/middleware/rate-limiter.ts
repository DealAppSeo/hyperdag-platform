/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting for API routes with different tiers
 * based on API key permissions.
 */

import { Request, Response, NextFunction } from 'express';
import * as apiKeyService from '../services/api/api-key-service';

// Rate limit settings by tier
const RATE_LIMITS = {
  DEFAULT: {
    points: 10,      // Number of requests
    duration: 60      // Time window in seconds
  },
  BASIC: {
    points: 50,      // 50 requests per minute
    duration: 60
  },
  PREMIUM: {
    points: 200,     // 200 requests per minute
    duration: 60
  },
  UNLIMITED: {
    points: 1000,    // 1000 requests per minute
    duration: 60
  }
};

// In-memory store for rate limit tracking
// In production, this should use Redis or another distributed cache
const rateLimitTracker: Record<string, { count: number, resetTime: number }> = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitTracker) {
    if (rateLimitTracker[key].resetTime < now) {
      delete rateLimitTracker[key];
    }
  }
}, 60000);

/**
 * Standard rate limiter for authenticated routes
 */
export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the API key from the request (attached by the validateApiKey middleware)
    const apiKey = (req as any).apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Valid API key required for this endpoint'
        }
      });
    }
    
    // Determine rate limit tier based on API key permissions
    let limitTier = RATE_LIMITS.DEFAULT;
    if (apiKey.permissions && apiKey.permissions.includes('unlimited')) {
      limitTier = RATE_LIMITS.UNLIMITED;
    } else if (apiKey.permissions && apiKey.permissions.includes('premium')) {
      limitTier = RATE_LIMITS.PREMIUM;
    } else if (apiKey.permissions && apiKey.permissions.includes('basic')) {
      limitTier = RATE_LIMITS.BASIC;
    }
    
    // Use the API key ID as the rate limit key
    const rateLimitKey = apiKey.id;
    const now = Date.now();
    
    // Initialize rate limit entry if it doesn't exist
    if (!rateLimitTracker[rateLimitKey]) {
      rateLimitTracker[rateLimitKey] = {
        count: 0,
        resetTime: now + (limitTier.duration * 1000)
      };
    }
    
    // Reset if the time window has passed
    if (rateLimitTracker[rateLimitKey].resetTime <= now) {
      rateLimitTracker[rateLimitKey] = {
        count: 0,
        resetTime: now + (limitTier.duration * 1000)
      };
    }
    
    // Check if rate limit exceeded
    if (rateLimitTracker[rateLimitKey].count >= limitTier.points) {
      const retryAfter = Math.ceil((rateLimitTracker[rateLimitKey].resetTime - now) / 1000);
      
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(limitTier.points));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.floor(rateLimitTracker[rateLimitKey].resetTime / 1000)));
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests, please try again in ${retryAfter} seconds`
        }
      });
    }
    
    // Increment the counter
    rateLimitTracker[rateLimitKey].count++;
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(limitTier.points));
    res.set('X-RateLimit-Remaining', String(limitTier.points - rateLimitTracker[rateLimitKey].count));
    res.set('X-RateLimit-Reset', String(Math.floor(rateLimitTracker[rateLimitKey].resetTime / 1000)));
    
    next();
  } catch (error) {
    console.error('Error in rate limiter:', error);
    next();
  }
};

/**
 * Strict rate limiter for sensitive operations
 */
export const strictLimiter = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the API key from the request (attached by the validateApiKey middleware)
    const apiKey = (req as any).apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Valid API key required for this endpoint'
        }
      });
    }
    
    // Use a stricter limit for sensitive operations
    // Half the normal limit for the tier
    let limitTier = RATE_LIMITS.DEFAULT;
    if (apiKey.permissions && apiKey.permissions.includes('unlimited')) {
      limitTier = {
        points: Math.floor(RATE_LIMITS.UNLIMITED.points / 2),
        duration: RATE_LIMITS.UNLIMITED.duration
      };
    } else if (apiKey.permissions && apiKey.permissions.includes('premium')) {
      limitTier = {
        points: Math.floor(RATE_LIMITS.PREMIUM.points / 2),
        duration: RATE_LIMITS.PREMIUM.duration
      };
    } else if (apiKey.permissions && apiKey.permissions.includes('basic')) {
      limitTier = {
        points: Math.floor(RATE_LIMITS.BASIC.points / 2),
        duration: RATE_LIMITS.BASIC.duration
      };
    } else {
      limitTier = {
        points: Math.floor(RATE_LIMITS.DEFAULT.points / 2),
        duration: RATE_LIMITS.DEFAULT.duration
      };
    }
    
    // Use a different key for strict operations to track them separately
    const rateLimitKey = `strict_${apiKey.id}`;
    const now = Date.now();
    
    // Initialize rate limit entry if it doesn't exist
    if (!rateLimitTracker[rateLimitKey]) {
      rateLimitTracker[rateLimitKey] = {
        count: 0,
        resetTime: now + (limitTier.duration * 1000)
      };
    }
    
    // Reset if the time window has passed
    if (rateLimitTracker[rateLimitKey].resetTime <= now) {
      rateLimitTracker[rateLimitKey] = {
        count: 0,
        resetTime: now + (limitTier.duration * 1000)
      };
    }
    
    // Check if rate limit exceeded
    if (rateLimitTracker[rateLimitKey].count >= limitTier.points) {
      const retryAfter = Math.ceil((rateLimitTracker[rateLimitKey].resetTime - now) / 1000);
      
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(limitTier.points));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.floor(rateLimitTracker[rateLimitKey].resetTime / 1000)));
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for sensitive operation',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many sensitive operation requests, please try again in ${retryAfter} seconds`
        }
      });
    }
    
    // Increment the counter
    rateLimitTracker[rateLimitKey].count++;
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(limitTier.points));
    res.set('X-RateLimit-Remaining', String(limitTier.points - rateLimitTracker[rateLimitKey].count));
    res.set('X-RateLimit-Reset', String(Math.floor(rateLimitTracker[rateLimitKey].resetTime / 1000)));
    
    next();
  } catch (error) {
    console.error('Error in strict rate limiter:', error);
    next();
  }
};