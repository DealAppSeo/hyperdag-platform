/**
 * Telegram Authentication Service for HyperDAG
 * 
 * Implements Telegram Login Widget authentication flow
 * - Secure login verification using Telegram's OAuth
 * - User account creation and linking
 * - Privacy-preserving authentication options
 */

import crypto from 'crypto';
import { storage } from '../storage';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: number;
}

class TelegramAuthService {
  private botToken: string | undefined;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
  }

  /**
   * Verify Telegram authentication data
   * Uses the same method as Telegram's Login Widget verification
   */
  verifyTelegramAuth(authData: TelegramAuthData): boolean {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    // For development, accept test data
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return true;
    }

    const { hash, ...data } = authData;

    // Create data check string
    const dataCheckString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key as keyof typeof data]}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash matches
    if (hash !== expectedHash) {
      return false;
    }

    // Check auth_date is not too old (24 hours)
    const currentTime = Math.floor(Date.now() / 1000);
    const authAge = currentTime - authData.auth_date;
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    return authAge <= maxAge;
  }

  /**
   * Convert Telegram auth data to user object
   */
  private parseTelegramUser(authData: TelegramAuthData): TelegramUser {
    return {
      id: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      username: authData.username,
      photoUrl: authData.photo_url,
      authDate: authData.auth_date
    };
  }

  /**
   * Hash Telegram ID for privacy
   */
  private hashTelegramId(telegramId: number): string {
    return crypto
      .createHash('sha256')
      .update(`telegram_${telegramId}`)
      .digest('hex');
  }

  /**
   * Encrypt Telegram auth data for storage
   */
  private encryptTelegramData(telegramUser: TelegramUser): string {
    const data = JSON.stringify(telegramUser);
    // Simple encryption - in production, use proper encryption
    return Buffer.from(data).toString('base64');
  }

  /**
   * Find existing user by Telegram ID
   */
  async findUserByTelegramId(telegramId: number): Promise<any | null> {
    try {
      const hashedId = this.hashTelegramId(telegramId);
      
      // Query database directly for users with matching Telegram auth
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq, or } = await import('drizzle-orm');
      
      const result = await db.select().from(users).where(
        or(
          eq(users.telegramAuthHash, hashedId),
          eq(users.telegramAuthId, telegramId.toString())
        )
      ).limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by Telegram ID:', error);
      return null;
    }
  }

  /**
   * Create new user account from Telegram data
   */
  async createUserFromTelegram(telegramUser: TelegramUser): Promise<any> {
    const hashedId = this.hashTelegramId(telegramUser.id);
    const encryptedData = this.encryptTelegramData(telegramUser);
    
    // Generate unique username from Telegram data
    let username = telegramUser.username;
    
    // If no Telegram username, create a better default
    if (!username) {
      const firstName = telegramUser.firstName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const lastName = telegramUser.lastName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      username = lastName ? `${firstName}_${lastName}` : firstName;
    }
    
    // Ensure username is unique
    let counter = 1;
    let finalUsername = username;
    while (await storage.getUserByUsername(finalUsername)) {
      finalUsername = `${username}_${counter}`;
      counter++;
    }

    // Generate referral code
    const referralCode = crypto.randomBytes(8).toString('hex');

    const newUser = await storage.createUser({
      username: finalUsername,
      password: crypto.randomBytes(32).toString('hex'), // Random password since using Telegram auth
      telegramAuthId: telegramUser.id.toString(),
      telegramAuthHash: hashedId,
      telegramAuthData: encryptedData,
      authMethods: {
        password: false,
        wallet: false,
        telegram: true,
        google: false,
        discord: false,
        github: false,
        twitter: false,
        medium: false,
        stackoverflow: false
      },
      referralCode,
      authLevel: 2, // Enhanced auth level for OAuth users
      onboardingStage: 3, // Skip basic stages for OAuth users
      settings: {
        communication: {
          channels: {
            telegram: true,
            email: false,
            sms: false,
            inApp: true,
            slack: false
          }
        }
      }
    });

    return newUser;
  }

  /**
   * Link Telegram account to existing user
   */
  async linkTelegramToUser(userId: number, telegramUser: TelegramUser): Promise<any> {
    const hashedId = this.hashTelegramId(telegramUser.id);
    const encryptedData = this.encryptTelegramData(telegramUser);

    return await storage.updateUser(userId, {
      telegramAuthId: telegramUser.id.toString(),
      telegramAuthHash: hashedId,
      telegramAuthData: encryptedData,
      authMethods: {
        telegram: true
      }
    });
  }

  /**
   * Main authentication flow
   */
  async authenticateWithTelegram(authData: TelegramAuthData): Promise<{
    success: boolean;
    user?: any;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      // Verify authentication data
      if (!this.verifyTelegramAuth(authData)) {
        return {
          success: false,
          error: 'Invalid Telegram authentication data'
        };
      }

      const telegramUser = this.parseTelegramUser(authData);

      // Check if user already exists
      let existingUser = await this.findUserByTelegramId(telegramUser.id);

      if (existingUser) {
        // Update auth data and return existing user
        await this.linkTelegramToUser(existingUser.id, telegramUser);
        return {
          success: true,
          user: existingUser,
          isNewUser: false
        };
      } else {
        // Create new user
        const newUser = await this.createUserFromTelegram(telegramUser);
        return {
          success: true,
          user: newUser,
          isNewUser: true
        };
      }
    } catch (error) {
      console.error('Telegram authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Get Telegram login configuration for frontend
   */
  getLoginConfig(): {
    available: boolean;
    botUsername?: string;
    redirectUrl: string;
  } {
    return {
      available: !!this.botToken,
      botUsername: 'HyperDagBot', // The actual bot username without @
      redirectUrl: '/api/auth/telegram/callback'
    };
  }

  /**
   * Generate login URL for Telegram OAuth
   */
  generateLoginUrl(redirectUrl?: string): string {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const baseUrl = 'https://oauth.telegram.org/auth';
    const params = new URLSearchParams({
      bot_id: this.botToken.split(':')[0],
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://hyperdag.org' 
        : 'https://hyper-dag-manager-1-dealappseo.replit.app',
      return_to: redirectUrl || '/api/auth/telegram/callback'
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

export const telegramAuthService = new TelegramAuthService();