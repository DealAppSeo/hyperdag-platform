import { Request, Response, NextFunction } from 'express';
import { fourFactorAuthService } from '../services/4fa-service';
import { logger } from '../utils/logger';

export interface AuthGuardOptions {
  requiredLevel: number;
  feature: string;
  redirectUrl?: string;
}

// Middleware to enforce authentication levels for specific features
export const requireAuthLevel = (options: AuthGuardOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          redirectTo: '/auth'
        });
      }

      const canAccess = await fourFactorAuthService.enforceAuthLevel(
        req.user.id, 
        options.requiredLevel
      );

      if (!canAccess) {
        const currentLevel = await fourFactorAuthService.getAuthLevel(req.user.id);
        
        return res.status(403).json({
          success: false,
          error: `Insufficient authentication level for ${options.feature}`,
          required: options.requiredLevel,
          current: currentLevel,
          redirectTo: options.redirectUrl || '/auth/4fa',
          message: getAuthUpgradeMessage(currentLevel, options.requiredLevel)
        });
      }

      next();
    } catch (error) {
      logger.error('Auth level check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication verification failed'
      });
    }
  };
};

// Specific guards for common use cases
export const requireWalletAuth = requireAuthLevel({
  requiredLevel: 2,
  feature: 'wallet connection',
  redirectUrl: '/auth/4fa'
});

export const requireTokenAuth = requireAuthLevel({
  requiredLevel: 4,
  feature: 'token operations',
  redirectUrl: '/auth/4fa'
});

export const requireSoulboundVerification = requireAuthLevel({
  requiredLevel: 4,
  feature: 'soulbound-verified features (living human with soul)',
  redirectUrl: '/auth/4fa'
});

function getAuthUpgradeMessage(current: number, required: number): string {
  if (current < 2 && required >= 2) {
    return 'Please enable 2FA to connect your wallet';
  }
  if (current < 4 && required >= 4) {
    return 'Please complete Proof of Life + biometric verification to confirm you are a living human with soul';
  }
  return `Authentication level ${required} required`;
}