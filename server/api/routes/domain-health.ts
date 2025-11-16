import express, { Request, Response } from 'express';
import { apiResponse } from '../index';

const router = express.Router();

/**
 * Domain health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get domain information from request
    const host = req.hostname;
    const protocol = req.protocol;
    const primaryDomain = process.env.PRIMARY_DOMAIN || 'hyperdag.org';
    const shouldRedirectWWW = process.env.REDIRECT_WWW === 'true';
    const expectedWwwBehavior = shouldRedirectWWW ? 'www redirects to non-www' : 'non-www redirects to www';
    
    // Check if SSL is correctly configured (by checking if protocol is https)
    const sslConfigured = protocol === 'https';
    
    // Check if this request came through Cloudflare
    const cfRay = req.headers['cf-ray'];
    const isCloudflareProxied = !!cfRay;
    
    // Get full URL from request
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    
    // Format response data
    const domainHealth = {
      status: 'operational',
      host,
      primaryDomain,
      domainRedirectPolicy: expectedWwwBehavior,
      isWwwDomain: host.startsWith('www.'),
      ssl: {
        configured: sslConfigured,
        protocol
      },
      cloudflare: {
        proxied: isCloudflareProxied,
        cfRay
      },
      request: {
        url: fullUrl,
        headers: {
          'user-agent': req.headers['user-agent'],
          'host': req.headers.host,
          'cf-connecting-ip': req.headers['cf-connecting-ip']
        }
      },
      env: {
        primaryDomain,
        redirectWww: shouldRedirectWWW,
        appUrl: process.env.APP_URL,
        replitDomains: process.env.REPLIT_DOMAINS
      }
    };
    
    return res.json(apiResponse(true, domainHealth, 'Domain health check successful'));
  } catch (error) {
    console.error('Domain health check error:', error);
    return res.status(500).json(apiResponse(false, null, 'Domain health check failed'));
  }
});

export default router;