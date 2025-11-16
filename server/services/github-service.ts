import { storage } from '../storage';

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubTokens {
  access_token: string;
  token_type: string;
  scope: string;
}

export class GitHubService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID!;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    // Dynamic redirect URI will be set per request
    this.redirectUri = '';
  }

  getAuthUrl(req?: any): string {
    // Use dynamic domain from request if available
    const redirectUri = req 
      ? `${req.protocol}://${req.get('host')}/api/auth/github/callback`
      : this.redirectUri;
      
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'user:email read:user',
      state: Math.random().toString(36).substring(7),
    });

    console.log('GitHub OAuth Debug:');
    console.log('Client ID:', this.clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Full Auth URL:', `https://github.com/login/oauth/authorize?${params.toString()}`);

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, req?: any): Promise<GitHubTokens> {
    // Use the same redirect URI that was used for the auth request
    const redirectUri = req 
      ? `${req.protocol}://${req.get('host')}/api/auth/github/callback`
      : this.redirectUri;

    console.log('GitHub token exchange debug:');
    console.log('Code:', code);
    console.log('Redirect URI:', redirectUri);
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    const tokens = await response.json();
    console.log('GitHub token exchange successful');
    return tokens;
  }

  async getGitHubUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'HyperDAG-App',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get GitHub user');
    }

    return await response.json();
  }

  async getGitHubUserEmails(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'HyperDAG-App',
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  async findOrCreateUser(githubUser: GitHubUser, accessToken: string): Promise<any> {
    // Create a hash of the GitHub ID for privacy
    const githubIdHash = this.hashGitHubId(githubUser.id.toString());
    
    // Try to find existing user by GitHub ID hash
    let user = await this.findUserByGitHubHash(githubIdHash);
    
    if (user) {
      // Update verification status and follower count
      await storage.updateUser(user.id, {
        githubVerified: true,
        githubFollowers: githubUser.followers
      });
      return user;
    }

    // Get user's email addresses
    const emails = await this.getGitHubUserEmails(accessToken);
    const primaryEmail = emails.find(email => email.primary)?.email || githubUser.email;

    // Try to find by email if provided
    if (primaryEmail) {
      user = await this.findUserByEmail(primaryEmail);
      if (user) {
        // Link GitHub to existing account
        await storage.updateUser(user.id, { 
          githubIdHash: githubIdHash,
          githubVerified: true,
          githubFollowers: githubUser.followers
        });
        return user;
      }
    }

    // Create new user
    const newUser = await storage.createUser({
      username: githubUser.login,
      email: primaryEmail || null,
      githubIdHash: githubIdHash,
      githubVerified: true,
      githubFollowers: githubUser.followers,
      password: '', // OAuth users don't need passwords
      referralCode: this.generateReferralCode(),
      tokens: 100, // Welcome bonus
      points: 0,
      reputationScore: Math.min(50, 10 + Math.floor(githubUser.public_repos * 0.5)), // Bonus for developers
    });

    return newUser;
  }

  /**
   * Helper method to hash GitHub ID for privacy
   */
  private hashGitHubId(githubId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(githubId).digest('hex');
  }

  /**
   * Helper method to find user by GitHub ID hash
   */
  private async findUserByGitHubHash(githubIdHash: string): Promise<any> {
    try {
      const users = await storage.getAllUsers();
      return users.find(user => user.githubIdHash === githubIdHash);
    } catch (error) {
      console.error('Error finding user by GitHub hash:', error);
      return null;
    }
  }

  /**
   * Helper method to find user by email
   */
  private async findUserByEmail(email: string): Promise<any> {
    try {
      const users = await storage.getAllUsers();
      return users.find(user => user.email === email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const githubService = new GitHubService();