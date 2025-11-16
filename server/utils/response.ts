import { Response } from 'express';

/**
 * Send a successful response
 * @param res Express response object
 * @param data Data to send in the response
 * @param status HTTP status code
 */
export function sendSuccess(res: Response, data: any, status: number = 200) {
  return res.status(status).json({
    success: true,
    data
  });
}

/**
 * Send an error response
 * @param res Express response object
 * @param message Error message
 * @param code Error code
 * @param status HTTP status code
 */
export function sendError(
  res: Response, 
  message: string, 
  code: string = 'SERVER_ERROR',
  status: number = 500
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
}