import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const schemas = {
  email: z.string().email().max(254),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  bio: z.string().max(500),
  url: z.string().url().max(2048),
  id: z.number().int().positive(),
  text: z.string().max(10000),
  interests: z.array(z.string().max(50)).max(20),
  skills: z.array(z.string().max(50)).max(30)
};

function sanitizeInput(value: any): any {
  if (typeof value === 'string') {
    // Remove null bytes and control characters
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }
  
  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(value[key]);
      }
    }
    return sanitized;
  }
  
  return value;
}

export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body) {
        req.body = sanitizeInput(req.body);
      }
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: result.error.errors
        });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Validation error'
      });
    }
  };
}

export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
}