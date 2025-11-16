/**
 * RepID Service Extension
 * 
 * This extension adds ZKP developer API support to the RepID service
 */

import { db } from '../../db';
import { users, zkIdentityCommitments, verifiedCredentials } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { RepIDService } from './rep-id-service';

export class RepIDServiceExtension extends RepIDService {
  /**
   * Get reputation data using an identity commitment
   * This allows privacy-preserving verification without exposing the user's identity
   */
  async getReputationByCommitment(commitment: string) {
    try {
      // Find the user associated with this commitment
      const user = await this.getUserByCommitment(commitment);
      
      if (!user.success || !user.data) {
        return {
          success: false,
          message: 'User not found for the given commitment'
        };
      }
      
      // Get the user's reputation data
      const userId = user.data.id;
      const reputationData = await this.getUserReputation(userId);
      
      // Get the verification level
      const level = this.calculateReputationLevel(reputationData.totalScore || 0);
      
      // Return the reputation data without exposing personal details
      return {
        success: true,
        data: {
          score: reputationData.totalScore || 0,
          level: level,
          verified: reputationData.verifiedCount > 0,
          lastUpdated: reputationData.lastUpdated,
        },
        message: 'Reputation data retrieved successfully'
      };
    } catch (error) {
      logger.error('rep-id-extension', 'Error getting reputation by commitment', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving reputation data'
      };
    }
  }
  
  /**
   * Get user by identity commitment
   * Identity commitments are cryptographic commitments that allow proving identity without revealing it
   */
  async getUserByCommitment(commitment: string) {
    try {
      // Find the identity commitment in our database
      const [identityCommitment] = await db
        .select({
          userId: zkIdentityCommitments.userId
        })
        .from(zkIdentityCommitments)
        .where(eq(zkIdentityCommitments.commitment, commitment));
      
      if (!identityCommitment) {
        return {
          success: false,
          message: 'Identity commitment not found'
        };
      }
      
      // Get the user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, identityCommitment.userId));
      
      if (!user) {
        return {
          success: false,
          message: 'User not found for the given commitment'
        };
      }
      
      return {
        success: true,
        data: user,
        message: 'User found'
      };
    } catch (error) {
      logger.error('rep-id-extension', 'Error getting user by commitment', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving user data'
      };
    }
  }
  
  /**
   * Calculate compatibility score between two users based on their commitments
   */
  async calculateCompatibility(
    commitment1: string,
    commitment2: string,
    context: string = 'general'
  ) {
    try {
      // Get the users by their commitments
      const user1Result = await this.getUserByCommitment(commitment1);
      const user2Result = await this.getUserByCommitment(commitment2);
      
      if (!user1Result.success || !user2Result.success) {
        return {
          success: false,
          message: 'One or both users not found'
        };
      }
      
      const user1 = user1Result.data;
      const user2 = user2Result.data;
      
      // Get reputation data for both users
      const rep1 = this.calculateReputationLevel(user1.reputationScore || 0);
      const rep2 = this.calculateReputationLevel(user2.reputationScore || 0);
      
      // Get credentials for both users
      const credentials1 = await db.query.verifiedCredentials.findMany({
        where: eq(verifiedCredentials.userId, user1.id)
      });
      
      const credentials2 = await db.query.verifiedCredentials.findMany({
        where: eq(verifiedCredentials.userId, user2.id)
      });
      
      // Extract skill sets from credentials
      const skills1 = new Set<string>();
      const skills2 = new Set<string>();
      
      // Extract skills from credential metadata (assuming it contains skills)
      for (const cred of credentials1) {
        if (cred.metadata && typeof cred.metadata === 'object' && 'skills' in cred.metadata) {
          const credSkills = cred.metadata.skills as string[];
          credSkills.forEach(skill => skills1.add(skill.toLowerCase()));
        }
      }
      
      for (const cred of credentials2) {
        if (cred.metadata && typeof cred.metadata === 'object' && 'skills' in cred.metadata) {
          const credSkills = cred.metadata.skills as string[];
          credSkills.forEach(skill => skills2.add(skill.toLowerCase()));
        }
      }
      
      // Calculate common skills
      const commonSkills = new Set<string>();
      for (const skill of skills1) {
        if (skills2.has(skill)) {
          commonSkills.add(skill);
        }
      }
      
      // Calculate unique skills (complementary)
      const uniqueSkills1 = new Set<string>();
      const uniqueSkills2 = new Set<string>();
      
      for (const skill of skills1) {
        if (!skills2.has(skill)) {
          uniqueSkills1.add(skill);
        }
      }
      
      for (const skill of skills2) {
        if (!skills1.has(skill)) {
          uniqueSkills2.add(skill);
        }
      }
      
      // Calculate compatibility score
      // This is a simplified algorithm that could be improved with AI
      const commonSkillsWeight = 0.4;
      const uniqueSkillsWeight = 0.3;
      const reputationWeight = 0.3;
      
      // Normalize the skill sets (to avoid bias towards users with more skills)
      const totalUniqueSkills = uniqueSkills1.size + uniqueSkills2.size;
      const totalSkills = skills1.size + skills2.size;
      
      // Calculate individual scores
      const commonSkillsScore = totalSkills > 0 ? (commonSkills.size / totalSkills) * 100 : 0;
      const uniqueSkillsScore = totalSkills > 0 ? (totalUniqueSkills / totalSkills) * 100 : 0;
      const reputationScore = ((rep1 + rep2) / 10) * 100; // Assuming max level is 5 for each
      
      // Weighted final score
      const compatibilityScore = Math.round(
        (commonSkillsScore * commonSkillsWeight) +
        (uniqueSkillsScore * uniqueSkillsWeight) +
        (reputationScore * reputationWeight)
      );
      
      // Get human-readable lists for the response
      const commonArray = Array.from(commonSkills);
      const uniqueArray1 = Array.from(uniqueSkills1);
      const uniqueArray2 = Array.from(uniqueSkills2);
      
      return {
        success: true,
        data: {
          score: Math.min(compatibilityScore, 100), // Cap at 100%
          strengths: commonArray,
          complementary: [...uniqueArray1, ...uniqueArray2],
          context
        },
        message: 'Compatibility score calculated successfully'
      };
    } catch (error) {
      logger.error('rep-id-extension', 'Error calculating compatibility', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error calculating compatibility'
      };
    }
  }
  
  /**
   * Calculate reputation level based on a score
   * This converts the numerical score to a level (1-5)
   */
  private calculateReputationLevel(score: number): number {
    if (score >= 1000) return 5;
    if (score >= 500) return 4;
    if (score >= 200) return 3;
    if (score >= 50) return 2;
    return 1;
  }
}

export const repIdServiceExtension = new RepIDServiceExtension();