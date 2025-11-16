/**
 * Authentication Middleware for HyperDAG MVP
 * Production-ready authentication with session management and security
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { ProductionValidator } from '../production-config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        authLevel: number;
        isAdmin: boolean;
      };
      session?: {
        userId?: number;
        isAuthenticated?: boolean;
        lastActivity?: Date;
      };
    }
  }
}

export interface AuthConfig {
  jwtSecret: string;
  sessionSecret: string;
  bcryptRounds: number;
  sessionDuration: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export class AuthService {
  private config: AuthConfig;
  private loginAttempts: Map<string, { count: number; lockUntil?: Date }> = new Map();

  constructor() {
    const prodConfig = ProductionValidator.getProductionConfig();
    this.config = {
      jwtSecret: prodConfig.security.jwtSecret,
      sessionSecret: prodConfig.security.sessionSecret,
      bcryptRounds: prodConfig.authentication.bcryptRounds,
      sessionDuration: prodConfig.authentication.sessionDuration,
      maxLoginAttempts: prodConfig.authentication.maxLoginAttempts,
      lockoutDuration: prodConfig.authentication.lockoutDuration
    };
  }

  // Hash password for storage
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: '24h',
      issuer: 'hyperdag-mvp',
      audience: 'hyperdag-users'
    });
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Check login attempts and implement lockout
  checkLoginAttempts(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return true;

    if (attempts.lockUntil && attempts.lockUntil > new Date()) {
      return false; // Still locked out
    }

    if (attempts.lockUntil && attempts.lockUntil <= new Date()) {
      // Lockout expired, reset attempts
      this.loginAttempts.delete(identifier);
      return true;
    }

    return attempts.count < this.config.maxLoginAttempts;
  }

  // Record failed login attempt
  recordFailedLogin(identifier: string): void {
    const attempts = this.loginAttempts.get(identifier) || { count: 0 };
    attempts.count++;

    if (attempts.count >= this.config.maxLoginAttempts) {
      attempts.lockUntil = new Date(Date.now() + this.config.lockoutDuration);
    }

    this.loginAttempts.set(identifier, attempts);
  }

  // Clear login attempts on successful login
  clearLoginAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }
}

// Initialize auth service
const authService = new AuthService();

// Rate limiting middleware
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware - supports both session and token auth
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First check if user is already authenticated via session (Passport.js)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Fall back to token-based authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required'
        }
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      authLevel: decoded.authLevel || 1,
      isAdmin: decoded.isAdmin || false
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      }
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (token) {
      const decoded = authService.verifyToken(token);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        authLevel: decoded.authLevel || 1,
        isAdmin: decoded.isAdmin || false
      };
    }
  } catch (error) {
    // Silently continue without user if token is invalid
  }

  next();
};

// Admin-only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Administrator privileges required'
      }
    });
  }

  next();
};

// Auth level middleware
export const requireAuthLevel = (minLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (req.user.authLevel < minLevel) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_AUTH_LEVEL',
          message: `Authentication level ${minLevel} required`
        }
      });
    }

    next();
  };
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.isAuthenticated) {
    const lastActivity = req.session.lastActivity;
    const sessionDuration = authService['config'].sessionDuration;
    
    if (lastActivity && (Date.now() - lastActivity.getTime()) > sessionDuration) {
      // Session expired
      req.session.isAuthenticated = false;
      delete req.session.userId;
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired, please login again'
        }
      });
    }

    // Update last activity
    req.session.lastActivity = new Date();
  }

  next();
};

// Standard authentication requirement middleware (already exported above)

export { authService };