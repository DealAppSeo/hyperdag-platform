/**
 * User Activity API Routes
 * 
 * Provides endpoints for tracking user activity and managing profile completion prompts
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserActivityTracker } from '../../services/user-activity-tracker';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Schema for activity tracking
const activitySchema = z.object({
  type: z.enum(['purpose_save', 'nonprofit_view', 'grantflow_search', 'profile_update', 'page_visit', 'search_query']),
  description: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional()
});

/**
 * Track user activity
 * POST /api/user-activity/track
 */
router.post('/track', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = activitySchema.parse(req.body);
    const userId = (req as any).user.id;

    await UserActivityTracker.trackActivity({
      userId,
      type: validatedData.type,
      description: validatedData.description,
      metadata: validatedData.metadata,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Activity tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid activity data'
    });
  }
});

/**
 * Get user session data
 * GET /api/user-activity/session
 */
router.get('/session', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const session = await UserActivityTracker.getUserSession(userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting user session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session data'
    });
  }
});

/**
 * Check if user should be prompted for profile completion
 * GET /api/user-activity/completion-prompt
 */
router.get('/completion-prompt', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const promptData = await UserActivityTracker.shouldPromptProfileCompletion(userId);

    res.json({
      success: true,
      data: promptData
    });
  } catch (error) {
    console.error('Error checking completion prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check prompt status'
    });
  }
});

/**
 * Get activity summary for profile completion
 * GET /api/user-activity/summary
 */
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const summary = await UserActivityTracker.getActivitySummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting activity summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity summary'
    });
  }
});

/**
 * Notify that activity has been preserved
 * POST /api/user-activity/notify-preserved
 */
router.post('/notify-preserved', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { activityCount } = req.body;

    await UserActivityTracker.notifyActivityPreserved(userId, activityCount || 0);

    res.json({
      success: true,
      message: 'Activity preservation notification sent'
    });
  } catch (error) {
    console.error('Error sending preservation notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

export default router;