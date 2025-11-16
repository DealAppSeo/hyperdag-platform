/**
 * OAuth Service
 * 
 * Provides OAuth integration with various social media providers
 */
import { db } from '../db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { 
  SupportedOAuthProvider, 
  OAuthProviderInterface, 
  OAuthCallbackResult,
  OAuthTokenResponse,
  OAuthProfile,
  TwitterProfile,
  GoogleProfile,
  LinkedInProfile,
  YouTubeProfile,
  DiscordProfile,
  GitHubProfile,
  MediumProfile,
  StackOverflowProfile
} from '../types/oauth-types';
import axios from 'axios';
import crypto from 'crypto';

// Base OAuth provider class that implements common functionality
abstract class BaseOAuthProvider implements OAuthProviderInterface {
  protected clientId: string;
  protected clientSecret: string;
  protected provider: SupportedOAuthProvider;
  protected baseAuthUrl: string;
  protected tokenUrl: string;
  protected profileUrl: string;
  protected scopes: string[];
  protected appUrl: string;

  constructor(provider: SupportedOAuthProvider) {
    this.provider = provider;
    this.appUrl = process.env.APP_URL || '';
    
    // Provider-specific initialization
    switch (provider) {
      case SupportedOAuthProvider.TWITTER:
        this.clientId = process.env.TWITTER_CLIENT_ID || '';
        this.clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://twitter.com/i/oauth2/authorize';
        this.tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        this.profileUrl = 'https://api.twitter.com/2/users/me';
        this.scopes = ['tweet.read', 'users.read', 'offline.access'];
        break;
        
      case SupportedOAuthProvider.GOOGLE:
        this.clientId = process.env.GOOGLE_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        this.tokenUrl = 'https://oauth2.googleapis.com/token';
        this.profileUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
        this.scopes = ['profile', 'email'];
        break;
        
      case SupportedOAuthProvider.LINKEDIN:
        this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
        this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://www.linkedin.com/oauth/v2/authorization';
        this.tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        this.profileUrl = 'https://api.linkedin.com/v2/me';
        this.scopes = ['r_liteprofile', 'r_emailaddress'];
        break;
        
      case SupportedOAuthProvider.YOUTUBE:
        this.clientId = process.env.YOUTUBE_CLIENT_ID || '';
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        this.tokenUrl = 'https://oauth2.googleapis.com/token';
        this.profileUrl = 'https://www.googleapis.com/youtube/v3/channels';
        this.scopes = ['https://www.googleapis.com/auth/youtube.readonly'];
        break;
        
      case SupportedOAuthProvider.DISCORD:
        this.clientId = process.env.DISCORD_CLIENT_ID || '';
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://discord.com/api/oauth2/authorize';
        this.tokenUrl = 'https://discord.com/api/oauth2/token';
        this.profileUrl = 'https://discord.com/api/users/@me';
        this.scopes = ['identify', 'email'];
        break;
        
      case SupportedOAuthProvider.GITHUB:
        this.clientId = process.env.GITHUB_CLIENT_ID || '';
        this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://github.com/login/oauth/authorize';
        this.tokenUrl = 'https://github.com/login/oauth/access_token';
        this.profileUrl = 'https://api.github.com/user';
        this.scopes = ['read:user', 'user:email'];
        break;
        
      case SupportedOAuthProvider.MEDIUM:
        this.clientId = process.env.MEDIUM_CLIENT_ID || '';
        this.clientSecret = process.env.MEDIUM_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://medium.com/m/oauth/authorize';
        this.tokenUrl = 'https://medium.com/v1/tokens';
        this.profileUrl = 'https://api.medium.com/v1/me';
        this.scopes = ['basicProfile', 'listPublications'];
        break;
        
      case SupportedOAuthProvider.STACKOVERFLOW:
        this.clientId = process.env.STACKOVERFLOW_CLIENT_ID || '';
        this.clientSecret = process.env.STACKOVERFLOW_CLIENT_SECRET || '';
        this.baseAuthUrl = 'https://stackoverflow.com/oauth';
        this.tokenUrl = 'https://stackoverflow.com/oauth/access_token';
        this.profileUrl = 'https://api.stackexchange.com/2.3/me';
        this.scopes = ['read_inbox', 'private_info'];
        break;
        
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    // Validate required environment variables
    if (!this.clientId || !this.clientSecret) {
      console.warn(`[OAuth] Missing credentials for ${provider}`);
    }
    
    if (!this.appUrl) {
      console.warn('[OAuth] Missing APP_URL environment variable, OAuth callbacks may not work correctly');
    }
  }

  /**
   * Generate a secure random state for CSRF protection
   */
  protected generateState(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthorizationUrl(redirectUri?: string): Promise<string> {
    if (!this.clientId) {
      throw new Error(`OAuth configuration missing for ${this.provider}`);
    }
    
    const state = this.generateState();
    const scopeStr = this.scopes.join(' ');
    
    // Use provided redirect URI or default to our standard one
    const finalRedirectUri = redirectUri || `${this.appUrl}/api/oauth/${this.provider}/callback`;
    
    // Build URL with provider-specific parameters
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: finalRedirectUri,
      scope: scopeStr,
      state,
      response_type: 'code'
    });
    
    return `${this.baseAuthUrl}?${params.toString()}`;
  }

