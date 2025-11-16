/**
 * Dynamic Rewards Calculation Service
 * 
 * This service handles the calculation of rewards for users based on:
 * - Engagement level
 * - Activity type
 * - Temporal factors (early adoption, streak bonuses)
 * - Network effects (referrals, community impact)
 * - Reputation score
 * 
 * The system implements dynamic multipliers to incentivize specific
 * behaviors and create a virtuous growth cycle.
 */

import { db } from '../db';
import { users, userActivities, rewards, referrals, userActivityStreaks } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * Main interface for reward calculation parameters
 */
interface RewardCalculationParams {
  userId: number;
  activityType: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Reward multiplier factors
 */
interface RewardMultipliers {
  earlyAdopter: number;
  activityStreak: number;
  networkEffect: number;
  reputation: number;
  temporal: number; // time-based factors
  engagement: number;
  custom: number; // for special campaigns
}

/**
 * Activity reward configuration
 */
interface ActivityReward {
  basePoints: number;
  maxDailyRewards: number;
  cooldownPeriod: number; // in minutes
  description: string;
  eligibleForStreak: boolean;
}

class RewardsService {
  // Base rewards for different activity types
  private activityRewards: Record<string, ActivityReward> = {
    'profile_completion': {
      basePoints: 50,
      maxDailyRewards: 1,
      cooldownPeriod: 1440, // 24 hours
      description: 'Completing your profile',
      eligibleForStreak: false
    },
    'successful_referral': {
      basePoints: 500,
      maxDailyRewards: 10, 
      cooldownPeriod: 0, // no cooldown for referrals
      description: 'Referring a new user who signs up',
      eligibleForStreak: false
    },
    'daily_login': {
      basePoints: 20,
      maxDailyRewards: 1,
      cooldownPeriod: 1440,
      description: 'Logging in daily',
      eligibleForStreak: true
    },
    'content_creation': {
      basePoints: 100,
      maxDailyRewards: 5,
      cooldownPeriod: 60,
      description: 'Creating new content',
      eligibleForStreak: true
    },
    'engagement_reaction': {
      basePoints: 5,
      maxDailyRewards: 20,
      cooldownPeriod: 1,
      description: 'Reacting to content',
      eligibleForStreak: false
    },
    'comment': {
      basePoints: 15,
      maxDailyRewards: 15,
      cooldownPeriod: 2,
      description: 'Commenting on content',
      eligibleForStreak: true
    },
    'share_content': {
      basePoints: 30,
      maxDailyRewards: 10,
      cooldownPeriod: 30,
      description: 'Sharing content externally',
      eligibleForStreak: true
    },
    'create_project': {
      basePoints: 200,
      maxDailyRewards: 3,
      cooldownPeriod: 120,
      description: 'Creating a new project',
      eligibleForStreak: false
    },
    'grant_application': {
      basePoints: 150,
      maxDailyRewards: 5,
      cooldownPeriod: 240,
      description: 'Applying for a grant',
      eligibleForStreak: false
    },
    'verification': {
      basePoints: 250,
      maxDailyRewards: 1,
      cooldownPeriod: 10080, // 1 week
      description: 'Verifying your identity or credentials',
      eligibleForStreak: false
    },
    'connect_wallet': {
      basePoints: 100,
      maxDailyRewards: 1,
      cooldownPeriod: 10080, // 1 week
      description: 'Connecting a wallet',
      eligibleForStreak: false
    }
  };

  // Early adoption multiplier constants
  private readonly EARLY_ADOPTER_MAX_MULTIPLIER = 5.0;
  private readonly EARLY_ADOPTER_THRESHOLD = 10000; // first 10,000 users
  private readonly EARLY_ADOPTER_MIN_MULTIPLIER = 1.0;

