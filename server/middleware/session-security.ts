import session from 'express-session';
import { Request } from 'express';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      authLevel: number;
    };
    csrf?: string;
    lastActivity?: number;
  }
}

export const sessionConfig: session.SessionOptions = {
  name: 'hyperdag.sid',
  secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  genid: () => {
    // Generate cryptographically secure session IDs
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
};

export function sessionTimeout(req: Request, res: any, next: any) {
  if (req.session && req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    
    // 30 minute timeout
    if (now - lastActivity > 30 * 60 * 1000) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }
    
    req.session.lastActivity = now;
  }
  
  next();
}