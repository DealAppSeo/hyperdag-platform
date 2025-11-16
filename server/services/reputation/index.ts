/**
 * Reputation Service
 * 
 * This service provides core functions for working with the reputation system:
 * 1. Recording reputation activities
 * 2. Calculating reputation scores and badges
 * 3. Providing utility functions for reputation-based decisions
 */

import { db } from '../../db';
import { eq, and, desc, sql, sum } from 'drizzle-orm';
import { 
  users, 
  reputationActivities, 
  badges,
  verifiedCredentials,
  grantFlowActivities,
  REPUTATION_ACTIVITY_TYPES
} from '@shared/schema';
import { logger } from '../../utils/logger';

// Weights for different types of reputation activities
const ACTIVITY_TYPE_WEIGHTS = {
  // Project-related activities (higher weight, as these are more valuable)
  project_creation: 1.2,
  project_update: 0.5,
  project_milestone: 1.5,
  
  // RFP/RFI activities
  rfp_creation: 1.0,
  rfp_funded: 1.2,
  rfi_creation: 0.8,
  rfi_response: 0.5,
  
  // Proposal activities
  proposal_submission: 0.8,
  proposal_accepted: 2.0,
  proposal_submitted: 0.8,
  proposal_created: 0.7,
  
  // Team activities
  team_invitation_sent: 0.3,
  team_invitation_accepted: 0.5,
  team_member_joined: 0.4,
  team_invitation_rejected: 0.1,
  joined_project_team: 0.7,
  team_member_removed: 0.0,
  
  // Grant activities
  rfi_created: 0.7,
  rfi_published: 0.8,
  rfi_voted: 0.2,
  rfi_commented: 0.3,
  rfi_converted: 1.0,
  
  // Credential-related activities
  credential_verification: 1.5,
  
  // Community activities
  endorsement: 0.7,
  
  // Funding activities
  donation: 1.0,
  
  // Miscellaneous
  default: 1.0
};

// Constants for badge thresholds
const BADGE_THRESHOLDS = {
  // Creator badges
  creator_bronze: 30,  // 3 projects created
  creator_silver: 100, // 10 projects created
  creator_gold: 300,   // 30 projects created
  
  // Networker badges
  networker_bronze: 20,  // 10 connections
  networker_silver: 60,  // 30 connections
  networker_gold: 200,   // 100 connections
  
  // Backer badges
  backer_bronze: 50,    // 5 projects backed
  backer_silver: 150,   // 15 projects backed
  backer_gold: 500,     // 50 projects backed
  
  // Innovator badges
  innovator_bronze: 40,  // 2 accepted proposals
  innovator_silver: 120, // 6 accepted proposals
  innovator_gold: 350    // 20 accepted proposals
};

/**
 * Record a reputation activity
 * 
 * @param userId User ID to record activity for
 * @param type Activity type
 * @param points Base points for the activity
 * @param metadata Additional data about the activity
 * @returns Boolean indicating success
 */
export async function recordReputationActivity(
  userId: number, 
  type: string, 
  points: number,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    logger.info(`Recording reputation activity: ${type} for user ${userId}`);
    
    // Insert the reputation activity
    const [activity] = await db
      .insert(reputationActivities)
      .values({
        userId,
        type,
        points,
        description: getActivityDescription(type),
        metadata,
        timestamp: new Date()
      })
      .returning();
    
    if (!activity) {
      logger.error(`Failed to insert reputation activity`);
      return false;
    }
    
    // Update the user's reputation score
    await db
      .update(users)
      .set({ 
        reputationScore: sql`reputation_score + ${points}`,
        lastUpdated: new Date()
      })
      .where(eq(users.id, userId));
    
    // Check if user qualifies for any new badges
    await checkForBadges(userId);
    
    return true;
  } catch (error) {
    logger.error(`Error recording reputation activity: ${error.message}`);
    return false;
  }
}

/**
 * Get a description for an activity type
 */
