/**
 * Request Validation Middleware
 * 
 * This middleware uses Zod schemas to validate request bodies, query parameters,
 * and URL parameters before they reach route handlers.
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validates requests against a Zod schema
 * @param schema The Zod schema to validate against
 */
export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // If validation fails, return a structured error response
      if (error instanceof ZodError) {
        logger.warn('Validation error:', error.errors);
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      // For unexpected errors, pass to error handler
      next(error);
    }
  };