  /**
   * Calculate rewards for a user activity
   * 
   * @param params RewardCalculationParams
   * @returns The calculated reward points
   */
  async calculateReward(params: RewardCalculationParams): Promise<number> {
    const { userId, activityType, metadata = {}, timestamp = new Date() } = params;
    
    // Check if this activity type is defined
    if (!this.activityRewards[activityType]) {
      console.warn(`[rewards-service] Unknown activity type: ${activityType}`);
      return 0;
    }
    
    // Get activity configuration
    const activityConfig = this.activityRewards[activityType];
    const basePoints = activityConfig.basePoints;
    
    // Check for cooldown period
    if (await this.isInCooldown(userId, activityType, timestamp, activityConfig.cooldownPeriod)) {
      console.log(`[rewards-service] User ${userId} is in cooldown for ${activityType}`);
      return 0;
    }
    
    // Check for max daily rewards
    if (await this.hasReachedDailyMax(userId, activityType, timestamp, activityConfig.maxDailyRewards)) {
      console.log(`[rewards-service] User ${userId} has reached daily max for ${activityType}`);
      return 0;
    }
    
    // Calculate all multipliers
    const multipliers = await this.calculateMultipliers(userId, activityType, metadata, timestamp);
    
    // Apply multipliers to base points
    let totalPoints = basePoints;
    let totalMultiplier = 1.0;
    
    // Calculate total multiplier (multiplicative)
    for (const [key, value] of Object.entries(multipliers)) {
      totalMultiplier *= value;
    }
    
    // Apply multiplier but ensure minimum of 1x (never reduce base points)
    totalMultiplier = Math.max(1.0, totalMultiplier);
    totalPoints = Math.round(totalPoints * totalMultiplier);
    
    // Log the reward calculation
    console.log(`[rewards-service] User ${userId} earned ${totalPoints} points for ${activityType} (base: ${basePoints}, multiplier: ${totalMultiplier.toFixed(2)}x)`);
    
    // Record the reward in the database
    await this.recordReward(userId, activityType, totalPoints, multipliers, metadata, timestamp);
    
    return totalPoints;
  }
  
  /**
   * Calculate all applicable multipliers for a reward
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param metadata Additional metadata
   * @param timestamp Activity timestamp
   * @returns Object containing all multipliers
   */
  private async calculateMultipliers(
    userId: number, 
    activityType: string, 
    metadata: Record<string, any>,
    timestamp: Date
  ): Promise<RewardMultipliers> {
    // Get user data
    const user = await this.getUserData(userId);
    if (!user) {
      return this.getDefaultMultipliers();
    }
    
    // Calculate each multiplier
    const earlyAdopter = this.calculateEarlyAdopterMultiplier(user.id);
    const activityStreak = await this.calculateActivityStreakMultiplier(userId, activityType, timestamp);
    const networkEffect = await this.calculateNetworkEffectMultiplier(userId);
    const reputation = this.calculateReputationMultiplier(user.reputationScore || 0);
    const temporal = this.calculateTemporalMultiplier(timestamp);
    const engagement = await this.calculateEngagementMultiplier(userId, timestamp);
    const custom = this.calculateCustomMultiplier(activityType, metadata);
    
    return {
      earlyAdopter,
      activityStreak,
      networkEffect,
      reputation,
      temporal,
      engagement,
      custom
    };
  }
  
  /**
   * Calculate early adopter multiplier based on user ID
   * Early users get higher multipliers to reward early adoption
   * 
   * @param userId User ID
   * @returns Early adopter multiplier
   */
  private calculateEarlyAdopterMultiplier(userId: number): number {
    // Higher multiplier for earlier users
    if (userId <= this.EARLY_ADOPTER_THRESHOLD) {
      // Linear decrease from max to min as user ID approaches threshold
      const multiplier = this.EARLY_ADOPTER_MAX_MULTIPLIER - 
        ((this.EARLY_ADOPTER_MAX_MULTIPLIER - this.EARLY_ADOPTER_MIN_MULTIPLIER) * 
         (userId / this.EARLY_ADOPTER_THRESHOLD));
      
      return Math.max(this.EARLY_ADOPTER_MIN_MULTIPLIER, multiplier);
    }
    
    return this.EARLY_ADOPTER_MIN_MULTIPLIER;
  }
  
