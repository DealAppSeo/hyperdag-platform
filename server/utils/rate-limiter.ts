/**
 * Rate limiter utility for API endpoints
 * Simple in-memory rate limiting solution with configurable limits
 */

import { Request, Response, NextFunction } from 'express';

// In-memory cache for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store IP addresses and their request counts
const ipRequestCounts: Map<string, RateLimitEntry> = new Map();

/**
 * Clear expired rate limit entries every hour
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequestCounts.entries()) {
    if (entry.resetTime <= now) {
      ipRequestCounts.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

/**
 * Create a middleware function that limits requests based on the client's IP address
 * 
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowSeconds Time window in seconds
 * @param message Custom error message (optional)
 * @returns Express middleware function
 */
export function rateLimiter(maxRequests: number, windowSeconds: number, message?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // If IP is not identified, let the request proceed
    if (ip === 'unknown') {
      console.warn('[rate-limiter] Unable to identify client IP, skipping rate limit check');
      return next();
    }
    
    // Skip rate limiting for local development
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
    if (process.env.NODE_ENV === 'development' && isLocalhost) {
      return next();
    }
    
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Get or create rate limit entry for this IP
    if (!ipRequestCounts.has(ip)) {
      ipRequestCounts.set(ip, {
        count: 0,
        resetTime: now + windowMs
      });
    }
    
    const entry = ipRequestCounts.get(ip)!;
    
    // Reset counter if the time window has passed
    if (entry.resetTime <= now) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }
    
    // Increment request count
    entry.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    
    // If limit is reached, send error response
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || `Too many requests, please try again in ${retryAfter} seconds`
        }
      });
    }
    
    // Proceed with the request
    next();
  };
}

/**
 * Rate limiter specifically for authentication attempts
 * More strict limits to prevent brute force attacks
 */
export const authLimiter = rateLimiter(
  5, // 5 attempts
  300, // in a 5-minute window
  'Too many authentication attempts. Please try again later.'
);

/**
 * Very strict rate limiter for sensitive operations
 * Used for email verification, password changes, etc.
 */
export const strictLimiter = rateLimiter(
  3, // 3 attempts
  300, // in a 5-minute window
  'Too many attempts. Please try again in a few minutes.'
);

/**
 * Rate limiter for sensitive API routes
 * Moderate limits to prevent abuse
 */
export const apiLimiter = rateLimiter(
  30, // 30 requests
  60, // in a 1-minute window
  'API rate limit exceeded. Please slow down your requests.'
);

/**
 * Rate limiter for public API routes
 * Generous limits for normal usage
 */
export const publicApiLimiter = rateLimiter(
  60, // 60 requests
  60, // in a 1-minute window
  'Rate limit exceeded. Please slow down your requests.'
);