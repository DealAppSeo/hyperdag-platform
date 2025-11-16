import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body against a Zod schema
 * @param schema Zod schema for validation
 * @returns Express middleware function
 */
export const validate = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      logger.error(`Validation error: ${error.message}`);
      
      // Format Zod errors for better readability
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        error: error.message
      });
    }
  };
};