function getActivityDescription(type: string): string {
  // Find activity in predefined types
  const activity = REPUTATION_ACTIVITY_TYPES.find(a => a.type === type);
  
  if (activity) {
    return activity.description;
  }
  
  // Return a fallback description based on the type
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate a user's reputation score with weighting
 * 
 * @param userId User ID to calculate score for
 * @param includeCredentials Whether to include verified credentials in the calculation
 * @returns Calculated score (or null if user not found)
 */
export async function calculateRepScore(
  userId: number,
  includeCredentials = true
): Promise<number | null> {
  try {
    logger.info(`Calculating reputation score for user ${userId}`);
    
    // Get the user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0]);
    
    if (!user) {
      logger.warn(`User ${userId} not found`);
      return null;
    }
    
    // Get all reputation activities for the user
    const activities = await db
      .select()
      .from(reputationActivities)
      .where(eq(reputationActivities.userId, userId));
    
    // Calculate weighted score from activities
    let weightedScore = activities.reduce((score, activity) => {
      // Get weight for this activity type (default to 1.0)
      const weight = ACTIVITY_TYPE_WEIGHTS[activity.type] || ACTIVITY_TYPE_WEIGHTS.default;
      
      // Add weighted points to total
      return score + (activity.points * weight);
    }, 0);
    
    // Include bonus for verified credentials if requested
    if (includeCredentials) {
      const credentials = await db
        .select()
        .from(verifiedCredentials)
        .where(eq(verifiedCredentials.userId, userId));
      
      // Each credential gives a small bonus (5 points)
      weightedScore += credentials.length * 5;
    }
    
    return Math.round(weightedScore);
  } catch (error) {
    logger.error(`Error calculating reputation score: ${error.message}`);
    return null;
  }
}

/**
 * Check if user qualifies for any new badges
 */
async function checkForBadges(userId: number): Promise<void> {
  try {
    // Get all reputation activities for the user
    const activities = await db
      .select()
      .from(reputationActivities)
      .where(eq(reputationActivities.userId, userId));
    
    // Get user's existing badges
    const existingBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.userId, userId));
    
    // Count activities by type
    const activityCounts: Record<string, number> = {};
    activities.forEach(activity => {
      const baseType = activity.type.split('_')[0]; // Get base type (e.g., "project" from "project_creation")
      activityCounts[baseType] = (activityCounts[baseType] || 0) + 1;
    });
    
    // Check for creator badges
    const projectCreationCount = activities
      .filter(a => a.type === 'project_creation')
      .length;
    
    // Check for each badge tier
    await awardBadgeIfQualified(userId, 'creator', 'bronze', projectCreationCount, BADGE_THRESHOLDS.creator_bronze, existingBadges);
    await awardBadgeIfQualified(userId, 'creator', 'silver', projectCreationCount, BADGE_THRESHOLDS.creator_silver, existingBadges);
    await awardBadgeIfQualified(userId, 'creator', 'gold', projectCreationCount, BADGE_THRESHOLDS.creator_gold, existingBadges);
    
    // Check for networker badges
    const networkingCount = activities
      .filter(a => ['team_invitation_accepted', 'joined_project_team'].includes(a.type))
      .length;
    
    await awardBadgeIfQualified(userId, 'networker', 'bronze', networkingCount, BADGE_THRESHOLDS.networker_bronze, existingBadges);
    await awardBadgeIfQualified(userId, 'networker', 'silver', networkingCount, BADGE_THRESHOLDS.networker_silver, existingBadges);
    await awardBadgeIfQualified(userId, 'networker', 'gold', networkingCount, BADGE_THRESHOLDS.networker_gold, existingBadges);
    
    // Check for backer badges
    const backerCount = activities
      .filter(a => ['donation', 'rfp_funded'].includes(a.type))
      .length;
    
    await awardBadgeIfQualified(userId, 'backer', 'bronze', backerCount, BADGE_THRESHOLDS.backer_bronze, existingBadges);
    await awardBadgeIfQualified(userId, 'backer', 'silver', backerCount, BADGE_THRESHOLDS.backer_silver, existingBadges);
    await awardBadgeIfQualified(userId, 'backer', 'gold', backerCount, BADGE_THRESHOLDS.backer_gold, existingBadges);
    
    // Check for innovator badges
    const innovatorCount = activities
      .filter(a => ['proposal_accepted'].includes(a.type))
      .length;
    
    await awardBadgeIfQualified(userId, 'innovator', 'bronze', innovatorCount, BADGE_THRESHOLDS.innovator_bronze, existingBadges);
    await awardBadgeIfQualified(userId, 'innovator', 'silver', innovatorCount, BADGE_THRESHOLDS.innovator_silver, existingBadges);
    await awardBadgeIfQualified(userId, 'innovator', 'gold', innovatorCount, BADGE_THRESHOLDS.innovator_gold, existingBadges);
    
  } catch (error) {
    logger.error(`Error checking for badges: ${error.message}`);
  }
}

/**
 * Award a badge if the user qualifies
 */
