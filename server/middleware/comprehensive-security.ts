import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import validator from 'validator';
import xss from 'xss';
import crypto from 'crypto';

// Comprehensive rate limiting with IP tracking
export const createAdvancedRateLimit = (options: {
  windowMs?: number;
  max?: number;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
      });
    },
    keyGenerator: (req: Request) => {
      // Use IP address for rate limiting
      return req.ip || req.connection?.remoteAddress || 'unknown';
    },
    skip: (req: Request) => {
      // Only skip for actual health endpoints
      return req.path === '/health';
    }
  });
};

// Advanced input validation and sanitization
export const comprehensiveInputValidation = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize all string inputs
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove SQL injection patterns
        let cleaned = obj.replace(/['";\\]/g, '');
        // Remove XSS patterns
        cleaned = xss(cleaned);
        // Validate length
        if (cleaned.length > 1000) {
          cleaned = cleaned.substring(0, 1000);
        }
        return cleaned;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize key names
          const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
          if (cleanKey.length > 0) {
            sanitized[cleanKey] = sanitizeObject(value);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    // Apply sanitization to request body, query, and params
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
};

// Enhanced security headers
export const enhancedSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Set comprehensive security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy for mobile optimization
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    next();
  } catch (error) {
    console.error('Security headers error:', error);
    next();
  }
};

// CSRF protection with proper token generation
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF for GET requests and API endpoints that don't modify data
    if (req.method === 'GET' || req.path.includes('/api/csrf-token')) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body.csrfToken;
    const sessionToken = (req as any).session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token mismatch'
      });
    }

    next();
  } catch (error) {
    console.error('CSRF protection error:', error);
    res.status(500).json({
      success: false,
      message: 'CSRF validation failed'
    });
  }
};

// Response compression for performance
export const responseCompression = compression({
  filter: (req: Request, res: Response) => {
    // Compress all text responses
    if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
      return true;
    }
    if (res.getHeader('Content-Type')?.toString().includes('text/')) {
      return true;
    }
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024 // Only compress responses larger than 1KB
});

// Mobile-optimized middleware
export const mobileOptimization = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  if (isMobile) {
    // Set mobile-specific headers
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache for mobile
    res.setHeader('Vary', 'User-Agent');
  }

  next();
};

// Generate secure CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate email addresses
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email) && email.length <= 254;
};

// Validate URLs
export const validateURL = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

// SQL injection prevention
export const preventSQLInjection = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\bUNION\b/gi, '') // Remove UNION
    .replace(/\bSELECT\b/gi, '') // Remove SELECT
    .replace(/\bINSERT\b/gi, '') // Remove INSERT
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE
    .replace(/\bDELETE\b/gi, '') // Remove DELETE
    .replace(/\bDROP\b/gi, ''); // Remove DROP
};