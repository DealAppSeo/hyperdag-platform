import { Router, Request, Response } from 'express';
import { redundantAuthService } from '../../services/redundancy/auth/redundant-auth-service';
import { requireRedundantAuth, requireEnhancedRedundantAuth } from '../../middleware/redundant-auth-middleware';
import { logger } from '../../utils/logger';
import { storage } from '../../storage';

/**
 * Smart Authentication API Routes
 * 
 * These routes provide intelligent authentication with automatic fallback options:
 * 
 * 1. Supports multiple authentication methods (password, Web3, OAuth, etc.)
 * 2. Gracefully degrades when certain methods are unavailable
 * 3. Dynamically adapts to changing conditions based on service status
 */
const router = Router();

/**
 * @route GET /api/smart-auth/status
 * @desc Get current status of the authentication system
 * @access Public
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await redundantAuthService.checkStatus();
    res.json({
      status,
      message: `Authentication system is ${status}`
    });
  } catch (error) {
    logger.error('[smart-auth-api] Error checking auth status:', error);
    res.status(500).json({ 
      error: 'Failed to check authentication status', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/smart-auth/login
 * @desc Login with password and request optimal authentication flow
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }
    
    // Authenticate with password
    const user = await redundantAuthService.authenticateWithPassword(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }
    
    // Determine the optimal authentication flow based on available methods
    const authFlow = await redundantAuthService.getOptimalAuthFlow(username);
    
    // Check if we need additional authentication factors
    if (authFlow.requiredCount > 1) {
      // Password is already verified, so we count that as one factor
      const remainingFactors = authFlow.requiredCount - 1;
      
      // Generate verification code if email or telegram verification is available
      let verificationCode = null;
      let verificationSent = { email: false, telegram: false };
      
      if (authFlow.methods.includes('email') || authFlow.methods.includes('telegram')) {
        verificationCode = redundantAuthService.generateVerificationCode();
        
        // Create verification code record
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 10); // Code expires in 10 minutes
        
        await storage.createVerificationCode({
          userId: user.id,
          code: verificationCode,
          expires
        });
        
        // Send verification code via available channels
        verificationSent = await redundantAuthService.sendVerificationCode(user, verificationCode);
      }
      
      // Return response with authentication flow information
      return res.status(200).json({ 
        success: true, 
        message: "Additional authentication required", 
        username: user.username,
        authFlow: {
          methods: authFlow.methods.filter(m => m !== 'password'), // Password already verified
          requiredCount: remainingFactors,
          verificationSent
        },
        user: {
          id: user.id,
          username: user.username,
          authLevel: user.authLevel || 1,
          // Filter out sensitive information
          email: user.email ? user.email.substring(0, 3) + '***' + user.email.substring(user.email.indexOf('@')) : null,
          hasTelegram: !!user.telegramId,
          hasTotp: !!user.totpSecret,
          hasWallet: !!user.walletAddress
        }
      });
    }
    
    // If only one factor is required, log the user in directly
    req.login(user, (err) => {
      if (err) {
        logger.error('[smart-auth-api] Error logging in user:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error during login" 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Login successful", 
        user: {
          id: user.id,
          username: user.username,
          authLevel: user.authLevel || 1,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    logger.error('[smart-auth-api] Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during authentication", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/smart-auth/verify
 * @desc Verify a second factor (email code, TOTP, etc.)
 * @access Public
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { username, method, code, signature, message } = req.body;
    
    if (!username || !method) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and verification method are required" 
      });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    let isVerified = false;
    
    // Verify based on the selected method
    if (method === 'email' || method === 'telegram') {
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: "Verification code is required" 
        });
      }
      
      isVerified = await redundantAuthService.authenticateWithEmailCode(username, code);
    } else if (method === '2fa') {
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: "TOTP code is required" 
        });
      }
      
      isVerified = await redundantAuthService.authenticateWith2FA(username, code);
    } else if (method === 'web3' || method === 'wallet') {
      if (!signature || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Signature and message are required" 
        });
      }
      
      // For Web3 auth, we need the wallet address which we'll get from the user record
      if (!user.walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "User has no wallet address" 
        });
      }
      
      const verifiedUser = await redundantAuthService.authenticateWithWeb3(
        user.walletAddress, 
        signature, 
        message
      );
      
      isVerified = !!verifiedUser;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid verification method" 
      });
    }
    
    if (!isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: "Verification failed" 
      });
    }
    
    // If verification succeeded, log the user in
    req.login(user, (err) => {
      if (err) {
        logger.error('[smart-auth-api] Error logging in user after verification:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error during login" 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Verification successful", 
        user: {
          id: user.id,
          username: user.username,
          authLevel: user.authLevel || 1,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    logger.error('[smart-auth-api] Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during verification", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/smart-auth/methods
 * @desc Get available authentication methods for a user
 * @access Protected
 */
