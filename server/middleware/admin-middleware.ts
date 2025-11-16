/**
 * Admin Middleware
 * 
 * Middleware to check if the current user is an administrator
 * and restrict access to admin-only routes.
 */
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to ensure the user is an admin
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required"
    });
  }

  // Check if authenticated user is an admin
  if (!req.user?.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: "Admin access required"
    });
  }

  // User is authenticated and has admin privileges
  next();
}