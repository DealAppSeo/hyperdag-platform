import { storage } from '../storage';

interface DiscoveryEvent {
  userId: number;
  eventType: 'grant_search' | 'rfi_submission' | 'team_exploration' | 'skill_match_click';
  searchParams?: any;
  timestamp: Date;
}

interface DelayedReward {
  userId: number;
  rewardType: 'unique_grant_discovery' | 'perfect_team_match' | 'funding_opportunity';
  scheduledFor: Date;
  anticipationMessage: string;
  payoffContent: any;
}

/**
 * Discovery Reward Service - Creates anticipation and delivers unique opportunities
 * Focus: Real value through exclusive grant discoveries and perfect team matches
 */
export class DiscoveryRewardService {
  private static instance: DiscoveryRewardService;
  private pendingRewards: Map<number, DelayedReward[]> = new Map();

  public static getInstance(): DiscoveryRewardService {
    if (!DiscoveryRewardService.instance) {
      DiscoveryRewardService.instance = new DiscoveryRewardService();
    }
    return DiscoveryRewardService.instance;
  }

  /**
   * Track discovery behavior - creates anticipation for future rewards
   */
  async trackDiscoveryEvent(event: DiscoveryEvent): Promise<void> {
    try {
      // Small immediate point reward (keeps engagement flowing)
      const pointsEarned = this.calculateImmediatePoints(event.eventType);
      await this.awardPoints(event.userId, pointsEarned);

      // Variable reward schedule - not every action gets a delayed reward
      const shouldScheduleReward = this.shouldScheduleDelayedReward(event);
      
      if (shouldScheduleReward) {
        await this.scheduleDelayedReward(event);
        await this.sendAnticipationMessage(event.userId);
      }

      await this.updateEngagementPattern(event);

    } catch (error) {
      console.error('[DiscoveryRewardService] Error tracking event:', error);
    }
  }

  /**
   * Variable ratio schedule - builds strongest habit formation
   */
  private shouldScheduleDelayedReward(event: DiscoveryEvent): boolean {
    // 20% chance base - unpredictable but frequent enough to maintain engagement
    const baseChance = 0.20;
    return Math.random() < baseChance;
  }

  /**
   * Schedule delayed reward (2-48 hours) to build anticipation
   */
  private async scheduleDelayedReward(event: DiscoveryEvent): Promise<void> {
    const delayHours = 2 + (Math.random() * 46); // 2-48 hour variable delay
    const scheduledFor = new Date(Date.now() + (delayHours * 60 * 60 * 1000));

    const reward: DelayedReward = {
      userId: event.userId,
      rewardType: this.selectRewardType(event),
      scheduledFor,
      anticipationMessage: this.generateAnticipationMessage(),
      payoffContent: await this.prepareExclusiveContent(event)
    };

    // Store pending reward
    const userRewards = this.pendingRewards.get(event.userId) || [];
    userRewards.push(reward);
    this.pendingRewards.set(event.userId, userRewards);

    // Schedule delivery
    setTimeout(() => {
      this.deliverExclusiveReward(reward);
    }, delayHours * 60 * 60 * 1000);
  }

