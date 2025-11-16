import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { storage } from '../../storage';

const router = Router();

// Store for temporary nonces (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Clean up expired nonces (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of Array.from(nonceStore.entries())) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      nonceStore.delete(address);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * @route POST /api/auth/nonce
 * @desc Generate a nonce for Web3 authentication
 * @access Public
 */
router.post('/nonce', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid Ethereum address is required' 
      });
    }

    // Generate random nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Store nonce with timestamp
    nonceStore.set(address.toLowerCase(), {
      nonce,
      timestamp: Date.now()
    });

    res.json({ 
      success: true, 
      nonce 
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate authentication nonce' 
    });
  }
});

/**
 * @route POST /api/auth/verify
 * @desc Verify Web3 signature and authenticate user
 * @access Public
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message, signature, and address are required' 
      });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Ethereum address' 
      });
    }

    // Check if nonce exists and is valid
    const storedData = nonceStore.get(address.toLowerCase());
    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired nonce' 
      });
    }

    // Verify the nonce is in the message
    if (!message.includes(storedData.nonce)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message does not contain valid nonce' 
      });
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Signature verification failed' 
        });
      }
    } catch (signatureError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature format' 
      });
    }

    // Remove used nonce
    nonceStore.delete(address.toLowerCase());

    // Find or create user
    let user = await storage.getUserByWalletAddress(address.toLowerCase());
    
    if (!user) {
      // Create new user with wallet address
      const username = `user_${address.slice(2, 8)}`;
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      user = await storage.createUser({
        username,
        password: '', // No password for Web3-only users
        referralCode,
        walletAddress: address.toLowerCase()
      });
    } else {
      // Update existing user's wallet address if not set
      if (!user.walletAddress) {
        await storage.linkWalletToUser(user.id, address.toLowerCase());
        user.walletAddress = address.toLowerCase();
      }
    }

    // Set session
    req.login(user, (err) => {
      if (err) {
        console.error('Session creation error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create user session' 
        });
      }

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          authLevel: user.authLevel || 1
        },
        message: 'Web3 authentication successful' 
      });
    });

  } catch (error) {
    console.error('Error verifying Web3 signature:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication verification failed' 
    });
  }
});

/**
 * @route GET /api/auth/web3-status
 * @desc Check Web3 authentication status
 * @access Private
 */
router.get('/web3-status', (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ 
      success: false, 
      authenticated: false 
    });
  }

  res.json({ 
    success: true, 
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      walletAddress: req.user.walletAddress,
      authLevel: req.user.authLevel || 1
    }
  });
});

export default router;