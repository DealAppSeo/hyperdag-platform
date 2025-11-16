import { storage } from './storage';
import { discoveryRewardService } from './discovery-reward-service';

interface OnboardingStage {
  stage: number;
  name: string;
  required: boolean;
  rewardThreshold: number; // Points needed before this becomes required
  benefits: string[];
  privacyLevel: 'anonymous' | 'pseudonymous' | 'verified' | 'secure';
}

interface UserPrivacyProfile {
  userId: number;
  privacyLevel: 'anonymous' | 'pseudonymous' | 'verified' | 'secure';
  zkProofCommitment?: string;
  sbtTokenId?: string;
  encryptedData: any;
  consentTimestamp: Date;
}

/**
 * Progressive Onboarding Service
 * Minimizes friction while building trust through gradual privacy protection
 */
export class ProgressiveOnboardingService {
  private static instance: ProgressiveOnboardingService;

  // Progressive stages with clear privacy benefits
  private readonly onboardingStages: OnboardingStage[] = [
    {
      stage: 0,
      name: 'anonymous_participation',
      required: false,
      rewardThreshold: 0,
      benefits: ['Earn discovery points', 'Test partner apps', 'Browse grants'],
      privacyLevel: 'anonymous'
    },
    {
      stage: 1,
      name: 'alias_creation',
      required: true,
      rewardThreshold: 25, // After earning some points
      benefits: ['Track your progress', 'Save preferences', 'Build reputation'],
      privacyLevel: 'pseudonymous'
    },
    {
      stage: 2,
      name: 'email_verification',
      required: true,
      rewardThreshold: 100, // Before claiming significant rewards
      benefits: ['Secure notifications', 'Recovery options', 'Grant alerts'],
      privacyLevel: 'verified'
    },
    {
      stage: 3,
      name: 'phone_2fa',
      required: true,
      rewardThreshold: 250, // Before token redemption
      benefits: ['Enhanced security', 'Priority support', 'Exclusive opportunities'],
      privacyLevel: 'verified'
    },
    {
      stage: 4,
      name: 'wallet_connection',
      required: false,
      rewardThreshold: 500, // For advanced features
      benefits: ['Web3 integration', 'Cross-chain reputation', 'DeFi opportunities'],
      privacyLevel: 'secure'
    },
    {
      stage: 5,
      name: 'sbt_creation',
      required: false,
      rewardThreshold: 1000, // For full ecosystem access
      benefits: ['Quantum-resistant identity', 'Permanent reputation', 'Elite network access'],
      privacyLevel: 'secure'
    }
  ];

  public static getInstance(): ProgressiveOnboardingService {
    if (!ProgressiveOnboardingService.instance) {
      ProgressiveOnboardingService.instance = new ProgressiveOnboardingService();
    }
    return ProgressiveOnboardingService.instance;
  }

  /**
   * Handle new user from embedded testing (minimal friction entry)
   */
  async createAnonymousUser(testerInfo: any): Promise<any> {
    // Create user with minimal information
    const anonymousUser = await storage.createUser({
      username: `tester_${Date.now()}`, // Temporary username
      email: null, // Not required initially
      password: this.generateSecurePassword(),
      points: 0,
      tokens: 0,
      onboardingStage: 0,
      privacyLevel: 'anonymous',
      referralSource: 'embedded_testing',
      tempData: {
        originalTesterInfo: testerInfo,
        createdVia: 'testing_rewards',
        firstAppTested: testerInfo.appName
      }
    });

    // Send welcome message explaining privacy-first approach
    await this.sendPrivacyFirstWelcome(anonymousUser.id);

    return anonymousUser;
  }

  /**
   * Check if user needs to progress to next onboarding stage
   */
  async checkOnboardingProgress(userId: number): Promise<any> {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const currentStage = user.onboardingStage || 0;
    const nextStage = this.onboardingStages[currentStage + 1];

    // Check if user has enough points to require next stage
    if (nextStage && user.points >= nextStage.rewardThreshold) {
      return {
        progressionRequired: nextStage.required,
        nextStage: nextStage,
        currentPoints: user.points,
        message: this.generateProgressionMessage(nextStage, user.points),
        privacyBenefits: nextStage.benefits
      };
    }

    return { progressionRequired: false, currentStage: currentStage };
  }