  /**
   * Calculate streak multiplier based on consistent activity
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param timestamp Activity timestamp
   * @returns Streak multiplier
   */
  private async calculateActivityStreakMultiplier(
    userId: number,
    activityType: string,
    timestamp: Date
  ): Promise<number> {
    // Only calculate for activities eligible for streaks
    if (!this.activityRewards[activityType]?.eligibleForStreak) {
      return 1.0;
    }
    
    try {
      // Get the current streak from the database
      const streaks = await db.select({
        currentStreak: userActivityStreaks.currentStreak,
        longestStreak: userActivityStreaks.longestStreak,
        lastActivityDate: userActivityStreaks.lastActivityDate
      }).from(userActivityStreaks)
        .where(and(
          eq(userActivityStreaks.userId, userId),
          eq(userActivityStreaks.activityType, activityType)
        ))
        .limit(1);
      
      if (streaks.length === 0) {
        return 1.0;
      }
      
      const currentStreak = streaks[0].currentStreak || 0;
      
      // Increase multiplier based on streak length
      // Cap at 2.0x for a 30-day streak
      const maxStreakBonus = 1.0; // up to +100%
      const streakForMaxBonus = 30; // 30-day streak for max bonus
      
      const streakBonus = Math.min(maxStreakBonus, (currentStreak / streakForMaxBonus) * maxStreakBonus);
      return 1.0 + streakBonus;
    } catch (error) {
      console.error('[rewards-service] Error calculating streak multiplier:', error);
      return 1.0;
    }
  }
  
  /**
   * Calculate network effect multiplier based on user's referrals and network
   * 
   * @param userId User ID
   * @returns Network effect multiplier
   */
  private async calculateNetworkEffectMultiplier(userId: number): Promise<number> {
    try {
      // Count direct referrals
      const referralResult = await db.select({ count: sql`count(*)` }).from(referrals)
        .where(eq(referrals.referrerId, userId));
      const directReferrals = Number(referralResult[0]?.count || 0);
      
      // Network effect increases with more referrals
      // Cap at 2.0x for 20 referrals
      const maxNetworkBonus = 1.0; // up to +100%
      const referralsForMaxBonus = 20;
      
      const networkBonus = Math.min(maxNetworkBonus, (directReferrals / referralsForMaxBonus) * maxNetworkBonus);
      return 1.0 + networkBonus;
    } catch (error) {
      console.error('[rewards-service] Error calculating network multiplier:', error);
      return 1.0;
    }
  }
  
  /**
   * Calculate reputation multiplier based on user's reputation score
   * 
   * @param reputationScore User's reputation score
   * @returns Reputation multiplier
   */
  private calculateReputationMultiplier(reputationScore: number): number {
    // Reputation score ranges from 0-100
    // Provide up to +50% bonus for high reputation
    const maxReputationBonus = 0.5;
    const reputationBonus = (reputationScore / 100) * maxReputationBonus;
    
    return 1.0 + reputationBonus;
  }
  
  /**
   * Calculate temporal multiplier based on time-based factors
   * 
   * @param timestamp Activity timestamp
   * @returns Temporal multiplier
   */
  private calculateTemporalMultiplier(timestamp: Date): number {
    // Check for special events, promotions, or time-based bonuses
    // TODO: Implement event calendar and special promotion periods
    
    // Example: Weekend bonus (+10% on weekends)
    const day = timestamp.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const weekendBonus = isWeekend ? 0.1 : 0;
    
    // Example: Nightly bonus (+5% during night hours - 10PM to 6AM)
    const hour = timestamp.getHours();
    const isNightTime = hour >= 22 || hour < 6;
    const nightTimeBonus = isNightTime ? 0.05 : 0;
    
    return 1.0 + weekendBonus + nightTimeBonus;
  }
  
