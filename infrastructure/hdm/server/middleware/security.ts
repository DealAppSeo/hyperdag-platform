import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import xss from 'xss';

// Input validation and sanitization middleware
export const validateAndSanitize = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all string inputs to prevent XSS
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names to prevent prototype pollution
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanKey && cleanKey !== '__proto__' && cleanKey !== 'constructor' && cleanKey !== 'prototype') {
          sanitized[cleanKey] = sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Validate email formats
  if (req.body?.email && !validator.isEmail(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate URLs
  if (req.body?.website && !validator.isURL(req.body.website)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format'
    });
  }

  next();
};

// SQL injection prevention for dynamic queries
export const preventSQLInjection = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove dangerous SQL keywords and characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and escape characters
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
    .trim();
};

// Rate limiting by user ID for authenticated endpoints
const userRequestCounts = new Map<number, { count: number; resetTime: number }>();

export const userRateLimit = (maxRequests: number = 50, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(); // Skip for unauthenticated requests
    }

    const userId = req.user.id;
    const now = Date.now();
    const userStats = userRequestCounts.get(userId);

    if (!userStats || now > userStats.resetTime) {
      userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userStats.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for user'
      });
    }

    userStats.count++;
    next();
  };
};

// Content Security Policy for mobile apps
export const mobileCSP = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https: wss:; " +
    "frame-ancestors 'none';"
  );
  next();
};