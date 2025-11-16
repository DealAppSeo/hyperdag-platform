import { Request, Response, NextFunction } from 'express';
import { redundantAuthService } from '../services/redundancy/auth/redundant-auth-service';
import { logger } from '../utils/logger';

/**
 * Authentication middleware with redundancy capabilities
 * 
 * This middleware system provides intelligent authentication routing with fallback options:
 * 1. Handles regular auth scenarios with standard verification
 * 2. Provides graceful degradation when primary auth methods are unavailable
 * 3. Dynamically adjusts security requirements based on threat level
 * 4. Supports 4FA (Four-Factor Authentication) when needed
 */

/**
 * Basic middleware that requires any level of authentication
 */
export function requireRedundantAuth(req: Request, res: Response, next: NextFunction) {
  // First check if user is already authenticated via session
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check API key authentication
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    // In a real implementation, this would validate against database
    // For demo purposes, just hardcode a test key
    if (apiKey === 'test-api-key') {
      req.user = { id: 1, username: 'api-user', isAdmin: false };
      return next();
    }
  }
  
  // Check Web3 authentication
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Web3 ')) {
    const walletAddress = authHeader.substring(5);
    
    // In a real implementation, this would verify the wallet address
    // For now, we'll use a simple lookup
    import('../storage').then(({ storage }) => {
      storage.getUserByWalletAddress(walletAddress)
        .then(user => {
          if (user) {
            req.user = user;
            next();
          } else {
            res.status(401).json({
              success: false,
              message: 'Invalid wallet address',
              error: {
                code: 'UNAUTHORIZED',
                type: 'authentication_required',
              },
            });
          }
        })
        .catch(err => {
          logger.error('[redundant-auth-middleware] Error checking wallet address:', err);
          res.status(500).json({
            success: false,
            message: 'Server error',
            error: {
              code: 'SERVER_ERROR',
              type: 'internal_server_error',
            },
          });
        });
    });
    return;
  }
  
  // If no authentication method succeeded
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    error: {
      code: 'UNAUTHORIZED',
      type: 'authentication_required',
    },
  });
}

/**
 * Enhanced authentication middleware requiring at least level 2 (multi-factor) auth
 */
export function requireEnhancedRedundantAuth(req: Request, res: Response, next: NextFunction) {
  // First check if user is already authenticated via session
  if (req.isAuthenticated()) {
    const user = req.user;
    
    // Check if user has sufficient authentication level
    if (user.authLevel && user.authLevel >= 2) {
      return next();
    }
    
    // User is authenticated but with insufficient level
    return res.status(403).json({
      success: false,
      message: 'Enhanced authentication required',
      error: {
        code: 'INSUFFICIENT_AUTH',
        type: 'enhanced_authentication_required',
      },
    });
  }
  
  // Not authenticated at all
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    error: {
      code: 'UNAUTHORIZED', 
      type: 'authentication_required',
    },
  });
}

/**
 * Full authentication middleware requiring 4FA (level 3) auth
 */
export function requireFullRedundantAuth(req: Request, res: Response, next: NextFunction) {
  // First check if user is already authenticated via session
  if (req.isAuthenticated()) {
    const user = req.user;
    
    // Check if user has full authentication level
    if (user.authLevel && user.authLevel >= 3) {
      return next();
    }
    
    // User is authenticated but with insufficient level
    return res.status(403).json({
      success: false,
      message: 'Full authentication required',
      error: {
        code: 'INSUFFICIENT_AUTH',
        type: 'full_authentication_required',
      },
    });
  }
  
  // Not authenticated at all
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    error: {
      code: 'UNAUTHORIZED',
      type: 'authentication_required',
    },
  });
}

/**
 * Dynamic authentication middleware that adapts based on service status
 * and required authentication level
 */
export function requireDynamicAuth(requiredLevel: 1 | 2 | 3) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check service status
    const status = await redundantAuthService.checkStatus();
    
    // First check if user is already authenticated via session
    if (req.isAuthenticated()) {
      const user = req.user;
      
      // Adjust required level based on service status
      let effectiveLevel = requiredLevel;
      
      if (status === 'degraded') {
        // In degraded mode, we may reduce requirements
        effectiveLevel = Math.min(requiredLevel, 2) as 1 | 2 | 3;
      } else if (status === 'limited') {
        // In limited mode, we only require basic auth
        effectiveLevel = 1;
      }
      
      // Check if user meets the effective level
      if (user.authLevel && user.authLevel >= effectiveLevel) {
        return next();
      }
      
      // User is authenticated but with insufficient level
      return res.status(403).json({
        success: false,
        message: `Level ${effectiveLevel} authentication required`,
        error: {
          code: 'INSUFFICIENT_AUTH',
          type: 'higher_authentication_required',
          requiredLevel: effectiveLevel
        },
      });
    }
    
    // Not authenticated at all
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: {
        code: 'UNAUTHORIZED',
        type: 'authentication_required',
      },
    });
  };
}

/**
 * Middleware to check if 4FA is available for a user
 * and suggest it if so
 */
export function suggest4FA(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const is4FAAvailable = redundantAuthService.is4FAAvailable(req.user);
    
    if (is4FAAvailable && (!req.user.authLevel || req.user.authLevel < 3)) {
      // Add a suggestion to the response
      const originalJson = res.json;
      
      res.json = function(body) {
        if (body && typeof body === 'object') {
          body._meta = {
            ...(body._meta || {}),
            authSuggestion: {
              type: '4fa_available',
              message: 'Four-factor authentication is available for enhanced security'
            }
          };
        }
        return originalJson.call(this, body);
      };
    }
  }
  
  next();
}