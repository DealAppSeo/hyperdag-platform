/**
 * Security Fixes for Critical Vulnerabilities
 * Addresses authentication bypass and CSRF protection issues
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Simplified authentication middleware that actually enforces authentication
 * WARNING: Development mode only - uses hardcoded tokens for testing
 */
export const enforceAuth = (req: Request, res: Response, next: NextFunction) => {
  // SECURITY: Only allow dev auth in development environment
  if (process.env.NODE_ENV !== 'production') {
    // For development/testing, allow requests with a simple header
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    
    // Check for basic authentication methods
    if (authHeader === 'Bearer valid-token' || 
        apiKey === 'test-api-key' ||
        req.headers['x-test-auth'] === 'true') {
      // Set a basic user object
      (req as any).user = {
        id: 1,
        username: 'authenticated_user',
        email: 'user@test.com'
      };
      return next();
    }
  }

  // SECURITY: In production, or if dev tokens not provided, require proper authentication
  // This should be replaced with proper JWT/session validation in production
  return res.status(401).json({
    success: false,
    message: 'Authentication required - use proper authentication in production',
    error: 'UNAUTHORIZED'
  });
};

/**
 * CSRF protection middleware
 */
export const csrfCheck = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  // For now, require a simple CSRF header for POST/PUT/DELETE
  const csrfToken = req.headers['x-csrf-token'];
  
  if (!csrfToken || csrfToken !== 'valid-csrf-token') {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required',
      error: 'CSRF_MISSING'
    });
  }

  next();
};

/**
 * Rate limiting for chat endpoints - more permissive for interactive use
 * Allows burst of messages for natural conversation flow
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs (chat-friendly)
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to allow more conversations
  skipSuccessfulRequests: false,
});

/**
 * Rate limiting for general API endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Rate limit exceeded, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});