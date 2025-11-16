/**
 * Forum Integration Rewards Service
 * 
 * This service handles syncing rewards, points and reputation between
 * hyperdag.org and forum.hyperdag.org to ensure a unified rewards system
 * across the entire ecosystem.
 */

import { db } from '../db';
import { users, userActivities, rewards } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import axios from 'axios';

// Forum activity types that earn rewards
export enum ForumActivityType {
  POST_CREATION = 'forum_post_creation',
  REPLY = 'forum_reply',
  LIKES_RECEIVED = 'forum_likes_received', 
  POST_VIEWS = 'forum_post_views',
  ACCEPTED_ANSWER = 'forum_accepted_answer',
  DAILY_FORUM_VISIT = 'forum_daily_visit',
  WEEKLY_ENGAGEMENT = 'forum_weekly_engagement',
  COMMUNITY_AWARD = 'forum_community_award'
}

// Integration config
const config = {
  forumApiUrl: process.env.FORUM_API_URL || 'https://forum.hyperdag.org/api',
  forumApiKey: process.env.FORUM_API_KEY,
  syncInterval: 15 * 60 * 1000, // 15 minutes
};

// Points and reputation earnings for each activity type
const activityRewards = {
  [ForumActivityType.POST_CREATION]: {
    points: 50,
    reputation: 2,
    tokens: 0,
    description: 'Creating a new forum post'
  },
  [ForumActivityType.REPLY]: {
    points: 15,
    reputation: 1,
    tokens: 0,
    description: 'Replying to a forum post'
  },
  [ForumActivityType.LIKES_RECEIVED]: {
    points: 5,
    reputation: 0.2,
    tokens: 0,
    description: 'Receiving likes on forum content'
  },
  [ForumActivityType.POST_VIEWS]: {
    points: 0.5, // per view
    reputation: 0.01, // small amount per view
    tokens: 0,
    description: 'Views on your forum posts'
  },
  [ForumActivityType.ACCEPTED_ANSWER]: {
    points: 100,
    reputation: 5,
    tokens: 1,
    description: 'Having your answer accepted as solution'
  },
  [ForumActivityType.DAILY_FORUM_VISIT]: {
    points: 10,
    reputation: 0,
    tokens: 0,
    description: 'Visiting the forum daily'
  },
  [ForumActivityType.WEEKLY_ENGAGEMENT]: {
    points: 75,
    reputation: 3,
    tokens: 1,
    description: 'Consistently engaging in the forum for a week'
  },
  [ForumActivityType.COMMUNITY_AWARD]: {
    points: 150,
    reputation: 10,
    tokens: 3,
    description: 'Receiving a community award'
  }
};

// Forum engagement thresholds for weekly rewards
const weeklyEngagementThresholds = {
  posts: 3,
  replies: 5, 
  likes: 10,
  readTime: 30 // minutes
};

