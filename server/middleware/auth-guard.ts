import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Guard Middleware
 * Ensures that the user is authenticated before proceeding to protected routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      error: "UNAUTHORIZED" 
    });
  }
  next();
}

/**
 * Admin Authorization Guard Middleware
 * Ensures that the user is an admin before proceeding to admin-only routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      error: "UNAUTHORIZED" 
    });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      message: "Admin privileges required",
      error: "FORBIDDEN" 
    });
  }
  
  next();
}

/**
 * Safe user access helper
 * Returns the authenticated user or throws an error
 */
export function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
}