  /**
   * Handle stage progression with privacy explanations
   */
  async progressToStage(userId: number, stageData: any): Promise<any> {
    const user = await storage.getUser(userId);
    const targetStage = this.onboardingStages.find(s => s.name === stageData.stageName);
    
    if (!targetStage) throw new Error('Invalid stage');

    let updateData: any = {};

    switch (targetStage.stage) {
      case 1: // Alias creation
        updateData = {
          username: stageData.preferredAlias,
          onboardingStage: 1,
          privacyLevel: 'pseudonymous'
        };
        await this.awardProgressionBonus(userId, 15, 'alias_creation');
        break;

      case 2: // Email verification
        updateData = {
          email: stageData.email,
          emailVerified: false, // Will be verified separately
          onboardingStage: 2,
          privacyLevel: 'verified'
        };
        await this.initializeEmailVerification(userId, stageData.email);
        break;

      case 3: // Phone 2FA
        updateData = {
          twoFactorEnabled: true,
          authLevel: 2,
          onboardingStage: 3
        };
        await this.initializePhone2FA(userId, stageData.phoneNumber);
        break;

      case 4: // Wallet connection
        updateData = {
          walletAddress: stageData.walletAddress,
          connectedWallets: { [stageData.walletType]: stageData.walletAddress },
          onboardingStage: 4,
          privacyLevel: 'secure'
        };
        await this.generateZKProof(userId, stageData.walletAddress);
        break;

      case 5: // SBT creation
        const sbtData = await this.createSoulboundToken(userId, user);
        updateData = {
          sbtTokenId: sbtData.tokenId,
          repIdCommitment: sbtData.zkCommitment,
          onboardingStage: 5
        };
        break;
    }

    await storage.updateUser(userId, updateData);

    // Send stage completion notification with privacy emphasis
    await this.sendStageCompletionNotification(userId, targetStage);

    return {
      success: true,
      newStage: targetStage.stage,
      privacyLevel: targetStage.privacyLevel,
      unlockedBenefits: targetStage.benefits
    };
  }

  /**
   * Check redemption eligibility based on onboarding progress
   */
  async checkRedemptionEligibility(userId: number, requestedAmount: number): Promise<any> {
    const user = await storage.getUser(userId);
    const currentStage = user.onboardingStage || 0;

    // Define redemption thresholds
    const redemptionRequirements = {
      points_to_tokens: { minStage: 2, minAuth: 'email' }, // Email verified
      token_withdrawal: { minStage: 3, minAuth: '2fa' },    // Phone 2FA
      premium_features: { minStage: 4, minAuth: 'wallet' }, // Wallet connected
      elite_access: { minStage: 5, minAuth: 'sbt' }         // SBT created
    };

    let redemptionType = 'points_to_tokens';
    if (requestedAmount > 100) redemptionType = 'token_withdrawal';
    if (requestedAmount > 500) redemptionType = 'premium_features';
    if (requestedAmount > 1000) redemptionType = 'elite_access';

    const requirement = redemptionRequirements[redemptionType];
    const eligible = currentStage >= requirement.minStage;

    if (!eligible) {
      const requiredStage = this.onboardingStages[requirement.minStage];
      return {
        eligible: false,
        currentStage: currentStage,
        requiredStage: requirement.minStage,
        message: `To redeem ${requestedAmount} tokens, please complete ${requiredStage.name} for enhanced security.`,
        privacyBenefits: requiredStage.benefits,
        securityExplanation: this.getSecurityExplanation(requiredStage.name)
      };
    }

    return { eligible: true, approved: true };
  }

