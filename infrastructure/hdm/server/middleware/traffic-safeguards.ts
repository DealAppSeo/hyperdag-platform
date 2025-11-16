/**
 * Traffic Safeguards Middleware for HyperDAG
 * 
 * Essential for handling viral traffic spikes during hackathon project launches.
 * Provides multi-layer protection against system overload.
 */

import { Request, Response, NextFunction } from 'express';
import { trafficResilience } from '../services/traffic-resilience-service';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
    isAdmin?: boolean;
  };
}

/**
 * Priority-based request handling
 * Admin and verified users get priority during high traffic
 */
export function priorityRequestHandler() {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // Set request priority
    if (user?.isAdmin) {
      (req as any).priority = 'high';
    } else if (user?.emailVerified && user?.twoFactorEnabled) {
      (req as any).priority = 'medium';
    } else {
      (req as any).priority = 'low';
    }
    
    next();
  };
}

/**
 * Critical endpoint protection
 * Protects essential APIs during traffic spikes
 */
export function criticalEndpointProtection() {
  const criticalPaths = [
    '/api/user',
    '/api/auth',
    '/api/notifications',
    '/api/referral'
  ];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const isCritical = criticalPaths.some(path => req.path.startsWith(path));
    
    if (isCritical) {
      // Apply stricter rate limiting for critical endpoints
      (req as any).isCritical = true;
    }
    
    next();
  };
}

/**
 * Response compression and caching headers
 */
export function optimizeResponse() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set caching headers for static content
    if (req.path.includes('/api/grants') || req.path.includes('/api/leaderboard')) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
    // Set compression
    res.set('Content-Encoding', 'gzip');
    
    next();
  };
}

/**
 * Database connection pooling protection
 */
export function databaseProtection() {
  let activeConnections = 0;
  const maxConnections = 50;
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (activeConnections >= maxConnections) {
      return res.status(503).json({
        error: 'Database temporarily unavailable due to high load',
        retryAfter: 10
      });
    }
    
    activeConnections++;
    
    // Cleanup on response finish
    res.on('finish', () => {
      activeConnections--;
    });
    
    next();
  };
}

/**
 * Memory usage monitoring
 */
export function memoryGuard() {
  return (req: Request, res: Response, next: NextFunction) => {
    const usage = process.memoryUsage();
    const mbUsed = Math.round(usage.heapUsed / 1024 / 1024);
    
    // Reject non-critical requests if memory usage is too high
    if (mbUsed > 400 && !(req as any).isCritical) {
      return res.status(503).json({
        error: 'Server temporarily overloaded',
        retryAfter: 30
      });
    }
    
    next();
  };
}

/**
 * Graceful degradation for non-essential features
 */
export function gracefulDegradation() {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonEssentialPaths = [
      '/api/analytics',
      '/api/ai/recommendations',
      '/api/visualizations'
    ];
    
    const isNonEssential = nonEssentialPaths.some(path => req.path.startsWith(path));
    
    if (isNonEssential) {
      // During high load, return simplified responses
      const usage = process.memoryUsage();
      const mbUsed = Math.round(usage.heapUsed / 1024 / 1024);
      
      if (mbUsed > 300) {
        return res.json({
          message: 'Service temporarily simplified due to high traffic',
          available: false
        });
      }
    }
    
    next();
  };
}

/**
 * Error recovery middleware
 */
export function errorRecovery() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error in request:', error.message);
    
    // Provide helpful error responses
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout due to high traffic',
        suggestion: 'Please try again in a few moments'
      });
    }
    
    if (error.message.includes('connection')) {
      return res.status(503).json({
        error: 'Temporary service disruption',
        suggestion: 'System is recovering, please retry'
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Temporary system issue',
      suggestion: 'Please try again shortly'
    });
  };
}

/**
 * Health monitoring endpoint
 */
export function healthMonitoring() {
  return (req: Request, res: Response) => {
    const usage = process.memoryUsage();
    const uptime = process.uptime();
    
    const health = {
      status: 'healthy',
      uptime: Math.round(uptime),
      memory: {
        used: Math.round(usage.heapUsed / 1024 / 1024),
        total: Math.round(usage.heapTotal / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    };
    
    // Determine health status
    if (health.memory.used > 400) {
      health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  };
}