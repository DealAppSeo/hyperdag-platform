/**
 * API Key Authentication Middleware
 *
 * This middleware handles API key authentication and permission scopes.
 * It validates API keys, checks for expiration, and attaches user and scope information to the request.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { apiKeys, users, type User } from '@shared/schema';
import { and, eq, gt, isNull, or } from 'drizzle-orm';

// Extend Express Request to include API scopes
declare global {
  namespace Express {
    interface Request {
      apiKeyScopes?: string[];
    }
  }
}

/**
 * Require one or more API scopes
 * @param requiredScopes - The scopes required to access the route
 */
export function requireScope(requiredScopes: string | string[]) {
  const scopesArray = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip scope check for authenticated users (not using API key)
    if (req.isAuthenticated() && req.user && !req.apiKeyScopes) {
      return next();
    }
    
    // Check if API scopes are set
    if (!req.apiKeyScopes || req.apiKeyScopes.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_REQUIRED',
          message: 'Valid API key with appropriate scopes is required'
        }
      });
    }
    
    // Check for admin scope (allows all actions)
    if (req.apiKeyScopes.includes('admin')) {
      return next();
    }
    
    // Check if all required scopes are present
    const hasAllScopes = scopesArray.every(scope => req.apiKeyScopes!.includes(scope));
    
    if (!hasAllScopes) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'The API key does not have the required scopes',
          details: {
            requiredScopes: scopesArray,
            providedScopes: req.apiKeyScopes
          }
        }
      });
    }
    
    next();
  };
}

/**
 * API Key Authentication Middleware
 * 
 * This middleware checks for an API key and validates it.
 * If valid, it attaches the user and scopes to the request.
 */
export default async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Skip API key auth for non-API routes or if already authenticated via session
  if (!req.path.startsWith('/api/v1/') || req.isAuthenticated()) {
    return next();
  }
  
  // Get API key from header
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(); // No API key provided, continue to next middleware
  }
  
  try {
    // Find API key in database
    const [keyData] = await db.select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, apiKey),
          // Check that key is not expired or has no expiration
          or(
            isNull(apiKeys.expiresAt),
            gt(apiKeys.expiresAt, new Date())
          )
        )
      );
    
    if (!keyData) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key'
        }
      });
    }
    
    // Get the user associated with the API key
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, keyData.userId));
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with API key not found'
        }
      });
    }
    
    // Attach API key scopes to the request
    req.apiKeyScopes = keyData.scopes;
    
    // Log the user in (similar to passport login)
    (req as any).user = user;
    req.login(user, (err) => {
      if (err) {
        console.error('Error logging in with API key:', err);
        return next(err);
      }
      
      // Log API key usage (could be stored for analytics)
      console.log(`API Key used: ${keyData.id} (${keyData.name}) by user ${user.username}`);
      
      // Continue to the next middleware/route handler
      next();
    });
  } catch (error) {
    console.error('API Key Authentication Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during API key authentication'
      }
    });
  }
}
