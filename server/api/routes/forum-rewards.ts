/**
 * Forum Rewards API Routes
 * 
 * These routes enable integration between HyperDAG's reward system
 * and the forum.hyperdag.org platform.
 */

import { Request, Response, Router, Express } from 'express';
import { forumRewardsService } from '../../services/forum-rewards-integration';
import { requireAuth } from '../../middleware/auth-middleware';
import { requireAdmin } from '../../middleware/admin-middleware';
import { z } from 'zod';

const forumRewardsRouter = Router();

// Schema for manual reward assignment
const manualRewardSchema = z.object({
  userId: z.number(),
  activityType: z.string(),
  metadata: z.record(z.any()).optional()
});

// Setup function that registers routes with the Express app
export function setupForumRewards(app: Express) {
  
  // Start the forum rewards sync service when the server starts
  forumRewardsService.startAutoSync();
  
  // Trigger manual sync (admin only)
  app.post('/api/forum-rewards/sync', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await forumRewardsService.syncForumActivity();
      res.status(200).json({ 
        success: true, 
        message: 'Forum activity sync completed successfully' 
      });
    } catch (error) {
      console.error('Error syncing forum activity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync forum activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually assign forum rewards (admin only)
  app.post('/api/forum-rewards/award', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = manualRewardSchema.parse(req.body);
      
      const success = await forumRewardsService.awardForumRewards(
        validatedData.userId,
        validatedData.activityType as any,
        validatedData.metadata
      );
      
      if (success) {
        res.status(200).json({ 
          success: true, 
          message: 'Forum rewards awarded successfully' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Failed to award forum rewards' 
        });
      }
    } catch (error) {
      console.error('Error awarding forum rewards:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Failed to award forum rewards',
        error: error instanceof Error ? error.message : 'Invalid request'
      });
    }
  });
  
  // Get forum activity stats for user
  app.get('/api/user/forum-activity', requireAuth, async (req: Request, res: Response) => {
    try {
      // For now, retrieve from user activities table
      // In the future, we can add more detailed forum activity stats
      
      res.status(200).json({ 
        success: true,
        data: {
          // Mock data until we integrate with the forum API
          postsCreated: 3,
          repliesPosted: 12,
          likesReceived: 27,
          weeklyEngagementStreak: 2,
          lastVisit: new Date().toISOString(),
          reputation: req.user?.reputationScore || 0,
          forumBadges: [
            { name: 'Newcomer', level: 1, description: 'Joined the forum' },
            { name: 'Responder', level: 2, description: 'Posted 10+ replies' }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching forum activity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch forum activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Webhook endpoint for forum events
  app.post('/api/webhooks/forum-activity', async (req: Request, res: Response) => {
    try {
      // Verify webhook signature (should implement this for security)
      // const isValidWebhook = verifyWebhookSignature(req);
      // if (!isValidWebhook) {
      //   return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      // }
      
      const event = req.body;
      
      if (!event || !event.type || !event.data) {
        return res.status(400).json({ success: false, message: 'Invalid event payload' });
      }
      
      // Process the webhook event
      switch (event.type) {
        case 'forum.post.created':
          // Handle new post created
          break;
        case 'forum.reply.created':
          // Handle new reply created
          break;
        case 'forum.reaction.added':
          // Handle reaction added
          break;
        case 'forum.user.joined':
          // Handle new user joined
          break;
        default:
          console.log(`Unhandled forum webhook event type: ${event.type}`);
      }
      
      // Return success to acknowledge receipt of webhook
      res.status(200).json({ success: true, message: 'Event received' });
    } catch (error) {
      console.error('Error processing forum webhook:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return forumRewardsRouter;
}