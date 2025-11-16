import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get user notification preferences
 */
router.get('/user/notification-preferences', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Default preferences if none set
    const defaultPreferences = {
      grantMatches: { email: true, sms: false, push: true },
      teamMatches: { email: true, sms: false, push: true },
      exclusiveOpportunities: { email: true, sms: true, push: true },
      urgentDeadlines: { email: true, sms: true, push: true },
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('[Notification Preferences] Get error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve notification preferences' 
    });
  }
});

/**
 * Update user notification preferences
 */
router.put('/user/notification-preferences', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { grantMatches, teamMatches, exclusiveOpportunities, urgentDeadlines } = req.body;

    // Validate preference structure
    const requiredKeys = ['email', 'sms', 'push'];
    const categories = { grantMatches, teamMatches, exclusiveOpportunities, urgentDeadlines };
    
    for (const [categoryName, category] of Object.entries(categories)) {
      if (!category || typeof category !== 'object') {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid ${categoryName} preferences format` 
        });
      }
      
      for (const key of requiredKeys) {
        if (typeof category[key] !== 'boolean') {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid ${key} preference in ${categoryName}` 
          });
        }
      }
    }

    // Update user preferences
    await storage.updateUser(req.user.id, {
      notificationPreferences: {
        grantMatches,
        teamMatches,
        exclusiveOpportunities,
        urgentDeadlines
      }
    });

    // Calculate engagement score based on preferences
    const engagementScore = calculateEngagementScore(categories);
    await storage.updateUser(req.user.id, { engagementScore });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { engagementScore }
    });

  } catch (error) {
    console.error('[Notification Preferences] Update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification preferences' 
    });
  }
});

/**
 * Calculate user engagement score based on notification preferences
 * Higher scores = more exclusive opportunities
 */
function calculateEngagementScore(preferences: any): number {
  let score = 0;
  
  Object.values(preferences).forEach((category: any) => {
    if (category.email) score += 1;
    if (category.sms) score += 2; // SMS shows higher commitment
    if (category.push) score += 1;
  });
  
  // Bonus for enabling VIP opportunities
  if (preferences.exclusiveOpportunities) {
    const vipMethods = Object.values(preferences.exclusiveOpportunities).filter(Boolean).length;
    if (vipMethods === 3) score += 5; // All methods enabled = bonus
  }
  
  return Math.min(score, 100); // Cap at 100
}

export default router;