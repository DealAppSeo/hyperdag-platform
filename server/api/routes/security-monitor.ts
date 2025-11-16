import { Router, Request, Response } from 'express';
import { antiGamingService } from '../../services/anti-gaming-service';
import { requireAuth } from '../../middleware/auth';
import { requireSoulboundVerification } from '../../middleware/4fa-guard';
import { productionLogger as logger } from '../../utils/production-logger';

const router = Router();

/**
 * Get user's security risk assessment
 * GET /api/security/assessment
 */
router.get('/assessment', requireAuth, async (req: Request, res: Response) => {
  try {
    const sybilResult = await antiGamingService.detectSybilNetwork(req.user!.id);
    
    res.json({
      success: true,
      data: {
        riskLevel: sybilResult.risk,
        confidence: sybilResult.confidence,
        securityFlags: sybilResult.flags,
        blockedActions: sybilResult.blockedActions,
        requiresReview: sybilResult.requiresManualReview,
        recommendations: getSecurityRecommendations(sybilResult)
      }
    });
  } catch (error) {
    logger.error('Security assessment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Security assessment failed'
    });
  }
});

/**
 * Check if a specific action is allowed
 * POST /api/security/check-action
 */
router.post('/check-action', requireAuth, async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action parameter required'
      });
    }

    const restrictionCheck = await antiGamingService.enforceAntiGamingRestrictions(
      req.user!.id,
      action
    );

    res.json({
      success: true,
      data: {
        allowed: restrictionCheck.allowed,
        reason: restrictionCheck.reason,
        action: action
      }
    });
  } catch (error) {
    logger.error('Action check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Action check failed'
    });
  }
});

/**
 * Admin endpoint: Get security overview (requires SBT verification)
 * GET /api/security/admin/overview
 */
router.get('/admin/overview', requireSoulboundVerification, async (req: Request, res: Response) => {
  try {
    // Only allow admin users (like 'sean') to access this
    if (req.user!.username !== 'sean') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // This would implement admin security dashboard data
    res.json({
      success: true,
      data: {
        message: 'Security monitoring dashboard - implementation pending',
        activeSecurityFeatures: [
          'Sybil attack detection',
          'IP clustering analysis',
          'Device fingerprinting',
          'Behavioral pattern analysis',
          'Referral network monitoring',
          'Anti-automation detection'
        ]
      }
    });
  } catch (error) {
    logger.error('Admin security overview failed:', error);
    res.status(500).json({
      success: false,
      error: 'Security overview failed'
    });
  }
});

function getSecurityRecommendations(sybilResult: any): string[] {
  const recommendations: string[] = [];
  
  if (sybilResult.risk === 'low') {
    recommendations.push('Your account security looks good! Complete SBT verification for full access.');
  } else if (sybilResult.risk === 'medium') {
    recommendations.push('Complete additional verification steps to improve account security.');
    recommendations.push('Avoid rapid automated-like actions to maintain good security standing.');
  } else if (sybilResult.risk === 'high') {
    recommendations.push('Your account has been flagged for suspicious activity patterns.');
    recommendations.push('Complete SBT verification to unlock restricted features.');
    recommendations.push('Contact support if you believe this is an error.');
  } else if (sybilResult.risk === 'critical') {
    recommendations.push('Your account requires immediate manual review.');
    recommendations.push('All token operations are temporarily suspended.');
    recommendations.push('Please contact support for account verification.');
  }
  
  return recommendations;
}

export default router;