import { storage } from './storage';
import { discoveryRewardService } from './discovery-reward-service';

interface ReferralReward {
  referrerId: number;
  refereeId: number;
  rewardType: 'grant_discovery_boost' | 'exclusive_team_access' | 'priority_matching' | 'vip_opportunities';
  value: number;
  unlockCondition: string;
}

/**
 * Viral Referral Service - Amplifies discovery rewards through network effects
 * Focus: Reward referrers when their invites succeed, creating viral loops
 */
export class ViralReferralService {
  private static instance: ViralReferralService;

  public static getInstance(): ViralReferralService {
    if (!ViralReferralService.instance) {
      ViralReferralService.instance = new ViralReferralService();
    }
    return ViralReferralService.instance;
  }

  /**
   * Track successful referral and trigger cascading rewards
   */
  async processSuccessfulReferral(referrerId: number, newUserId: number): Promise<void> {
    try {
      // Immediate referral bonus for both users
      await this.awardImmediateBonus(referrerId, newUserId);
      
      // Set up milestone-based rewards for sustained engagement
      await this.setupMilestoneRewards(referrerId, newUserId);
      
      // Boost referrer's discovery algorithm priority
      await this.boostDiscoveryPriority(referrerId);

    } catch (error) {
      console.error('[ViralReferralService] Error processing referral:', error);
    }
  }

