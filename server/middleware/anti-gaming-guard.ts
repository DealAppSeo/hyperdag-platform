import { Request, Response, NextFunction } from 'express';
import { antiGamingService } from '../services/anti-gaming-service';
import { productionLogger as logger } from '../utils/production-logger';

export interface AntiGamingOptions {
  action: string;
  blockOnRisk?: ('medium' | 'high' | 'critical')[];
  requireManualReview?: boolean;
}

export const antiGamingGuard = (options: AntiGamingOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check anti-gaming restrictions
      const restrictionCheck = await antiGamingService.enforceAntiGamingRestrictions(
        req.user.id,
        options.action
      );

      if (!restrictionCheck.allowed) {
        logger.warn(`Anti-gaming restriction triggered for user ${req.user.id}: ${restrictionCheck.reason}`);
        
        return res.status(403).json({
          success: false,
          error: 'Action blocked for security reasons',
          details: restrictionCheck.reason,
          securityNotice: 'If you believe this is an error, please contact support for manual review.'
        });
      }

      // Perform full Sybil detection for high-risk actions
      if (options.requireManualReview) {
        const sybilResult = await antiGamingService.detectSybilNetwork(req.user.id);
        
        if (sybilResult.requiresManualReview) {
          logger.warn(`Manual review required for user ${req.user.id}: ${sybilResult.flags.join(', ')}`);
          
          return res.status(403).json({
            success: false,
            error: 'Manual security review required',
            details: 'Your account has been flagged for additional security verification',
            flags: sybilResult.flags,
            contactSupport: true
          });
        }

        // Block based on configured risk levels
        if (options.blockOnRisk?.includes(sybilResult.risk)) {
          return res.status(403).json({
            success: false,
            error: `Action blocked due to ${sybilResult.risk} security risk`,
            details: sybilResult.flags.join(', '),
            riskLevel: sybilResult.risk
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Anti-gaming guard error:', error);
      
      // Fail secure - block action if security check fails
      res.status(500).json({
        success: false,
        error: 'Security verification failed',
        details: 'Please try again later or contact support'
      });
    }
  };
};

// Pre-configured guards for common actions
export const protectTokenTransfer = antiGamingGuard({
  action: 'token_transfer',
  blockOnRisk: ['high', 'critical'],
  requireManualReview: true
});

export const protectReferralRewards = antiGamingGuard({
  action: 'referral_rewards',
  blockOnRisk: ['medium', 'high', 'critical'],
  requireManualReview: true
});

export const protectVoting = antiGamingGuard({
  action: 'voting',
  blockOnRisk: ['high', 'critical'],
  requireManualReview: false
});

export const protectGrantApplications = antiGamingGuard({
  action: 'grant_applications',
  blockOnRisk: ['critical'],
  requireManualReview: true
});