  /**
   * Exchange code for tokens
   */
  protected async getTokens(code: string, redirectUri?: string): Promise<OAuthTokenResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(`OAuth configuration missing for ${this.provider}`);
    }
    
    const finalRedirectUri = redirectUri || `${this.appUrl}/api/oauth/${this.provider}/callback`;
    
    // Token exchange params - these may vary by provider
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: finalRedirectUri,
      grant_type: 'authorization_code'
    });
    
    try {
      // For GitHub which uses Accept: application/json
      const headers = { Accept: 'application/json' };
      
      // Exchange code for tokens
      const response = await axios.post(this.tokenUrl, params.toString(), { headers });
      
      return response.data;
    } catch (error) {
      console.error(`[OAuth] Token exchange error for ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh an access token using the refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(`OAuth configuration missing for ${this.provider}`);
    }
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    try {
      const headers = { Accept: 'application/json' };
      const response = await axios.post(this.tokenUrl, params.toString(), { headers });
      
      return response.data;
    } catch (error) {
      console.error(`[OAuth] Token refresh error for ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Save social connection to user profile
   */
  async saveSocialConnection(userId: number, profileData: OAuthProfile): Promise<void> {
    try {
      // Base data to update for all providers
      const updateData: any = {};
      
      // For each provider, update the specific fields based on our schema
      switch (this.provider) {
        case SupportedOAuthProvider.TWITTER:
          updateData.xIdHash = this.hashIdentifier(profileData.id);
          updateData.xUsername = (profileData as TwitterProfile).username;
          updateData.xVerified = true;
          if ((profileData as TwitterProfile).followersCount) {
            updateData.xFollowers = (profileData as TwitterProfile).followersCount;
          }
          break;
          
        case SupportedOAuthProvider.GOOGLE:
          updateData.googleIdHash = this.hashIdentifier(profileData.id);
          updateData.googleVerified = true;
          // Update email if available and not already set
          if ((profileData as GoogleProfile).email) {
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user.length > 0 && !user[0].email) {
              updateData.email = (profileData as GoogleProfile).email;
            }
          }
          break;
          
        case SupportedOAuthProvider.LINKEDIN:
          updateData.linkedinIdHash = this.hashIdentifier(profileData.id);
          updateData.linkedinVerified = true;
          if ((profileData as LinkedInProfile).connectionCount) {
            updateData.linkedinConnections = (profileData as LinkedInProfile).connectionCount;
          }
          break;
          
        case SupportedOAuthProvider.YOUTUBE:
          updateData.youtubeIdHash = this.hashIdentifier(profileData.id);
          updateData.youtubeVerified = true;
          if ((profileData as YouTubeProfile).subscriberCount) {
            updateData.youtubeSubscribers = (profileData as YouTubeProfile).subscriberCount;
          }
          break;
          
        case SupportedOAuthProvider.DISCORD:
          updateData.discordIdHash = this.hashIdentifier(profileData.id);
          updateData.discordVerified = true;
          updateData.discordUsername = (profileData as DiscordProfile).username;
          break;
          
        case SupportedOAuthProvider.GITHUB:
          updateData.githubIdHash = this.hashIdentifier(profileData.id);
          updateData.githubVerified = true;
          if ((profileData as GitHubProfile).followers) {
            updateData.githubFollowers = (profileData as GitHubProfile).followers;
          }
          break;
          
        case SupportedOAuthProvider.MEDIUM:
          updateData.mediumIdHash = this.hashIdentifier(profileData.id);
          updateData.mediumUsername = (profileData as MediumProfile).username;
          updateData.mediumVerified = true;
          if ((profileData as MediumProfile).followersCount) {
            updateData.mediumFollowers = (profileData as MediumProfile).followersCount;
          }
          if ((profileData as MediumProfile).articlesCount) {
            updateData.mediumArticles = (profileData as MediumProfile).articlesCount;
          }
          break;
          
        case SupportedOAuthProvider.STACKOVERFLOW:
          updateData.stackoverflowIdHash = this.hashIdentifier(profileData.id);
          updateData.stackoverflowUsername = (profileData as StackOverflowProfile).displayName;
          updateData.stackoverflowVerified = true;
          if ((profileData as StackOverflowProfile).reputation) {
            updateData.stackoverflowReputation = (profileData as StackOverflowProfile).reputation;
          }
          break;
          
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
      
      // Update auth methods to show this provider is now enabled
      updateData.authMethods = sql`jsonb_set(auth_methods, '{${this.provider}}', 'true'::jsonb)`;
      
      // Always update lastUpdated timestamp
      updateData.lastUpdated = new Date();
      
      // Update user with connected status and stats
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      console.log(`[OAuth] Saved ${this.provider} connection for user ${userId}`);
    } catch (error) {
      console.error(`[OAuth] Error saving ${this.provider} connection:`, error);
      throw error;
    }
  }
  
  /**
   * Hash an identifier for privacy
   */
  private hashIdentifier(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex');
  }

  /**
   * Disconnect social account from user profile
   */
  async disconnectSocialAccount(userId: number): Promise<void> {
    try {
      // Base data to update for all providers
      const updateData: any = {};
      
      // For each provider, update the specific fields based on our schema
      switch (this.provider) {
        case SupportedOAuthProvider.TWITTER:
          updateData.xIdHash = null;
          updateData.xUsername = null;
          updateData.xVerified = false;
          updateData.xFollowers = null;
          break;
          
        case SupportedOAuthProvider.GOOGLE:
          updateData.googleIdHash = null;
          updateData.googleVerified = false;
          break;
          
        case SupportedOAuthProvider.LINKEDIN:
          updateData.linkedinIdHash = null;
          updateData.linkedinVerified = false;
          updateData.linkedinConnections = null;
          break;
          
        case SupportedOAuthProvider.YOUTUBE:
          updateData.youtubeIdHash = null;
          updateData.youtubeVerified = false;
          updateData.youtubeSubscribers = null;
          break;
          
        case SupportedOAuthProvider.DISCORD:
          updateData.discordIdHash = null;
          updateData.discordVerified = false;
          updateData.discordUsername = null;
          break;
          
        case SupportedOAuthProvider.GITHUB:
          updateData.githubIdHash = null;
          updateData.githubVerified = false;
          updateData.githubFollowers = null;
          break;
          
        case SupportedOAuthProvider.MEDIUM:
          updateData.mediumIdHash = null;
          updateData.mediumUsername = null;
          updateData.mediumVerified = false;
          updateData.mediumFollowers = null;
          updateData.mediumArticles = null;
          break;
          
        case SupportedOAuthProvider.STACKOVERFLOW:
          updateData.stackoverflowIdHash = null;
          updateData.stackoverflowUsername = null;
          updateData.stackoverflowVerified = false;
          updateData.stackoverflowReputation = null;
          break;
          
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
      
      // Update auth methods to show this provider is now disabled
      updateData.authMethods = sql`jsonb_set(auth_methods, '{${this.provider}}', 'false'::jsonb)`;
      
      // Always update lastUpdated timestamp
      updateData.lastUpdated = new Date();
      
      // Update user to disconnect the social account
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      console.log(`[OAuth] Disconnected ${this.provider} for user ${userId}`);
    } catch (error) {
      console.error(`[OAuth] Error disconnecting ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Extract provider-specific stats from profile data
   * Should be implemented by each specific provider
   */
  protected abstract extractStats(profile: OAuthProfile): object;

  /**
   * Fetch user profile from provider API
   * Should be implemented by each specific provider
   */
  protected abstract fetchUserProfile(accessToken: string): Promise<OAuthProfile>;

  /**
   * Handle OAuth callback
   * This is the standard implementation that most providers can use
   */
  async handleCallback(code: string, state?: string, redirectUri?: string): Promise<OAuthCallbackResult> {
    try {
      // Exchange authorization code for tokens
      const tokens = await this.getTokens(code, redirectUri);
      
      if (!tokens.access_token) {
        return {
          success: false,
          message: 'Invalid token response',
          error: new Error('No access token received')
        };
      }
      
      // Fetch user profile with the access token
      const userProfile = await this.fetchUserProfile(tokens.access_token);
      
      return {
        success: true,
        message: 'Successfully authenticated',
        data: userProfile
      };
    } catch (error) {
      console.error(`[OAuth] ${this.provider} callback error:`, error);
      
      return {
        success: false,
        message: 'Authentication failed',
        error: error as Error
      };
    }
  }
}

/**
 * Twitter OAuth Provider Implementation
 */
class TwitterOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.TWITTER);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<TwitterProfile> {
    try {
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          'user.fields': 'id,name,username,profile_image_url,verified,public_metrics'
        }
      });
      
      const userData = response.data.data;
      
      return {
        id: userData.id,
        provider: SupportedOAuthProvider.TWITTER,
        displayName: userData.name,
        username: userData.username,
        profileImageUrl: userData.profile_image_url,
        profileUrl: `https://twitter.com/${userData.username}`,
        verified: userData.verified,
        followersCount: userData.public_metrics?.followers_count,
        friendsCount: userData.public_metrics?.following_count,
        statusesCount: userData.public_metrics?.tweet_count
      };
    } catch (error) {
      console.error('[OAuth] Error fetching Twitter profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: TwitterProfile): object {
    return {
      followersCount: profile.followersCount || 0,
      followingCount: profile.friendsCount || 0,
      tweetsCount: profile.statusesCount || 0,
      verified: profile.verified || false
    };
  }
}

/**
 * Google OAuth Provider Implementation
 */
class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.GOOGLE);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<GoogleProfile> {
    try {
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const userData = response.data;
      
      return {
        id: userData.sub,
        provider: SupportedOAuthProvider.GOOGLE,
        displayName: userData.name,
        username: userData.email?.split('@')[0],
        email: userData.email,
        profileImageUrl: userData.picture,
        verified: userData.email_verified,
        locale: userData.locale,
        givenName: userData.given_name,
        familyName: userData.family_name
      };
    } catch (error) {
      console.error('[OAuth] Error fetching Google profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: GoogleProfile): object {
    return {
      verified: profile.verified || false,
      locale: profile.locale
    };
  }
}

/**
 * LinkedIn OAuth Provider Implementation
 */
class LinkedInOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.LINKEDIN);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      // Fetch basic profile
      const profileResponse = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch email (separate endpoint)
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const userData = profileResponse.data;
      const emailData = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;
      
      return {
        id: userData.id,
        provider: SupportedOAuthProvider.LINKEDIN,
        displayName: `${userData.localizedFirstName} ${userData.localizedLastName}`,
        email: emailData,
        profileUrl: `https://www.linkedin.com/in/${userData.vanityName || userData.id}`,
        headline: userData.headline,
        industry: userData.industry,
        location: userData.locationName
      };
    } catch (error) {
      console.error('[OAuth] Error fetching LinkedIn profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: LinkedInProfile): object {
    return {
      headline: profile.headline,
      industry: profile.industry,
      location: profile.location,
      connectionCount: profile.connectionCount || 0
    };
  }
}

/**
 * YouTube OAuth Provider Implementation
 */
class YouTubeOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.YOUTUBE);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<YouTubeProfile> {
    try {
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          part: 'snippet,statistics',
          mine: true
        }
      });
      
      const channelData = response.data.items?.[0];
      
      if (!channelData) {
        throw new Error('No channel data returned from YouTube API');
      }
      
      return {
        id: channelData.id,
        provider: SupportedOAuthProvider.YOUTUBE,
        displayName: channelData.snippet.title,
        username: channelData.snippet.customUrl,
        profileImageUrl: channelData.snippet.thumbnails?.default?.url,
        channelUrl: `https://www.youtube.com/channel/${channelData.id}`,
        subscriberCount: parseInt(channelData.statistics.subscriberCount, 10),
        viewCount: parseInt(channelData.statistics.viewCount, 10),
        videoCount: parseInt(channelData.statistics.videoCount, 10)
      };
    } catch (error) {
      console.error('[OAuth] Error fetching YouTube profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: YouTubeProfile): object {
    return {
      subscriberCount: profile.subscriberCount || 0,
      viewCount: profile.viewCount || 0,
      videoCount: profile.videoCount || 0
    };
  }
}

