import { storage } from './storage';
import { discoveryRewardService } from './discovery-reward-service';

interface EmbeddedApp {
  id: string;
  appName: string;
  ownerId: number;
  apiKey: string;
  domain: string;
  rewardSettings: {
    pointsPerTest: number;
    bonusForDetailedFeedback: number;
    referralBonus: number;
  };
  integrationStatus: 'pending' | 'active' | 'suspended';
  monthlyTestingVolume: number;
}

interface TestingSession {
  sessionId: string;
  appId: string;
  testerId: number;
  startTime: Date;
  endTime?: Date;
  feedbackSubmitted: boolean;
  rewardsEarned: number;
  qualityScore: number; // 1-10 based on feedback quality
}

/**
 * Embedded Testing Rewards System
 * Allows other apps to integrate HyperDAG rewards for their testers
 * Creates viral growth through third-party app testing
 */
export class EmbeddedTestingRewards {
  private static instance: EmbeddedTestingRewards;

  public static getInstance(): EmbeddedTestingRewards {
    if (!EmbeddedTestingRewards.instance) {
      EmbeddedTestingRewards.instance = new EmbeddedTestingRewards();
    }
    return EmbeddedTestingRewards.instance;
  }

  /**
   * Register a new app for embedded testing rewards
   */
  async registerApp(ownerUserId: number, appDetails: any): Promise<EmbeddedApp> {
    const apiKey = this.generateAPIKey();
    
    const embeddedApp: EmbeddedApp = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appName: appDetails.name,
      ownerId: ownerUserId,
      apiKey: apiKey,
      domain: appDetails.domain,
      rewardSettings: {
        pointsPerTest: appDetails.pointsPerTest || 10,
        bonusForDetailedFeedback: appDetails.bonusForDetailedFeedback || 5,
        referralBonus: appDetails.referralBonus || 15
      },
      integrationStatus: 'pending',
      monthlyTestingVolume: 0
    };

    await storage.createEmbeddedApp(embeddedApp);

    // Send integration guide to app owner
    await this.sendIntegrationGuide(ownerUserId, embeddedApp);

