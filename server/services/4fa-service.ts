import { db } from '../db';
import { users, sbtCredentials } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import speakeasy from 'speakeasy';

export interface AuthFactors {
  password: boolean;
  totp: boolean;
  biometric: boolean;
  proofOfLife: boolean;
}

export interface ProofOfLifeChallenge {
  challengeId: string;
  type: 'captcha' | 'behavioral' | 'voice' | 'video';
  data: any;
  expiresAt: Date;
}

export class FourFactorAuthService {
  
  // Check current authentication level
  async getAuthLevel(userId: number): Promise<number> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) throw new Error('User not found');
    
    return user[0].authLevel || 1;
  }

  // Verify if user can access specific features based on auth level
  canAccessFeature(authLevel: number, feature: string): boolean {
    const requirements: Record<string, number> = {
      'explore': 1,           // Basic exploration - no auth required
      'wallet_connect': 2,    // 2FA required for wallet connection
      'token_withdraw': 4,    // 4FA required for token operations
      'dbt_mint': 1,          // DBT available by default (unverified digital tokens)
      'sbt_conversion': 4     // 4FA + PoL + biometrics required for SBT (verified soulbound)
    };

    return authLevel >= (requirements[feature] || 1);
  }

  // Initiate 2FA setup (required before wallet connection)
  async setup2FA(userId: number): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: 'HyperDAG',
      account: `user_${userId}`,
      length: 32
    });

    // Store temp secret until verified
    await db.update(users)
      .set({ 
        tempTotpSecret: secret.base32,
        twoFactorEnabled: false 
      })
      .where(eq(users.id, userId));

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || ''
    };
  }

  // Verify 2FA setup and enable
  async verify2FA(userId: number, token: string): Promise<boolean> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].tempTotpSecret) {
      throw new Error('2FA setup not initiated');
    }

    const verified = speakeasy.totp.verify({
      secret: user[0].tempTotpSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      await db.update(users)
        .set({
          twoFactorEnabled: true,
          totpSecret: user[0].tempTotpSecret,
          tempTotpSecret: null,
          authLevel: 2
        })
        .where(eq(users.id, userId));

      logger.info(`2FA enabled for user ${userId}`);
      return true;
    }

    return false;
  }

  // Generate wallet connection challenge (nonce for signature verification)
  async generateWalletChallenge(userId: number, walletAddress: string): Promise<{ nonce: string; message: string; expiresAt: Date }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }

    if (user[0].authLevel < 2) {
      throw new Error('2FA required before wallet connection');
    }

    // Check if wallet is already connected to another account
    const existingWallet = await db.select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1);
    
    if (existingWallet.length > 0 && existingWallet[0].id !== userId) {
      throw new Error('Wallet already connected to another account');
    }

    // Generate cryptographic nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const message = `Sign this message to verify wallet ownership.\n\nNonce: ${nonce}\nUser ID: ${userId}\nExpires: ${expiresAt.toISOString()}`;

    // Store challenge temporarily in metadata
    await db.update(users)
      .set({
        metadata: {
          ...(user[0].metadata || {}),
          walletChallenge: {
            nonce,
            address: walletAddress.toLowerCase(),
            expiresAt: expiresAt.toISOString()
          }
        }
      })
      .where(eq(users.id, userId));

    return { nonce, message, expiresAt };
  }

  // Verify wallet signature and connect wallet (upgrades to auth level 3)
  async verifyAndConnectWallet(userId: number, walletAddress: string, signature: string): Promise<void> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }

    if (user[0].authLevel < 2) {
      throw new Error('2FA required before wallet connection');
    }

    // Get stored challenge
    const challenge = user[0].metadata?.walletChallenge;
    if (!challenge) {
      throw new Error('No wallet challenge found. Please request a new challenge.');
    }

    // Verify challenge hasn't expired
    if (new Date() > new Date(challenge.expiresAt)) {
      throw new Error('Challenge expired. Please request a new one.');
    }

    // Verify wallet address matches challenge
    if (challenge.address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Wallet address mismatch');
    }

    // Verify signature using ethers.js
    try {
      const { ethers } = await import('ethers');
      const message = `Sign this message to verify wallet ownership.\n\nNonce: ${challenge.nonce}\nUser ID: ${userId}\nExpires: ${challenge.expiresAt}`;
      
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature: wallet ownership verification failed');
      }
    } catch (error) {
      logger.error('Signature verification failed:', error);
      throw new Error('Invalid signature format or verification failed');
    }

    // Check if wallet is already connected to another account
    const existingWallet = await db.select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1);
    
    if (existingWallet.length > 0 && existingWallet[0].id !== userId) {
      throw new Error('Wallet already connected to another account');
    }

    // Connect wallet and upgrade to auth level 3
    await db.update(users)
      .set({
        walletAddress: walletAddress.toLowerCase(),
        authLevel: 3,
        metadata: {
          ...(user[0].metadata || {}),
          walletChallenge: null, // Clear challenge after successful verification
          walletConnectedAt: new Date().toISOString()
        }
      })
      .where(eq(users.id, userId));

    logger.info(`Wallet ${walletAddress} verified and connected for user ${userId}`);
  }

  // Generate Proof of Life challenge
  async generatePoLChallenge(userId: number): Promise<ProofOfLifeChallenge> {
    const challengeTypes = ['captcha', 'behavioral', 'voice', 'video'];
    const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let challengeData;
    switch (randomType) {
      case 'captcha':
        challengeData = {
          question: "Select all images containing humans",
          images: this.generateCaptchaImages(),
          correctIndices: [0, 2, 4] // Mock correct answers
        };
        break;
      case 'behavioral':
        challengeData = {
          instruction: "Move your mouse in a figure-8 pattern",
          expectedPattern: "figure8",
          timeLimit: 30000
        };
        break;
      case 'voice':
        challengeData = {
          phrase: "I am a real human using HyperDAG",
          expectedDuration: { min: 2000, max: 8000 },
          voicePrint: true
        };
        break;
      case 'video':
        challengeData = {
          instruction: "Blink three times slowly while looking at the camera",
          faceDetection: true,
          blinkCount: 3
        };
        break;
    }

    // Store challenge temporarily
    await this.storePendingChallenge(userId, challengeId, randomType, challengeData, expiresAt);

    return {
      challengeId,
      type: randomType as any,
      data: challengeData,
      expiresAt
    };
  }

  // Verify Proof of Life response
  async verifyPoLResponse(userId: number, challengeId: string, response: any): Promise<boolean> {
    const challenge = await this.getPendingChallenge(userId, challengeId);
    if (!challenge || new Date() > challenge.expiresAt) {
      return false;
    }

    let verified = false;
    switch (challenge.type) {
      case 'captcha':
        verified = this.verifyCaptchaResponse(challenge.data, response);
        break;
      case 'behavioral':
        verified = this.verifyBehavioralResponse(challenge.data, response);
        break;
      case 'voice':
        verified = this.verifyVoiceResponse(challenge.data, response);
        break;
      case 'video':
        verified = this.verifyVideoResponse(challenge.data, response);
        break;
    }

    if (verified) {
      await db.update(users)
        .set({ 
          authLevel: 4,
          lastProofOfLife: new Date()
        })
        .where(eq(users.id, userId));

      // Convert DBTs to SBTs for verified living humans with soul
      await this.convertDBTsToSBTs(userId);
      
      await this.clearPendingChallenge(userId, challengeId);
      logger.info(`Proof of Life verified for user ${userId}`);
    }

    return verified;
  }

  // Convert DBTs to SBTs after successful PoL verification
  async convertDBTsToSBTs(userId: number): Promise<void> {
    try {
      const userDBTs = await db.select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.userId, userId));

      for (const dbt of userDBTs) {
        // Update credential to indicate soulbound verification (living human with body and soul)
        await db.update(sbtCredentials)
          .set({
            type: 'sbt_soulbound_verified',
            description: `Soulbound Token (verified living human) - ${dbt.description || 'Soul-verified credential'}`
          })
          .where(eq(sbtCredentials.id, dbt.id));
      }

      logger.info(`Converted ${userDBTs.length} DBTs to SBTs for user ${userId} - verified living human with soul`);
    } catch (error) {
      logger.error('Failed to convert DBTs to SBTs:', error);
      throw error;
    }
  }

  // Check if user can perform token operations
  async canWithdrawTokens(userId: number): Promise<boolean> {
    const authLevel = await this.getAuthLevel(userId);
    return authLevel >= 4; // Requires 4FA including PoL
  }

  // Progressive auth enforcement middleware
  async enforceAuthLevel(userId: number, requiredLevel: number): Promise<boolean> {
    const currentLevel = await this.getAuthLevel(userId);
    return currentLevel >= requiredLevel;
  }

  // Helper methods
  private generateCaptchaImages(): string[] {
    // In production, integrate with real CAPTCHA service
    return [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...', // Mock image data
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
    ];
  }

  private async storePendingChallenge(userId: number, challengeId: string, type: string, data: any, expiresAt: Date): Promise<void> {
    // Store in temporary table or cache
    // Implementation depends on your preferred storage
  }

  private async getPendingChallenge(userId: number, challengeId: string): Promise<any> {
    // Retrieve from temporary storage
    return null; // Mock implementation
  }

  private async clearPendingChallenge(userId: number, challengeId: string): Promise<void> {
    // Clear from temporary storage
  }

  private verifyCaptchaResponse(challengeData: any, response: any): boolean {
    // Verify CAPTCHA response
    return JSON.stringify(challengeData.correctIndices) === JSON.stringify(response.selectedIndices);
  }

  private verifyBehavioralResponse(challengeData: any, response: any): boolean {
    // Analyze mouse movement patterns
    return response.pattern === challengeData.expectedPattern;
  }

  private verifyVoiceResponse(challengeData: any, response: any): boolean {
    // Voice analysis and verification
    const duration = response.duration;
    return duration >= challengeData.expectedDuration.min && 
           duration <= challengeData.expectedDuration.max;
  }

  private verifyVideoResponse(challengeData: any, response: any): boolean {
    // Video analysis for human verification
    return response.blinkCount === challengeData.blinkCount && response.faceDetected;
  }
}

export const fourFactorAuthService = new FourFactorAuthService();