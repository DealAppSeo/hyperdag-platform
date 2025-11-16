/**
 * Four-Factor Authentication (4FA) API Routes
 * 
 * Routes for managing and verifying the four authentication factors:
 * 1. Knowledge factor (username/password)
 * 2. Email verification
 * 3. Time-based OTP (TOTP)
 * 4. Wallet signature verification
 */

import { Router, Request, Response } from 'express';
import { fourFAService } from '../../services/four-fa-service';
import { requireAuth } from '../../middleware/auth-middleware';
import { strictLimiter } from '../../utils/rate-limiter';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { walletBridgeService } from '../../services/wallet-bridge-service';

// Type checking for the 4FA routes is handled by global Express.User interface defined in auth-middleware.ts

const router = Router();

// Schema for 2FA setup verification
const verifyTOTPSchema = z.object({
  secret: z.string().min(16).max(64),
  token: z.string().min(6).max(6),
});

// Schema for wallet verification
const verifyWalletSchema = z.object({
  walletAddress: z.string().min(1),
  signature: z.string().min(1),
  network: z.enum(['polygon', 'solana', 'ethereum']).default('polygon'),
});

// Schema for email verification
const verifyEmailSchema = z.object({
  code: z.string().min(6).max(6),
});

/**
 * Get authentication factors status
 * 
 * @route GET /api/4fa/status
 * @access Private
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    // After requireAuth middleware, req.user will be defined
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const factors = await fourFAService.getAuthFactorsStatus(userId);
    const level = await fourFAService.getAuthLevel(userId);
    
    res.json({
      success: true,
      data: {
        factors,
        level,
      },
    });
  } catch (error) {
    logger.error('[4FA API] Error getting auth status', error);
    res.status(500).json({
      success: false,
      message: 'Error getting authentication status',
    });
  }
});

/**
 * Generate TOTP secret for Factor 3 (2FA) setup
 * 
 * @route POST /api/4fa/setup-totp
 * @access Private
 */
router.post('/setup-totp', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;
    
    if (!userId || !username) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    // Generate TOTP secret and QR code
    const { secret, qrCodeUrl } = await fourFAService.generateTOTPSecret(userId, username);
    
    res.json({
      success: true,
      data: {
        secret,
        qrCodeUrl,
      },
      message: 'Scan the QR code with your authenticator app, then verify a code to complete setup',
    });
  } catch (error) {
    logger.error('[4FA API] Error setting up TOTP', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up two-factor authentication',
    });
  }
});

/**
 * Verify and enable TOTP for Factor 3 (2FA)
 * 
 * @route POST /api/4fa/verify-totp
 * @access Private
 */
router.post('/verify-totp', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const result = verifyTOTPSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: result.error.errors,
      });
    }
    
    const { secret, token } = result.data;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const isValid = await fourFAService.verifyAndEnableTOTP(userId, secret, token);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }
    
    const newLevel = await fourFAService.getAuthLevel(userId);
    
    res.json({
      success: true,
      data: {
        authLevel: newLevel,
      },
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    logger.error('[4FA API] Error verifying TOTP', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying two-factor authentication',
    });
  }
});

/**
 * Disable TOTP for Factor 3 (2FA)
 * 
 * @route POST /api/4fa/disable-totp
 * @access Private
 */
router.post('/disable-totp', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    const success = await fourFAService.disableTOTP(userId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to disable two-factor authentication',
      });
    }
    
    const newLevel = await fourFAService.getAuthLevel(userId);
    
    res.json({
      success: true,
      data: {
        authLevel: newLevel,
      },
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error) {
    logger.error('[4FA API] Error disabling TOTP', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling two-factor authentication',
    });
  }
});

/**
 * Verify a TOTP code during login
 * 
 * @route POST /api/4fa/check-totp
 * @access Private
 */
router.post('/check-totp', [requireAuth], async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string' || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    const isValid = await fourFAService.verifyTOTP(userId, token);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }
    
    res.json({
      success: true,
      message: 'TOTP verification successful',
    });
  } catch (error) {
    logger.error('[4FA API] Error checking TOTP', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying code',
    });
  }
});

/**
 * Send email verification code for Factor 2
 * 
 * @route POST /api/4fa/send-email-code
 * @access Private
 */
router.post('/send-email-code', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    const email = req.user.email;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No email address associated with this account',
      });
    }
    
    const success = await fourFAService.sendEmailVerificationCode(userId, email);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
      });
    }
    
    res.json({
      success: true,
      message: 'Verification code sent to your email address',
    });
  } catch (error) {
    logger.error('[4FA API] Error sending email code', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification code',
    });
  }
});

/**
 * Verify email code for Factor 2
 * 
 * @route POST /api/4fa/verify-email
 * @access Private
 */
router.post('/verify-email', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: result.error.errors,
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const { code } = result.data;
    const userId = req.user.id;
    
    const isValid = await fourFAService.verifyEmailCode(userId, code);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }
    
    const newLevel = await fourFAService.getAuthLevel(userId);
    
    res.json({
      success: true,
      data: {
        authLevel: newLevel,
      },
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('[4FA API] Error verifying email', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
    });
  }
});

/**
 * Verify wallet signature for Factor 4
 * 
 * @route POST /api/4fa/verify-wallet
 * @access Private
 */
router.post('/verify-wallet', [requireAuth, strictLimiter], async (req: Request, res: Response) => {
  try {
    const result = verifyWalletSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: result.error.errors,
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const { walletAddress, signature, network } = result.data;
    const userId = req.user.id;
    
    const isValid = await fourFAService.verifyWalletSignature(userId, walletAddress, signature, network);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet signature',
      });
    }
    
    const newLevel = await fourFAService.getAuthLevel(userId);
    
    res.json({
      success: true,
      data: {
        authLevel: newLevel,
        walletAddress,
        network,
      },
      message: 'Wallet verified successfully',
    });
  } catch (error) {
    logger.error('[4FA API] Error verifying wallet', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying wallet',
    });
  }
});

/**
 * Check if a user has sufficient auth level for a feature
 * 
 * @route GET /api/4fa/check-access/:featureId
 * @access Private
 */
router.get('/check-access/:featureId', requireAuth, async (req: Request, res: Response) => {
  try {
    const featureId = req.params.featureId;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user.id;
    
    // Get the user's current auth level
    const userLevel = await fourFAService.getAuthLevel(userId);
    
    // Get the required level for the feature
    const requiredLevel = fourFAService.getRequiredAuthLevelForFeature(featureId);
    
    const hasAccess = userLevel >= requiredLevel;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        userLevel,
        requiredLevel,
        missingFactors: requiredLevel - userLevel,
      },
    });
  } catch (error) {
    logger.error('[4FA API] Error checking feature access', error);
    res.status(500).json({
      success: false,
      message: 'Error checking feature access',
    });
  }
});

export default router;