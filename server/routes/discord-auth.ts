/**
 * Discord Authentication Routes for HyperDAG
 */

import { Router } from 'express';
import { discordService } from '../services/discord-service';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Discord OAuth initiation
router.get('/auth', async (req, res) => {
  try {
    // Generate a secure state parameter
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session for verification
    (req.session as any).discordState = state;
    
    const authUrl = discordService.getAuthUrl(state);
    console.log('[discord-auth] Generated auth URL:', authUrl);
    res.json({ authUrl });
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Discord authentication', details: error.message });
  }
});

// Discord OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect('/auth?error=discord_auth_failed');
  }

  if (!code || !state) {
    return res.redirect('/auth?error=invalid_discord_code');
  }

  // Verify state parameter
  if (state !== (req.session as any).discordState) {
    return res.redirect('/auth?error=discord_state_mismatch');
  }

  try {
    // Exchange code for tokens
    const tokens = await discordService.exchangeCodeForToken(code as string);
    
    if (!tokens || !tokens.access_token) {
      return res.redirect('/auth?error=discord_token_failed');
    }

    // Get Discord user profile
    const discordProfile = await discordService.getUserProfile(tokens.access_token);
    
    if (!discordProfile) {
      return res.redirect('/auth?error=discord_profile_failed');
    }

    // Create or find user with Discord ID
    const existingUser = await storage.getUserByDiscordId(discordProfile.id);
    
    if (existingUser) {
      // Login existing user
      req.login(existingUser, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect('/auth?error=login_failed');
        }
        // Clear the state from session
        delete (req.session as any).discordState;
        res.redirect('/?success=discord_login');
      });
    } else {
      // Create new user account with Discord data
      const discordIdHash = crypto.createHash('sha256')
        .update(`discord:${discordProfile.id}`)
        .digest('hex');
      
      const newUser = await storage.createUser({
        username: `${discordProfile.username}_${discordProfile.discriminator}`,
        password: crypto.randomBytes(32).toString('hex'), // Random password for Discord users
        email: discordProfile.email || null,
        discordIdHash: discordIdHash,
        discordUsername: `${discordProfile.username}#${discordProfile.discriminator}`,
        discordVerified: discordProfile.verified || false,
        referralCode: crypto.randomBytes(4).toString('hex').toUpperCase()
      });

      req.login(newUser, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect('/auth?error=registration_failed');
        }
        // Clear the state from session
        delete (req.session as any).discordState;
        res.redirect('/?success=discord_registered');
      });
    }
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect('/auth?error=discord_connection_failed');
  }
});

// Disconnect Discord
router.post('/discord/disconnect', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const updateData = {
      discordIdHash: null,
      discordVerified: false,
      discordUsername: null,
      discordConnections: null,
      discordGuilds: null,
      lastUpdated: new Date()
    };

    await storage.updateUser((req.user as any).id, updateData);

    res.json({ success: true, message: 'Discord disconnected successfully' });
  } catch (error) {
    console.error('Discord disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Discord' });
  }
});

export default router;