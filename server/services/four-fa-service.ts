/**
 * Four-Factor Authentication (4FA) Service
 * 
 * This service manages the advanced authentication system for HyperDAG, which includes:
 * 1. Knowledge factor (username/password)
 * 2. Email verification
 * 3. Time-based OTP (TOTP)
 * 4. Wallet signature verification
 */

import { db } from '../db';
import * as schema from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { walletBridgeService } from './wallet-bridge-service';
import { polygonService } from './polygon-service';
import { solanaService } from './solana-service';
import { ethers } from 'ethers';

const scryptAsync = promisify(scrypt);

interface AuthFactors {
  factor1: boolean; // Knowledge (username/password)
  factor2: boolean; // Email verification
  factor3: boolean; // Time-based OTP
  factor4: boolean; // Wallet signature
}

export class FourFAService {
  /**
   * Initialize the 4FA service
   */
  constructor() {
    logger.info('[4FA] Four-Factor Authentication service initialized');
  }

  /**
   * Get the authentication factors status for a user
   */
  async getAuthFactorsStatus(userId: number): Promise<AuthFactors> {
    try {
      const [user] = await db
        .select({
          passwordSet: schema.users.password,
          emailVerified: schema.users.emailVerified,
          twoFactorEnabled: schema.users.twoFactorEnabled,
          walletAddress: schema.users.walletAddress,
          connectedWallets: schema.users.connectedWallets,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      return {
        factor1: !!user.passwordSet, // Knowledge factor is always true if password exists
        factor2: !!user.emailVerified, // Email verification
        factor3: !!user.twoFactorEnabled, // TOTP 2FA
        factor4: !!user.walletAddress || Object.keys(user.connectedWallets || {}).length > 0, // Wallet connection
      };
    } catch (error) {
      logger.error('[4FA] Error getting auth status', error);
      throw error;
    }
  }

  /**
   * Get the current authentication level based on verified factors
   * Level 0: No factors verified (impossible if user exists)
   * Level 1: Knowledge factor only (username/password)
   * Level 2: Knowledge + one additional factor
   * Level 3: Knowledge + two additional factors
   * Level 4: All four factors verified
   */
  async getAuthLevel(userId: number): Promise<number> {
    try {
      const factors = await this.getAuthFactorsStatus(userId);
      
      // Count verified factors (factor1 should always be true for registered users)
      let verifiedCount = 0;
      if (factors.factor1) verifiedCount++;
      if (factors.factor2) verifiedCount++;
      if (factors.factor3) verifiedCount++;
      if (factors.factor4) verifiedCount++;
      
      return verifiedCount;
    } catch (error) {
      logger.error('[4FA] Error getting auth level', error);
      return 1; // Default to level 1 if there's an error
    }
  }

  /**
   * Update the auth level in the database
   */
  async updateAuthLevel(userId: number): Promise<number> {
    try {
      const level = await this.getAuthLevel(userId);
      
      await db
        .update(schema.users)
        .set({ authLevel: level })
        .where(eq(schema.users.id, userId));
      
      return level;
    } catch (error) {
      logger.error('[4FA] Error updating auth level', error);
      throw error;
    }
  }

  /**
   * Generate a TOTP secret for 2FA setup
   */
  async generateTOTPSecret(userId: number, username: string): Promise<{secret: string, qrCodeUrl: string}> {
    try {
      const secret = authenticator.generateSecret();
      const serviceName = 'HyperDAG';
      const otpauth = authenticator.keyuri(username, serviceName, secret);
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(otpauth);
      
      // Store the secret temporarily (will be confirmed when user verifies a code)
      await db
        .insert(schema.verificationCodes)
        .values({
          userId: userId,
          code: secret,
          type: '2fa-setup',
          expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });
      
      return { secret, qrCodeUrl };
    } catch (error) {
      logger.error('[4FA] Error generating TOTP secret', error);
      throw error;
    }
  }

  /**
   * Verify a TOTP code during 2FA setup
   */
  async verifyAndEnableTOTP(userId: number, secret: string, token: string): Promise<boolean> {
    try {
      // Verify the token against the secret
      const isValid = authenticator.verify({ token, secret });
      
      if (!isValid) {
        return false;
      }
      
      // Store the verified secret
      await db
        .update(schema.users)
        .set({
          twoFactorSecret: secret,
          twoFactorEnabled: true,
        })
        .where(eq(schema.users.id, userId));
      
      // Clean up temporary verification code
      await db
        .delete(schema.verificationCodes)
        .where(and(
          eq(schema.verificationCodes.userId, userId),
          eq(schema.verificationCodes.type, '2fa-setup')
        ));
      
      // Update auth level
      await this.updateAuthLevel(userId);
      
      return true;
    } catch (error) {
      logger.error('[4FA] Error verifying TOTP', error);
      return false;
    }
  }

  /**
   * Verify a TOTP code during login
   */
  async verifyTOTP(userId: number, token: string): Promise<boolean> {
    try {
      // Get the user's 2FA secret
      const [user] = await db
        .select({
          twoFactorSecret: schema.users.twoFactorSecret,
          twoFactorEnabled: schema.users.twoFactorEnabled,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId));
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return false;
      }
      
      // Verify the token
      return authenticator.verify({ token, secret: user.twoFactorSecret });
    } catch (error) {
      logger.error('[4FA] Error verifying TOTP during login', error);
      return false;
    }
  }

  /**
   * Disable TOTP 2FA
   */
  async disableTOTP(userId: number): Promise<boolean> {
    try {
      await db
        .update(schema.users)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
        })
        .where(eq(schema.users.id, userId));
      
      // Update auth level
      await this.updateAuthLevel(userId);
      
      return true;
    } catch (error) {
      logger.error('[4FA] Error disabling TOTP', error);
      return false;
    }
  }

  /**
   * Verify wallet ownership via signature
   */
  async verifyWalletSignature(userId: number, walletAddress: string, signature: string, network = 'polygon'): Promise<boolean> {
    try {
      // Verify wallet ownership using network-specific service
      let result = false;
      
      // Implement direct signature verification since wallet services don't have this method
      try {
        switch (network.toLowerCase()) {
          case 'polygon':
            // For Ethereum/Polygon: verify the signature using ethers.js
            // Signature is assumed to be a signature of a standard message
            const message = `Verify wallet ownership for HyperDAG 4FA: ${walletAddress}`;
            // Using ethers v6 signature verification
            const verifiedAddress = ethers.recoverAddress(ethers.hashMessage(message), signature);
            result = verifiedAddress.toLowerCase() === walletAddress.toLowerCase();
            break;
          case 'solana':
            // For Solana: we'd verify using solana/web3.js
            // This is simplified for now
            logger.info(`[4FA] Solana verification not fully implemented yet`);
            result = true; // Simplified for MVP
            break;
          default:
            logger.error(`[4FA] Unsupported network: ${network}`);
            return false;
        }
      } catch (error: any) {
        logger.error(`[4FA] Error verifying wallet signature: ${error?.message || 'Unknown error'}`);
        return false;
      }
      
      if (result) {
        // Update the user's connected wallets
        const [user] = await db
          .select({
            connectedWallets: schema.users.connectedWallets,
          })
          .from(schema.users)
          .where(eq(schema.users.id, userId));
        
        if (!user) {
          return false;
        }
        
        const connectedWallets = user.connectedWallets || {};
        connectedWallets[network.toLowerCase()] = walletAddress;
        
        await db
          .update(schema.users)
          .set({
            walletAddress: walletAddress, // Main wallet address
            connectedWallets: connectedWallets,
          })
          .where(eq(schema.users.id, userId));
        
        // Update auth level
        await this.updateAuthLevel(userId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('[4FA] Error verifying wallet signature', error);
      return false;
    }
  }

  /**
   * Send email verification code
   */
  async sendEmailVerificationCode(userId: number, email: string): Promise<boolean> {
    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code
      await db
        .insert(schema.verificationCodes)
        .values({
          userId: userId,
          code,
          type: 'email-verification',
          expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });
      
      // In a real implementation, send an email with the code
      // For development, we'll log it
      logger.info(`[4FA] Email verification code for user ${userId}: ${code}`);
      
      return true;
    } catch (error) {
      logger.error('[4FA] Error sending email verification code', error);
      return false;
    }
  }

  /**
   * Verify email verification code
   */
  async verifyEmailCode(userId: number, code: string): Promise<boolean> {
    try {
      // Get the verification code
      const [verificationCode] = await db
        .select()
        .from(schema.verificationCodes)
        .where(and(
          eq(schema.verificationCodes.userId, userId),
          eq(schema.verificationCodes.type, 'email-verification'),
          eq(schema.verificationCodes.code, code)
        ));
      
      if (!verificationCode) {
        return false;
      }
      
      // Check if code is expired
      if (verificationCode.expires < new Date()) {
        return false;
      }
      
      // Mark the email as verified
      await db
        .update(schema.users)
        .set({
          emailVerified: true,
        })
        .where(eq(schema.users.id, userId));
      
      // Delete the verification code
      await db
        .delete(schema.verificationCodes)
        .where(eq(schema.verificationCodes.id, verificationCode.id));
      
      // Update auth level
      await this.updateAuthLevel(userId);
      
      return true;
    } catch (error) {
      logger.error('[4FA] Error verifying email code', error);
      return false;
    }
  }

  /**
   * Calculate the authentication level needed for a specific feature
   * This can be used to determine if a user has enough auth factors to access a feature
   * 
   * @param featureId Unique identifier for the feature
   * @returns Authentication level required (1-4)
   */
  getRequiredAuthLevelForFeature(featureId: string): number {
    // Feature-specific auth level requirements
    const featureRequirements: Record<string, number> = {
      // Public features (Level 1: basic login)
      'view-profile': 1,
      'browse-projects': 1,
      'view-rfis': 1,
      
      // Enhanced security features (Level 2: login + one more factor)
      'create-rfi': 2,
      'comment': 2,
      'join-team': 2,
      
      // Sensitive features (Level 3: login + two more factors)
      'create-rfp': 3,
      'vote-rfp': 3,
      'update-profile': 3,
      
      // Critical features (Level 4: all factors)
      'transfer-tokens': 4,
      'withdraw-funds': 4,
      'admin-functions': 4,
    };
    
    return featureRequirements[featureId] || 1; // Default to level 1 if not specified
  }
}

export const fourFAService = new FourFAService();