async function awardBadgeIfQualified(
  userId: number, 
  badgeType: string,
  tier: string,
  count: number, 
  threshold: number,
  existingBadges: any[]
): Promise<void> {
  try {
    // Check if user already has this badge
    const badgeExists = existingBadges.some(badge => 
      badge.type === `${badgeType}_${tier}`
    );
    
    // If user doesn't have badge and meets the threshold, award it
    if (!badgeExists && count >= threshold) {
      await db
        .insert(badges)
        .values({
          userId,
          type: `${badgeType}_${tier}`,
          earnedAt: new Date()
        });
      
      logger.info(`Awarded ${badgeType}_${tier} badge to user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error awarding badge: ${error.message}`);
  }
}

/**
 * Get user's badges with details
 */
export async function getUserBadges(userId: number): Promise<any[]> {
  try {
    // Get user's badges
    const userBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.userId, userId))
      .orderBy(desc(badges.earnedAt));
    
    // Add descriptive details to each badge
    return userBadges.map(badge => {
      // Parse the badge type into its components
      const [type, tier] = badge.type.split('_');
      
      // Define display information based on badge type
      const badgeInfo = {
        id: badge.id,
        type: badge.type,
        earnedAt: badge.earnedAt,
        displayName: '', 
        description: '',
        icon: '',
        color: '',
        level: 0
      };
      
      // Set badge level based on tier
      if (tier === 'bronze') badgeInfo.level = 1;
      if (tier === 'silver') badgeInfo.level = 2;
      if (tier === 'gold') badgeInfo.level = 3;
      
      // Set detailed information based on type
      switch (type) {
        case 'creator':
          badgeInfo.displayName = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Creator`;
          badgeInfo.description = `Awarded for creating ${badgeInfo.level === 1 ? '3' : badgeInfo.level === 2 ? '10' : '30'} projects`;
          badgeInfo.icon = 'hammer-and-wrench';
          badgeInfo.color = tier === 'gold' ? 'golden' : tier === 'silver' ? 'silver' : 'bronze';
          break;
          
        case 'networker':
          badgeInfo.displayName = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Networker`;
          badgeInfo.description = `Awarded for forming ${badgeInfo.level === 1 ? '10' : badgeInfo.level === 2 ? '30' : '100'} connections`;
          badgeInfo.icon = 'network';
          badgeInfo.color = tier === 'gold' ? 'golden' : tier === 'silver' ? 'silver' : 'bronze';
          break;
          
        case 'backer':
          badgeInfo.displayName = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Backer`;
          badgeInfo.description = `Awarded for backing ${badgeInfo.level === 1 ? '5' : badgeInfo.level === 2 ? '15' : '50'} projects`;
          badgeInfo.icon = 'heart';
          badgeInfo.color = tier === 'gold' ? 'golden' : tier === 'silver' ? 'silver' : 'bronze';
          break;
          
        case 'innovator':
          badgeInfo.displayName = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Innovator`;
          badgeInfo.description = `Awarded for having ${badgeInfo.level === 1 ? '2' : badgeInfo.level === 2 ? '6' : '20'} accepted proposals`;
          badgeInfo.icon = 'lightbulb';
          badgeInfo.color = tier === 'gold' ? 'golden' : tier === 'silver' ? 'silver' : 'bronze';
          break;
          
        default:
          badgeInfo.displayName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
          badgeInfo.description = `A special badge`;
          badgeInfo.icon = 'award';
          badgeInfo.color = tier === 'gold' ? 'golden' : tier === 'silver' ? 'silver' : 'bronze';
      }
      
      return badgeInfo;
    });
  } catch (error) {
    logger.error(`Error getting user badges: ${error.message}`);
    return [];
  }
}

/**
 * Get reputation leaderboard
 */
export async function getReputationLeaderboard(
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  try {
    // Get users sorted by reputation score
    const leaderboard = await db
      .select({
        id: users.id,
        username: users.username,
        reputationScore: users.reputationScore,
        badges: sql<number>`(SELECT COUNT(*) FROM badges WHERE badges.user_id = users.id)`
      })
      .from(users)
      .orderBy(desc(users.reputationScore))
      .limit(limit)
      .offset(offset);
    
    return leaderboard;
  } catch (error) {
    logger.error(`Error getting reputation leaderboard: ${error.message}`);
    return [];
  }
}

/**
 * Get reputation breakdown by category
 */
export async function getReputationBreakdown(userId: number): Promise<any> {
  try {
    // Get all reputation activities for the user
    const activities = await db
      .select()
      .from(reputationActivities)
      .where(eq(reputationActivities.userId, userId));
    
    // Group activities by type
    const breakdownByType = activities.reduce((result, activity) => {
      const category = activity.type.split('_')[0];
      
      if (!result[category]) {
        result[category] = 0;
      }
      
      result[category] += activity.points;
      return result;
    }, {});
    
    // Calculate total points
    const totalPoints = Object.values(breakdownByType).reduce((sum: number, points: number) => sum + points, 0);
    
    // Convert to array with percentages
    const breakdown = Object.entries(breakdownByType).map(([category, points]) => ({
      category,
      points,
      percentage: totalPoints > 0 ? (points as number) / totalPoints * 100 : 0
    }));
    
    // Sort by points (highest first)
    breakdown.sort((a, b) => b.points - a.points);
    
    return {
      total: totalPoints,
      breakdown
    };
  } catch (error) {
    logger.error(`Error getting reputation breakdown: ${error.message}`);
    return { total: 0, breakdown: [] };
  }
}

/**
 * Check if a user meets a reputation requirement
 */
export async function checkReputationRequirement(
  userId: number, 
  requiredScore: number
): Promise<{ meets: boolean, currentScore: number, gap: number }> {
  try {
    const userScore = await calculateRepScore(userId);
    
    if (userScore === null) {
      return { meets: false, currentScore: 0, gap: requiredScore };
    }
    
    return {
      meets: userScore >= requiredScore,
      currentScore: userScore,
      gap: Math.max(0, requiredScore - userScore)
    };
  } catch (error) {
    logger.error(`Error checking reputation requirement: ${error.message}`);
    return { meets: false, currentScore: 0, gap: requiredScore };
  }
}