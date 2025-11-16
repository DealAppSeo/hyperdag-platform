import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Domain Handler Middleware
 * 
 * This middleware handles domain redirects and normalization to ensure
 * consistent behavior across both www and non-www domains.
 * 
 * Configuration:
 * - Set PRIMARY_DOMAIN in .env to the preferred domain (e.g., 'hyperdag.org')
 * - Set REDIRECT_WWW=true in .env to redirect www to non-www (or false for the opposite)
 */
export function domainHandler(req: Request, res: Response, next: NextFunction) {
  // Skip for health checks, API routes, and certain callbacks
  if (req.path.startsWith('/api/health') || 
      req.path.startsWith('/api/callback') ||
      req.path.startsWith('/api/domain-health') ||
      process.env.NODE_ENV !== 'production') {
    return next();
  }

  const host = req.hostname;
  const primaryDomain = process.env.PRIMARY_DOMAIN || 'hyperdag.org';
  const shouldRedirectWWW = process.env.REDIRECT_WWW === 'true';
  
  // Check for www subdomain with SSL issues
  if (host === `www.${primaryDomain}`) {
    // If we detect the www subdomain, serve our redirect page
    // This uses client-side redirection to avoid SSL errors
    try {
      const redirectPagePath = path.join(__dirname, '../public/www-redirect.html');
      if (fs.existsSync(redirectPagePath)) {
        const redirectHtml = fs.readFileSync(redirectPagePath, 'utf8');
        return res.send(redirectHtml);
      }
    } catch (error) {
      console.error('Error serving www redirect page:', error);
    }
    
    // Fallback to standard redirect if the file approach fails
    if (shouldRedirectWWW) {
      return res.redirect(301, `https://${primaryDomain}${req.originalUrl}`);
    }
  } else if (!shouldRedirectWWW && host === primaryDomain) {
    // Redirect non-www to www (only if that's the policy)
    return res.redirect(301, `https://www.${primaryDomain}${req.originalUrl}`);
  }
  
  // For api subdomain or any other case, just continue
  next();
}