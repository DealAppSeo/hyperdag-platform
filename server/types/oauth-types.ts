/**
 * OAuth Types
 * 
 * Type definitions for OAuth integration with various providers
 */

/**
 * Supported OAuth providers
 */
export enum SupportedOAuthProvider {
  TWITTER = 'twitter',
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  DISCORD = 'discord',
  GITHUB = 'github',
  MEDIUM = 'medium',
  STACKOVERFLOW = 'stackoverflow'
}

/**
 * OAuth token response interface
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * Base profile data interface that all providers should implement
 */
export interface BaseOAuthProfile {
  id: string;
  provider: SupportedOAuthProvider;
  displayName?: string;
  username?: string;
  email?: string;
  profileUrl?: string;
  profileImageUrl?: string;
}

/**
 * Twitter/X specific profile data
 */
export interface TwitterProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.TWITTER;
  followersCount?: number;
  friendsCount?: number;
  statusesCount?: number;
  verified?: boolean;
}

/**
 * Google specific profile data
 */
export interface GoogleProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.GOOGLE;
  verified?: boolean;
  locale?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * LinkedIn specific profile data
 */
export interface LinkedInProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.LINKEDIN;
  headline?: string;
  industry?: string;
  location?: string;
  connectionCount?: number;
}

/**
 * YouTube specific profile data
 */
export interface YouTubeProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.YOUTUBE;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  channelUrl?: string;
}

/**
 * Discord specific profile data
 */
export interface DiscordProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.DISCORD;
  discriminator?: string;
  locale?: string;
  verified?: boolean;
  premiumType?: number;
}

/**
 * GitHub specific profile data
 */
export interface GitHubProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.GITHUB;
  login?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  company?: string;
  location?: string;
  blog?: string;
}

/**
 * Medium specific profile data
 */
export interface MediumProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.MEDIUM;
  username?: string;
  url?: string;
  followersCount?: number;
  followingCount?: number;
  publicationsCount?: number;
  articlesCount?: number;
  clapsCount?: number;
}

/**
 * Stack Overflow specific profile data
 */
export interface StackOverflowProfile extends BaseOAuthProfile {
  provider: SupportedOAuthProvider.STACKOVERFLOW;
  displayName?: string;
  reputation?: number;
  badgeCounts?: {
    gold: number;
    silver: number;
    bronze: number;
  };
  questionCount?: number;
  answerCount?: number;
  viewCount?: number;
  accountId?: number;
  link?: string;
}

/**
 * Union type of all possible OAuth profiles
 */
export type OAuthProfile = 
  | TwitterProfile
  | GoogleProfile
  | LinkedInProfile
  | YouTubeProfile 
  | DiscordProfile
  | GitHubProfile
  | MediumProfile
  | StackOverflowProfile;

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
  success: boolean;
  message: string;
  data?: OAuthProfile;
  error?: Error;
}

/**
 * OAuth connection data stored in the database 
 */
export interface OAuthConnectionData {
  providerUserId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profileData?: any;
}

/**
 * Interface for OAuth providers
 */
export interface OAuthProviderInterface {
  /**
   * Get authorization URL for initiating OAuth flow
   */
  getAuthorizationUrl(redirectUri?: string): Promise<string>;
  
  /**
   * Handle callback from OAuth provider
   */
  handleCallback(code: string, state?: string, redirectUri?: string): Promise<OAuthCallbackResult>;
  
  /**
   * Save social connection to user profile
   */
  saveSocialConnection(userId: number, profileData: OAuthProfile): Promise<void>;
  
  /**
   * Disconnect social account from user profile
   */
  disconnectSocialAccount(userId: number): Promise<void>;
  
  /**
   * Refresh OAuth token
   */
  refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;
}