export class ForumRewardsIntegrationService {
  private lastSyncTimestamp: Date = new Date(0); // Start with epoch time
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Validate API configuration
    if (!config.forumApiKey) {
      console.warn('Forum API key not configured. Forum rewards integration will be limited.');
    }
  }

  /**
   * Start the automatic sync process
   */
  public startAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    console.log(`Starting forum rewards sync with interval of ${config.syncInterval/60000} minutes`);
    
    // Immediate first sync
    this.syncForumActivity().catch(err => {
      console.error('Error during initial forum activity sync:', err);
    });
    
    // Set up recurring sync
    this.syncIntervalId = setInterval(() => {
      this.syncForumActivity().catch(err => {
        console.error('Error during forum activity sync:', err);
      });
    }, config.syncInterval);
  }

  /**
   * Stop the automatic sync process
   */
  public stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Synchronize forum activity with the rewards system
   */
  public async syncForumActivity(): Promise<void> {
    try {
      if (!config.forumApiKey) {
        console.warn('Forum API key not configured. Skipping forum activity sync.');
        return;
      }

      console.log(`Syncing forum activity since ${this.lastSyncTimestamp.toISOString()}`);
      
      // Fetch recent activity from forum API
      const forumActivity = await this.fetchForumActivity(this.lastSyncTimestamp);
      
      if (!forumActivity || !forumActivity.length) {
        console.log('No new forum activity to sync');
        return;
      }
      
      console.log(`Processing ${forumActivity.length} forum activities`);
      
      // Process each activity and award rewards
      for (const activity of forumActivity) {
        await this.processForumActivity(activity);
      }
      
      // Update last sync timestamp
      this.lastSyncTimestamp = new Date();
      console.log(`Forum activity sync completed. Next sync after ${config.syncInterval/60000} minutes`);
      
    } catch (error) {
      console.error('Error syncing forum activity:', error);
      throw error;
    }
  }

  /**
   * Award rewards based on activity in the forum
   */
  public async awardForumRewards(
    userId: number,
    activityType: ForumActivityType,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Fetch user to ensure they exist
      const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!userRecord) {
        console.error(`Failed to award forum rewards: User ${userId} not found`);
        return false;
      }
      
      // Get reward amounts for this activity type
      const reward = activityRewards[activityType];
      if (!reward) {
        console.error(`Unknown forum activity type: ${activityType}`);
        return false;
      }
      
      // Calculate actual rewards based on metadata and multipliers
      const { points, reputation, tokens } = this.calculateRewards(activityType, reward, metadata);
      
      // Record the activity
      await db.insert(userActivities).values({
        userId,
        activityType,
        points,
        reputationPoints: reputation,
        tokens,
        metadata: metadata,
        createdAt: new Date()
      });
      
      // Update user points, reputation and tokens
      await db.update(users)
        .set({
          points: sql`${users.points} + ${points}`,
          reputationScore: sql`${users.reputationScore} + ${reputation}`,
          tokens: sql`${users.tokens} + ${tokens}`,
        })
        .where(eq(users.id, userId));
      
      console.log(`Awarded forum rewards to user ${userId}: ${points} points, ${reputation} reputation, ${tokens} tokens for ${activityType}`);
      
      return true;
    } catch (error) {
      console.error('Error awarding forum rewards:', error);
      return false;
    }
  }

  /**
   * Calculate actual rewards based on activity type, base rewards and metadata
   */
  private calculateRewards(
    activityType: ForumActivityType, 
    baseReward: { points: number, reputation: number, tokens: number },
    metadata: Record<string, any>
  ): { points: number, reputation: number, tokens: number } {
    let pointMultiplier = 1.0;
    let reputationMultiplier = 1.0;
    let tokenMultiplier = 1.0;
    
    // Apply different multipliers based on activity type and metadata
    switch (activityType) {
      case ForumActivityType.POST_CREATION:
        // Longer, higher quality posts get more rewards
        if (metadata.wordCount && metadata.wordCount > 500) {
          pointMultiplier = 1.5;
          reputationMultiplier = 1.3;
        }
        break;
        
      case ForumActivityType.LIKES_RECEIVED:
        // Calculate based on number of likes
        const likeCount = metadata.likeCount || 1;
        return {
          points: Math.min(baseReward.points * likeCount, 100),  // Cap at 100 points
          reputation: Math.min(baseReward.reputation * likeCount, 5), // Cap at 5 reputation
          tokens: 0 // No tokens for likes
        };
        
      case ForumActivityType.POST_VIEWS:
        // Calculate based on number of views
        const viewCount = metadata.viewCount || 1;
        return {
          points: Math.min(baseReward.points * viewCount, 200),  // Cap at 200 points
          reputation: Math.min(baseReward.reputation * viewCount, 3), // Cap at 3 reputation
          tokens: 0 // No tokens for views
        };
        
      case ForumActivityType.WEEKLY_ENGAGEMENT:
        // Apply multiplier based on engagement level above threshold
        if (metadata.engagementScore && metadata.engagementScore > 150) {
          pointMultiplier = 1.5;
          tokenMultiplier = 2; // Bonus token for high engagement
        }
        break;
    }
    
    return {
      points: Math.round(baseReward.points * pointMultiplier),
      reputation: parseFloat((baseReward.reputation * reputationMultiplier).toFixed(2)),
      tokens: Math.round(baseReward.tokens * tokenMultiplier)
    };
  }

  /**
   * Fetch forum activity from the forum API
   */
  private async fetchForumActivity(since: Date): Promise<any[]> {
    try {
      const response = await axios.get(`${config.forumApiUrl}/activities`, {
        headers: {
          'Authorization': `Bearer ${config.forumApiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          since: since.toISOString(),
          limit: 1000
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Forum API returned status ${response.status}`);
      }
      
      return response.data.activities || [];
    } catch (error) {
      // If API is not available, we'll simulate for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using simulated forum activity data for development');
        return this.getSimulatedForumActivity();
      }
      
      console.error('Error fetching forum activity:', error);
      return [];
    }
  }

  /**
   * Process a single forum activity and award rewards
   */
  private async processForumActivity(activity: any): Promise<void> {
    try {
      // Map forum user to HyperDAG user
      const userId = await this.mapForumUserToHyperDagUser(activity.userId);
      if (!userId) {
        // User not found in our system
        return;
      }
      
      // Determine activity type and award rewards
      const activityType = this.mapForumActivityType(activity.type);
      if (!activityType) {
        // Not a rewarded activity type
        return;
      }
      
      // Check if this activity has already been processed (idempotency)
      const [existingActivity] = await db.select()
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            eq(userActivities.activityType, activityType),
            eq(userActivities.externalId, activity.id)
          )
        );
      
      if (existingActivity) {
        // Already processed this activity
        return;
      }
      
      // Award rewards for this activity
      await this.awardForumRewards(userId, activityType, {
        ...activity.metadata,
        forumActivityId: activity.id,
        forumActivityTimestamp: activity.timestamp
      });
      
    } catch (error) {
      console.error(`Error processing forum activity ${activity?.id}:`, error);
    }
  }

  /**
   * Map forum activity type to our enum
   */
  private mapForumActivityType(forumType: string): ForumActivityType | null {
    const typeMap: Record<string, ForumActivityType> = {
      'post_created': ForumActivityType.POST_CREATION,
      'reply_created': ForumActivityType.REPLY,
      'likes_received': ForumActivityType.LIKES_RECEIVED,
      'views_milestone': ForumActivityType.POST_VIEWS,
      'answer_accepted': ForumActivityType.ACCEPTED_ANSWER,
      'daily_visit': ForumActivityType.DAILY_FORUM_VISIT,
      'weekly_engagement': ForumActivityType.WEEKLY_ENGAGEMENT,
      'community_award': ForumActivityType.COMMUNITY_AWARD
    };
    
    return typeMap[forumType] || null;
  }

  /**
   * Map forum user ID to HyperDAG user ID
   */
  private async mapForumUserToHyperDagUser(forumUserId: string): Promise<number | null> {
    try {
      // First check if we have a user with this forum ID
      const [user] = await db.select()
        .from(users)
        .where(sql`${users.metadata}->>'forumUserId' = ${forumUserId}`);
      
      if (user) {
        return user.id;
      }
      
      // If not found by forum ID, try to match by username/email from forum API
      const forumUser = await this.fetchForumUserDetails(forumUserId);
      if (!forumUser) {
        return null;
      }
      
      // Try to match by email
      if (forumUser.email) {
        const [userByEmail] = await db.select()
          .from(users)
          .where(eq(users.email, forumUser.email));
        
        if (userByEmail) {
          // Found match by email, update metadata to include forum user ID for future reference
          await db.update(users)
            .set({
              metadata: sql`jsonb_set(
                COALESCE(${users.metadata}, '{}'::jsonb),
                '{forumUserId}',
                ${JSON.stringify(forumUserId)}::jsonb
              )`
            })
            .where(eq(users.id, userByEmail.id));
          
          return userByEmail.id;
        }
      }
      
      // Try to match by username
      if (forumUser.username) {
        const [userByUsername] = await db.select()
          .from(users)
          .where(eq(users.username, forumUser.username));
        
        if (userByUsername) {
          // Found match by username, update metadata to include forum user ID
          await db.update(users)
            .set({
              metadata: sql`jsonb_set(
                COALESCE(${users.metadata}, '{}'::jsonb),
                '{forumUserId}',
                ${JSON.stringify(forumUserId)}::jsonb
              )`
            })
            .where(eq(users.id, userByUsername.id));
          
          return userByUsername.id;
        }
      }
      
      // No match found
      return null;
    } catch (error) {
      console.error(`Error mapping forum user ${forumUserId}:`, error);
      return null;
    }
  }

  /**
   * Fetch forum user details from forum API
   */
  private async fetchForumUserDetails(forumUserId: string): Promise<any> {
    try {
      const response = await axios.get(`${config.forumApiUrl}/users/${forumUserId}`, {
        headers: {
          'Authorization': `Bearer ${config.forumApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Forum API returned status ${response.status}`);
      }
      
      return response.data.user;
    } catch (error) {
      console.error(`Error fetching forum user details for ${forumUserId}:`, error);
      return null;
    }
  }

  /**
   * Generate simulated forum activity data for development/testing
   */
  private getSimulatedForumActivity(): any[] {
    const mockActivities = [
      {
        id: `post_${Date.now()}_1`,
        userId: 'forum_user_1',
        username: 'test_user',
        type: 'post_created',
        timestamp: new Date().toISOString(),
        metadata: {
          postId: 'post_12345',
          title: 'Getting Started with HyperDAG',
          wordCount: 650,
          tags: ['beginner', 'tutorial']
        }
      },
      {
        id: `reply_${Date.now()}_1`,
        userId: 'forum_user_2',
        username: 'test_user2',
        type: 'reply_created',
        timestamp: new Date().toISOString(),
        metadata: {
          postId: 'post_12345',
          replyId: 'reply_6789',
          wordCount: 120
        }
      },
      {
        id: `likes_${Date.now()}_1`,
        userId: 'forum_user_1',
        username: 'test_user',
        type: 'likes_received',
        timestamp: new Date().toISOString(),
        metadata: {
          postId: 'post_12345',
          likeCount: 5
        }
      }
    ];
    
    return mockActivities;
  }
}

// Export singleton instance
export const forumRewardsService = new ForumRewardsIntegrationService();