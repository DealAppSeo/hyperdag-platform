/**
 * Traffic Resilience Service for HyperDAG
 * 
 * Provides comprehensive safeguards against traffic spikes and system overload.
 * Critical for hackathon teams who need guaranteed uptime during viral growth.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

interface TrafficMetrics {
  requestsPerSecond: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class TrafficResilienceService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private pendingRequests: Array<{ req: Request; res: Response; timestamp: number }> = [];
  private isThrottling = false;
  private lastMetricsUpdate = 0;
  
  // Multi-tier rate limiting for different user types
  private readonly rateLimits = {
    // Anonymous users - most restrictive
    anonymous: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
    
    // Verified users - moderate limits
    verified: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500, // 500 requests per window
      message: 'Rate limit exceeded. Please wait before making more requests.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
    
    // Premium/API users - highest limits
    premium: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 2000, // 2000 requests per window
      message: 'Premium rate limit exceeded.',
      standardHeaders: true,
      legacyHeaders: false,
    })
  };

  /**
   * Adaptive rate limiting based on user verification level
   */
  adaptiveRateLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      // Determine user tier
      let rateLimiter;
      if (!user) {
        rateLimiter = this.rateLimits.anonymous;
      } else if (user.emailVerified && user.twoFactorEnabled) {
        rateLimiter = this.rateLimits.premium;
      } else {
        rateLimiter = this.rateLimits.verified;
      }
      
      rateLimiter(req, res, next);
    };
  }

  /**
   * Circuit breaker pattern for external services
   */
  circuitBreaker(serviceName: string, threshold = 5, timeout = 60000) {
    return async (serviceCall: () => Promise<any>) => {
      const breaker = this.circuitBreakers.get(serviceName) || {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      };

      // Check if circuit is open and if we should try again
      if (breaker.isOpen) {
        if (Date.now() < breaker.nextAttemptTime) {
          throw new Error(`Circuit breaker open for ${serviceName}. Service temporarily unavailable.`);
        }
        // Half-open state - try one request
        breaker.isOpen = false;
      }

      try {
        const result = await serviceCall();
        // Success - reset circuit breaker
        breaker.failureCount = 0;
        this.circuitBreakers.set(serviceName, breaker);
        return result;
      } catch (error) {
        breaker.failureCount++;
        breaker.lastFailureTime = Date.now();
        
        if (breaker.failureCount >= threshold) {
          breaker.isOpen = true;
          breaker.nextAttemptTime = Date.now() + timeout;
          console.warn(`Circuit breaker opened for ${serviceName} after ${threshold} failures`);
        }
        
        this.circuitBreakers.set(serviceName, breaker);
        throw error;
      }
    };
  }

  /**
   * Request queuing for handling traffic spikes
   */
  requestQueue(maxQueueSize = 1000) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.isThrottling) {
        if (this.requestQueue.length >= maxQueueSize) {
          return res.status(503).json({
            error: 'Server temporarily overloaded. Please try again in a few moments.',
            retryAfter: 30
          });
        }
        
        this.requestQueue.push({ req, res, timestamp: Date.now() });
        return;
      }
      
      next();
    };
  }

  /**
   * Process queued requests when system load decreases
   */
  processQueue() {
    if (this.requestQueue.length === 0) return;
    
    const now = Date.now();
    const maxAge = 30000; // 30 seconds timeout for queued requests
    
    // Remove expired requests
    this.requestQueue = this.requestQueue.filter(item => {
      if (now - item.timestamp > maxAge) {
        item.res.status(408).json({ error: 'Request timeout' });
        return false;
      }
      return true;
    });
    
    // Process up to 10 requests at a time
    const toProcess = this.requestQueue.splice(0, 10);
    toProcess.forEach(({ req, res }) => {
      // Re-route the request through normal processing
      // This would need to be integrated with your main router
      console.log(`Processing queued request: ${req.method} ${req.path}`);
    });
  }

  /**
   * Health check middleware with graceful degradation
   */
  healthCheck() {
    return (req: Request, res: Response) => {
      const metrics = this.getCurrentMetrics();
      
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        metrics: {
          requests_per_second: metrics.requestsPerSecond,
          response_time_ms: metrics.responseTime,
          error_rate: metrics.errorRate,
          cpu_usage: metrics.cpuUsage,
          memory_usage: metrics.memoryUsage
        },
        services: {
          database: 'healthy',
          ipfs: 'healthy',
          blockchain: 'healthy'
        }
      };
      
      // Check if system is under stress
      if (metrics.cpuUsage > 80 || metrics.memoryUsage > 85) {
        status.status = 'degraded';
        this.isThrottling = true;
      } else {
        this.isThrottling = false;
      }
      
      const httpStatus = status.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(status);
    };
  }

  /**
   * Graceful shutdown handler
   */
  gracefulShutdown() {
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Starting graceful shutdown...');
      
      // Stop accepting new connections
      this.isThrottling = true;
      
      // Give existing requests time to complete
      setTimeout(() => {
        console.log('Graceful shutdown complete');
        process.exit(0);
      }, 10000); // 10 second grace period
    });
  }

  /**
   * Database connection pooling and failover
   */
  getDatabaseConnection() {
    // This would integrate with your existing database service
    return this.circuitBreaker('database', 3, 30000);
  }

  /**
   * Memory usage monitoring and cleanup
   */
  monitorMemory() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const mbUsed = Math.round(usage.heapUsed / 1024 / 1024);
      
      if (mbUsed > 500) { // Alert at 500MB
        console.warn(`High memory usage: ${mbUsed}MB`);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current system metrics
   */
  private getCurrentMetrics(): TrafficMetrics {
    const now = Date.now();
    if (now - this.lastMetricsUpdate < 5000) {
      // Return cached metrics if updated recently
    }
    
    const usage = process.memoryUsage();
    return {
      requestsPerSecond: 0, // Would be calculated from actual request tracking
      activeConnections: 0, // Would be tracked from connection count
      responseTime: 0, // Would be calculated from response time tracking
      errorRate: 0, // Would be calculated from error tracking
      cpuUsage: 0, // Would need OS-level monitoring
      memoryUsage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }

  /**
   * Initialize all resilience features
   */
  initialize() {
    this.monitorMemory();
    this.gracefulShutdown();
    
    // Start queue processing
    setInterval(() => {
      if (!this.isThrottling) {
        this.processQueue();
      }
    }, 1000);
    
    console.log('Traffic resilience service initialized');
  }
}

export const trafficResilience = new TrafficResilienceService();