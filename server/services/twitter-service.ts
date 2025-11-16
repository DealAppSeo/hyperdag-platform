/**
 * Twitter/X Service
 * 
 * This service provides integration with the Twitter/X API for:
 * - OAuth 2.0 authentication
 * - Reading user profile information
 * - Getting follower counts
 * - Posting tweets (with privacy-preserving options)
 */

import axios from 'axios';
import { createHash } from 'crypto';
import { storage } from '../storage';

// Interface for Twitter API user response
interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    verified?: boolean;
    public_metrics?: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
      listed_count: number;
    };
  };
}

// Interface for Twitter API followers response
interface TwitterFollowersResponse {
  data: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  meta: {
    result_count: number;
    next_token?: string;
  };
}

class TwitterService {
  private readonly API_BASE = 'https://api.twitter.com/2';
  private readonly AUTH_BASE = 'https://api.twitter.com/oauth2';
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;
  
  constructor() {
    // Load environment variables
    this.CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
    this.CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
    this.REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/oauth/twitter/callback';
    
    if (process.env.NODE_ENV === 'production' && (!this.CLIENT_ID || !this.CLIENT_SECRET)) {
      console.warn('[twitter-service] Missing Twitter API credentials. Twitter integration will be unavailable.');
    } else {
      console.log('[twitter-service] Twitter service initialized');
    }
  }
  
  /**
   * Get authorization URL for Twitter OAuth2
   */
  public getAuthUrl(state: string): string {
    // Use PKCE for additional security
    const codeChallenge = createHash('sha256').update(state).digest('base64url');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: 'tweet.read users.read follows.read',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    return `${this.AUTH_BASE}/authorize?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string, verifier: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } | null> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock token
        return {
          access_token: 'mock_twitter_access_token',
          expires_in: 7200
        };
      }
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        code_verifier: verifier
      });
      
      const response = await axios.post(`${this.AUTH_BASE}/token`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`
        }
      });
      
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('[twitter-service] Error exchanging code for token:', error);
      return null;
    }
  }
  
  /**
   * Get user profile from Twitter API
   */
  public async getUserProfile(accessToken: string): Promise<{
    id: string;
    username: string;
    name: string;
    followerCount: number;
    profileImageUrl?: string;
    verified?: boolean;
  } | null> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock profile
        return {
          id: 'mock_twitter_id_123456',
          username: 'hyperdag_user',
          name: 'HyperDAG User',
          followerCount: 250,
          profileImageUrl: 'https://via.placeholder.com/200',
          verified: false
        };
      }
      
      // Request user profile with follower metrics
      const response = await axios.get(
        `${this.API_BASE}/users/me?user.fields=public_metrics,profile_image_url,verified`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const userData = response.data as TwitterUserResponse;
      
      return {
        id: userData.data.id,
        username: userData.data.username,
        name: userData.data.name,
        followerCount: userData.data.public_metrics?.followers_count || 0,
        profileImageUrl: userData.data.profile_image_url,
        verified: userData.data.verified
      };
    } catch (error) {
      console.error('[twitter-service] Error getting user profile:', error);
      return null;
    }
  }
  
  /**
   * Get follower count for a user
   */
  public async getFollowerCount(userId: string, accessToken: string): Promise<number> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock count
        return 250;
      }
      
      // Request follower metrics for the user
      const response = await axios.get(
        `${this.API_BASE}/users/${userId}?user.fields=public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const userData = response.data as TwitterUserResponse;
      return userData.data.public_metrics?.followers_count || 0;
    } catch (error) {
      console.error('[twitter-service] Error getting follower count:', error);
      return 0;
    }
  }
  
  /**
   * Update a user record with Twitter data
   */
  public async updateUserWithTwitterData(
    userId: number,
    twitterId: string,
    username: string,
    followerCount: number
  ): Promise<boolean> {
    try {
      // Hash the Twitter ID for privacy
      const twitterIdHash = createHash('sha256')
        .update(`twitter:${twitterId}`)
        .digest('hex');
      
      const updateData = {
        xIdHash: twitterIdHash,
        xUsername: username,
        xVerified: true,
        xFollowers: followerCount,
        lastUpdated: new Date()
      };
      
      await storage.updateUser(userId, updateData);
      
      // Check if user qualifies for influencer badge
      if (followerCount >= 500) {
        await this.checkForInfluencerBadge(userId);
      }
      
      return true;
    } catch (error) {
      console.error('[twitter-service] Error updating user with Twitter data:', error);
      return false;
    }
  }
  
  /**
   * Check if user qualifies for influencer badge
   */
  private async checkForInfluencerBadge(userId: number): Promise<void> {
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
          description: 'Earned Influencer badge with significant Twitter following'
        });
        
        // Award tokens for achieving this milestone
        const user = await storage.getUser(userId);
        if (user && typeof user.tokens === 'number') {
          await storage.updateUserTokens(user.id, user.tokens + 50);
        }
      }
    } catch (error) {
      console.error('[twitter-service] Error checking for influencer badge:', error);
    }
  }
}

// Create and export a singleton instance
export const twitterService = new TwitterService();