  /**
   * Calculate engagement multiplier based on user's recent activity level
   * 
   * @param userId User ID
   * @param timestamp Activity timestamp
   * @returns Engagement multiplier
   */
  private async calculateEngagementMultiplier(
    userId: number,
    timestamp: Date
  ): Promise<number> {
    try {
      // Get activity count for the past 7 days
      const sevenDaysAgo = new Date(timestamp);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activitiesResult = await db.select({ count: sql`count(*)` }).from(userActivities)
        .where(and(
          eq(userActivities.userId, userId),
          gte(userActivities.timestamp, sevenDaysAgo),
          lte(userActivities.timestamp, timestamp)
        ));
      const recentActivities = Number(activitiesResult[0]?.count || 0);
      
      // Engagement multiplier increases with more activity
      // Cap at +30% for 20 activities per week
      const maxEngagementBonus = 0.3;
      const activitiesForMaxBonus = 20;
      
      const engagementBonus = Math.min(maxEngagementBonus, (recentActivities / activitiesForMaxBonus) * maxEngagementBonus);
      return 1.0 + engagementBonus;
    } catch (error) {
      console.error('[rewards-service] Error calculating engagement multiplier:', error);
      return 1.0;
    }
  }
  
  /**
   * Calculate custom multiplier based on specific campaigns or rules
   * 
   * @param activityType Activity type
   * @param metadata Additional metadata
   * @returns Custom multiplier
   */
  private calculateCustomMultiplier(
    activityType: string,
    metadata: Record<string, any>
  ): number {
    // Check for special conditions or campaigns
    
    // Example: First-time bonus for certain activities
    if (metadata.isFirstTime === true) {
      return 1.5; // +50% for first-time activities
    }
    
    // Example: Content quality bonus
    if (activityType === 'content_creation' && metadata.contentQuality) {
      const qualityScore = metadata.contentQuality;
      // Up to +100% for highest quality content
      return 1.0 + (qualityScore / 10);
    }
    
    // Example: Team completion bonus
    if (activityType === 'create_project' && metadata.teamSize && metadata.teamSize > 1) {
      // +10% per team member up to +50%
      const teamBonus = Math.min(0.5, (metadata.teamSize - 1) * 0.1);
      return 1.0 + teamBonus;
    }
    
    return 1.0;
  }
  
  /**
   * Check if user is in cooldown period for an activity
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param timestamp Current timestamp
   * @param cooldownMinutes Cooldown period in minutes
   * @returns True if in cooldown, false otherwise
   */
  private async isInCooldown(
    userId: number,
    activityType: string,
    timestamp: Date,
    cooldownMinutes: number
  ): Promise<boolean> {
    // No cooldown if set to 0
    if (cooldownMinutes <= 0) {
      return false;
    }
    
    try {
      // Calculate cooldown start time
      const cooldownStart = new Date(timestamp);
      cooldownStart.setMinutes(cooldownStart.getMinutes() - cooldownMinutes);
      
      // Check for activities within cooldown period
      const cooldownResult = await db.select({ count: sql`count(*)` }).from(userActivities)
        .where(and(
          eq(userActivities.userId, userId),
          eq(userActivities.activityType, activityType),
          gte(userActivities.timestamp, cooldownStart)
        ));
      const recentActivities = Number(cooldownResult[0]?.count || 0);
      
      return recentActivities > 0;
    } catch (error) {
      console.error('[rewards-service] Error checking cooldown:', error);
      return false; // Default to no cooldown on error
    }
  }
  
