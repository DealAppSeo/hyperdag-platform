import { storage } from '../storage';

interface DiscordUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  discriminator: string;
}

interface DiscordTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class DiscordService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID!;
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    // Use Replit domain for development, production domain for deployment  
    this.redirectUri = process.env.NODE_ENV === 'production' 
      ? `https://hyperdag.org/api/discord/callback`
      : `https://2cd3fda4-0422-4d37-a58a-54d2d137f264-00-b6szyf81fcf.picard.replit.dev/api/discord/callback`;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email',
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<DiscordTokens> {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return await response.json();
  }

  async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Discord user');
    }

    return await response.json();
  }

  async findOrCreateUser(discordUser: DiscordUser): Promise<any> {
    // Try to find existing user by Discord ID
    let user = await storage.getUserByDiscordId(discordUser.id);
    
    if (user) {
      return user;
    }

    // Try to find by email if provided
    if (discordUser.email) {
      user = await storage.getUserByEmail(discordUser.email);
      if (user) {
        // Link Discord to existing account
        await storage.updateUser(user.id, { discordId: discordUser.id });
        return user;
      }
    }

    // Create new user
    const newUser = await storage.createUser({
      username: discordUser.username,
      email: discordUser.email || null,
      discordId: discordUser.id,
      password: '', // OAuth users don't need passwords
      referralCode: this.generateReferralCode(),
      tokens: 100, // Welcome bonus
      points: 0,
      reputationScore: 10, // Starting reputation
    });

    return newUser;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const discordService = new DiscordService();