    return embeddedApp;
  }

  /**
   * Generate JavaScript embed code for other apps
   */
  generateEmbedCode(appId: string, apiKey: string): string {
    return `
<!-- HyperDAG Testing Rewards Integration -->
<script src="https://api.hyperdag.org/embed/testing-rewards.js"></script>
<script>
  HyperDAGTesting.init({
    appId: '${appId}',
    apiKey: '${apiKey}',
    rewardMessage: 'Earn discovery points for testing this app!',
    onTestingComplete: function(rewards) {
      console.log('Tester earned:', rewards.points, 'discovery points');
      // Optional: Show custom reward message
    }
  });

  // Optional: Custom testing session tracking
  HyperDAGTesting.startSession({
    testType: 'usability', // 'usability', 'security', 'performance'
    expectedDuration: 15, // minutes
    rewardMultiplier: 1.0 // Boost rewards for complex testing
  });
</script>

<!-- Testing Feedback Widget (Optional) -->
<div id="hyperdag-feedback-widget"></div>
<script>
  HyperDAGTesting.renderFeedbackWidget('#hyperdag-feedback-widget', {
    theme: 'light', // 'light' or 'dark'
    showRewardPreview: true,
    collectContactInfo: true // For follow-up collaboration
  });
</script>`;
  }

  /**
   * Process testing session from embedded app
   */
  async processTestingSession(appId: string, sessionData: any): Promise<TestingSession> {
    const app = await storage.getEmbeddedApp(appId);
    if (!app || app.integrationStatus !== 'active') {
      throw new Error('App not found or not active');
    }

    // Create or update tester in HyperDAG system
    let tester = await this.findOrCreateTester(sessionData.testerInfo);
    
    const session: TestingSession = {
      sessionId: sessionData.sessionId,
      appId: appId,
      testerId: tester.id,
      startTime: new Date(sessionData.startTime),
      endTime: sessionData.endTime ? new Date(sessionData.endTime) : undefined,
      feedbackSubmitted: !!sessionData.feedback,
      rewardsEarned: 0,
      qualityScore: 0
    };

    // Calculate rewards based on testing quality and duration
    const rewards = await this.calculateTestingRewards(app, sessionData);
    session.rewardsEarned = rewards.total;
    session.qualityScore = rewards.qualityScore;

    // Award rewards to tester
    await this.awardTestingRewards(tester.id, rewards);

    // Track for discovery service (builds engagement)
    await discoveryRewardService.trackDiscoveryEvent({
      userId: tester.id,
      eventType: 'skill_match_click',
      searchParams: { 
        testingApp: app.appName,
        rewardsEarned: rewards.total,
        qualityScore: rewards.qualityScore
      },
      timestamp: new Date()
    });

    // Update app metrics
    await this.updateAppMetrics(appId);

    await storage.createTestingSession(session);
    return session;
  }

  /**
   * Find existing tester or create new HyperDAG account
   */
  private async findOrCreateTester(testerInfo: any): Promise<any> {
    // Try to find existing user by email
    if (testerInfo.email) {
      const existingUser = await storage.getUserByEmail(testerInfo.email);
      if (existingUser) return existingUser;
    }

    // Create new user account for the tester
    const newUser = await storage.createUser({
      username: testerInfo.username || `tester_${Date.now()}`,
      email: testerInfo.email,
      password: this.generateTempPassword(),
      points: 0,
      tokens: 0,
      skills: testerInfo.skills || [],
      bio: `Testing contributor from ${testerInfo.source || 'partner app'}`,
      referralSource: 'embedded_testing'
    });

    // Send welcome message about HyperDAG platform
    await this.sendTesterWelcome(newUser.id, testerInfo.source);

    return newUser;
  }

  /**
   * Calculate rewards based on testing quality and engagement
   */
  private async calculateTestingRewards(app: EmbeddedApp, sessionData: any): Promise<any> {
    let basePoints = app.rewardSettings.pointsPerTest;
    let qualityScore = 5; // Default mid-range score
    
    // Bonus for detailed feedback
    if (sessionData.feedback && sessionData.feedback.length > 100) {
      basePoints += app.rewardSettings.bonusForDetailedFeedback;
      qualityScore += 2;
    }

    // Bonus for longer testing sessions (shows engagement)
    const durationMinutes = (new Date(sessionData.endTime) - new Date(sessionData.startTime)) / (1000 * 60);
    if (durationMinutes > 10) {
      basePoints += Math.floor(durationMinutes / 5); // 1 point per 5 minutes
      qualityScore += 1;
    }

    // Bonus for actionable feedback (detected keywords)
    if (sessionData.feedback && this.hasActionableFeedback(sessionData.feedback)) {
      basePoints += 10;
      qualityScore += 2;
    }

    qualityScore = Math.min(qualityScore, 10); // Cap at 10

    return {
      total: basePoints,
      breakdown: {
        base: app.rewardSettings.pointsPerTest,
        feedback: sessionData.feedback ? app.rewardSettings.bonusForDetailedFeedback : 0,
        duration: Math.floor(durationMinutes / 5),
        quality: this.hasActionableFeedback(sessionData.feedback) ? 10 : 0
      },
      qualityScore
    };
  }

  /**
   * Award testing rewards and trigger discovery benefits
   */
  private async awardTestingRewards(userId: number, rewards: any): Promise<void> {
    const user = await storage.getUser(userId);
    
    await storage.updateUser(userId, {
      points: user.points + rewards.total,
      tokens: user.tokens + Math.floor(rewards.total / 5) // 1 token per 5 points
    });

    // High-quality testers get discovery priority boost
    if (rewards.qualityScore >= 8) {
      await storage.updateUser(userId, {
        testingReputationScore: (user.testingReputationScore || 0) + 1,
        discoveryPriorityBoost: {
          multiplier: 1.2,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          source: 'quality_testing_contribution'
        }
      });
    }

    // Send reward notification
    await storage.createNotification({
      userId,
      type: 'testing_rewards',
      message: `🎉 Earned ${rewards.total} points for quality testing! ${rewards.qualityScore >= 8 ? 'Bonus: 7-day discovery priority boost!' : ''}`,
      metadata: rewards,
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Send integration guide to app owners
   */
  private async sendIntegrationGuide(ownerUserId: number, app: EmbeddedApp): Promise<void> {
    const embedCode = this.generateEmbedCode(app.id, app.apiKey);
    
    await storage.createNotification({
      userId: ownerUserId,
      type: 'integration_guide',
      message: `🚀 Your app "${app.appName}" is ready for testing rewards integration! Copy the embed code from your dashboard to start rewarding testers with discovery points.`,
      metadata: { 
        appId: app.id,
        embedCode,
        integrationSteps: [
          'Copy the embed code to your app',
          'Test the integration with a dummy session',
          'Activate rewards for real testers',
          'Monitor testing metrics in your HyperDAG dashboard'
        ]
      },
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Send welcome message to new testers from embedded apps
   */
  private async sendTesterWelcome(userId: number, sourceApp?: string): Promise<void> {
    await storage.createNotification({
      userId,
      type: 'tester_welcome',
      message: `👋 Welcome to HyperDAG! You earned discovery points for testing${sourceApp ? ` ${sourceApp}` : ' a partner app'}. Explore our platform to discover exclusive grants and find perfect collaborators!`,
      metadata: {
        nextSteps: [
          'Complete your profile for better grant matching',
          'Browse exclusive grant opportunities', 
          'Connect with other developers for collaboration',
          'Earn more points through platform discovery'
        ],
        incentive: 'Complete your profile for 50 bonus discovery points!'
      },
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Check if feedback contains actionable insights
   */
  private hasActionableFeedback(feedback: string): boolean {
    const actionableKeywords = [
      'bug', 'error', 'improve', 'suggestion', 'recommend', 'issue',
      'problem', 'confusing', 'unclear', 'difficult', 'enhancement',
      'feature', 'usability', 'performance', 'slow', 'fast', 'intuitive'
    ];
    
    return actionableKeywords.some(keyword => 
      feedback.toLowerCase().includes(keyword)
    );
  }

  private async updateAppMetrics(appId: string): Promise<void> {
    await storage.incrementAppTestingVolume(appId);
  }

  private generateAPIKey(): string {
    return 'hdag_' + Math.random().toString(36).substr(2, 32);
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).substr(2, 12);
  }
}

export const embeddedTestingRewards = EmbeddedTestingRewards.getInstance();