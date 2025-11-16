import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth-middleware';
import { limiters } from '../../middleware/rate-limit';
import { storage } from '../../storage';
import { db } from '../../db';
import QRCode from 'qrcode';
import { referrals, users } from '@shared/schema';
import { eq, sql, and, count } from 'drizzle-orm';
import crypto from 'crypto';

const { standardLimiter } = limiters;
const router = Router();

/**
 * Get detailed referral statistics for the current user
 * Includes full breakdown of referral numbers, validation rates, and rewards
 */
router.get('/stats', requireAuth, standardLimiter, async (req: Request, res: Response) => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Get all referrals for the current user
    const userReferrals = await storage.getReferralsByUserId(req.user.id);
    
    // Get validated counts (users who completed profile & connected wallet)
    const validatedLevel1Count = userReferrals.filter(r => 
      r.level === 1 && r.status === 'validated'
    ).length;
    
    const validatedLevel2Count = userReferrals.filter(r => 
      r.level === 2 && r.status === 'validated'
    ).length;
    
    const validatedLevel3Count = userReferrals.filter(r => 
      r.level === 3 && r.status === 'validated'
    ).length;
    
    // Get pending counts (users who registered but haven't completed validation)
    const pendingLevel1Count = userReferrals.filter(r => 
      r.level === 1 && r.status === 'pending'
    ).length;
    
    const pendingLevel2Count = userReferrals.filter(r => 
      r.level === 2 && r.status === 'pending'
    ).length;
    
    const pendingLevel3Count = userReferrals.filter(r => 
      r.level === 3 && r.status === 'pending'
    ).length;
    
    // Get total referral counts by level
    const level1Count = userReferrals.filter(r => r.level === 1).length;
    const level2Count = userReferrals.filter(r => r.level === 2).length;
    const level3Count = userReferrals.filter(r => r.level === 3).length;
    
    // Calculate total rewards
    const totalRewards = userReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const rewardsFromValidated = userReferrals
      .filter(r => r.status === 'validated')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    
    // Calculate validation rate (percentage of referrals that completed validation)
    const totalReferrals = level1Count + level2Count + level3Count;
    const totalValidated = validatedLevel1Count + validatedLevel2Count + validatedLevel3Count;
    const validationRate = totalReferrals > 0 ? (totalValidated / totalReferrals) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        total: {
          referrals: totalReferrals,
          validated: totalValidated,
          pending: totalReferrals - totalValidated,
          validationRate: Math.round(validationRate * 100) / 100, // Round to 2 decimal places
          rewards: totalRewards,
          rewardsFromValidated: rewardsFromValidated
        },
        level1: {
          total: level1Count,
          validated: validatedLevel1Count,
          pending: pendingLevel1Count
        },
        level2: {
          total: level2Count,
          validated: validatedLevel2Count,
          pending: pendingLevel2Count
        },
        level3: {
          total: level3Count,
          validated: validatedLevel3Count,
          pending: pendingLevel3Count
        }
      },
      message: 'Referral statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving referral statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve referral statistics' 
    });
  }
});

/**
 * Get compact referral counts for dashboard widgets
 * Returns only the essential numbers for a small widget display
 */
router.get('/counts', requireAuth, standardLimiter, async (req: Request, res: Response) => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Get aggregated stats
    const stats = await storage.getReferralStats(req.user.id);
    
    // Get total validated referrals count
    const validatedReferrals = await db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, req.user.id),
        eq(referrals.status, 'validated')
      ));
    
    const validatedCount = validatedReferrals.length > 0 ? validatedReferrals[0].count : 0;
    
    // Calculate pending count
    const totalCount = stats.level1 + stats.level2 + stats.level3;
    const pendingCount = totalCount - validatedCount;
    
    res.json({
      success: true,
      data: {
        total: totalCount,
        validated: validatedCount,
        pending: pendingCount,
        rewards: stats.rewards
      },
      message: 'Referral counts retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving referral counts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve referral counts' 
    });
  }
});

/**
 * Generate QR code for the user's referral link
 */
router.get('/qr', requireAuth, standardLimiter, async (req: Request, res: Response) => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // For the QR code to work reliably, we should use a URL that will be valid after deployment
    // Use a predictable URL that will work once the app is deployed
    
    // Check if we have a deployment URL set in environment variables
    let baseUrl = process.env.APP_URL || '';
    
    if (!baseUrl) {
      // Check if this is running on a deployed Replit app
      const isDeployed = process.env.REPL_DEPLOYMENT_ID ? true : false;
      
      if (isDeployed) {
        // Use the deployment domain - will be available after deployment
        const replSlug = process.env.REPL_SLUG || 'hyperdag';
        baseUrl = `https://${replSlug}.replit.app`;
      } else {
        // For development/pre-deployment, use the current Replit URL based on environment
        // When running locally, this will use the Replit WebView URL for mobile testing
        const replId = process.env.REPL_ID || 'unknown';
        const replOwner = process.env.REPL_OWNER || 'unknown';
        baseUrl = `https://${replId}.${replOwner}.repl.co`;
        console.log('Using current Replit URL for QR codes to enable mobile testing');
      }
    }
    
    console.log(`Using base URL: ${baseUrl} for QR code generation`);
    
    // Check if referral code exists, if not, generate one
    if (!req.user.referralCode) {
      console.log('User missing referral code, generating one now');
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Update the user record
      const [updatedUser] = await db.update(users)
        .set({ referralCode })
        .where(eq(users.id, req.user.id))
        .returning();
        
      if (updatedUser) {
        req.user.referralCode = updatedUser.referralCode;
      } else {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update user with referral code' 
        });
      }
    }
    
    const qrData = `${baseUrl}/auth?ref=${req.user.referralCode}`;
    console.log(`Generating QR code for referral code: ${req.user.referralCode}`);
    
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    console.log('QR code generated successfully');
    
    res.json({
      success: true,
      data: {
        qrCodeUrl,
        referralCode: req.user.referralCode,
        referralLink: qrData
      },
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate QR code' 
    });
  }
});

export default router;