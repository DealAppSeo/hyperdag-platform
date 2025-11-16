import { Router } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    slackState: string;
    userId: number;
    user: any;
  }
}

// Slack OAuth initiation - JSON response for frontend
router.get('/auth', (req, res) => {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Slack Client ID not configured' });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/slack/callback`;
    const scope = 'identity.basic,identity.email,identity.team';
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state for CSRF protection
    req.session.slackState = state;
    
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    
    console.log('Slack OAuth Debug:');
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Full Auth URL:', slackAuthUrl);
    
    res.json({ authUrl: slackAuthUrl });
  } catch (error) {
    console.error('Slack auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Slack authentication' });
  }
});

// Slack OAuth login - redirect version
router.get('/login', (req, res) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/slack/callback`;
  const scope = 'identity.basic,identity.email,identity.team';
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state for CSRF protection
  req.session.slackState = state;
  
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  console.log('Slack OAuth Debug:');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  console.log('Full Auth URL:', slackAuthUrl);
  
  res.redirect(slackAuthUrl);
});

// Slack OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    console.log('Slack callback received:', { code: !!code, state, error });
    
    if (error) {
      console.error('Slack OAuth error:', error);
      return res.redirect('/auth?error=slack_oauth_error');
    }

    if (!code) {
      console.error('No authorization code received from Slack');
      return res.redirect('/auth?error=no_code');
    }

    // Verify state for CSRF protection
    if (state !== req.session.slackState) {
      console.error('State mismatch in Slack callback');
      return res.redirect('/auth?error=state_mismatch');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/slack/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Slack token response:', { ok: tokenData.ok, error: tokenData.error });

    if (!tokenData.ok) {
      console.error('Failed to exchange code for token:', tokenData.error);
      return res.redirect('/auth?error=token_exchange_failed');
    }

    // Get user info from Slack
    const userResponse = await fetch('https://slack.com/api/users.identity', {
      headers: {
        'Authorization': `Bearer ${tokenData.authed_user.access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('Slack user data:', { ok: userData.ok, userId: userData.user?.id });

    if (!userData.ok) {
      console.error('Failed to get user data from Slack:', userData.error);
      return res.redirect('/auth?error=user_data_failed');
    }

    const slackUser = userData.user;
    const slackTeam = userData.team;

    // Check if user exists or create new user
    let user = await storage.getUserBySlackId(slackUser.id);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        username: slackUser.name || `slack_${slackUser.id}`,
        email: slackUser.email || null,
        slackId: slackUser.id,
        slackUsername: slackUser.name,
        slackTeamId: slackTeam?.id || null,
        slackTeamName: slackTeam?.name || null,
        profilePicture: slackUser.image_512 || slackUser.image_192 || null,
      });
      
      console.log('Created new user from Slack:', user.id);
    } else {
      // Update existing user's Slack info
      user = await storage.updateUserSlackInfo(user.id, {
        slackUsername: slackUser.name,
        slackTeamId: slackTeam?.id || null,
        slackTeamName: slackTeam?.name || null,
        profilePicture: slackUser.image_512 || slackUser.image_192 || user.profilePicture,
      });
      
      console.log('Updated existing user with Slack info:', user.id);
    }

    // Store user session
    req.session.userId = user.id;
    req.session.user = user;

    // Clear Slack state
    delete req.session.slackState;
    
    console.log('Slack authentication successful for user:', user.id);
    res.redirect('/?slack_auth=success');

  } catch (error) {
    console.error('Slack callback error:', error);
    res.redirect('/auth?error=callback_error');
  }
});

// Slack disconnect
router.post('/disconnect', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await storage.updateUserSlackInfo(req.session.userId, {
      slackUsername: null,
      slackTeamId: null,
      slackTeamName: null,
    });

    res.json({ success: true, message: 'Slack account disconnected' });
  } catch (error) {
    console.error('Slack disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Slack account' });
  }
});

export default router;