import { Router, Request, Response } from 'express';
import { 
  twitterOAuthProvider,
  googleOAuthProvider,
  linkedinOAuthProvider,
  youtubeOAuthProvider,
  discordOAuthProvider,
  githubOAuthProvider,
  mediumOAuthProvider,
  stackoverflowOAuthProvider
} from '../../services/oauth-service';
import { SupportedOAuthProvider } from '../../types/oauth-types';

const router = Router();

/**
 * OAuth Authorization route - Initiates OAuth flow for the specified provider
 */
router.get('/:provider/authorize', async (req: Request, res: Response) => {
  try {
    const providerName = req.params.provider;
    
    // Validate provider
    if (!Object.values(SupportedOAuthProvider).includes(providerName as SupportedOAuthProvider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    // Get the appropriate OAuth provider
    let provider;
    switch (providerName) {
      case SupportedOAuthProvider.TWITTER:
        provider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        provider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        provider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        provider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        provider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        provider = githubOAuthProvider;
        break;
      case SupportedOAuthProvider.MEDIUM:
        provider = mediumOAuthProvider;
        break;
      case SupportedOAuthProvider.STACKOVERFLOW:
        provider = stackoverflowOAuthProvider;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    // Generate authorization URL
    const redirectUri = `${process.env.APP_URL}/api/oauth/${providerName}/callback`;
    const authUrl = await provider.getAuthorizationUrl(redirectUri);
    
    // Redirect to provider authorization page
    res.redirect(authUrl);
  } catch (error) {
    console.error(`OAuth authorization error:`, error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * OAuth Callback route - This endpoint is called by OAuth providers after authentication
 */
router.get('/:provider/callback', async (req: Request, res: Response) => {
  try {
    const providerName = req.params.provider;
    const { code, state } = req.query as { code: string; state: string };
    
    if (!code) {
      return res.redirect(`/oauth/callback?error=Missing+required+parameters&provider=${providerName}`);
    }
    
    // Validate provider
    if (!Object.values(SupportedOAuthProvider).includes(providerName as SupportedOAuthProvider)) {
      return res.redirect(`/oauth/callback?error=Invalid+provider&provider=${providerName}`);
    }
    
    // Get the appropriate OAuth provider
    let provider;
    switch (providerName) {
      case SupportedOAuthProvider.TWITTER:
        provider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        provider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        provider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        provider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        provider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        provider = githubOAuthProvider;
        break;
      case SupportedOAuthProvider.MEDIUM:
        provider = mediumOAuthProvider;
        break;
      case SupportedOAuthProvider.STACKOVERFLOW:
        provider = stackoverflowOAuthProvider;
        break;
      default:
        return res.redirect(`/oauth/callback?error=Unsupported+provider&provider=${providerName}`);
    }
    
    // Process the OAuth callback
    const redirectUri = `${process.env.APP_URL}/api/oauth/${providerName}/callback`;
    const result = await provider.handleCallback(code, state, redirectUri);
    
    if (!result.success) {
      return res.redirect(`/oauth/callback?error=${encodeURIComponent(result.message || 'Authentication failed')}&provider=${providerName}`);
    }
    
    // If user is authenticated, associate this account with their profile
    if (req.isAuthenticated() && req.user) {
      const userId = req.user.id;
      
      // Update user record with social connection
      await provider.saveSocialConnection(userId, result.data!);
    }
    
    // Redirect back to client callback with success and data
    const redirectParams = new URLSearchParams({
      provider: providerName,
      success: 'true'
    });
    
    if (result.data) {
      // Add basic profile info to redirect (don't include sensitive data)
      redirectParams.set('id', result.data.id);
      if (result.data.displayName) redirectParams.set('name', result.data.displayName);
      if (result.data.username) redirectParams.set('username', result.data.username);
    }
    
    return res.redirect(`/oauth/callback?${redirectParams.toString()}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`/oauth/callback?error=Unexpected+error&provider=${req.params.provider || 'unknown'}`);
  }
});

/**
 * OAuth Disconnect route - Removes connection to the specified provider
 */
router.post('/:provider/disconnect', async (req: Request, res: Response) => {
  try {
    // Require authentication
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const providerName = req.params.provider;
    
    // Validate provider
    if (!Object.values(SupportedOAuthProvider).includes(providerName as SupportedOAuthProvider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    // Get the appropriate OAuth provider
    let provider;
    switch (providerName) {
      case SupportedOAuthProvider.TWITTER:
        provider = twitterOAuthProvider;
        break;
      case SupportedOAuthProvider.GOOGLE:
        provider = googleOAuthProvider;
        break;
      case SupportedOAuthProvider.LINKEDIN:
        provider = linkedinOAuthProvider;
        break;
      case SupportedOAuthProvider.YOUTUBE:
        provider = youtubeOAuthProvider;
        break;
      case SupportedOAuthProvider.DISCORD:
        provider = discordOAuthProvider;
        break;
      case SupportedOAuthProvider.GITHUB:
        provider = githubOAuthProvider;
        break;
      case SupportedOAuthProvider.MEDIUM:
        provider = mediumOAuthProvider;
        break;
      case SupportedOAuthProvider.STACKOVERFLOW:
        provider = stackoverflowOAuthProvider;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    // Disconnect social account
    await provider.disconnectSocialAccount(userId);
    
    // Return success
    res.status(200).json({ 
      success: true, 
      message: `Successfully disconnected ${providerName}` 
    });
  } catch (error) {
    console.error(`OAuth disconnect error:`, error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

/**
 * Get available OAuth providers and their status
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // Get user ID if authenticated
    const userId = req.isAuthenticated() && req.user ? req.user.id : null;
    
    // Create list of available providers
    const providers = Object.values(SupportedOAuthProvider).map(provider => ({
      id: provider,
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      // If a user is authenticated, check if they have this provider connected
      // Otherwise, just return false for all connected statuses
      connected: userId && req.user ? req.user[`${provider}Verified`] === true : false
    }));
    
    res.status(200).json(providers);
  } catch (error) {
    console.error('Error fetching OAuth providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

export default router;