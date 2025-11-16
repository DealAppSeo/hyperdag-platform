/**
 * PurposeHub.AI Authentication Middleware
 * 
 * Validates API keys for external PurposeHub.AI integration
 */

import { Request, Response, NextFunction } from 'express';
import { validatePurposeHubKey } from '../config/purposehub-apikey';

/**
 * Middleware to validate PurposeHub API key
 * Checks Authorization header or x-api-key header
 */
export const validatePurposeHubAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract API key from headers
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    let apiKey: string | null = null;
    
    // Support both Authorization: Bearer <key> and X-API-Key: <key>
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    } else if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    }
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Provide API key in Authorization: Bearer <key> or X-API-Key: <key> header'
      });
    }
    
    // Validate the key
    const isValid = validatePurposeHubKey(apiKey);
    
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked'
      });
    }
    
    // Key is valid, continue
    next();
  } catch (error: any) {
    console.error('[PurposeHub Auth] Middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to validate API key'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no key provided
 * Useful for endpoints that have both public and authenticated features
 */
export const optionalPurposeHubAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    let apiKey: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    } else if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    }
    
    if (apiKey) {
      const isValid = validatePurposeHubKey(apiKey);
      (req as any).isPurposeHubAuthenticated = isValid;
    } else {
      (req as any).isPurposeHubAuthenticated = false;
    }
    
    next();
  } catch (error: any) {
    console.error('[PurposeHub Auth] Optional middleware error:', error);
    (req as any).isPurposeHubAuthenticated = false;
    next();
  }
};
