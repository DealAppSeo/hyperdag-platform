/**
 * User Activity Tracker Service
 * 
 * Tracks user activity immediately upon signup, even before full registration.
 * Ensures all user interactions are preserved and can be restored later.
 */

import { db } from "../db";
import { users, reputationActivities, userSavedPurposes, notifications } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { redundantStorageService } from "./redundancy/storage/redundant-storage-service";

export interface ActivityEvent {
  userId: number;
  type: 'purpose_save' | 'nonprofit_view' | 'grantflow_search' | 'profile_update' | 'page_visit' | 'search_query';
  description: string;
  metadata?: any;
  timestamp: Date;
}

export interface UserSession {
  userId: number;
  sessionStart: Date;
  lastActivity: Date;
  activityCount: number;
  savedPurposes: number;
  profileCompleteness: number;
}

export class UserActivityTracker {
  
  /**
   * Track user activity immediately upon any interaction
   */
  static async trackActivity(event: ActivityEvent): Promise<void> {
    try {
      // Always save to database first
      await db.insert(reputationActivities).values({
        userId: event.userId,
        type: event.type,
        description: event.description,
        points: this.calculatePoints(event.type),
        metadata: event.metadata || {},
        createdAt: event.timestamp
      });

      // Update user's last activity timestamp
      await db.update(users)
        .set({ 
          lastEngagement: event.timestamp,
          engagementScore: await this.calculateEngagementScore(event.userId)
        })
        .where(eq(users.id, event.userId));

      // Also save to decentralized storage for persistence
      await this.saveToDecentralizedStorage(event);

    } catch (error) {
      console.error('Error tracking user activity:', error);
      // Fallback to local storage if database fails
      await this.saveToLocalStorage(event);
    }
  }

  /**
   * Calculate points for different activity types
   */
  private static calculatePoints(activityType: string): number {
    const pointValues = {
      'purpose_save': 5,
      'nonprofit_view': 2,
      'grantflow_search': 3,
      'profile_update': 10,
      'page_visit': 1,
      'search_query': 2
    };
    return pointValues[activityType] || 1;
  }

  /**
   * Calculate user's engagement score based on recent activity
   */
  private static async calculateEngagementScore(userId: number): Promise<number> {
    try {
      const recentActivities = await db.select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId))
        .orderBy(desc(reputationActivities.createdAt))
        .limit(50);

      if (recentActivities.length === 0) return 0;

      // Calculate engagement based on activity frequency and diversity
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      let score = 0;
      const activityTypes = new Set();

      for (const activity of recentActivities) {
        const daysSince = (now.getTime() - new Date(activity.createdAt).getTime()) / dayInMs;
        const recencyMultiplier = Math.max(0, 1 - (daysSince / 30)); // Decay over 30 days
        
        score += activity.points * recencyMultiplier;
        activityTypes.add(activity.type);
      }

      // Bonus for activity diversity
      const diversityBonus = Math.min(activityTypes.size * 10, 50);
      