  /**
   * Check if user has reached daily maximum for an activity
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param timestamp Current timestamp
   * @param maxDaily Maximum daily count
   * @returns True if daily max reached, false otherwise
   */
  private async hasReachedDailyMax(
    userId: number,
    activityType: string,
    timestamp: Date,
    maxDaily: number
  ): Promise<boolean> {
    try {
      // Calculate day start
      const dayStart = new Date(timestamp);
      dayStart.setHours(0, 0, 0, 0);
      
      // Calculate day end
      const dayEnd = new Date(timestamp);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Count today's activities
      const dailyResult = await db.select({ count: sql`count(*)` }).from(userActivities)
        .where(and(
          eq(userActivities.userId, userId),
          eq(userActivities.activityType, activityType),
          gte(userActivities.timestamp, dayStart),
          lte(userActivities.timestamp, dayEnd)
        ));
      const todayCount = Number(dailyResult[0]?.count || 0);
      
      return todayCount >= maxDaily;
    } catch (error) {
      console.error('[rewards-service] Error checking daily max:', error);
      return false; // Default to not reached on error
    }
  }
  
  /**
   * Get user data from database
   * 
   * @param userId User ID
   * @returns User data or null if not found
   */
  private async getUserData(userId: number): Promise<any> {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
    } catch (error) {
      console.error('[rewards-service] Error getting user data:', error);
      return null;
    }
  }
  
