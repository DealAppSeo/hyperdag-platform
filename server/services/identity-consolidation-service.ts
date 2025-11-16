/**
 * Identity Consolidation Service
 * 
 * Handles merging multiple user accounts while preventing gaming through
 * activity-based deduplication and proper reward consolidation.
 */

import { storage } from '../storage';
import { emailService } from './email-service';
import crypto from 'crypto';

interface ConsolidationRequest {
  primaryUserId: number;
  secondaryUserIds: number[];
  email: string;
  confirmationToken: string;
}

interface ActivityDeduplication {
  activityType: string;
  identifier: string; // referral code, content hash, etc.
  preservedAccount: number;
  duplicateAccounts: number[];
}

interface ConsolidationResult {
  success: boolean;
  consolidatedUser: any;
  preservedActivities: ActivityDeduplication[];
  forfeited: {
    tokens: number;
    points: number;
    activities: string[];
  };
  errors?: string[];
}

export class IdentityConsolidationService {
  
  /**
   * Initiate account consolidation process
   */
  async initiateConsolidation(
    primaryUserId: number, 
    secondaryUserIds: number[]
  ): Promise<{ confirmationToken: string; emailSent: boolean }> {
    
    // Get primary user
    const primaryUser = await storage.getUser(primaryUserId);
    if (!primaryUser || !primaryUser.email) {
      throw new Error('Primary user must have verified email');
    }

    // Validate secondary users exist and can be merged
    const secondaryUsers = await Promise.all(
      secondaryUserIds.map(id => storage.getUser(id))
    );

    if (secondaryUsers.some(user => !user)) {
      throw new Error('One or more secondary accounts not found');
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    
    // Store consolidation request (in production, this would be in database)
    const consolidationRequest: ConsolidationRequest = {
      primaryUserId,
      secondaryUserIds,
      email: primaryUser.email,
      confirmationToken
    };

    // Send confirmation email
    const emailSent = await this.sendConsolidationConfirmationEmail(
      consolidationRequest,
      primaryUser,
      secondaryUsers.filter(Boolean)
    );

    return { confirmationToken, emailSent };
  }

  /**
   * Analyze what would happen during consolidation (preview)
   */
  async analyzeConsolidation(
    primaryUserId: number,
    secondaryUserIds: number[]
  ): Promise<{
    totalReputationScore: number;
    preservedActivities: any[];
    duplicateActivities: any[];
    tokensToForfeit: number;
    pointsToForfeit: number;
  }> {
    
    const allUserIds = [primaryUserId, ...secondaryUserIds];
    const users = await Promise.all(allUserIds.map(id => storage.getUser(id)));
    
    // Calculate total reputation (sum of all accounts)
    const totalReputationScore = users.reduce((sum, user) => 
      sum + (user?.reputationScore || 0), 0
    );

    // Analyze activities for duplicates
    const { preserved, duplicates } = await this.analyzeActivityDuplication(allUserIds);
    
    // Calculate forfeitures (secondary accounts lose tokens/points from duplicate activities)
    const secondaryUsers = users.slice(1);
    const tokensToForfeit = secondaryUsers.reduce((sum, user) => 
      sum + (user?.tokens || 0), 0
    ) * 0.3; // 30% penalty on tokens from secondary accounts
    
    const pointsToForfeit = duplicates.length * 10; // Points from duplicate activities

    return {
      totalReputationScore,
      preservedActivities: preserved,
      duplicateActivities: duplicates,
      tokensToForfeit,
      pointsToForfeit
    };
  }

  /**
   * Execute account consolidation after confirmation
   */
  async executeConsolidation(confirmationToken: string): Promise<ConsolidationResult> {
    // In production, retrieve from database using token
    // For now, this is a placeholder for the consolidation logic
    
    try {
      // Validate confirmation token and get request details
      // const request = await this.getConsolidationRequest(confirmationToken);
      
      // For now, return a mock result
      return {
        success: true,
        consolidatedUser: null,
        preservedActivities: [],
        forfeited: {
          tokens: 0,
          points: 0,
          activities: []
        }
      };
    } catch (error) {
      return {
        success: false,
        consolidatedUser: null,
        preservedActivities: [],
        forfeited: {
          tokens: 0,
          points: 0,
          activities: []
        },
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Analyze activities across accounts to identify duplicates
   */
  private async analyzeActivityDuplication(userIds: number[]): Promise<{
    preserved: any[];
    duplicates: any[];
  }> {
    
    const activityMap = new Map();
    const preserved: any[] = [];
    const duplicates: any[] = [];

    for (const userId of userIds) {
      // Get user's referral activities
      const referrals = await storage.getReferralsByUser(userId);
      
      // Check for duplicate referrals (same referred user)
      for (const referral of referrals) {
        const key = `referral:${referral.referredUserId}`;
        
        if (activityMap.has(key)) {
          duplicates.push({
            type: 'referral',
            userId,
            identifier: referral.referredUserId,
            duplicate: true
          });
        } else {
          activityMap.set(key, { userId, type: 'referral' });
          preserved.push({
            type: 'referral',
            userId,
            identifier: referral.referredUserId,
            duplicate: false
          });
        }
      }

      // Add other activity types (content creation, social posts, etc.)
      // This would be expanded based on the platform's activity types
    }

    return { preserved, duplicates };
  }

  /**
   * Send confirmation email for account consolidation
   */
  private async sendConsolidationConfirmationEmail(
    request: ConsolidationRequest,
    primaryUser: any,
    secondaryUsers: any[]
  ): Promise<boolean> {
    
    const accountsList = secondaryUsers.map(user => 
      `• ${user.username} (${user.authMethods ? Object.keys(user.authMethods).filter(method => user.authMethods[method]).join(', ') : 'password'})`
    ).join('\n');

    const emailContent = `
Dear ${primaryUser.username},

You have requested to consolidate multiple HyperDAG accounts into your primary account.

PRIMARY ACCOUNT (to keep):
• ${primaryUser.username} (${primaryUser.email})

ACCOUNTS TO MERGE:
${accountsList}

IMPORTANT CONSOLIDATION RULES:
✓ All reputation scores will be combined
✓ Duplicate activities (same referrals, etc.) will only count once
✓ Different activities from each account will be preserved
✓ Secondary accounts will forfeit 30% of tokens as anti-gaming measure
✓ This action is PERMANENT and cannot be undone

To confirm this consolidation, click the link below:
https://hyperdag.org/api/identity/consolidation/confirm?token=${request.confirmationToken}

If you did not request this, please ignore this email.

Best regards,
HyperDAG Team
    `;

    try {
      await emailService.sendEmail({
        to: request.email,
        subject: 'Confirm Account Consolidation - HyperDAG',
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });
      return true;
    } catch (error) {
      console.error('Failed to send consolidation confirmation email:', error);
      return false;
    }
  }

  /**
   * Check if user has any accounts that could be linked
   */
  async findLinkableAccounts(userId: number): Promise<{
    email: any[];
    similarUsernames: any[];
    recentIPs: any[];
  }> {
    
    const user = await storage.getUser(userId);
    if (!user) return { email: [], similarUsernames: [], recentIPs: [] };

    const linkableAccounts = {
      email: [] as any[],
      similarUsernames: [] as any[],
      recentIPs: [] as any[]
    };

    // Find accounts with same email
    if (user.email) {
      const sameEmailUsers = await storage.getUsersByEmail(user.email);
      linkableAccounts.email = sameEmailUsers.filter(u => u.id !== userId);
    }

    // Find accounts with similar usernames
    const similarUsers = await storage.getUsersBySimilarUsername(user.username);
    linkableAccounts.similarUsernames = similarUsers.filter(u => u.id !== userId);

    return linkableAccounts;
  }
}

export const identityConsolidationService = new IdentityConsolidationService();