      return Math.round(score + diversityBonus);
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  /**
   * Get user's current session data
   */
  static async getUserSession(userId: number): Promise<UserSession | null> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) return null;

      const userData = user[0];
      const savedPurposes = await db.select().from(userSavedPurposes)
        .where(eq(userSavedPurposes.userId, userId));

      const recentActivities = await db.select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId))
        .orderBy(desc(reputationActivities.createdAt))
        .limit(1);

      const profileCompleteness = this.calculateProfileCompleteness(userData);

      return {
        userId,
        sessionStart: userData.createdAt || new Date(),
        lastActivity: userData.lastEngagement || new Date(),
        activityCount: recentActivities.length,
        savedPurposes: savedPurposes.length,
        profileCompleteness
      };
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Calculate profile completeness percentage
   */
  private static calculateProfileCompleteness(user: any): number {
    const fields = [
      'email', 'twoFactorEnabled', 'walletAddress', 'bio', 
      'interests', 'skills', 'persona'
    ];
    
    let completed = 0;
    for (const field of fields) {
      if (user[field] && user[field] !== '' && user[field] !== null) {
        completed++;
      }
    }
    
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Check if user should be prompted to complete profile
   */
  static async shouldPromptProfileCompletion(userId: number): Promise<{
    shouldPrompt: boolean;
    reason: string;
    activityValue: number;
  }> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return { shouldPrompt: false, reason: 'No session found', activityValue: 0 };

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) return { shouldPrompt: false, reason: 'User not found', activityValue: 0 };

      const userData = user[0];
      const activityValue = session.savedPurposes * 5 + session.activityCount * 2;

      // Prompt if user has significant activity but incomplete profile
      if (session.profileCompleteness < 50 && activityValue >= 10) {
        return {
          shouldPrompt: true,
          reason: `You have ${session.savedPurposes} saved items and ${session.activityCount} activities. Complete your profile to get credit and unlock AI recommendations!`,
          activityValue
        };
      }

      // Prompt if user has 2FA/wallet missing but has activity
      if (!userData.twoFactorEnabled && !userData.walletAddress && activityValue >= 5) {
        return {
          shouldPrompt: true,
          reason: `Secure your account with 2FA or wallet connection to protect your ${session.savedPurposes} saved items!`,
          activityValue
        };
      }

      return { shouldPrompt: false, reason: 'Profile completion not needed yet', activityValue };
    } catch (error) {
      console.error('Error checking profile completion prompt:', error);
      return { shouldPrompt: false, reason: 'Error checking status', activityValue: 0 };
    }
  }

  /**
   * Save activity data to decentralized storage for persistence
   */
  private static async saveToDecentralizedStorage(event: ActivityEvent): Promise<void> {
    try {
      const activityData = {
        userId: event.userId,
        type: event.type,
        description: event.description,
        metadata: event.metadata,
        timestamp: event.timestamp.toISOString(),
        platform: 'hyperdag'
      };

      await redundantStorageService.store(
        `user_activity_${event.userId}_${Date.now()}`,
        JSON.stringify(activityData)
      );
    } catch (error) {
      console.error('Error saving to decentralized storage:', error);
      // Continue silently - this is backup storage
    }
  }

  /**
   * Fallback local storage for critical activity data
   */
  private static async saveToLocalStorage(event: ActivityEvent): Promise<void> {
    try {
      // Save to file system as backup
      const fs = require('fs').promises;
      const path = require('path');
      
      const backupDir = path.join(process.cwd(), 'temp', 'activity_backup');
      await fs.mkdir(backupDir, { recursive: true });
      
      const filename = `user_${event.userId}_${Date.now()}.json`;
      const filepath = path.join(backupDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(event, null, 2));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  /**
   * Create notification about activity preservation
   */
  static async notifyActivityPreserved(userId: number, activityCount: number): Promise<void> {
    try {
      await db.insert(notifications).values({
        userId,
        type: 'activity_preserved',
        title: 'Your Activity is Preserved',
        message: `We've saved ${activityCount} activities. Complete your profile to unlock rewards and AI recommendations!`,
        isRead: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating activity notification:', error);
    }
  }

  /**
   * Get user's activity summary for profile completion prompt
   */
  static async getActivitySummary(userId: number): Promise<{
    totalActivities: number;
    savedPurposes: number;
    pointsEarned: number;
    profileCompleteness: number;
    estimatedRewards: number;
  }> {
    try {
      const activities = await db.select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId));

      const savedPurposes = await db.select()
        .from(userSavedPurposes)
        .where(eq(userSavedPurposes.userId, userId));

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const profileCompleteness = user.length ? this.calculateProfileCompleteness(user[0]) : 0;

      const pointsEarned = activities.reduce((sum, activity) => sum + activity.points, 0);
      const estimatedRewards = Math.floor(pointsEarned * 1.5); // Bonus for profile completion

      return {
        totalActivities: activities.length,
        savedPurposes: savedPurposes.length,
        pointsEarned,
        profileCompleteness,
        estimatedRewards
      };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return {
        totalActivities: 0,
        savedPurposes: 0,
        pointsEarned: 0,
        profileCompleteness: 0,
        estimatedRewards: 0
      };
    }
  }
}