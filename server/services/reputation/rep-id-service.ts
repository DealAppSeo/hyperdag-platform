/**
 * RepID Service
 * 
 * This service manages the user reputation system (RepID) for HyperDAG.
 * It handles reputation points, credential verification, and AI-powered team matching.
 * Integrates with HyperCrowd for reputation-based grant matching and team formation.
 */

import { db } from '../../db';
import { eq, and, desc, sql, gt, lt, between } from 'drizzle-orm';
import { 
  users, 
  reputationActivities, 
  verifiedCredentials, 
  teamMatches,
  projects,
  localGrants,
  rfps,
  grantMatches,
  grantSources,
  proposals,
  donations,
  InsertReputationActivity,
  InsertVerifiedCredential,
  InsertTeamMatch
} from '@shared/schema';
import { log } from '../../vite';

// Constants for reputation activities
export const REPUTATION_ACTIVITIES = {
  // Project activities
  PROJECT_CREATED: { points: 10, type: 'project_creation', description: 'Created a new project' },
  PROJECT_UPDATED: { points: 2, type: 'project_update', description: 'Updated a project' },
  PROJECT_MILESTONE: { points: 15, type: 'project_milestone', description: 'Completed a project milestone' },
  
  // RFP/RFI activities
  RFP_CREATED: { points: 8, type: 'rfp_creation', description: 'Created a Request for Proposal' },
  RFP_FUNDED: { points: 12, type: 'rfp_funded', description: 'Funded a Request for Proposal' },
  RFI_CREATED: { points: 5, type: 'rfi_creation', description: 'Created a Request for Information' },
  RFI_RESPONDED: { points: 3, type: 'rfi_response', description: 'Responded to a Request for Information' },
  
  // Participation activities
  PROPOSAL_SUBMITTED: { points: 7, type: 'proposal_submission', description: 'Submitted a proposal for an RFP' },
  PROPOSAL_ACCEPTED: { points: 20, type: 'proposal_accepted', description: 'Proposal was accepted for an RFP' },
  DONATION_MADE: { points: 5, type: 'donation', description: 'Made a donation to a project' },
  
  // Community activities
  CREDENTIAL_VERIFIED: { points: 15, type: 'credential_verification', description: 'Verified a new credential' },
  TEAM_MATCH_ACCEPTED: { points: 10, type: 'team_match', description: 'Joined a team through matching' },
  COMMUNITY_ENDORSEMENT: { points: 3, type: 'endorsement', description: 'Received an endorsement from community' }
};


export class RepIDService {
  // Helper function to safely get activity description
  private getActivityDescription(type: string): string {
    // Find the activity type in our constants
    const activity = Object.entries(REPUTATION_ACTIVITIES).find(
      ([key, value]) => value.type === type || key === type
    );
    
    // Return the description or a default value
    return activity?.[1]?.description || 'Activity';
  }
  /**
   * Add reputation points to a user and create a reputation activity
   */
  async addReputationActivity(activity: InsertReputationActivity): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Insert the reputation activity
      const [newActivity] = await db
        .insert(reputationActivities)
        .values(activity)
        .returning();

      // Update user's reputation score
      const [updatedUser] = await db
        .update(users)
        .set({ 
          reputationScore: sql`reputation_score + ${activity.points}`,
          lastUpdated: new Date()
        })
        .where(eq(users.id, activity.userId))
        .returning();

