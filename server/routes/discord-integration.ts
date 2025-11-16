import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// Discord integration status
router.get('/discord/integration', requireAuth, async (req, res) => {
  try {
    // Mock data for showcase - in production this would check actual Discord connection
    const mockIntegration = {
      connected: true,
      discordId: "123456789",
      username: "Sean#1234",
      roles: ["@Expert-Developer", "@Grant-Hunter", "@Community-Helper"],
      serverMemberships: [
        {
          id: "hyperdag-main",
          name: "HyperDAG Community",
          memberCount: 1247,
          specialChannels: ["#expert-only", "#grant-alerts", "#team-matching"]
        },
        {
          id: "web3-builders",
          name: "Web3 Builders Hub", 
          memberCount: 892,
          specialChannels: ["#zkp-discussion", "#reputation-verified", "#exclusive-opportunities"]
        }
      ],
      reputation: {
        helpScore: 847,
        badges: ["Expert Helper", "Community Champion", "Grant Master"],
        tokens: 534,
        level: 7
      }
    };

    res.json(mockIntegration);
  } catch (error) {
    console.error('Error fetching Discord integration:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Discord integration status' 
    });
  }
});

// ZKP credentials endpoint
router.get('/zkp/credentials', requireAuth, async (req, res) => {
  try {
    // Mock ZKP credentials for showcase
    const mockCredentials = [
      {
        id: "zkp-1",
        type: "expertise",
        title: "Senior Full-Stack Developer",
        verified: true,
        discordRole: "Expert-Developer",
        proof: "zk_proof_hash_12345"
      },
      {
        id: "zkp-2", 
        type: "achievement",
        title: "Community Contributor",
        verified: true,
        discordRole: "Community-Helper",
        proof: "zk_proof_hash_67890"
      },
      {
        id: "zkp-3",
        type: "contribution",
        title: "Grant Application Success",
        verified: false,
        discordRole: "Grant-Hunter",
        proof: "zk_proof_hash_pending"
      }
    ];

    res.json(mockCredentials);
  } catch (error) {
    console.error('Error fetching ZKP credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ZKP credentials' 
    });
  }
});

// Generate ZKP credential
router.post('/zkp/generate-credential', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    
    // Mock credential generation
    const newCredential = {
      id: `zkp-${Date.now()}`,
      type,
      title: `${type === 'expertise' ? 'Expert' : 'Contributor'} Credential`,
      verified: true,
      discordRole: `${type}-verified`,
      proof: `zk_proof_${Date.now()}`
    };

    res.json({ 
      success: true, 
      credential: newCredential,
      message: 'ZKP credential generated successfully' 
    });
  } catch (error) {
    console.error('Error generating ZKP credential:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate ZKP credential' 
    });
  }
});

// Discord OAuth connection
router.post('/auth/discord/connect', requireAuth, async (req, res) => {
  try {
    if (!process.env.DISCORD_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Discord integration not configured. Please contact admin.'
      });
    }

    // Generate Discord OAuth URL
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/auth/discord/callback')}&response_type=code&scope=identify%20guilds%20guilds.join`;

    res.json({
      success: true,
      authUrl: discordAuthUrl
    });
  } catch (error) {
    console.error('Error creating Discord auth URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create Discord authentication URL' 
    });
  }
});

// Discord OAuth callback
router.get('/auth/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    // In production, this would exchange the code for an access token
    // and save the Discord connection to the user's profile
    
    // For showcase purposes, redirect to success page
    res.redirect('/?discord_connected=true');
  } catch (error) {
    console.error('Error handling Discord callback:', error);
    res.redirect('/?discord_error=true');
  }
});

export default router;