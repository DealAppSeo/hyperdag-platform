import { Router, Request, Response } from 'express';
import { fourFactorAuthService } from '../../services/4fa-service';
import { requireAuth } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

/**
 * Get current authentication level
 * GET /api/auth/level
 */
router.get('/level', requireAuth, async (req: Request, res: Response) => {
  try {
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    
    const capabilities = {
      canExplore: fourFactorAuthService.canAccessFeature(authLevel, 'explore'),
      canConnectWallet: fourFactorAuthService.canAccessFeature(authLevel, 'wallet_connect'),
      canWithdrawTokens: fourFactorAuthService.canAccessFeature(authLevel, 'token_withdraw'),
      canMintDBT: fourFactorAuthService.canAccessFeature(authLevel, 'dbt_mint'),
      canConvertToSBT: fourFactorAuthService.canAccessFeature(authLevel, 'sbt_conversion')
    };

    res.json({
      success: true,
      data: {
        authLevel,
        capabilities,
        nextRequirement: authLevel < 4 ? getNextRequirement(authLevel) : null
      }
    });
  } catch (error) {
    logger.error('Failed to get auth level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication level'
    });
  }
});

/**
 * Setup 2FA (required before wallet connection)
 * POST /api/auth/2fa/setup
 */
router.post('/2fa/setup', requireAuth, async (req: Request, res: Response) => {
  try {
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    if (authLevel >= 2) {
      return res.status(400).json({
        success: false,
        error: '2FA already enabled'
      });
    }

    const { secret, qrCode } = await fourFactorAuthService.setup2FA(req.user!.id);
    
    res.json({
      success: true,
      data: {
        secret,
        qrCode,
        instructions: 'Scan this QR code with your authenticator app, then verify with a 6-digit code'
      }
    });
  } catch (error) {
    logger.error('2FA setup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA'
    });
  }
});

/**
 * Verify and enable 2FA
 * POST /api/auth/2fa/verify
 */
router.post('/2fa/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      token: z.string().length(6).regex(/^\d{6}$/)
    });

    const { token } = schema.parse(req.body);
    const verified = await fourFactorAuthService.verify2FA(req.user!.id, token);

    if (verified) {
      res.json({
        success: true,
        data: {
          message: '2FA enabled successfully',
          authLevel: 2,
          newCapabilities: {
            canConnectWallet: true,
            nextStep: 'You can now connect your wallet. Complete Proof of Life for token operations.'
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
  } catch (error) {
    logger.error('2FA verification failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    });
  }
});

/**
 * Request wallet connection challenge (requires 2FA)
 * POST /api/auth/wallet/challenge
 */
router.post('/wallet/challenge', requireAuth, async (req: Request, res: Response) => {
  try {
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    if (authLevel < 2) {
      return res.status(400).json({
        success: false,
        error: '2FA required before wallet connection'
      });
    }

    const schema = z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    });

    const { address } = schema.parse(req.body);
    
    // Generate challenge nonce for wallet signature verification
    const challenge = await fourFactorAuthService.generateWalletChallenge(req.user!.id, address);
    
    res.json({
      success: true,
      data: {
        challenge: challenge.nonce,
        message: challenge.message,  // Return exact message that will be verified
        expiresAt: challenge.expiresAt
      }
    });
  } catch (error) {
    logger.error('Wallet challenge generation failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Challenge generation failed'
    });
  }
});

/**
 * Verify wallet signature and connect (requires 2FA)
 * POST /api/auth/wallet/connect
 */
router.post('/wallet/connect', requireAuth, async (req: Request, res: Response) => {
  try {
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    if (authLevel < 2) {
      return res.status(400).json({
        success: false,
        error: '2FA required before wallet connection'
      });
    }

    const schema = z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
      signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature format')
    });

    const { address, signature } = schema.parse(req.body);
    
    // Verify signature and connect wallet (upgrades to auth level 3)
    await fourFactorAuthService.verifyAndConnectWallet(req.user!.id, address, signature);
    
    res.json({
      success: true,
      data: {
        message: 'Wallet connected and verified successfully',
        authLevel: 3,
        walletAddress: address,
        newCapabilities: {
          canMintDBT: true,
          nextStep: 'Complete Proof of Life verification to unlock token operations and SBT conversion'
        }
      }
    });
  } catch (error) {
    logger.error('Wallet connection failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Wallet verification failed'
    });
  }
});

