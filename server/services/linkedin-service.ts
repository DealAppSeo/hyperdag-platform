/**
 * LinkedIn Service
 * 
 * This service provides integration with the LinkedIn API for:
 * - OAuth 2.0 authentication
 * - Reading user profile information
 * - Getting connection counts
 * - Posting content (with privacy-preserving options)
 */

import axios from 'axios';
import { createHash } from 'crypto';
import { storage } from '../storage';

// Interface for LinkedIn API user response
interface LinkedInUserResponse {
  id: string;
  firstName: {
    localized: {
      [key: string]: string;
    };
  };
  lastName: {
    localized: {
      [key: string]: string;
    };
  };
  profilePicture?: {
    displayImage: string;
  };
  // Other profile fields
}

// Interface for LinkedIn API connections response
interface LinkedInConnectionsResponse {
  elements: Array<{
    miniProfile: {
      id: string;
      firstName: {
        localized: {
          [key: string]: string;
        };
      };
      lastName: {
        localized: {
          [key: string]: string;
        };
      };
    };
  }>;
  paging?: {
    count: number;
    start: number;
    total: number;
  };
}

class LinkedInService {
  private readonly API_BASE = 'https://api.linkedin.com/v2';
  private readonly AUTH_BASE = 'https://www.linkedin.com/oauth/v2';
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;
  
  constructor() {
    // Load environment variables
    this.CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
    this.CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
    this.REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/oauth/linkedin/callback';
    
    if (process.env.NODE_ENV === 'production' && (!this.CLIENT_ID || !this.CLIENT_SECRET)) {
      console.warn('[linkedin-service] Missing LinkedIn API credentials. LinkedIn integration will be unavailable.');
    } else {
      console.log('[linkedin-service] LinkedIn service initialized');
    }
  }
  
  /**
   * Get authorization URL for LinkedIn OAuth2
   */
  public getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: 'r_liteprofile r_emailaddress',
      state: state
    });
    
    return `${this.AUTH_BASE}/authorization?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } | null> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock token
        return {
          access_token: 'mock_linkedin_access_token',
          expires_in: 7200
        };
      }
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET
      });
      
      const response = await axios.post(`${this.AUTH_BASE}/accessToken`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('[linkedin-service] Error exchanging code for token:', error);
      return null;
    }
  }
  
  /**
   * Get user profile from LinkedIn API
   */
  public async getUserProfile(accessToken: string): Promise<{
    id: string;
    name: string;
    profileImageUrl?: string;
    connectionCount: number;
  } | null> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock profile
        return {
          id: 'mock_linkedin_id_123456',
          name: 'HyperDAG Professional',
          profileImageUrl: 'https://via.placeholder.com/200',
          connectionCount: 325
        };
      }
      
      // Request user profile
      const profileResponse = await axios.get(
        `${this.API_BASE}/me?projection=(id,firstName,lastName,profilePicture)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const userData = profileResponse.data as LinkedInUserResponse;
      
      // Get primary locale
      const primaryLocale = Object.keys(userData.firstName.localized)[0];
      
      // Get connection count (approximated from API response)
      const connectionCount = await this.getConnectionCount(accessToken);
      
      return {
        id: userData.id,
        name: `${userData.firstName.localized[primaryLocale]} ${userData.lastName.localized[primaryLocale]}`,
        profileImageUrl: userData.profilePicture?.displayImage,
        connectionCount
      };
    } catch (error) {
      console.error('[linkedin-service] Error getting user profile:', error);
      return null;
    }
  }
  
  /**
   * Get connection count for a user
   * Note: LinkedIn's API has limitations on connection data access
   */
  public async getConnectionCount(accessToken: string): Promise<number> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // For development, return a mock count
        return 325;
      }
      
      // Request connections for the user
      // Note: LinkedIn API might restrict this data, so this is an approximation
      const response = await axios.get(
        `${this.API_BASE}/connections?start=0&count=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const connectionsData = response.data as LinkedInConnectionsResponse;
      return connectionsData.paging?.total || 0;
    } catch (error) {
      console.error('[linkedin-service] Error getting connection count:', error);
      return 0;
    }
  }
  
  /**
   * Update a user record with LinkedIn data
   */
  public async updateUserWithLinkedInData(
    userId: number,
    linkedinId: string,
    name: string,
    connectionCount: number
  ): Promise<boolean> {
    try {
      // Hash the LinkedIn ID for privacy
      const linkedinIdHash = createHash('sha256')
        .update(`linkedin:${linkedinId}`)
        .digest('hex');
      
      const updateData = {
        linkedinIdHash: linkedinIdHash,
        linkedinVerified: true,
        linkedinConnections: connectionCount,
        lastUpdated: new Date()
      };
      
      await storage.updateUser(userId, updateData);
      
      // Check if user qualifies for influencer badge
      if (connectionCount >= 500) {
        await this.checkForInfluencerBadge(userId);
      }
      
      return true;
    } catch (error) {
      console.error('[linkedin-service] Error updating user with LinkedIn data:', error);
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
          description: 'Earned Influencer badge with significant LinkedIn network'
        });
        
        // Award tokens for achieving this milestone
        const user = await storage.getUser(userId);
        if (user && typeof user.tokens === 'number') {
          await storage.updateUserTokens(user.id, user.tokens + 50);
        }
      }
    } catch (error) {
      console.error('[linkedin-service] Error checking for influencer badge:', error);
    }
  }
}

// Create and export a singleton instance
export const linkedinService = new LinkedInService();