import { Router } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    githubState: string;
    userId: number;
    user: any;
  }
}

// GitHub OAuth initiation - JSON response for frontend
router.get('/auth', (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GitHub Client ID not configured' });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const scope = 'user:email,read:user';
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state for CSRF protection
    req.session.githubState = state;
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    
    res.json({ authUrl: githubAuthUrl });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub authentication' });
  }
});

// GitHub OAuth login - redirect version
router.get('/login', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  const scope = 'user:email,read:user';
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state for CSRF protection
  req.session.githubState = state;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  console.log('GitHub OAuth Debug:');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  console.log('Full Auth URL:', githubAuthUrl);
  
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log('GitHub callback - received state:', state);
  console.log('GitHub callback - session state:', req.session.githubState);
  console.log('GitHub callback - session ID:', req.sessionID);
  
  // Verify state for CSRF protection
  if (state !== req.session.githubState) {
    console.log('GitHub callback - state mismatch, redirecting to auth page');
    return res.redirect('/auth?error=invalid_state');
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return res.status(400).send(`GitHub OAuth error: ${tokenData.error_description}`);
    }
    
    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'HyperDAG-App',
      },
    });
    
    const userData = await userResponse.json();
    
    // Get user's email addresses
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'HyperDAG-App',
      },
    });
    
    const emails = await emailResponse.json();
    const primaryEmail = emails.find((email: any) => email.primary)?.email || userData.email;
    
    // Hash the GitHub ID for storage
    const githubIdHash = crypto.createHash('sha256')
      .update(`github:${userData.id}`)
      .digest('hex');
    
    // Create or update user
    let user;
    const existingUser = await storage.getUserByGitHubId(githubIdHash);
    
    if (existingUser) {
      // Update existing user with fresh GitHub data
      user = await storage.updateUser(existingUser.id, {
        githubIdHash: githubIdHash,
        githubVerified: true,
        githubFollowers: userData.followers || 0,
        email: primaryEmail || existingUser.email,
      });
    } else {
      // Generate a unique username if GitHub username is taken
      let username = userData.login;
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        username = `${userData.login}_gh${userData.id}`;
      }
      
      // Generate referral code
      const referralCode = crypto.randomBytes(6).toString('hex');
      
      // Create new user
      user = await storage.createUser({
        githubIdHash: githubIdHash,
        githubVerified: true,
        githubFollowers: userData.followers || 0,
        username: username,
        password: crypto.randomBytes(32).toString('hex'), // Random password since using OAuth
        email: primaryEmail,
        referralCode: referralCode,
        authLevel: 2, // Enhanced auth level for OAuth users
        onboardingStage: 3, // Skip to email verified stage
        authMethods: { github: true },
      });
    }
    
    // Store user info in session
    req.session.userId = user.id;
    req.session.user = user;
    
    // Clean up state
    delete req.session.githubState;
    
    // Redirect to home page
    res.redirect('/');
    
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.status(500).send('GitHub authentication failed');
  }
});

export default router;