      return { 
        success: true, 
        data: { activity: newActivity, user: updatedUser },
        message: 'Reputation activity added successfully'
      };
    } catch (error) {
      console.error('Failed to add reputation activity:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Update the ZKP commitment for a user's RepID
   */
  async updateRepIdCommitment(userId: number, commitment: string): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Update the user's RepID commitment
      const [updatedUser] = await db
        .update(users)
        .set({ 
          repIdCommitment: commitment,
          lastUpdated: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      return { 
        success: true, 
        data: updatedUser,
        message: 'RepID commitment updated successfully'
      };
    } catch (error) {
      console.error('Failed to update RepID commitment:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a verified credential for a user (using ZKP system)
   */
  async createVerifiedCredential(credential: InsertVerifiedCredential): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const [newCredential] = await db
        .insert(verifiedCredentials)
        .values(credential)
        .returning();

      return { 
        success: true, 
        data: newCredential,
        message: 'Verified credential created successfully'
      };
    } catch (error) {
      console.error('Failed to create verified credential:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a user's reputation profile
   */
  async getUserReputation(userId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Get reputation activities
      const activities = await db
        .select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId))
        .orderBy(desc(reputationActivities.timestamp));

      // Get public credentials
      const credentials = await db
        .select()
        .from(verifiedCredentials)
        .where(and(
          eq(verifiedCredentials.userId, userId),
          eq(verifiedCredentials.isPublic, true)
        ));

      return { 
        success: true, 
        data: {
          user: {
            id: user.id,
            username: user.username,
            reputationScore: user.reputationScore,
            persona: user.persona,
            interests: user.interests,
            skills: user.skills,
            openToCollaboration: user.openToCollaboration,
            repIdCommitment: user.repIdCommitment,
          },
          activities,
          credentials
        }
      };
    } catch (error) {
      console.error('Failed to get user reputation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get a user's reputation activities summarized by type
   */
  async getUserActivities(userId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Get all reputation activities for the user
      const allActivities = await db
        .select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId))
        .orderBy(desc(reputationActivities.timestamp));

      // Define interface for summary object
      interface ActivitySummary {
        [key: string]: {
          type: string;
          points: number;
          count: number;
          description: string;
          lastActivity: Date | string | null;
        }
      }

      // Group activities by type and calculate totals
      const activitySummary = allActivities.reduce((summary: ActivitySummary, activity) => {
        const type = activity.type;
        
        if (!summary[type]) {
          summary[type] = {
            type,
            points: 0,
            count: 0,
            description: this.getActivityDescription(type),
            lastActivity: null
          };
        }
        
        summary[type].points += activity.points;
        summary[type].count += 1;
        
        // Track the most recent activity of this type
        const activityDate = new Date(activity.timestamp);
        
        // Only create a Date object if lastActivity exists
        if (!summary[type].lastActivity) {
          // This is the first activity of this type
          summary[type].lastActivity = activity.timestamp;
        } else {
          // Compare with existing last activity
          const lastActivityDate = new Date(summary[type].lastActivity);
          if (activityDate > lastActivityDate) {
            summary[type].lastActivity = activity.timestamp;
          }
        }
        
        return summary;
      }, {});
      
      // Convert to array and sort by points (highest first)
      const activitiesArray = Object.values(activitySummary).sort((a: any, b: any) => b.points - a.points);

      return { 
        success: true, 
        data: activitiesArray,
        message: 'User activities retrieved successfully'
      };
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a user's detailed reputation activities with filtering and pagination
   */
  async getUserDetailedActivities(
    userId: number, 
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      fromDate?: Date;
      toDate?: Date;
      sortBy?: 'timestamp' | 'points';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ success: boolean, data?: any, total?: number, message?: string }> {
    try {
      // Get the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Build conditions array for the query
      let conditions = [eq(reputationActivities.userId, userId)];
      
      // Apply type filter if provided
      if (options?.type) {
        conditions.push(eq(reputationActivities.type, options.type));
      }
      
      // Apply date range filters if provided
      if (options?.fromDate) {
        conditions.push(gt(reputationActivities.timestamp, options.fromDate));
      }
      
      if (options?.toDate) {
        conditions.push(lt(reputationActivities.timestamp, options.toDate));
      }
      
      // Build the where clause using and()
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      
      // Get total count before applying pagination
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(reputationActivities)
        .where(whereClause);
        
      const [countResult] = await countQuery;
      const total = countResult?.count || 0;
      
      // Main query with sorting and pagination
      let query = db
        .select()
        .from(reputationActivities)
        .where(whereClause);
      
      // Apply sorting
      if (options?.sortBy === 'points') {
        if (options?.sortOrder === 'asc') {
          query = query.orderBy(reputationActivities.points); // ascending is default in SQL
        } else {
          query = query.orderBy(desc(reputationActivities.points));
        }
      } else {
        if (options?.sortOrder === 'asc') {
          query = query.orderBy(reputationActivities.timestamp); // ascending is default in SQL
        } else {
          query = query.orderBy(desc(reputationActivities.timestamp));
        }
      }
      
      // Apply pagination if provided
      if (typeof options?.limit === 'number') {
        query = query.limit(options.limit);
      }
      
      if (typeof options?.offset === 'number') {
        query = query.offset(options.offset);
      }
      
      // Execute the query
      const activities = await query;
      
      return { 
        success: true, 
        data: activities,
        total,
        message: 'User detailed activities retrieved successfully'
      };
    } catch (error) {
      console.error('Failed to get user detailed activities:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get a user's verified credentials
   */
  async getUserCredentials(userId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Get all credentials for the user 
      // (when viewing own credentials, user can see both public and private)
      const credentials = await db
        .select()
        .from(verifiedCredentials)
        .where(eq(verifiedCredentials.userId, userId))
        .orderBy(desc(verifiedCredentials.issuedDate));

      return { 
        success: true, 
        data: credentials,
        message: 'User credentials retrieved successfully'
      };
    } catch (error) {
      console.error('Failed to get user credentials:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a team match recommendation for a project
   */
  async createTeamMatch(match: InsertTeamMatch): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const [newMatch] = await db
        .insert(teamMatches)
        .values(match)
        .returning();

      return { 
        success: true, 
        data: newMatch,
        message: 'Team match created successfully'
      };
    } catch (error) {
      console.error('Failed to create team match:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get team matches for a user or project
   */
  async getTeamMatches({ userId, projectId }: { userId?: number, projectId?: number }): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      if (!userId && !projectId) {
        return { success: false, message: 'Either userId or projectId must be provided' };
      }

      let conditions = [];
      if (userId) {
        conditions.push(eq(teamMatches.userId, userId));
      }
      if (projectId) {
        conditions.push(eq(teamMatches.projectId, projectId));
      }

      // Create a combined condition using 'and'
      const whereCondition = conditions.length > 1 
        ? and(...conditions) 
        : conditions[0];

      // Execute the query with the correct condition
      const matches = await db.select()
        .from(teamMatches)
        .leftJoin(users, eq(teamMatches.userId, users.id))
        .leftJoin(projects, eq(teamMatches.projectId, projects.id))
        .where(whereCondition);

      return { 
        success: true, 
        data: matches.map(match => ({
          id: match.team_matches.id,
          projectId: match.team_matches.projectId,
          userId: match.team_matches.userId,
          role: match.team_matches.role,
          matchScore: match.team_matches.matchScore,
          matchReason: match.team_matches.matchReason,
          status: match.team_matches.status,
          createdAt: match.team_matches.createdAt,
          respondedAt: match.team_matches.respondedAt,
          projectTitle: match.projects?.title,
          username: match.users?.username,
        }))
      };
    } catch (error) {
      console.error('Failed to get team matches:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get matching grants for a project
   */
  async getMatchingGrants(projectId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .then(rows => rows[0]);

      if (!project) {
        return { success: false, message: 'Project not found' };
      }

      // Get all active grants
      const allGrants = await db
        .select()
        .from(grants)
        .where(eq(grants.isActive, true));

      // Simple matching algorithm based on categories
      // In a real implementation, this would be done with the AI recommendation engine
      const matchingGrants = allGrants.filter(grant => {
        if (!grant.categories || !project.categories) return false;
        
        // Check if any category matches
        return grant.categories.some(category => 
          project.categories.includes(category)
        );
      });

      return { 
        success: true, 
        data: matchingGrants
      };
    } catch (error) {
      console.error('Failed to get matching grants:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update a user's collaboration preferences
   */
  async updateCollaborationPreferences(userId: number, openToCollaboration: boolean): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          openToCollaboration,
          lastUpdated: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      return { 
        success: true, 
        data: updatedUser,
        message: 'Collaboration preferences updated successfully'
      };
    } catch (error) {
      console.error('Failed to update collaboration preferences:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a list of users who are open to collaboration
   */
  async getCollaborationCandidates(): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const candidates = await db
        .select({
          id: users.id,
          username: users.username,
          persona: users.persona,
          reputationScore: users.reputationScore,
          skills: users.skills,
          interests: users.interests
        })
        .from(users)
        .where(eq(users.openToCollaboration, true));

      return { 
        success: true, 
        data: candidates
      };
    } catch (error) {
      console.error('Failed to get collaboration candidates:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Award reputation points for HyperCrowd activities
   * This method handles awarding reputation points for various activities in the HyperCrowd system
   */
  async awardHyperCrowdPoints(userId: number, activityType: string, referenceId: number, additionalDetails?: string): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get the activity type from the REPUTATION_ACTIVITIES constants
      const activity = Object.values(REPUTATION_ACTIVITIES).find(act => act.type === activityType);
      
      if (!activity) {
        return { 
          success: false, 
          message: `Invalid activity type: ${activityType}`
        };
      }
      
      // Create the reputation activity record
      const reputationActivity: InsertReputationActivity = {
        userId,
        type: activity.type,
        points: activity.points,
        // Store reference ID and additional details in the description for now
        // We'll modify the schema in the future to properly store these
        description: `${activity.description} (Ref: ${referenceId})${additionalDetails ? ` - ${additionalDetails}` : ''}`,
      };
      
      // Add the reputation activity
      const result = await this.addReputationActivity(reputationActivity);
      
      // Log the activity
      log(`Awarded ${activity.points} points to user ${userId} for ${activity.type}`, 'reputation');
      
      return result;
    } catch (error) {
      console.error('Failed to award HyperCrowd points:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get top contributors based on reputation score
   * This is useful for leaderboards and highlighting active community members
   */
  async getTopContributors(limit: number = 10): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      const topUsers = await db
        .select({
          id: users.id,
          username: users.username,
          reputationScore: users.reputationScore,
          persona: users.persona
        })
        .from(users)
        .orderBy(desc(users.reputationScore))
        .limit(limit);
        
      return { 
        success: true, 
        data: topUsers
      };
    } catch (error) {
      console.error('Failed to get top contributors:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a reputation breakdown by activity type for a user
   * Useful for showing users how they've earned their reputation
   */
  async getReputationBreakdown(userId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get all reputation activities for the user
      const activities = await db
        .select()
        .from(reputationActivities)
        .where(eq(reputationActivities.userId, userId));
      
      // Group by activity type and sum points
      const breakdown = activities.reduce((acc, activity) => {
        const type = activity.type;
        if (!acc[type]) {
          acc[type] = {
            type,
            points: 0,
            count: 0,
            // Find the description from the constants
            description: Object.values(REPUTATION_ACTIVITIES).find(
              act => act.type === type
            )?.description || type
          };
        }
        acc[type].points += activity.points;
        acc[type].count += 1;
        return acc;
      }, {} as Record<string, { type: string, points: number, count: number, description: string }>);
      
      return { 
        success: true, 
        data: Object.values(breakdown).sort((a, b) => b.points - a.points)
      };
    } catch (error) {
      console.error('Failed to get reputation breakdown:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get reputation-based recommendations for teams and grants
   * Uses the user's reputation data to find suitable matches
   */
  async getReputationBasedRecommendations(userId: number): Promise<{ success: boolean, data?: any, message?: string }> {
    try {
      // Get the user and their reputation data
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Make sure user interests is actually an array
      const userInterests = Array.isArray(user.interests) ? user.interests : [];
      
      // Find projects that match the user's skills and interests - use simple query approach
      let matchingProjects: any[] = [];
      if (userInterests.length > 0) {
        // Use a safer approach with select instead of raw SQL
        const result = await db
          .select()
          .from(projects);
        
        // Filter in memory based on categories
        matchingProjects = result;
        
        // Filter projects that have matching categories with user interests
        if (matchingProjects.length > 0) {
          matchingProjects = matchingProjects.filter(project => {
            if (!project.categories || !Array.isArray(project.categories)) return false;
            return project.categories.some((category: string) => userInterests.includes(category));
          });
        }
      }
      
      // Find grant sources that align with the user's interests
      let matchingGrants: any[] = [];
      if (userInterests.length > 0) {
        // Use a safer approach with select instead of raw SQL
        const result = await db
          .select()
          .from(grantSources);
        
        // Use the result directly as it's already an array
        matchingGrants = result;
        
        // Filter grant sources that have matching categories with user interests
        if (matchingGrants.length > 0) {
          matchingGrants = matchingGrants.filter(grant => {
            if (!grant.categories || !Array.isArray(grant.categories)) return false;
            return grant.categories.some((category: string) => userInterests.includes(category));
          });
        }
      }
      
      // Get team formation suggestions based on open collaborations
      const teamSuggestions = await db
        .select()
        .from(users)
        .where(and(
          eq(users.openToCollaboration, true),
          sql`users.id != ${userId}`
          // Remove the problematic query part and handle it in memory instead
        ))
        .limit(10);
      
      // Filter team suggestions in memory based on skill match
      // This is more reliable than doing it in the SQL query
      const filteredTeamSuggestions = teamSuggestions
        .filter(u => {
          // If user has no skills or interests, don't filter
          if (!userInterests.length || !Array.isArray(u.skills)) return true;
          
          // Check for at least one matching skill/interest
          return u.skills.some((skill: string) => 
            userInterests.includes(skill)
          );
        })
        .slice(0, 5); // Limit to 5 results after filtering
      
      return { 
        success: true, 
        data: {
          projects: matchingProjects,
          grants: matchingGrants,
          teamSuggestions: filteredTeamSuggestions.map(u => ({
            id: u.id,
            username: u.username,
            persona: u.persona,
            reputationScore: u.reputationScore,
            skills: u.skills,
            interests: u.interests
          }))
        }
      };
    } catch (error) {
      console.error('Failed to get reputation-based recommendations:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Check if a user has sufficient reputation for an action
   * Used for gating certain actions based on reputation score
   */
  async checkReputationRequirement(userId: number, requiredScore: number): Promise<{ success: boolean, data?: { sufficient: boolean, currentScore: number }, message?: string }> {
    try {
      const user = await db
        .select({
          reputationScore: users.reputationScore
        })
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0]);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      const sufficient = (user.reputationScore || 0) >= requiredScore;
      
      return { 
        success: true, 
        data: {
          sufficient,
          currentScore: user.reputationScore || 0
        },
        message: sufficient ? 
          'User has sufficient reputation' : 
          `User needs ${requiredScore - (user.reputationScore || 0)} more reputation points`
      };
    } catch (error) {
      console.error('Failed to check reputation requirement:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Create and export singleton instance
export const repIdService = new RepIDService();
