import TelegramBot from 'node-telegram-bot-api';
import { randomBytes } from 'crypto';

// Store verification codes temporarily in memory
// In production, this would be stored in a database
interface VerificationRequest {
  code: string;
  username: string;
  timestamp: number;
  telegramId: number;
  expires: number; // Timestamp when code expires
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
}

class TelegramService {
  private bot: TelegramBot | null = null;
  verificationCodes: Map<string, VerificationRequest> = new Map();
  private initialized: boolean = false;
  private readonly TOKEN: string | undefined;
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!this.TOKEN) {
      console.warn('[telegram-service] Telegram bot token not provided. Telegram services will be disabled.');
      return;
    }
    
    // Initialize the bot in both development and production
    setTimeout(() => {
      try {
        this.initializeBot();
      } catch (error) {
        console.error('[telegram-service] Error initializing Telegram bot:', error);
      }
    }, 5000); // 5-second delay
  }

  isConfigured(): boolean {
    return !!this.TOKEN;
  }

  private initializeBot() {
    if (this.initialized || !this.TOKEN) return;
    
    try {
      // Create a bot instance with more specific polling options
      this.bot = new TelegramBot(this.TOKEN, { 
        polling: {
          interval: 2000, // Poll every 2 seconds
          params: {
            timeout: 10 // Use a shorter timeout
          }
        }
      });
      
      // Add error handler for polling errors
      this.bot.on('polling_error', (error) => {
        // Check if error is due to multiple instances
        if (error.code === 'ETELEGRAM' && error.message.includes('terminated by other getUpdates request')) {
          console.warn('[telegram-service] Polling conflict detected, stopping current polling session');
          this.bot?.stopPolling().then(() => {
            console.log('[telegram-service] Polling stopped due to conflict');
          }).catch(err => {
            console.error('[telegram-service] Error stopping polling:', err);
          });
        } else {
          console.error('[telegram-service] Polling error:', error);
        }
      });
      
      // Setup message handlers
      this.setupMessageHandlers();
      
      this.initialized = true;
      console.log('[telegram-service] Telegram service initialized successfully');
    } catch (error) {
      console.error('[telegram-service] Failed to initialize Telegram bot:', error);
      // Clean up on error
      if (this.bot) {
        this.bot.stopPolling();
        this.bot = null;
      }
      this.initialized = false;
    }
  }

  private setupMessageHandlers() {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot?.sendMessage(
        chatId,
        "Welcome to HyperDAG! 🚀\n\nThis bot helps you connect your Telegram account with HyperDAG.\n\nUse /getcode to receive a verification code.\nUse /getid to get your Telegram ID."
      );
    });

    // Handle /getcode command
    this.bot.onText(/\/getcode/, (msg) => {
      const chatId = msg.chat.id;
      const user = msg.from;
      
      if (!user) {
        this.bot?.sendMessage(chatId, "Unable to process your request. Please try again.");
        return;
      }
      
      // Generate a new code
      const code = this.generateVerificationCode();
      
      // Store the code using Telegram ID as key (more reliable than username)
      this.storeVerificationCodeById(user.id, code, user);
      
      this.bot?.sendMessage(
        chatId,
        `🔐 Your HyperDAG verification code is: **${code}**\n\nThis code will expire in 10 minutes.\n\nEnter this code on the HyperDAG authentication page to complete your login.`
      );
    });

    // Handle /getid command
    this.bot.onText(/\/getid/, (msg) => {
      const chatId = msg.chat.id;
      const user = msg.from;
      
      if (!user) {
        this.bot?.sendMessage(chatId, "Unable to retrieve your Telegram ID. Please try again later.");
        return;
      }
      
      this.bot?.sendMessage(
        chatId,
        `Your Telegram ID is: ${user.id}\n\nUse this ID when connecting your Telegram account on HyperDAG.`
      );
    });

    // Handle general messages
    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.toLowerCase();
      
      if (!text || text.startsWith('/')) return; // Ignore commands and empty messages
      
      if (text.includes('hello') || text.includes('hi')) {
        this.bot?.sendMessage(chatId, `Hello, ${msg.from?.first_name || 'there'}! 👋\n\nUse /start to learn how to connect your Telegram account with HyperDAG.`);
      } else if (text.includes('help')) {
        this.bot?.sendMessage(
          chatId,
          "Here's how to use this bot:\n\n/start - Get started\n/getcode - Get a verification code\n/getid - Get your Telegram ID"
        );
      }
    });
  }

  private generateVerificationCode(): string {
    // Generate a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private storeVerificationCode(username: string, code: string, telegramId: number) {
    const now = Date.now();
    const expires = now + this.EXPIRY_TIME;
    
    this.verificationCodes.set(username.toLowerCase(), {
      code,
      username: username.toLowerCase(),
      telegramId,
      timestamp: now,
      expires
    });
    
    // Clean up expired codes periodically
    this.cleanupExpiredCodes();
  }

  private storeVerificationCodeById(telegramId: number, code: string, user: any) {
    const now = Date.now();
    const expires = now + this.EXPIRY_TIME;
    
    // Store by code for easy lookup during verification
    this.verificationCodes.set(code, {
      code,
      username: user.username || `user_${telegramId}`,
      telegramId,
      timestamp: now,
      expires,
      firstName: user.first_name,
      lastName: user.last_name,
      telegramUsername: user.username
    });
    
    // Clean up expired codes periodically
    this.cleanupExpiredCodes();
  }

  private cleanupExpiredCodes() {
    const now = Date.now();
    
    for (const [username, request] of this.verificationCodes.entries()) {
      if (request.expires < now) {
        this.verificationCodes.delete(username);
      }
    }
  }

  // Public methods for use by other services

  public getVerificationByCode(code: string): VerificationRequest | null {
    // Clean up expired codes first
    this.cleanupExpiredCodes();
    
    // Direct lookup if stored by code
    const directRequest = this.verificationCodes.get(code);
    if (directRequest && directRequest.expires > Date.now()) {
      return directRequest;
    }
    
    // Fallback: search through all entries for matching code
    for (const [key, request] of this.verificationCodes.entries()) {
      if (request.code === code && request.expires > Date.now()) {
        return request;
      }
    }
    return null;
  }

  public sendMessage(telegramId: number, message: string): Promise<boolean> {
    if (!this.bot || !this.initialized) {
      console.warn('[telegram-service] Cannot send message: Bot not initialized');
      return Promise.resolve(false);
    }
    
    return this.bot.sendMessage(telegramId, message)
      .then(() => true)
      .catch((error) => {
        console.error('[telegram-service] Error sending message:', error);
        return false;
      });
  }

  public verifyUser(username: string, code: string): boolean {
    if (!username || !code) return false;
    
    const lowercaseUsername = username.toLowerCase();
    const request = this.verificationCodes.get(lowercaseUsername);
    
    if (!request) return false;
    
    const now = Date.now();
    if (request.expires < now) {
      // Code expired
      this.verificationCodes.delete(lowercaseUsername);
      return false;
    }
    
    // For development, accept any code
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      return true;
    }
    
    // Check if code matches
    return request.code === code;
  }

  public isUserConnected(username: string): boolean {
    return this.verificationCodes.has(username.toLowerCase());
  }

  public getTelegramIdForUsername(username: string): number | null {
    const request = this.verificationCodes.get(username.toLowerCase());
    return request ? request.telegramId : null;
  }

  public sendVerificationCode(username: string, code: string): Promise<boolean> {
    const request = this.verificationCodes.get(username.toLowerCase());
    if (!request || !request.telegramId) return Promise.resolve(false);
    
    return this.sendMessage(
      request.telegramId,
      `Your HyperDAG verification code is: ${code}\n\nThis code will expire in 10 minutes.`
    );
  }

  // New method for API endpoint
  public async requestVerificationCode(telegramUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.bot || !this.initialized) {
        return { success: false, error: "Telegram service not initialized" };
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expires = Date.now() + this.EXPIRY_TIME;

      // Store the verification request
      this.verificationCodes.set(telegramUserId, {
        code,
        username: telegramUserId,
        timestamp: Date.now(),
        telegramId: parseInt(telegramUserId),
        expires,
      });

      // Send code via bot
      const success = await this.sendMessage(
        parseInt(telegramUserId),
        `🔐 Your HyperDAG verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nUse this code on the HyperDAG website to complete your authentication.`
      );

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: "Failed to send verification code" };
      }
    } catch (error) {
      console.error('[telegram-service] Error requesting verification code:', error);
      return { success: false, error: "Service error" };
    }
  }

  // New method for code verification and login
  public async verifyCodeAndLogin(telegramUserId: string, code: string): Promise<{ 
    success: boolean; 
    user?: any; 
    isNewUser?: boolean; 
    suggestLinking?: boolean; 
    error?: string 
  }> {
    try {
      const request = this.verificationCodes.get(telegramUserId);
      
      if (!request) {
        return { success: false, error: "No verification request found" };
      }

      const now = Date.now();
      if (request.expires < now) {
        this.verificationCodes.delete(telegramUserId);
        return { success: false, error: "Verification code has expired" };
      }

      // For development, accept any 6-digit code
      const env = process.env.NODE_ENV || 'development';
      const isValidCode = env === 'development' ? code.length === 6 : request.code === code;

      if (!isValidCode) {
        return { success: false, error: "Invalid verification code" };
      }

      // Import database modules
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq } = await import('drizzle-orm');

      // Check if user already exists with this Telegram ID
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.telegramAuthId, telegramUserId))
        .limit(1);

      if (existingUser.length > 0) {
        // User exists, log them in
        this.verificationCodes.delete(telegramUserId);
        return {
          success: true,
          user: existingUser[0],
          isNewUser: false
        };
      }

      // Create new user
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const telegramAuthData = JSON.stringify({
        id: parseInt(telegramUserId),
        firstName: request.firstName || 'Telegram',
        lastName: request.lastName || 'User',
        username: request.telegramUsername || `user_${telegramUserId}`,
        authDate: Math.floor(Date.now() / 1000)
      });

      const newUsername = `tg_${telegramUserId}_${Date.now().toString().slice(-6)}`;

      const [newUser] = await db
        .insert(users)
        .values({
          username: newUsername,
          password: hashedPassword,
          telegramAuthId: telegramUserId,
          telegramAuthData,
          authMethods: { telegram: true },
          tokens: 100, // Welcome bonus
          points: 0,
          reputationScore: 0,
          onboardingStage: 1,
          referralCode: Math.random().toString(36).substring(2, 10).toUpperCase()
        })
        .returning();

      this.verificationCodes.delete(telegramUserId);

      return {
        success: true,
        user: newUser,
        isNewUser: true,
        suggestLinking: true // Suggest linking to existing account
      };

    } catch (error) {
      console.error('[telegram-service] Error verifying code and login:', error);
      return { success: false, error: "Authentication failed" };
    }
  }

  public shutdown() {
    if (this.bot) {
      this.bot.stopPolling();
      this.bot = null;
      this.initialized = false;
      console.log('[telegram-service] Telegram bot stopped');
    }
  }
}

// Create singleton instance
export const telegramService = new TelegramService();

// Export methods for use in other services
export const sendMessage = (telegramId: number, message: string) => 
  telegramService.sendMessage(telegramId, message);

export const verifyUser = (username: string, code: string) => 
  telegramService.verifyUser(username, code);

export const isUserConnected = (username: string) => 
  telegramService.isUserConnected(username);

export const getTelegramIdForUsername = (username: string) => 
  telegramService.getTelegramIdForUsername(username);

export const sendVerificationCode = (username: string, code: string) => 
  telegramService.sendVerificationCode(username, code);

export const getUserVerificationCode = (username: string): string | null => {
  const request = telegramService.verificationCodes.get(username.toLowerCase());
  return request ? request.code : null;
};

export const sendNotification = (username: string, message: string): Promise<boolean> => {
  const telegramId = getTelegramIdForUsername(username);
  if (!telegramId) return Promise.resolve(false);
  return sendMessage(telegramId, message);
};

export const shutdown = () => telegramService.shutdown();

// Export status check function for redundant services
export async function checkTelegramStatus(): Promise<boolean> {
  return telegramService.isConfigured();
}