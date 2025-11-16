/**
 * Enhanced Error Recovery Middleware
 * Fixes database connection issues and prevents header errors
 */

import { Request, Response, NextFunction } from 'express';

export function enhancedErrorHandler() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // Prevent "Cannot set headers after they are sent" errors
    if (res.headersSent) {
      console.error('Headers already sent, skipping response:', error.message);
      return;
    }

    console.error('Enhanced error handler:', error.message);

    // Handle database connection errors
    if (error.message.includes('Connection terminated') || 
        error.message.includes('connection')) {
      return res.status(503).json({
        success: false,
        error: 'Database temporarily unavailable',
        retryAfter: 5
      });
    }

    // Handle timeout errors
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        error: 'Request timeout',
        retryAfter: 3
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Temporary system issue',
      retryAfter: 10
    });
  };
}

export function preventDuplicateResponses() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    let responseSent = false;

    res.json = function(data: any) {
      if (responseSent) {
        console.warn('Duplicate response prevented for:', req.path);
        return this;
      }
      responseSent = true;
      return originalJson.call(this, data);
    };

    next();
  };
}