/**
 * Discord OAuth Provider Implementation
 */
class DiscordOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.DISCORD);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<DiscordProfile> {
    try {
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const userData = response.data;
      
      // Create avatar URL from ID and avatar hash
      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` 
        : undefined;
      
      return {
        id: userData.id,
        provider: SupportedOAuthProvider.DISCORD,
        displayName: userData.username,
        username: `${userData.username}#${userData.discriminator}`,
        email: userData.email,
        profileImageUrl: avatarUrl,
        discriminator: userData.discriminator,
        locale: userData.locale,
        verified: userData.verified,
        premiumType: userData.premium_type
      };
    } catch (error) {
      console.error('[OAuth] Error fetching Discord profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: DiscordProfile): object {
    return {
      verified: profile.verified || false,
      premiumType: profile.premiumType || 0
    };
  }
}

/**
 * GitHub OAuth Provider Implementation
 */
class GitHubOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.GITHUB);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<GitHubProfile> {
    try {
      // Fetch basic profile
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/json'
        }
      });
      
      // Fetch email (may be private, so need separate request)
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/json'
        }
      });
      
      const userData = response.data;
      
      // Find primary email
      const primaryEmail = emailResponse.data.find((email: any) => email.primary)?.email;
      
      return {
        id: userData.id.toString(),
        provider: SupportedOAuthProvider.GITHUB,
        displayName: userData.name,
        username: userData.login,
        email: primaryEmail || userData.email,
        profileUrl: userData.html_url,
        profileImageUrl: userData.avatar_url,
        login: userData.login,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        company: userData.company,
        location: userData.location,
        blog: userData.blog
      };
    } catch (error) {
      console.error('[OAuth] Error fetching GitHub profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: GitHubProfile): object {
    return {
      publicRepos: profile.publicRepos || 0,
      followers: profile.followers || 0,
      following: profile.following || 0,
      company: profile.company
    };
  }
}