/**
 * Generate Proof of Life challenge
 * POST /api/auth/pol/challenge
 */
router.post('/pol/challenge', requireAuth, async (req: Request, res: Response) => {
  try {
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    if (authLevel < 2) {
      return res.status(400).json({
        success: false,
        error: '2FA required before Proof of Life verification'
      });
    }

    const challenge = await fourFactorAuthService.generatePoLChallenge(req.user!.id);
    
    res.json({
      success: true,
      data: {
        challengeId: challenge.challengeId,
        type: challenge.type,
        data: challenge.data,
        expiresAt: challenge.expiresAt,
        instructions: getPoLInstructions(challenge.type)
      }
    });
  } catch (error) {
    logger.error('PoL challenge generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Proof of Life challenge'
    });
  }
});

/**
 * Submit Proof of Life response
 * POST /api/auth/pol/verify
 */
router.post('/pol/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      challengeId: z.string(),
      response: z.any()
    });

    const { challengeId, response } = schema.parse(req.body);
    const verified = await fourFactorAuthService.verifyPoLResponse(
      req.user!.id, 
      challengeId, 
      response
    );

    if (verified) {
      res.json({
        success: true,
        data: {
          message: 'Soulbound verification successful - living human with body and soul confirmed',
          authLevel: 4,
          dbtToSbtConversion: 'Your DBT credentials have been converted to SBT (soulbound to verified living human)',
          newCapabilities: {
            canWithdrawTokens: true,
            canConvertToSBT: true,
            soulboundVerified: true,
            livingHumanConfirmed: true
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Proof of Life verification failed'
      });
    }
  } catch (error) {
    logger.error('PoL verification failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    });
  }
});

/**
 * Check token withdrawal eligibility
 * GET /api/auth/token-eligibility
 */
router.get('/token-eligibility', requireAuth, async (req: Request, res: Response) => {
  try {
    const canWithdraw = await fourFactorAuthService.canWithdrawTokens(req.user!.id);
    const authLevel = await fourFactorAuthService.getAuthLevel(req.user!.id);
    
    res.json({
      success: true,
      data: {
        canWithdrawTokens: canWithdraw,
        authLevel,
        requirements: {
          current: getAuthLevelDescription(authLevel),
          needed: canWithdraw ? null : 'Complete 4FA including Proof of Life verification'
        }
      }
    });
  } catch (error) {
    logger.error('Token eligibility check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check token eligibility'
    });
  }
});

// Helper functions
function getNextRequirement(authLevel: number): string {
  switch (authLevel) {
    case 1: return 'Enable 2FA to connect wallets';
    case 2: return 'Complete biometric verification for enhanced security';
    case 3: return 'Complete Proof of Life to unlock token operations';
    default: return '';
  }
}

function getPoLInstructions(type: string): string {
  switch (type) {
    case 'captcha': return 'Select all images that contain real humans';
    case 'behavioral': return 'Follow the mouse movement instructions to prove human behavior';
    case 'voice': return 'Record yourself saying the provided phrase clearly';
    case 'video': return 'Complete the video challenge to verify you are human';
    default: return 'Complete the challenge to verify you are human';
  }
}

function getAuthLevelDescription(level: number): string {
  switch (level) {
    case 1: return 'Basic access - can explore the network';
    case 2: return '2FA enabled - can connect wallets';
    case 3: return '3FA enabled - enhanced security features';
    case 4: return '4FA + Proof of Life - full token operations available';
    default: return 'Unknown authentication level';
  }
}

export default router;