/**
 * Social Media Connections API
 * 
 * Handles the processing of social media OAuth callbacks and connection management
 */
import express, { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { apiResponse } from '../index';
import { requireAuth } from '../../middleware/auth-middleware';
// Using the individual provider instances
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
 * Process OAuth callback from frontend
 * This endpoint receives the OAuth code and state after the browser is redirected
 * from the OAuth provider back to our frontend
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { provider, code, state, redirectUri } = req.body;
    
    if (!provider || !code) {
      return res.status(400).json(apiResponse(false, null, 'Missing required parameters', { 
        code: 'INVALID_REQUEST', 
        message: 'Provider and code are required'
      }));
    }
    
    // Type check provider
    if (!Object.values(SupportedOAuthProvider).includes(provider as SupportedOAuthProvider)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid provider', { 
        code: 'INVALID_PROVIDER', 
        message: `Provider must be one of: ${Object.values(SupportedOAuthProvider).join(', ')}`
      }));
    }
    
    // Get the appropriate OAuth provider
    let oauthProvider;
    switch (provider) {
      case SupportedOAuthProvider.TWITTER:
        oauthProvider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        oauthProvider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        oauthProvider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        oauthProvider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        oauthProvider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        oauthProvider = githubOAuthProvider;
        break;
      default:
        return res.status(400).json(apiResponse(false, null, 'Provider not supported', { 
          code: 'PROVIDER_NOT_SUPPORTED', 
          message: `The provider ${provider} is not supported`
        }));
    }
    
    // Process the OAuth callback
    const result = await oauthProvider.handleCallback(code, state, redirectUri);
    
    if (!result.success) {
      return res.status(400).json(apiResponse(false, null, result.message, { 
        code: 'OAUTH_ERROR', 
        message: result.message
      }));
    }
    
    // If the result doesn't have data, something went wrong
    if (!result.data) {
      return res.status(400).json(apiResponse(false, null, 'No profile data received', { 
        code: 'OAUTH_ERROR', 
        message: 'No profile data received from the provider'
      }));
    }
    
    // If user is authenticated, associate this account with their profile
    if (req.isAuthenticated() && req.user) {
      const userId = req.user.id;
      
      // Update user record with social connection
      await oauthProvider.saveSocialConnection(userId, result.data);
      
      return res.json(apiResponse(true, { 
        connected: true,
        provider,
        userData: result.data
      }, 'Successfully connected social account'));
    } 
    // If not authenticated but we got valid data, return the data for frontend login/registration
    else {
      return res.json(apiResponse(true, {
        connected: false,
        provider,
        userData: result.data
      }, 'Successfully authenticated with provider'));
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json(apiResponse(false, null, 'Error processing OAuth callback', { 
      code: 'SERVER_ERROR', 
      message: 'An unexpected error occurred'
    }));
  }
});

/**
 * Get user's social connections
 */
router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Query user record to get social connections
    const [userWithSocial] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!userWithSocial) {
      return res.status(404).json(apiResponse(false, null, 'User not found', { 
        code: 'USER_NOT_FOUND', 
        message: 'User not found'
      }));
    }
    
    // Format social connections for client
    const connections = {
      twitter: userWithSocial.twitterConnected,
      google: userWithSocial.googleConnected,
      linkedin: userWithSocial.linkedinConnected,
      youtube: userWithSocial.youtubeConnected,
      discord: userWithSocial.discordConnected,
      github: userWithSocial.githubConnected,
    };
    
    // Include stats if they exist
    const socialStats = {
      twitter: userWithSocial.twitterStats,
      linkedin: userWithSocial.linkedinStats,
      youtube: userWithSocial.youtubeStats,
      discord: userWithSocial.discordStats,
      github: userWithSocial.githubStats,
    };
    
    return res.json(apiResponse(true, { connections, socialStats }, 'Social connections retrieved'));
    
  } catch (error) {
    console.error('Get connections error:', error);
    return res.status(500).json(apiResponse(false, null, 'Error retrieving social connections', { 
      code: 'SERVER_ERROR', 
      message: 'An unexpected error occurred'
    }));
  }
});

/**
 * Disconnect a social account
 */
router.post('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    const userId = req.user!.id;
    
    if (!provider) {
      return res.status(400).json(apiResponse(false, null, 'Missing provider parameter', { 
        code: 'INVALID_REQUEST', 
        message: 'Provider is required'
      }));
    }
    
    // Type check provider
    if (!Object.values(SupportedOAuthProvider).includes(provider as SupportedOAuthProvider)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid provider', { 
        code: 'INVALID_PROVIDER', 
        message: `Provider must be one of: ${Object.values(SupportedOAuthProvider).join(', ')}`
      }));
    }
    
    // Get the appropriate OAuth provider
    let oauthProvider;
    switch (provider) {
      case SupportedOAuthProvider.TWITTER:
        oauthProvider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        oauthProvider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        oauthProvider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        oauthProvider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        oauthProvider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        oauthProvider = githubOAuthProvider;
        break;
      default:
        return res.status(400).json(apiResponse(false, null, 'Provider not supported', { 
          code: 'PROVIDER_NOT_SUPPORTED', 
          message: `The provider ${provider} is not supported`
        }));
    }
    
    // Remove social connection from user record
    await oauthProvider.disconnectSocialAccount(userId);
    
    return res.json(apiResponse(true, { disconnected: true, provider }, 'Social account disconnected'));
    
  } catch (error) {
    console.error('Disconnect error:', error);
    return res.status(500).json(apiResponse(false, null, 'Error disconnecting social account', { 
      code: 'SERVER_ERROR', 
      message: 'An unexpected error occurred'
    }));
  }
});

/**
 * Generate an OAuth URL for connecting a social account
 */
router.get('/connect/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { redirectUri } = req.query;
    
    // Type check provider
    if (!Object.values(SupportedOAuthProvider).includes(provider as SupportedOAuthProvider)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid provider', { 
        code: 'INVALID_PROVIDER', 
        message: `Provider must be one of: ${Object.values(SupportedOAuthProvider).join(', ')}`
      }));
    }
    
    // Get the appropriate OAuth provider
    let oauthProvider;
    switch (provider) {
      case SupportedOAuthProvider.TWITTER:
        oauthProvider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        oauthProvider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        oauthProvider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        oauthProvider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        oauthProvider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        oauthProvider = githubOAuthProvider;
        break;
      default:
        return res.status(400).json(apiResponse(false, null, 'Provider not supported', { 
          code: 'PROVIDER_NOT_SUPPORTED', 
          message: `The provider ${provider} is not supported`
        }));
    }
    
    // Generate authorization URL
    const authUrl = await oauthProvider.getAuthorizationUrl(redirectUri as string);
    
    return res.json(apiResponse(true, { authUrl }, 'Authorization URL generated'));
    
  } catch (error) {
    console.error('Generate auth URL error:', error);
    return res.status(500).json(apiResponse(false, null, 'Error generating authorization URL', { 
      code: 'SERVER_ERROR', 
      message: 'An unexpected error occurred'
    }));
  }
});

export default router;