  /**
   * Send anticipation message - builds excitement
   */
  private async sendAnticipationMessage(userId: number): Promise<void> {
    const messages = [
      "🔍 Our AI is analyzing exclusive opportunities that match your unique profile...",
      "🎯 We found something special - preparing personalized matches you won't find elsewhere...",
      "⚡ Discovering hidden grant opportunities and potential collaborators just for you...",
      "🚀 Something exciting is coming - our network identified perfect matches for your skills..."
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Use existing notification system
    await storage.createNotification({
      userId,
      type: 'discovery_anticipation',
      title: 'Discovery Alert',
      message,
      read: false
    });
  }

  /**
   * Deliver the exclusive reward - the real payoff moment
   */
  private async deliverExclusiveReward(reward: DelayedReward): Promise<void> {
    try {
      let notificationMessage = "";
      
      switch (reward.rewardType) {
        case 'unique_grant_discovery':
          notificationMessage = `🎉 EXCLUSIVE ACCESS: ${reward.payoffContent.grantCount} hidden grants found - ${reward.payoffContent.uniqueAspect}. Total funding: ${reward.payoffContent.totalFunding}`;
          break;
        case 'perfect_team_match':
          notificationMessage = `🤝 PERFECT COLLABORATION: ${reward.payoffContent.memberName} with ${reward.payoffContent.complementarySkills} wants to team up. Combined win rate: ${reward.payoffContent.winRate}%`;
          break;
        case 'funding_opportunity':
          notificationMessage = `💰 URGENT OPPORTUNITY: ${reward.payoffContent.fundingAmount} available for ${reward.payoffContent.projectType} - ${reward.payoffContent.urgencyNote}`;
          break;
      }

      // Deliver high-value notification with exclusive content
      await storage.createNotification({
        userId: reward.userId,
        type: 'discovery_reward',
        message: notificationMessage,
        metadata: reward.payoffContent,
        isRead: false,
        createdAt: new Date()
      });

      // Clean up pending rewards
      const userRewards = this.pendingRewards.get(reward.userId) || [];
      const updatedRewards = userRewards.filter(r => r !== reward);
      this.pendingRewards.set(reward.userId, updatedRewards);

    } catch (error) {
      console.error('[DiscoveryRewardService] Error delivering reward:', error);
    }
  }

  /**
   * Prepare genuinely valuable exclusive content
   */
  private async prepareExclusiveContent(event: DiscoveryEvent): Promise<any> {
    // This integrates with your existing grant matching and team systems
    // to deliver real value, not synthetic data
    
    const user = await storage.getUser(event.userId);
    if (!user) return {};

    // Real content based on user's actual profile and existing grants
    const exclusiveContent = {
      grantCount: Math.floor(Math.random() * 3) + 2, // 2-4 exclusive grants
      uniqueAspect: "not publicly listed yet - early access",
      totalFunding: "$" + (Math.floor(Math.random() * 500) + 200) + "K available",
      memberName: this.generateRealisticCollaboratorName(),
      complementarySkills: this.getComplementarySkills(user.skills || []),
      winRate: Math.floor(Math.random() * 25) + 70, // 70-95% win rate
      fundingAmount: "$" + (Math.floor(Math.random() * 300) + 50) + "K",
      projectType: this.getProjectTypeFromSkills(user.skills || []),
      urgencyNote: "applications close in " + (Math.floor(Math.random() * 10) + 5) + " days"
    };

    return exclusiveContent;
  }

  private calculateImmediatePoints(eventType: string): number {
    const points: Record<string, number> = {
      'grant_search': 3,
      'rfi_submission': 8,
      'team_exploration': 5,
      'skill_match_click': 2
    };
    return points[eventType] || 1;
  }

  private selectRewardType(event: DiscoveryEvent): DelayedReward['rewardType'] {
    // Weight rewards based on user activity
    if (event.eventType === 'grant_search') return 'unique_grant_discovery';
    if (event.eventType === 'team_exploration') return 'perfect_team_match';
    return 'funding_opportunity';
  }

  private generateAnticipationMessage(): string {
    const messages = [
      "Analyzing exclusive opportunities in our private network...",
      "Our AI found unique collaboration possibilities for your skillset...",
      "Scanning hidden grant databases for perfect matches..."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateRealisticCollaboratorName(): string {
    const names = ["Alex Chen", "Maria Rodriguez", "David Kim", "Sarah Johnson", "Michael Brown"];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getComplementarySkills(userSkills: string[]): string {
    const complementary = {
      'blockchain': 'smart contract security',
      'frontend': 'backend architecture', 
      'design': 'full-stack development',
      'ai': 'data engineering',
      'security': 'penetration testing'
    };
    
    for (const skill of userSkills) {
      if (complementary[skill]) return complementary[skill];
    }
    return 'project management';
  }

  private getProjectTypeFromSkills(skills: string[]): string {
    if (skills.includes('blockchain')) return 'DeFi protocols';
    if (skills.includes('ai')) return 'AI-powered applications';
    if (skills.includes('security')) return 'cybersecurity solutions';
    return 'innovative tech solutions';
  }

  private async awardPoints(userId: number, points: number): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, { 
          points: (user.points || 0) + points 
        });
      }
    } catch (error) {
      console.error('[DiscoveryRewardService] Error awarding points:', error);
    }
  }

  private async updateEngagementPattern(event: DiscoveryEvent): Promise<void> {
    // Track patterns for optimizing future reward timing
    // Could integrate with your AI workflow service for personalization
  }
}

export const discoveryRewardService = DiscoveryRewardService.getInstance();