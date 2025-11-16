/**
 * Global error handler middleware with standardized responses
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from './api-response';

/**
 * Async handler wrapper to catch and forward errors to the global error handler
 * @param fn Async route handler function
 * @returns Express route handler with error handling
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Utility function to create and throw API errors
 * Can be used in route handlers to throw errors that will be caught by asyncHandler
 */
export const createApiError = {
  badRequest: (message: string, code?: string, details?: any) => {
    throw ApiError.badRequest(message, code, details);
  },
  unauthorized: (message?: string, code?: string, details?: any) => {
    throw ApiError.unauthorized(message, code, details);
  },
  forbidden: (message?: string, code?: string, details?: any) => {
    throw ApiError.forbidden(message, code, details);
  },
  notFound: (message?: string, code?: string, details?: any) => {
    throw ApiError.notFound(message, code, details);
  },
  conflict: (message: string, code?: string, details?: any) => {
    throw ApiError.conflict(message, code, details);
  },
  internal: (message?: string, code?: string, details?: any) => {
    throw ApiError.internal(message, code, details);
  }
};

/**
 * Authentication error handler middleware
 * Checks if the user is authenticated, throws 401 error if not
 */
export const authErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    createApiError.unauthorized('Authentication required');
  }
  next();
};

/**
 * Custom error class for API errors with status code and error code
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST', details?: any): ApiError {
    return new ApiError(message, 400, code, details);
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details?: any): ApiError {
    return new ApiError(message, 401, code, details);
  }

  static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN', details?: any): ApiError {
    return new ApiError(message, 403, code, details);
  }

  static notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND', details?: any): ApiError {
    return new ApiError(message, 404, code, details);
  }

  static conflict(message: string, code: string = 'CONFLICT', details?: any): ApiError {
    return new ApiError(message, 409, code, details);
  }

  static internal(message: string = 'Internal Server Error', code: string = 'INTERNAL_SERVER_ERROR', details?: any): ApiError {
    return new ApiError(message, 500, code, details);
  }
}

/**
 * Global error handler middleware
 * Place at the end of the middleware chain
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error occurred:', err);
  
  if (err instanceof ApiError) {
    // For ApiError instances, use the provided status code and error code
    sendError(res, err.message, err.code, err.statusCode, err.details);
  } else if (err.name === 'ValidationError') {
    // For validation errors (from Zod, etc.)
    sendError(res, 'Validation error', 'VALIDATION_ERROR', 400, err.errors || err.details);
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    // For authentication errors
    sendError(res, err.message || 'Unauthorized', 'UNAUTHORIZED', 401);
  } else if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token validation failure
    sendError(res, 'Invalid CSRF token', 'INVALID_CSRF_TOKEN', 403);
  } else {
    // For generic errors or unknown error types
    const statusCode = err.statusCode || err.status || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const errorMessage = err.message || 'An unexpected error occurred';
    
    // Only include stack trace in development
    const details = process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined;
    
    sendError(res, errorMessage, errorCode, statusCode, details);
  }
}
