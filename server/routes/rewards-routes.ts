import { Router } from 'express';
import { rewardsService } from '../services/rewards-service';
import { z } from 'zod';
import { insertUserActivitySchema } from '@shared/schema';

// Validation schema for awarding activity points
const awardActivityPointsSchema = z.object({
  userId: z.number(),
  activityType: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Create rewards router
const rewardsRouter = Router();

/**
 * Award points for an activity
 * POST /api/rewards/activity
 */
rewardsRouter.post('/activity', async (req, res) => {
  try {
    const validation = awardActivityPointsSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.format()
      });
    }
    
    const { userId, activityType, metadata = {} } = validation.data;
    
    // Calculate and award points for the activity
    const points = await rewardsService.calculateReward({
      userId,
      activityType,
      metadata,
      timestamp: new Date()
    });
    
    return res.json({
      success: true,
      message: `Successfully awarded ${points} points for ${activityType}`,
      data: {
        userId,
        activityType,
        points
      }
    });
  } catch (error) {
    console.error('[rewards-routes] Error awarding points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to award points'
    });
  }
});

/**
 * Get user activity history
 * GET /api/rewards/activities/:userId
 */
rewardsRouter.get('/activities/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId'
      });
    }
    
    // Get activity history for the user
    const activities = await rewardsService.getUserActivities(userId);
    
    return res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('[rewards-routes] Error getting activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get activity history'
    });
  }
});

/**
 * Get user streaks
 * GET /api/rewards/streaks/:userId
 */
rewardsRouter.get('/streaks/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId'
      });
    }
    
    // Get streak information for the user
    const streaks = await rewardsService.getUserStreaks(userId);
    
    return res.json({
      success: true,
      data: streaks
    });
  } catch (error) {
    console.error('[rewards-routes] Error getting streaks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get streak information'
    });
  }
});

/**
 * Get user reward summary
 * GET /api/rewards/summary/:userId
 */
rewardsRouter.get('/summary/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId'
      });
    }
    
    // Get reward summary for the user
    const summary = await rewardsService.getUserRewardSummary(userId);
    
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('[rewards-routes] Error getting reward summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get reward summary'
    });
  }
});

export default rewardsRouter;