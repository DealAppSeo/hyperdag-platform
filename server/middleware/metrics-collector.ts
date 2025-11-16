/**
 * Metrics Collection Middleware
 * Automatically records API latency and errors for autonomous system monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { realMetricsCollector } from '../services/autonomous/real-metrics-collector';

/**
 * Middleware to collect API latency metrics
 */
export function metricsCollectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Capture response finish to record latency
  const originalSend = res.send;
  res.send = function (body): Response {
    const latency = Date.now() - startTime;
    
    // Record API latency for all requests
    realMetricsCollector.recordApiLatency(latency);
    
    // Add response time headers for client-side performance monitoring
    res.setHeader('X-Response-Time', `${latency}ms`);
    res.setHeader('X-Performance-Target', '200ms');
    res.setHeader('X-Performance-Status', latency < 200 ? 'optimal' : 'slow');
    
    // Call original send
    return originalSend.call(this, body);
  };
  
  next();
}

/**
 * Error handler middleware to collect error metrics
 */
export function errorCollectionMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  // Record the error
  realMetricsCollector.recordError(err.message || 'Unknown error');
  
  // Log error for debugging
  console.error('[Error Handler]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });
  
  // Send error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    }
  });
}
