import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Middleware to sanitize request body to prevent XSS attacks
 * Recursively sanitizes all string values in the request body
 */
export function xssProtection(req: Request, res: Response, next: NextFunction) {
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
}

/**
 * Recursively sanitize all string values in an object
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: any): any {
  if (!obj) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj: any = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    
    return sanitizedObj;
  }
  
  return obj;
}