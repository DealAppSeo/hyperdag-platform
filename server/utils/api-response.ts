/**
 * Standardized API response utility for consistent responses
 */

import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    type?: string;
    details?: any;
  };
}

/**
 * Send a success response with standardized format
 * @param res Express response object
 * @param data Optional data to include in response
 * @param message Optional success message
 * @param statusCode HTTP status code (defaults to 200)
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string, 
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data: data,
    message: message
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response with standardized format
 * @param res Express response object
 * @param message Error message
 * @param code Error code
 * @param statusCode HTTP status code (defaults to 500)
 * @param details Additional error details
 */
export function sendError(
  res: Response,
  message: string,
  code: string = 'INTERNAL_SERVER_ERROR',
  statusCode: number = 500,
  details?: any,
  type?: string
): void {
  const response: ApiResponse<null> = {
    success: false,
    message: message,
    error: {
      code: code,
      message: message,
      type: type || 'server_error',
      details: details
    }
  };
  
  res.status(statusCode).json(response);
}

/**
 * For backward compatibility with existing code
 * Create a standardized API response object without sending it
 */
export function formatResponse<T>(success: boolean, data?: T, message?: string, error?: any): ApiResponse<T> {
  if (success) {
    return {
      success: true,
      data,
      message
    };
  } else {
    return {
      success: false,
      message,
      error: error ? {
        code: error.code || 'ERROR',
        message: error.message || message || 'An error occurred',
        type: error.type,
        details: error.details
      } : undefined
    };
  }
}

/**
 * Standardized API response middleware
 * For wrapping API controller functions with standardized response handling
 */
export function createApiHandler<T>(
  handlerFn: (req: any, res: Response) => Promise<T>
): (req: any, res: Response) => Promise<void> {
  return async (req: any, res: Response) => {
    try {
      const result = await handlerFn(req, res);
      sendSuccess(res, result);
    } catch (error: any) {
      // Format error for consistent API responses
      sendError(
        res,
        error.message || 'An unexpected error occurred',
        error.code || 'INTERNAL_SERVER_ERROR',
        error.statusCode || 500,
        error.details
      );
    }
  };
}
