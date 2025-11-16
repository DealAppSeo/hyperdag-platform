/**
 * Social Media Service
 * 
 * This service provides functionality for integrating with various social media platforms:
 * - X (Twitter)
 * - Facebook
 * - LinkedIn
 * 
 * It manages verification and connection of accounts, tracking follower/connection counts,
 * and provides badges based on user's social media presence.
 */

import { randomBytes } from 'crypto';
import { storage } from '../storage';

// Social media verification request interface
interface SocialVerificationRequest {
  code: string;
  username: string;
  platform: 'x' | 'facebook' | 'linkedin';
  socialId?: string;
  timestamp: number;
  expires: number; // Timestamp when code expires
}

class SocialMediaService {
  private verificationCodes: Map<string, SocialVerificationRequest> = new Map();
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

  constructor() {
    console.log('[social-media-service] Social media service initialized');
    
    // Clean up expired codes periodically
    setInterval(() => this.cleanupExpiredCodes(), 60 * 1000); // Every minute
  }

  /**
   * Generate a verification code for connecting social media accounts
   */
  public generateVerificationCode(username: string, platform: 'x' | 'facebook' | 'linkedin'): string {
    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code
    this.storeVerificationCode(username, platform, code);
    
    return code;
  }

  /**
   * Store a verification code for a user
   */
  private storeVerificationCode(username: string, platform: 'x' | 'facebook' | 'linkedin', code: string, socialId?: string) {
    const now = Date.now();
    const expires = now + this.EXPIRY_TIME;
    
    const key = `${username.toLowerCase()}:${platform}`;
    
    this.verificationCodes.set(key, {
      code,
      username: username.toLowerCase(),
      platform,
      socialId,
      timestamp: now,
      expires
    });
  }

  /**
   * Check if a verification code is valid
   */
  public verifyCode(username: string, platform: 'x' | 'facebook' | 'linkedin', code: string, socialId?: string): boolean {
    if (!username || !code || !platform) return false;
    
    const key = `${username.toLowerCase()}:${platform}`;
    const request = this.verificationCodes.get(key);
    
    if (!request) return false;
    
    const now = Date.now();
    if (request.expires < now) {
      // Code expired
      this.verificationCodes.delete(key);
      return false;
    }
    
    // For development, accept any code
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      if (socialId) {
        request.socialId = socialId;
      }
      return true;
    }
    
    // Check if code matches
    if (request.code === code) {
      if (socialId) {
        request.socialId = socialId;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Complete the verification process by updating the user's record
   */
  public async completeVerification(
    userId: number, 
    platform: 'x' | 'facebook' | 'linkedin',
    socialId: string,
    username?: string,
    followerCount?: number
  ): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    const updateData: Partial<any> = {};
    
    switch (platform) {
      case 'x':
        updateData.xUsername = username || user.xUsername;
        updateData.xVerified = true;
        if (followerCount !== undefined) {
          updateData.xFollowers = followerCount;
        }
        break;
      case 'facebook':
        updateData.facebookId = socialId;
        updateData.facebookVerified = true;
        if (followerCount !== undefined) {
          updateData.facebookFriends = followerCount;
        }
        break;
      case 'linkedin':
        updateData.linkedinId = socialId;
        updateData.linkedinVerified = true;
        if (followerCount !== undefined) {
          updateData.linkedinConnections = followerCount;
        }
        break;
    }
    
    try {
      const updatedUser = await storage.updateUser(userId, updateData);
      return !!updatedUser;
    } catch (error) {
      console.error(`[social-media-service] Error completing ${platform} verification:`, error);
      return false;
    }
  }

  /**
   * Update social media follower/connection counts
   */
  public async updateSocialStats(
    userId: number,
    platform: 'x' | 'facebook' | 'linkedin',
    count: number
  ): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    const updateData: Partial<any> = {};
    
    switch (platform) {
      case 'x':
        if (!user.xVerified) return false;
        updateData.xFollowers = count;
        break;
      case 'facebook':
        if (!user.facebookVerified) return false;
        updateData.facebookFriends = count;
        break;
      case 'linkedin':
        if (!user.linkedinVerified) return false;
        updateData.linkedinConnections = count;
        break;
    }
    
    try {
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Check if user qualifies for social media influencer badge
      const qualifiesForBadge = this.checkForInfluencerBadge(updatedUser);
      if (qualifiesForBadge) {
        await this.awardInfluencerBadge(userId);
      }
      
      return !!updatedUser;
    } catch (error) {
      console.error(`[social-media-service] Error updating ${platform} stats:`, error);
      return false;
    }
  }

  /**
   * Check if user qualifies for influencer badge
   */
  private checkForInfluencerBadge(user: any): boolean {
    if (!user) return false;
    
    // Define thresholds for each platform
    const thresholds = {
      x: 500,
      facebook: 500,
      linkedin: 500
    };
    
    // Check if user meets any of the thresholds
    if (user.xVerified && user.xFollowers >= thresholds.x) {
      return true;
    }
    
    if (user.facebookVerified && user.facebookFriends >= thresholds.facebook) {
      return true;
    }
    
    if (user.linkedinVerified && user.linkedinConnections >= thresholds.linkedin) {
      return true;
    }
    
    return false;
  }