// OAuth service instance
export const twitterOAuthProvider = new TwitterOAuthProvider();
export const googleOAuthProvider = new GoogleOAuthProvider();
export const linkedinOAuthProvider = new LinkedInOAuthProvider();
export const youtubeOAuthProvider = new YouTubeOAuthProvider();
export const discordOAuthProvider = new DiscordOAuthProvider();
export const githubOAuthProvider = new GitHubOAuthProvider();

/**
 * Medium OAuth Provider Implementation
 */
class MediumOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.MEDIUM);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<MediumProfile> {
    try {
      const response = await axios.get(this.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const userData = response.data.data;
      
      // Get user's publications for additional stats
      const publicationsResponse = await axios.get(`https://api.medium.com/v1/users/${userData.id}/publications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Get user's number of articles (may require a separate call or calculation)
      let articlesCount = 0;
      try {
        const articlesResponse = await axios.get(`https://api.medium.com/v1/users/${userData.id}/posts`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        articlesCount = articlesResponse.data.data ? articlesResponse.data.data.length : 0;
      } catch (error) {
        console.error('Error fetching Medium articles count:', error);
      }
      
      return {
        id: userData.id,
        provider: SupportedOAuthProvider.MEDIUM,
        displayName: userData.name,
        username: userData.username,
        profileImageUrl: userData.imageUrl,
        profileUrl: `https://medium.com/@${userData.username}`,
        url: userData.url,
        articlesCount,
        publicationsCount: publicationsResponse.data.data ? publicationsResponse.data.data.length : 0
      };
    } catch (error) {
      console.error('[OAuth] Error fetching Medium profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: MediumProfile): object {
    return {
      publicationsCount: profile.publicationsCount || 0,
      articlesCount: profile.articlesCount || 0,
      followersCount: profile.followersCount || 0
    };
  }
}

/**
 * Stack Overflow OAuth Provider Implementation
 */
class StackOverflowOAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(SupportedOAuthProvider.STACKOVERFLOW);
  }
  
