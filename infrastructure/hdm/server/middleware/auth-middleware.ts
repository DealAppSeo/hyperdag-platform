/**
 * Authentication Middleware
 * 
 * Middleware functions for handling authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { fourFAService } from '../services/four-fa-service';
import { logger } from '../utils/logger';

// We're using type checking via null checks instead of interface extension
// to avoid conflicts with existing Express types

/**
 * Middleware to require authentication (any level)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: {
        code: 'UNAUTHORIZED',
        type: 'authentication_required',
      },
    });
  }
  
  next();
}

/**
 * Middleware to require a specific authentication level
 * 
 * @param level Authentication level (1-4) required to access the route
 */
export function requireAuthLevel(level: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'UNAUTHORIZED',
          type: 'authentication_required',
        },
      });
    }
    
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user data',
        });
      }
      
      const userId = req.user.id;
      const userLevel = await fourFAService.getAuthLevel(userId);
      
      if (userLevel < level) {
        return res.status(403).json({
          success: false,
          message: `Authentication level ${level} required`,
          error: {
            code: 'FORBIDDEN',
            type: 'insufficient_auth_level',
            currentLevel: userLevel,
            requiredLevel: level,
            missingFactors: level - userLevel,
          },
        });
      }
      
      next();
    } catch (error) {
      logger.error('[Auth Middleware] Error checking auth level', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying authentication level',
      });
    }
  };
}

/**
 * Middleware to require verification of specific factors
 * 
 * @param factors Array of factor numbers to require (1-4)
 */
export function requireFactors(factors: number[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'UNAUTHORIZED',
          type: 'authentication_required',
        },
      });
    }
    
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user data',
        });
      }
      
      const userId = req.user.id;
      const authStatus = await fourFAService.getAuthFactorsStatus(userId);
      
      const missingFactors: number[] = [];
      
      // Check each required factor
      for (const factor of factors) {
        if (factor === 1 && !authStatus.factor1) missingFactors.push(1);
        if (factor === 2 && !authStatus.factor2) missingFactors.push(2);
        if (factor === 3 && !authStatus.factor3) missingFactors.push(3);
        if (factor === 4 && !authStatus.factor4) missingFactors.push(4);
      }
      
      if (missingFactors.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Additional authentication required',
          error: {
            code: 'FORBIDDEN',
            type: 'missing_auth_factors',
            missingFactors,
          },
        });
      }
      
      next();
    } catch (error) {
      logger.error('[Auth Middleware] Error checking auth factors', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying authentication factors',
      });
    }
  };
}

/**
 * Middleware to require admin privileges
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: {
        code: 'UNAUTHORIZED',
        type: 'authentication_required',
      },
    });
  }
  
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
      error: {
        code: 'FORBIDDEN',
        type: 'admin_required',
      },
    });
  }
  
  next();
}