  /**
   * Award influencer badge to user
   */
  private async awardInfluencerBadge(userId: number): Promise<void> {
    try {
      // Check if user already has the badge
      const badges = await storage.getBadgesByUserId(userId);
      const hasInfluencerBadge = badges.some(badge => badge.type === 'influencer');
      
      if (!hasInfluencerBadge) {
        await storage.createBadge({
          userId,
          type: 'influencer'
        });
        
        // Add activity to reputation
        await storage.createReputationActivity({
          userId,
          type: 'social_influence',
          points: 50,
          description: 'Earned Influencer badge by connecting social media accounts with significant following'
        });
        
        // Also award tokens for achieving this milestone
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserTokens(user.id, user.tokens + 50);
        }
      }
    } catch (error) {
      console.error('[social-media-service] Error awarding influencer badge:', error);
    }
  }

  /**
   * Check connection status for a user on a specific platform
   */
  public async checkConnectionStatus(userId: number, platform: 'x' | 'facebook' | 'linkedin'): Promise<{
    connected: boolean;
    verified: boolean;
    username?: string;
    stats?: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        connected: false,
        verified: false
      };
    }
    
    switch (platform) {
      case 'x':
        return {
          connected: !!user.xUsername,
          verified: !!user.xVerified,
          username: user.xUsername,
          stats: user.xFollowers
        };
      case 'facebook':
        return {
          connected: !!user.facebookId,
          verified: !!user.facebookVerified,
          stats: user.facebookFriends
        };
      case 'linkedin':
        return {
          connected: !!user.linkedinId,
          verified: !!user.linkedinVerified,
          stats: user.linkedinConnections
        };
      default:
        return {
          connected: false,
          verified: false
        };
    }
  }

  /**
   * Clean up expired verification codes
   */
  private cleanupExpiredCodes() {
    const now = Date.now();
    
    for (const [key, request] of this.verificationCodes.entries()) {
      if (request.expires < now) {
        this.verificationCodes.delete(key);
      }
    }
  }

  /**
   * Get social media statistics for a user
   */
  public async getUserSocialStats(userId: number): Promise<{
    platforms: Array<{
      name: string;
      connected: boolean;
      verified: boolean;
      followers?: number;
      username?: string;
    }>;
    totalFollowers: number;
    influence: 'low' | 'medium' | 'high';
    badges: string[];
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        platforms: [],
        totalFollowers: 0,
        influence: 'low',
        badges: []
      };
    }
    
    const platforms = [
      {
        name: 'X',
        connected: !!user.xUsername,
        verified: !!user.xVerified,
        followers: user.xFollowers || 0,
        username: user.xUsername
      },
      {
        name: 'Facebook',
        connected: !!user.facebookId,
        verified: !!user.facebookVerified,
        followers: user.facebookFriends || 0
      },
      {
        name: 'LinkedIn',
        connected: !!user.linkedinId,
        verified: !!user.linkedinVerified,
        followers: user.linkedinConnections || 0
      }
    ];
    
    // Calculate total social reach
    const totalFollowers = (user.xFollowers || 0) + 
                          (user.facebookFriends || 0) + 
                          (user.linkedinConnections || 0);
    
    // Determine influence level
    let influence: 'low' | 'medium' | 'high' = 'low';
    if (totalFollowers > 2000) {
      influence = 'high';
    } else if (totalFollowers > 500) {
      influence = 'medium';
    }
    
    // Get badges
    const badges = await storage.getBadgesByUserId(userId);
    const badgeTypes = badges.map(badge => badge.type);
    
    return {
      platforms,
      totalFollowers,
      influence,
      badges: badgeTypes
    };
  }
}

// Create singleton instance
export const socialMediaService = new SocialMediaService();

// Export methods for use in other services
export const generateVerificationCode = (username: string, platform: 'x' | 'facebook' | 'linkedin'): string =>
  socialMediaService.generateVerificationCode(username, platform);

export const verifyCode = (username: string, platform: 'x' | 'facebook' | 'linkedin', code: string, socialId?: string): boolean =>
  socialMediaService.verifyCode(username, platform, code, socialId);

export const completeVerification = (
  userId: number, 
  platform: 'x' | 'facebook' | 'linkedin',
  socialId: string, 
  username?: string,
  followerCount?: number
): Promise<boolean> =>
  socialMediaService.completeVerification(userId, platform, socialId, username, followerCount);

export const updateSocialStats = (
  userId: number,
  platform: 'x' | 'facebook' | 'linkedin',
  count: number
): Promise<boolean> =>
  socialMediaService.updateSocialStats(userId, platform, count);

export const checkConnectionStatus = (
  userId: number,
  platform: 'x' | 'facebook' | 'linkedin'
): Promise<{
  connected: boolean;
  verified: boolean;
  username?: string;
  stats?: number;
}> =>
  socialMediaService.checkConnectionStatus(userId, platform);

export const getUserSocialStats = (userId: number): Promise<{
  platforms: Array<{
    name: string;
    connected: boolean;
    verified: boolean;
    followers?: number;
    username?: string;
  }>;
  totalFollowers: number;
  influence: 'low' | 'medium' | 'high';
  badges: string[];
}> =>
  socialMediaService.getUserSocialStats(userId);