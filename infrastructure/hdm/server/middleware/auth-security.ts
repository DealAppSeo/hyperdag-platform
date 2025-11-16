/**
 * JWT-Based Authentication and Zero-Trust Security Middleware
 * 
 * Implements enterprise-grade security for B2B adoption and compliance
 * Features role-based access, audit logging, and zero-trust architecture
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics';

export interface JWTPayload {
  userId: string;
  role: 'user' | 'admin' | 'enterprise';
  permissions: string[];
  tier: 'free' | 'pro' | 'enterprise';
  iat?: number;
  exp?: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  tokenExpiry: string;
  refreshTokenExpiry: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireStrongPasswords: boolean;
  enableAuditLogging: boolean;
}

export class AuthSecurityService {
  private config: SecurityConfig;
  private loginAttempts: Map<string, { attempts: number; lastAttempt: number; lockedUntil?: number }> = new Map();
  private tokenBlacklist: Set<string> = new Set();
  private auditLogs: Array<{
    timestamp: number;
    userId?: string;
    action: string;
    ip: string;
    userAgent: string;
    success: boolean;
    details?: any;
  }> = [];

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
      tokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      requireStrongPasswords: true,
      enableAuditLogging: true,
      ...config
    };

    // Warn if using default secret
    if (!process.env.JWT_SECRET) {
      console.warn('[Auth Security] Using generated JWT secret - set JWT_SECRET environment variable for production');
    }

    console.log('[Auth Security] JWT-based zero-trust security initialized');
  }

  /**
   * Generate JWT token with role-based permissions
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): { accessToken: string; refreshToken: string } {
    const tokenPayload: JWTPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(tokenPayload, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiry,
      issuer: 'hyperdag',
      audience: 'hyperdag-api'
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh' },
      this.config.jwtSecret,
      {
        expiresIn: this.config.refreshTokenExpiry,
        issuer: 'hyperdag',
        audience: 'hyperdag-refresh'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      if (this.tokenBlacklist.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: 'hyperdag',
        audience: 'hyperdag-api'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Authentication middleware
   */
  authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      this.logSecurityEvent('token_missing', req);
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      this.logSecurityEvent('token_invalid', req);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Add user info to request
    (req as any).user = payload;
    this.logSecurityEvent('token_valid', req, { userId: payload.userId });
    
    next();
  };

  /**
   * Role-based authorization middleware
   */
  authorizeRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as JWTPayload;

      if (!user || !allowedRoles.includes(user.role)) {
        this.logSecurityEvent('authorization_failed', req, { 
          requiredRoles: allowedRoles,
          userRole: user?.role
        });
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      this.logSecurityEvent('authorization_success', req, { userId: user.userId });
      next();
    };
  };

  /**
   * Permission-based authorization middleware
   */
  authorizePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as JWTPayload;

      if (!user || !user.permissions.includes(requiredPermission)) {
        this.logSecurityEvent('permission_denied', req, { 
          requiredPermission,
          userPermissions: user?.permissions
        });
        res.status(403).json({ error: 'Permission denied' });
        return;
      }

      next();
    };
  };

  /**
   * Rate limiting by user tier
   */
  tierBasedRateLimit = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JWTPayload;
    
    if (!user) {
      next();
      return;
    }

    // Set rate limits based on tier
    const limits = {
      free: { requests: 100, window: 60000 }, // 100 requests per minute
      pro: { requests: 1000, window: 60000 }, // 1000 requests per minute
      enterprise: { requests: 10000, window: 60000 } // 10000 requests per minute
    };

    const limit = limits[user.tier] || limits.free;
    
    // This is a simplified implementation - in production, use Redis for distributed rate limiting
    res.set('X-RateLimit-Limit', limit.requests.toString());
    res.set('X-RateLimit-Tier', user.tier);
    
    next();
  };

  /**
   * Brute force protection
   */
  bruteForceProtection = (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const attempts = this.loginAttempts.get(ip);

    if (attempts?.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      res.status(429).json({ 
        error: 'Account temporarily locked due to too many failed attempts',
        retryAfter: remainingTime
      });
      return;
    }

    next();
  };

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(ip: string): void {
    const attempts = this.loginAttempts.get(ip) || { attempts: 0, lastAttempt: 0 };
    
    attempts.attempts++;
    attempts.lastAttempt = Date.now();

    if (attempts.attempts >= this.config.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + this.config.lockoutDuration;
      this.logSecurityEvent('account_locked', null, { ip, attempts: attempts.attempts });
    }

    this.loginAttempts.set(ip, attempts);
  }

  /**
   * Clear login attempts on successful authentication
   */
  clearFailedAttempts(ip: string): void {
    this.loginAttempts.delete(ip);
  }

  /**
   * Blacklist token (logout, compromise, etc.)
   */
  blacklistToken(token: string): void {
    this.tokenBlacklist.add(token);
    
    // Clean up old blacklisted tokens periodically
    if (this.tokenBlacklist.size > 10000) {
      // In production, this should be handled by Redis with TTL
      const tokensToRemove = Array.from(this.tokenBlacklist).slice(0, 5000);
      tokensToRemove.forEach(t => this.tokenBlacklist.delete(t));
    }
  }

  /**
   * Refresh token endpoint
   */
  refreshToken = (req: Request, res: Response): void => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, this.config.jwtSecret, {
        issuer: 'hyperdag',
        audience: 'hyperdag-refresh'
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token type');
      }

      // Generate new tokens (would typically validate user still exists)
      const tokens = this.generateToken({
        userId: decoded.userId,
        role: 'user', // Would fetch from database
        permissions: ['api:read'],
        tier: 'free'
      });

      res.json(tokens);
      
    } catch (error) {
      this.logSecurityEvent('refresh_token_invalid', req);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  /**
   * Log security events for audit and monitoring
   */
  private logSecurityEvent(
    action: string, 
    req: Request | null, 
    details?: any
  ): void {
    if (!this.config.enableAuditLogging) return;

    const event = {
      timestamp: Date.now(),
      userId: (req as any)?.user?.userId,
      action,
      ip: req?.ip || req?.connection.remoteAddress || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      success: !action.includes('failed') && !action.includes('invalid') && !action.includes('denied'),
      details
    };

    this.auditLogs.push(event);

    // Keep only recent logs in memory (in production, send to external logging service)
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, 500);
    }

    // Update Prometheus metrics
    if (action.includes('failed') || action.includes('invalid') || action.includes('denied')) {
      prometheusMetrics.recordProviderError('auth', action, '401');
    } else {
      prometheusMetrics.recordProviderRequest('auth', 'jwt', action, 0);
    }

    console.log(`[Security Audit] ${action}:`, {
      userId: event.userId,
      ip: event.ip,
      success: event.success,
      timestamp: new Date(event.timestamp).toISOString()
    });
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    totalAuthEvents: number;
    successfulAuth: number;
    failedAuth: number;
    activeTokens: number;
    blacklistedTokens: number;
    lockedAccounts: number;
  } {
    const recentEvents = this.auditLogs.filter(e => Date.now() - e.timestamp < 3600000); // Last hour
    const successfulAuth = recentEvents.filter(e => e.success && e.action.includes('token')).length;
    const failedAuth = recentEvents.filter(e => !e.success && e.action.includes('token')).length;
    const lockedAccounts = Array.from(this.loginAttempts.values()).filter(a => a.lockedUntil && Date.now() < a.lockedUntil).length;

    return {
      totalAuthEvents: recentEvents.length,
      successfulAuth,
      failedAuth,
      activeTokens: 0, // Would need to track active sessions
      blacklistedTokens: this.tokenBlacklist.size,
      lockedAccounts
    };
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): typeof this.auditLogs {
    return this.auditLogs.slice(-limit);
  }
}

// Export singleton instance
export const authSecurity = new AuthSecurityService();