  protected async fetchUserProfile(accessToken: string): Promise<StackOverflowProfile> {
    try {
      // Stack Exchange API requires a slightly different approach
      const response = await axios.get(`${this.profileUrl}?site=stackoverflow&access_token=${accessToken}&key=${this.clientId}&filter=!-*f(6rOFMk`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No user data returned from Stack Overflow API');
      }
      
      const userData = response.data.items[0];
      
      return {
        id: userData.user_id.toString(),
        provider: SupportedOAuthProvider.STACKOVERFLOW,
        displayName: userData.display_name,
        profileImageUrl: userData.profile_image,
        link: userData.link,
        reputation: userData.reputation,
        badgeCounts: userData.badge_counts,
        questionCount: userData.question_count,
        answerCount: userData.answer_count,
        viewCount: userData.view_count,
        accountId: userData.account_id
      };
    } catch (error) {
      console.error('[OAuth] Error fetching Stack Overflow profile:', error);
      throw error;
    }
  }
  
  protected extractStats(profile: StackOverflowProfile): object {
    return {
      reputation: profile.reputation || 0,
      badges: profile.badgeCounts || { gold: 0, silver: 0, bronze: 0 },
      questionCount: profile.questionCount || 0,
      answerCount: profile.answerCount || 0
    };
  }
}

// Add new provider instances
export const mediumOAuthProvider = new MediumOAuthProvider();
export const stackoverflowOAuthProvider = new StackOverflowOAuthProvider();

/**
 * Get appropriate OAuth service for a provider
 */
export function getOAuthService(provider: SupportedOAuthProvider): BaseOAuthProvider {
  switch (provider) {
    case SupportedOAuthProvider.TWITTER:
      return twitterOAuthProvider;
    case SupportedOAuthProvider.GOOGLE:
      return googleOAuthProvider;
    case SupportedOAuthProvider.LINKEDIN:
      return linkedinOAuthProvider;
    case SupportedOAuthProvider.YOUTUBE:
      return youtubeOAuthProvider;
    case SupportedOAuthProvider.DISCORD:
      return discordOAuthProvider;
    case SupportedOAuthProvider.GITHUB:
      return githubOAuthProvider;
    case SupportedOAuthProvider.MEDIUM:
      return mediumOAuthProvider;
    case SupportedOAuthProvider.STACKOVERFLOW:
      return stackoverflowOAuthProvider;
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

console.log('[oauth-service] OAuth service initialized');