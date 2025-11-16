import { storage } from '../storage';

interface SlackUser {
  id: string;
  name: string;
  email: string | null;
  real_name: string;
  image_192: string;
  team_id: string;
}

interface SlackTokens {
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

export class SlackService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID!;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET!;
    // Use Replit domain for development, production domain for deployment
    this.redirectUri = process.env.NODE_ENV === 'production' 
      ? `https://hyperdag.org/api/auth/slack/callback`
      : `https://2cd3fda4-0422-4d37-a58a-54d2d137f264-00-b6szyf81fcf.picard.replit.dev/api/auth/slack/callback`;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'identity.basic,identity.email',
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(7),
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SlackTokens> {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  async getSlackUser(accessToken: string): Promise<SlackUser> {
    const response = await fetch('https://slack.com/api/users.identity', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Slack user');
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data.user;
  }

  async findOrCreateUser(slackUser: SlackUser): Promise<any> {
    // Try to find existing user by Slack ID
    let user = await storage.getUserBySlackId(slackUser.id);
    
    if (user) {
      return user;
    }

    // Try to find by email if provided
    if (slackUser.email) {
      user = await storage.getUserByEmail(slackUser.email);
      if (user) {
        // Link Slack to existing account
        await storage.updateUser(user.id, { slackId: slackUser.id });
        return user;
      }
    }

    // Create new user
    const newUser = await storage.createUser({
      username: slackUser.name,
      email: slackUser.email || null,
      slackId: slackUser.id,
      password: '', // OAuth users don't need passwords
      referralCode: this.generateReferralCode(),
      tokens: 100, // Welcome bonus
      points: 0,
      reputationScore: 15, // Bonus for team collaboration platform users
    });

    return newUser;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const slackService = new SlackService();