  /**
   * Send privacy-first welcome message
   */
  private async sendPrivacyFirstWelcome(userId: number): Promise<void> {
    await storage.createNotification({
      userId,
      type: 'privacy_welcome',
      message: `🔒 Welcome to HyperDAG! Your privacy is our priority. You can start earning discovery points immediately - no personal info required. We use zero-knowledge proofs to protect your data while you explore exclusive grants and collaborations.`,
      metadata: {
        privacyLevel: 'anonymous',
        nextSteps: [
          'Earn points by testing partner apps',
          'Browse exclusive grant opportunities',
          'Choose your own pace for account upgrades'
        ],
        privacyPromise: 'We never sell data. Period.'
      },
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Generate progression message emphasizing benefits and privacy
   */
  private generateProgressionMessage(stage: OnboardingStage, currentPoints: number): string {
    const messages = {
      alias_creation: `🎯 Great progress! You've earned ${currentPoints} points. Ready to choose an alias to track your discoveries? This keeps you anonymous while building your reputation.`,
      email_verification: `🚀 You're doing amazing with ${currentPoints} points! To unlock grant alerts and secure notifications, we'd love to verify an email. Your privacy remains protected with encryption.`,
      phone_2fa: `💪 Impressive! ${currentPoints} points earned. Ready for enhanced security? Adding 2FA protects your growing reputation and unlocks priority opportunities.`,
      wallet_connection: `🏆 Outstanding! ${currentPoints} points! Want to connect a wallet for Web3 features? This enables cross-chain reputation while maintaining privacy through zero-knowledge proofs.`,
      sbt_creation: `🌟 Elite level! ${currentPoints} points! Ready for quantum-resistant identity? Create your Soulbound Token for permanent, private reputation that follows you across the entire ecosystem.`
    };

    return messages[stage.name] || `Ready to upgrade your account for better security and more opportunities?`;
  }

  /**
   * Award progression bonuses to incentivize onboarding
   */
  private async awardProgressionBonus(userId: number, bonus: number, reason: string): Promise<void> {
    const user = await storage.getUser(userId);
    await storage.updateUser(userId, {
      points: user.points + bonus,
      tokens: user.tokens + Math.floor(bonus / 3)
    });

    await storage.createNotification({
      userId,
      type: 'progression_bonus',
      message: `🎉 Account upgrade bonus! +${bonus} discovery points for completing ${reason.replace('_', ' ')}!`,
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Get security explanation for each stage
   */
  private getSecurityExplanation(stageName: string): string {
    const explanations = {
      email_verification: 'Email verification ensures you receive important grant deadlines and opportunities securely.',
      phone_2fa: 'Two-factor authentication protects your growing reputation and prevents unauthorized access.',
      wallet_connection: 'Wallet connection enables Web3 features while maintaining privacy through zero-knowledge proofs.',
      sbt_creation: 'Soulbound Tokens provide quantum-resistant, permanent identity that enhances trust in collaborations.'
    };

    return explanations[stageName] || 'Enhanced security protects your privacy and unlocks exclusive opportunities.';
  }

  private async initializeEmailVerification(userId: number, email: string): Promise<void> {
    // Implementation would send verification email
    console.log(`[Onboarding] Email verification initiated for user ${userId}`);
  }

  private async initializePhone2FA(userId: number, phoneNumber: string): Promise<void> {
    // Implementation would send SMS verification
    console.log(`[Onboarding] 2FA setup initiated for user ${userId}`);
  }

  private async generateZKProof(userId: number, walletAddress: string): Promise<void> {
    // Implementation would generate zero-knowledge proof
    console.log(`[Onboarding] ZK proof generation for user ${userId}`);
  }

  private async createSoulboundToken(userId: number, user: any): Promise<any> {
    // Implementation would create SBT on blockchain
    return {
      tokenId: `sbt_${userId}_${Date.now()}`,
      zkCommitment: `zk_${Math.random().toString(36).substr(2, 16)}`
    };
  }

  private async sendStageCompletionNotification(userId: number, stage: OnboardingStage): Promise<void> {
    await storage.createNotification({
      userId,
      type: 'stage_completion',
      message: `✅ ${stage.name.replace('_', ' ')} completed! Your privacy level is now: ${stage.privacyLevel}. Unlocked: ${stage.benefits.join(', ')}.`,
      metadata: { stage: stage.stage, privacyLevel: stage.privacyLevel },
      isRead: false,
      createdAt: new Date()
    });
  }

  private generateSecurePassword(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

export const progressiveOnboardingService = ProgressiveOnboardingService.getInstance();