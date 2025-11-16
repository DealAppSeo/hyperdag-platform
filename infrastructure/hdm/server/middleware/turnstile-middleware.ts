import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { sendError } from '../utils/api-response';

/**
 * Middleware to verify Cloudflare Turnstile CAPTCHA responses
 * 
 * For proper functioning, you need to set the following environment variables:
 * - CLOUDFLARE_TURNSTILE_SECRET_KEY: Your Cloudflare Turnstile secret key
 */
export async function verifyTurnstile(req: Request, res: Response, next: NextFunction) {
  try {
    // TEMPORARY: Skip all verification while Cloudflare setup is in progress
    console.log('⚠️ Cloudflare Turnstile verification TEMPORARILY DISABLED while Cloudflare setup is in progress');
    return next();
    
    // Original code below (temporarily disabled)
    // Skip verification in development mode if configured to do so
    // if (process.env.NODE_ENV === 'development' && process.env.SKIP_TURNSTILE_IN_DEV === 'true') {
    //   console.log('⚠️ Cloudflare Turnstile verification SKIPPED in development mode');
    //   return next();
    // }

    // const token = req.body.turnstileToken;
    // if (!token) {
    //   return sendError(res, 'CAPTCHA verification failed: Missing token', 'INVALID_CAPTCHA', 400);
    // }

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('Cloudflare Turnstile secret key is not set');
      return sendError(res, 'Server configuration error', 'SERVER_ERROR', 500);
    }

    // Get the user's IP address
    // Use X-Forwarded-For in production behind a proxy, or req.ip directly
    const ip = req.headers['x-forwarded-for'] || req.ip;

    // Verify the token with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    // Include the user's IP address if available
    if (ip) {
      formData.append('remoteip', Array.isArray(ip) ? ip[0] : ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json() as { 
      success: boolean; 
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
      action?: string;
      cdata?: string;
    };

    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return sendError(
        res, 
        'CAPTCHA verification failed', 
        'INVALID_CAPTCHA', 
        400
      );
    }

    // Log successful verification in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Turnstile verification successful', {
        timestamp: data.challenge_ts,
        hostname: data.hostname,
        action: data.action,
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return sendError(res, 'CAPTCHA verification failed', 'SERVER_ERROR', 500);
  }
}

/**
 * Apply Turnstile verification to sensitive routes
 * @param router Express router to attach middleware to
 */
export function applyTurnstileToRoutes(router: any) {
  // List of routes that require Turnstile verification
  const sensitiveRoutes = [
    { path: '/api/login', method: 'post' },
    { path: '/api/register', method: 'post' },
    { path: '/api/user/request-password-change', method: 'post' },
    { path: '/api/user/change-password', method: 'post' },
    // Add more routes as needed
  ];

  // Apply the Turnstile middleware to each route
  sensitiveRoutes.forEach(route => {
    const method = route.method.toLowerCase();
    if (method === 'post') {
      router.post(route.path, verifyTurnstile);
    } else if (method === 'put') {
      router.put(route.path, verifyTurnstile);
    } else if (method === 'delete') {
      router.delete(route.path, verifyTurnstile);
    }
  });
}