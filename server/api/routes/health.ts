/**
 * Health Check API
 * 
 * Provides endpoints to verify system health and configuration
 */
import express, { Request, Response } from 'express';
import { apiResponse } from '../index';
import { 
  twitterOAuthProvider,
  googleOAuthProvider,
  linkedinOAuthProvider,
  youtubeOAuthProvider,
  discordOAuthProvider,
  githubOAuthProvider
} from '../../services/oauth-service';
import { SupportedOAuthProvider } from '../../types/oauth-types';

const router = express.Router();

/**
 * General health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check essential environment variables
    const essentialVars = [
      'DATABASE_URL',
      'SESSION_SECRET'
    ];
    
    const missingVars = essentialVars.filter(varName => !process.env[varName]);
    
    // Basic system health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      appUrl: process.env.APP_URL || 'not set',
      database: process.env.DATABASE_URL ? 'configured' : 'not configured',
      environmentVariables: {
        essential: missingVars.length === 0 ? 'ok' : `missing: ${missingVars.join(', ')}`,
      }
    };
    
    return res.json(apiResponse(true, health, 'Health check successful'));
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json(apiResponse(false, null, 'Health check failed', { 
      code: 'HEALTH_CHECK_FAILED', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
});

/**
 * OAuth configuration health check
 */
router.get('/oauth', async (_req: Request, res: Response) => {
  try {
    // Check if APP_URL is set
    const appUrl = process.env.APP_URL;
    
    // Check OAuth providers
    const providers = [
      {
        name: SupportedOAuthProvider.TWITTER,
        configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
        clientIdVar: 'TWITTER_CLIENT_ID',
        clientSecretVar: 'TWITTER_CLIENT_SECRET',
        callbackUrl: appUrl ? `${appUrl}/api/oauth/twitter/callback` : undefined
      },
      {
        name: SupportedOAuthProvider.GOOGLE,
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientIdVar: 'GOOGLE_CLIENT_ID',
        clientSecretVar: 'GOOGLE_CLIENT_SECRET',
        callbackUrl: appUrl ? `${appUrl}/api/oauth/google/callback` : undefined
      },
      {
        name: SupportedOAuthProvider.LINKEDIN,
        configured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
        clientIdVar: 'LINKEDIN_CLIENT_ID',
        clientSecretVar: 'LINKEDIN_CLIENT_SECRET',
        callbackUrl: appUrl ? `${appUrl}/api/oauth/linkedin/callback` : undefined
      },
      {
        name: SupportedOAuthProvider.YOUTUBE,
        configured: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
        clientIdVar: 'YOUTUBE_CLIENT_ID',
        clientSecretVar: 'YOUTUBE_CLIENT_SECRET', 
        callbackUrl: appUrl ? `${appUrl}/api/oauth/youtube/callback` : undefined
      },
      {
        name: SupportedOAuthProvider.DISCORD,
        configured: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
        clientIdVar: 'DISCORD_CLIENT_ID',
        clientSecretVar: 'DISCORD_CLIENT_SECRET',
        callbackUrl: appUrl ? `${appUrl}/api/oauth/discord/callback` : undefined
      },
      {
        name: SupportedOAuthProvider.GITHUB,
        configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        clientIdVar: 'GITHUB_CLIENT_ID',
        clientSecretVar: 'GITHUB_CLIENT_SECRET',
        callbackUrl: appUrl ? `${appUrl}/api/oauth/github/callback` : undefined
      }
    ];
    
    // Count configured providers
    const configuredCount = providers.filter(p => p.configured).length;
    
    // Format the response
    const oauthHealth = {
      status: appUrl ? 'ok' : 'warning',
      appUrl: appUrl || 'not set',
      appUrlWarning: !appUrl ? 'APP_URL environment variable is not set. OAuth callbacks may not work correctly.' : undefined,
      providersConfigured: configuredCount,
      providersTotal: providers.length,
      providers: providers
    };
    
    return res.json(apiResponse(true, oauthHealth, 'OAuth health check successful'));
  } catch (error) {
    console.error('OAuth health check error:', error);
    return res.status(500).json(apiResponse(false, null, 'OAuth health check failed', { 
      code: 'OAUTH_HEALTH_CHECK_FAILED', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
});

/**
 * Cloudflare configuration health check
 */
router.get('/cloudflare', async (req: Request, res: Response) => {
  try {
    // Check if APP_URL is set to a Cloudflare domain
    const appUrl = process.env.APP_URL;
    
    // Check for Cloudflare headers
    const cfRay = req.headers['cf-ray'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    const cfIpCountry = req.headers['cf-ipcountry'];
    
    // Check if Cloudflare is proxying this request
    const isCloudflareProxied = !!cfRay;
    
    // Format the response
    const cloudflareHealth = {
      status: isCloudflareProxied ? 'ok' : 'warning',
      appUrl: appUrl || 'not set',
      cloudflareProxied: isCloudflareProxied,
      cloudflareRay: cfRay,
      cloudflareHeaders: {
        'cf-ray': cfRay,
        'cf-connecting-ip': cfConnectingIp,
        'cf-ipcountry': cfIpCountry
      },
      recommendations: !isCloudflareProxied ? [
        'Ensure your domain is properly configured in Cloudflare',
        'Make sure the "Proxied" option is enabled in your DNS settings',
        'Verify that your SSL/TLS encryption mode is set to "Full" or "Full (strict)"'
      ] : []
    };
    
    return res.json(apiResponse(true, cloudflareHealth, 'Cloudflare health check successful'));
  } catch (error) {
    console.error('Cloudflare health check error:', error);
    return res.status(500).json(apiResponse(false, null, 'Cloudflare health check failed', { 
      code: 'CLOUDFLARE_HEALTH_CHECK_FAILED', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
});

export default router;