  /**
   * Record a reward in the database
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param points Points awarded
   * @param multipliers Applied multipliers
   * @param metadata Additional metadata
   * @param timestamp Activity timestamp
   */
  private async recordReward(
    userId: number,
    activityType: string,
    points: number,
    multipliers: RewardMultipliers,
    metadata: Record<string, any>,
    timestamp: Date
  ): Promise<void> {
    try {
      // Record the activity
      await db.insert(userActivities).values({
        userId,
        activityType,
        timestamp,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
      // Record the reward
      await db.insert(rewards).values({
        userId,
        activityType,
        points,
        multipliers: multipliers ? JSON.stringify(multipliers) : null,
        timestamp
      });
      
      // Update user's total points
      await db.update(users)
        .set({ 
          points: sql`points + ${points}`,
          tokens: sql`tokens + ${points}`
        })
        .where(eq(users.id, userId));
      
      // Update streak if applicable
      if (this.activityRewards[activityType]?.eligibleForStreak) {
        await this.updateActivityStreak(userId, activityType, timestamp);
      }
    } catch (error) {
      console.error('[rewards-service] Error recording reward:', error);
    }
  }
  
  /**
   * Update activity streak for streak-eligible activities
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @param timestamp Activity timestamp
   */
  private async updateActivityStreak(
    userId: number,
    activityType: string,
    timestamp: Date
  ): Promise<void> {
    try {
      // Get current streak data
      const streaks = await db.select({
        id: userActivityStreaks.id,
        currentStreak: userActivityStreaks.currentStreak,
        longestStreak: userActivityStreaks.longestStreak,
        lastActivityDate: userActivityStreaks.lastActivityDate
      }).from(userActivityStreaks)
        .where(and(
          eq(userActivityStreaks.userId, userId),
          eq(userActivityStreaks.activityType, activityType)
        ))
        .limit(1);
      
      const today = new Date(timestamp);
      today.setHours(0, 0, 0, 0);
      
      if (streaks.length === 0) {
        // First time, create new streak record
        const metadataJson = JSON.stringify({
          streakStart: today.toISOString()
        });
        
        await db.insert(userActivityStreaks).values({
          userId,
          activityType,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: timestamp,
          metadata: metadataJson
        });
        return;
      }
      
      // Get streak info from the streak record
      const streak = streaks[0];
      const lastDate = streak.lastActivityDate;
      const currentStreak = streak.currentStreak || 0;
      const longestStreak = streak.longestStreak || 0;
      
      if (!lastDate) {
        // Data exists but no last date, initialize
        await db.update(userActivityStreaks)
          .set({
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: timestamp
          })
          .where(eq(userActivityStreaks.id, streak.id));
        return;
      }
      
      // Calculate days between last activity and now
      const lastDay = new Date(lastDate);
      lastDay.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - lastDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let newStreak = currentStreak;
      let newLongestStreak = longestStreak;
      
      if (diffDays === 0) {
        // Same day, no change to streak
      } else if (diffDays === 1) {
        // Next day, increment streak
        newStreak++;
        newLongestStreak = Math.max(newLongestStreak, newStreak);
      } else {
        // Streak broken
        newStreak = 1;
      }
      
      // Update streak data
      const metadataJson = JSON.stringify({
        lastUpdate: new Date().toISOString()
      });
      
      await db.update(userActivityStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: timestamp,
          metadata: metadataJson
        })
        .where(eq(userActivityStreaks.id, streak.id));
    } catch (error) {
      console.error('[rewards-service] Error updating streak:', error);
    }
  }
  
  /**
   * Get default multipliers with all values set to 1.0
   * 
   * @returns Default multipliers object
   */
  private getDefaultMultipliers(): RewardMultipliers {
    return {
      earlyAdopter: 1.0,
      activityStreak: 1.0,
      networkEffect: 1.0,
      reputation: 1.0,
      temporal: 1.0,
      engagement: 1.0,
      custom: 1.0
    };
  }
  
  /**
   * Get activity history for a user
   * 
   * @param userId User ID
   * @returns List of user activities
   */
  async getUserActivities(userId: number): Promise<any[]> {
    try {
      const activities = await db.select({
        id: userActivities.id,
        activityType: userActivities.activityType,
        timestamp: userActivities.timestamp,
        metadata: userActivities.metadata
      }).from(userActivities)
        .where(eq(userActivities.userId, userId))
        .orderBy(sql`${userActivities.timestamp} DESC`)
        .limit(100);
      
      return activities;
    } catch (error) {
      console.error('[rewards-service] Error getting user activities:', error);
      return [];
    }
  }
  
  /**
   * Get streak information for a user
   * 
   * @param userId User ID
   * @returns List of user streaks
   */
  async getUserStreaks(userId: number): Promise<any[]> {
    try {
      const streaks = await db.select({
        id: userActivityStreaks.id,
        activityType: userActivityStreaks.activityType,
        currentStreak: userActivityStreaks.currentStreak,
        longestStreak: userActivityStreaks.longestStreak,
        lastActivityDate: userActivityStreaks.lastActivityDate
      }).from(userActivityStreaks)
        .where(eq(userActivityStreaks.userId, userId));
      
      return streaks;
    } catch (error) {
      console.error('[rewards-service] Error getting user streaks:', error);
      return [];
    }
  }
  
  /**
   * Get reward summary for a user
   * 
   * @param userId User ID
   * @returns Reward summary
   */
  async getUserRewardSummary(userId: number): Promise<any> {
    try {
      // Get user data
      const user = await this.getUserData(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get total rewards
      const rewardsResult = await db.select({
        totalPoints: sql`SUM(${rewards.points})`
      }).from(rewards)
        .where(eq(rewards.userId, userId));
      
      const totalRewards = Number(rewardsResult[0]?.totalPoints) || 0;
      
      // Get activity counts
      const activities = await db.select({
        activityType: userActivities.activityType,
        count: sql`COUNT(*)`
      }).from(userActivities)
        .where(eq(userActivities.userId, userId))
        .groupBy(userActivities.activityType);
      
      // Get streak data
      const streaks = await this.getUserStreaks(userId);
      
      // Get recent rewards
      const recentRewards = await db.select({
        id: rewards.id,
        activityType: rewards.activityType,
        points: rewards.points,
        timestamp: rewards.timestamp
      }).from(rewards)
        .where(eq(rewards.userId, userId))
        .orderBy(sql`${rewards.timestamp} DESC`)
        .limit(10);
      
      return {
        userId,
        totalPoints: user.points || 0,
        totalTokens: user.tokens || 0,
        totalRewards,
        activityCounts: activities,
        streaks,
        recentRewards
      };
    } catch (error) {
      console.error('[rewards-service] Error getting reward summary:', error);
      throw error;
    }
  }
}

export const rewardsService = new RewardsService();