  /**
   * Award immediate bonus to create positive first impression
   */
  private async awardImmediateBonus(referrerId: number, newUserId: number): Promise<void> {
    // Referrer gets immediate discovery boost
    await storage.updateUser(referrerId, {
      tokens: (await this.getUserTokens(referrerId)) + 25,
      points: (await this.getUserPoints(referrerId)) + 50
    });

    // New user gets welcome boost
    await storage.updateUser(newUserId, {
      tokens: 15,
      points: 25
    });

    // Send immediate notifications
    await storage.createNotification({
      userId: referrerId,
      type: 'referral_success',
      message: `🎉 Your referral is active! +25 tokens, +50 points, and 2x discovery priority for the next 7 days`,
      isRead: false,
      createdAt: new Date()
    });

    await storage.createNotification({
      userId: newUserId,
      type: 'welcome_bonus',
      message: `🚀 Welcome to HyperDAG! You start with 15 tokens and 25 points thanks to your referrer's recommendation`,
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Setup milestone rewards that unlock as referee engages
   */
  private async setupMilestoneRewards(referrerId: number, newUserId: number): Promise<void> {
    const milestones = [
      {
        condition: 'first_grant_search',
        referrerReward: { tokens: 10, discoveryBoost: '24hr_priority' },
        message: 'Your referral just searched for grants! +10 tokens and 24hr priority discovery'
      },
      {
        condition: 'first_rfi_submission', 
        referrerReward: { tokens: 20, discoveryBoost: 'exclusive_access' },
        message: 'Your referral submitted their first RFI! +20 tokens and exclusive grant access'
      },
      {
        condition: 'first_collaboration',
        referrerReward: { tokens: 50, discoveryBoost: 'vip_status' },
        message: 'Your referral found a team member! +50 tokens and VIP discovery status'
      },
      {
        condition: 'first_grant_win',
        referrerReward: { tokens: 100, discoveryBoost: 'lifetime_priority' },
        message: 'JACKPOT! Your referral won a grant! +100 tokens and lifetime priority matching'
      }
    ];

    // Store milestone tracking for this referral pair
    for (const milestone of milestones) {
      await storage.createReferralMilestone({
        referrerId,
        refereeId: newUserId,
        condition: milestone.condition,
        reward: milestone.referrerReward,
        message: milestone.message,
        completed: false,
        createdAt: new Date()
      });
    }
  }

  /**
   * Trigger milestone reward when referee achieves goals
   */
  async triggerMilestoneReward(userId: number, action: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.referredBy) return;

      const milestones = await storage.getReferralMilestones(user.referredBy, userId);
      const matchingMilestone = milestones.find(m => 
        m.condition === action && !m.completed
      );

      if (matchingMilestone) {
        // Award milestone reward to referrer
        await this.awardMilestoneReward(user.referredBy, matchingMilestone);
        
        // Mark milestone as completed
        await storage.updateReferralMilestone(matchingMilestone.id, { completed: true });

        // Send celebration notification
        await storage.createNotification({
          userId: user.referredBy,
          type: 'milestone_reward',
          message: matchingMilestone.message,
          isRead: false,
          createdAt: new Date()
        });
      }

    } catch (error) {
      console.error('[ViralReferralService] Error triggering milestone:', error);
    }
  }

  /**
   * Award milestone reward and boost discovery algorithms
   */
  private async awardMilestoneReward(referrerId: number, milestone: any): Promise<void> {
    const referrer = await storage.getUser(referrerId);
    if (!referrer) return;

    // Award tokens
    await storage.updateUser(referrerId, {
      tokens: referrer.tokens + milestone.reward.tokens,
      points: referrer.points + (milestone.reward.tokens * 2)
    });

    // Apply discovery boost
    await this.applyDiscoveryBoost(referrerId, milestone.reward.discoveryBoost);
  }

  /**
   * Boost referrer's priority in discovery algorithms
   */
  private async boostDiscoveryPriority(userId: number): Promise<void> {
    const boostExpiry = new Date();
    boostExpiry.setDate(boostExpiry.getDate() + 7); // 7-day boost

    await storage.updateUser(userId, {
      discoveryPriorityBoost: {
        multiplier: 2.0,
        expiresAt: boostExpiry,
        source: 'successful_referral'
      }
    });
  }

  /**
   * Apply specific discovery boost based on milestone
   */
  private async applyDiscoveryBoost(userId: number, boostType: string): Promise<void> {
    const boosts = {
      '24hr_priority': { multiplier: 3.0, duration: 1 },
      'exclusive_access': { multiplier: 2.0, duration: 7, exclusiveGrants: true },
      'vip_status': { multiplier: 2.5, duration: 30, vipOpportunities: true },
      'lifetime_priority': { multiplier: 1.5, duration: 365, lifetimeBenefit: true }
    };

    const boost = boosts[boostType];
    if (boost) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + boost.duration);

      await storage.updateUser(userId, {
        discoveryPriorityBoost: {
          multiplier: boost.multiplier,
          expiresAt: expiryDate,
          features: {
            exclusiveGrants: boost.exclusiveGrants || false,
            vipOpportunities: boost.vipOpportunities || false,
            lifetimeBenefit: boost.lifetimeBenefit || false
          },
          source: 'referral_milestone'
        }
      });
    }
  }

  /**
   * Generate compelling referral message with discovery incentives
   */
  generateReferralMessage(userId: number): string {
    const messages = [
      "🔍 Found exclusive grants on HyperDAG that aren't listed anywhere else. Join my network and we both get discovery bonuses + priority matching!",
      "💡 HyperDAG's AI found me the perfect collaborator and hidden funding opportunities. Use my link - we both get 2x discovery priority!",
      "🚀 Just discovered grants worth $500K+ through HyperDAG's exclusive network. Join with my referral for instant discovery boost!"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Calculate viral coefficient based on referral success rates
   */
  async calculateViralCoefficient(userId: number): Promise<number> {
    const referrals = await storage.getUserReferrals(userId);
    const activeReferrals = referrals.filter(r => r.lastEngagement > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    // Viral coefficient = (referrals made) × (% who become active) × (avg referrals per active user)
    const inviteRate = referrals.length;
    const conversionRate = activeReferrals.length / Math.max(referrals.length, 1);
    const avgReferralsPerUser = 1.2; // Platform average
    
    return inviteRate * conversionRate * avgReferralsPerUser;
  }

  private async getUserTokens(userId: number): Promise<number> {
    const user = await storage.getUser(userId);
    return user?.tokens || 0;
  }

  private async getUserPoints(userId: number): Promise<number> {
    const user = await storage.getUser(userId);
    return user?.points || 0;
  }
}

export const viralReferralService = ViralReferralService.getInstance();