router.get('/methods', requireRedundantAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const authFlow = await redundantAuthService.getOptimalAuthFlow(user.username);
    
    res.json({
      success: true,
      methods: authFlow.methods,
      requiredCount: authFlow.requiredCount,
      currentLevel: user.authLevel || 1,
      has4FA: redundantAuthService.is4FAAvailable(user)
    });
  } catch (error) {
    logger.error('[smart-auth-api] Error getting auth methods:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error retrieving authentication methods", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/smart-auth/enhance
 * @desc Enhance authentication level by adding a factor
 * @access Protected
 */
router.post('/enhance', requireRedundantAuth, async (req: Request, res: Response) => {
  try {
    const { method, code, signature, message } = req.body;
    const user = req.user;
    
    if (!method) {
      return res.status(400).json({ 
        success: false, 
        message: "Enhancement method is required" 
      });
    }
    
    let isVerified = false;
    
    // Verify based on the selected method
    if (method === 'email' || method === 'telegram') {
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: "Verification code is required" 
        });
      }
      
      isVerified = await redundantAuthService.authenticateWithEmailCode(user.username, code);
    } else if (method === '2fa') {
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: "TOTP code is required" 
        });
      }
      
      isVerified = await redundantAuthService.authenticateWith2FA(user.username, code);
    } else if (method === 'web3' || method === 'wallet') {
      if (!signature || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Signature and message are required" 
        });
      }
      
      // For Web3 auth, we need the wallet address which we'll get from the user record
      if (!user.walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "User has no wallet address" 
        });
      }
      
      const verifiedUser = await redundantAuthService.authenticateWithWeb3(
        user.walletAddress, 
        signature, 
        message
      );
      
      isVerified = !!verifiedUser;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid enhancement method" 
      });
    }
    
    if (!isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: "Verification failed" 
      });
    }
    
    // If verification succeeded, enhance the user's authentication level
    const currentLevel = user.authLevel || 1;
    const newLevel = Math.min(currentLevel + 1, 3) as 1 | 2 | 3;
    
    // Update the user's authentication level
    await storage.updateUser(user.id, { authLevel: newLevel });
    
    // Update session
    req.user.authLevel = newLevel;
    
    return res.status(200).json({ 
      success: true, 
      message: "Authentication level enhanced", 
      previousLevel: currentLevel,
      newLevel
    });
  } catch (error) {
    logger.error('[smart-auth-api] Enhancement error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during enhancement", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/smart-auth/protected-test
 * @desc Test endpoint requiring basic protection
 * @access Protected
 */
router.get('/protected-test', requireRedundantAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "You can access this protected resource",
    user: {
      id: req.user.id,
      username: req.user.username,
      authLevel: req.user.authLevel || 1
    }
  });
});

/**
 * @route GET /api/smart-auth/enhanced-test
 * @desc Test endpoint requiring enhanced protection
 * @access Enhanced Protection
 */
router.get('/enhanced-test', requireEnhancedRedundantAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "You can access this enhanced resource",
    user: {
      id: req.user.id,
      username: req.user.username,
      authLevel: req.user.authLevel || 1
    }
  });
});

export default router;