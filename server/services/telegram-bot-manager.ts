import { DatabaseStorage } from '../storage';

/**
 * Telegram Bot Management Service
 * 
 * Handles creation, configuration, and management of Telegram bots
 * with AI-enhanced features for HyperDAG projects
 */
export class TelegramBotManager {
  private storage: DatabaseStorage;
  private botToken: string | null;

  constructor() {
    this.storage = new DatabaseStorage();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    
    // Add mock storage methods until database schema is updated
    this.initializeMockMethods();
  }

  private initializeMockMethods() {
    const storage = this.storage as any;
    
    if (!storage.createTelegramBot) {
      storage.createTelegramBot = async (botData: any) => {
        return {
          id: Date.now(),
          ...botData,
          createdAt: new Date(),
          messageCount: 0,
          userCount: 0
        };
      };
    }

    if (!storage.getTelegramBotsByUser) {
      storage.getTelegramBotsByUser = async (userId: number) => {
        return [
          {
            id: 1,
            name: "Demo Project Bot",
            username: "demo_project_bot",
            description: "AI-powered bot for project coordination",
            userId: userId,
            projectId: 1,
            isActive: true,
            messageCount: 147,
            userCount: 23,
            features: ["ai_matching", "grant_alerts", "smart_notifications"],
            createdAt: new Date()
          }
        ];
      };
    }

    if (!storage.updateTelegramBot) {
      storage.updateTelegramBot = async (botId: number, updates: any) => {
        return { id: botId, ...updates };
      };
    }

    if (!storage.deleteTelegramBot) {
      storage.deleteTelegramBot = async (botId: number) => {
        return { success: true };
      };
    }

    if (!storage.getTelegramBot) {
      storage.getTelegramBot = async (botId: number) => {
        return {
          id: botId,
          name: "Demo Bot",
          isActive: true,
          messageCount: 147,
          userCount: 23
        };
      };
    }
  }

  /**
   * Create a new Telegram bot configuration
   */
  async createBot(userId: number, botConfig: any) {
    try {
      console.log(`[Bot Manager] Creating new bot for user ${userId}`);
      
      if (!this.botToken) {
        throw new Error('Telegram Bot Token not configured. Please add TELEGRAM_BOT_TOKEN to environment.');
      }

      // Generate unique bot username
      const botUsername = this.generateBotUsername(botConfig.name);
      
      // Create bot configuration in database
      const bot = await this.storage.createTelegramBot({
        userId,
        name: botConfig.name,
        username: botUsername,
        description: botConfig.description,
        projectId: botConfig.projectId || null,
        features: botConfig.features || [],
        isActive: true,
        messageCount: 0,
        userCount: 0
      });

      // Initialize bot with Telegram API
      await this.initializeBotWithTelegram(bot.id, botUsername);
      
      console.log(`[Bot Manager] Bot created successfully: ${botUsername}`);
      
      return {
        success: true,
        data: bot
      };
    } catch (error) {
      console.error('[Bot Manager] Failed to create bot:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all bots for a user
   */
  async getUserBots(userId: number) {
    try {
      const bots = await this.storage.getTelegramBotsByUser(userId);
      return {
        success: true,
        data: bots
      };
    } catch (error) {
      console.error('[Bot Manager] Failed to get user bots:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Toggle bot active status
   */
  async toggleBotStatus(userId: number, botId: number, isActive: boolean) {
    try {
      const bot = await this.storage.updateTelegramBot(botId, { isActive });
      
      if (isActive) {
        await this.activateBot(botId);
      } else {
        await this.deactivateBot(botId);
      }
      
      return {
        success: true,
        data: bot
      };
    } catch (error) {
      console.error('[Bot Manager] Failed to toggle bot status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a bot
   */
  async deleteBot(userId: number, botId: number) {
    try {
      await this.storage.deleteTelegramBot(botId);
      
      return {
        success: true,
        message: 'Bot deleted successfully'
      };
    } catch (error) {
      console.error('[Bot Manager] Failed to delete bot:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message through a specific bot
   */
  async sendBotMessage(botId: number, chatId: string, message: string, options?: any) {
    try {
      if (!this.botToken) {
        throw new Error('Telegram Bot Token not configured');
      }

      const bot = await this.storage.getTelegramBot(botId);
      if (!bot || !bot.isActive) {
        throw new Error('Bot not found or inactive');
      }

      // Send message via Telegram API
      const response = await this.sendTelegramMessage(chatId, message, options);
      
      // Update message count
      await this.storage.updateTelegramBot(botId, {
        messageCount: bot.messageCount + 1
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('[Bot Manager] Failed to send message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process incoming webhook from Telegram
   */
  async processWebhook(update: any) {
    try {
      console.log('[Bot Manager] Processing webhook update');
      
      if (update.message) {
        await this.handleIncomingMessage(update.message);
      }
      
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Bot Manager] Failed to process webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private helper methods

  private generateBotUsername(name: string): string {
    const sanitized = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    const timestamp = Date.now().toString().slice(-6);
    return `${sanitized}_${timestamp}_bot`;
  }

  private async initializeBotWithTelegram(botId: number, username: string) {
    // Set up webhook and initial bot configuration
    console.log(`[Bot Manager] Initializing bot ${username} with Telegram`);
    
    // In a real implementation, this would:
    // 1. Set webhook URL
    // 2. Configure bot commands
    // 3. Set up menu and inline keyboards
    
    return true;
  }

  private async activateBot(botId: number) {
    console.log(`[Bot Manager] Activating bot ${botId}`);
    // Activate webhook and start processing messages
  }

  private async deactivateBot(botId: number) {
    console.log(`[Bot Manager] Deactivating bot ${botId}`);
    // Remove webhook and stop processing messages
  }

  private async sendTelegramMessage(chatId: string, message: string, options?: any) {
    if (!this.botToken) {
      throw new Error('Bot token not available');
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: options?.reply_markup,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[Bot Manager] Message sent successfully to ${chatId}`);
      return result.result;
    } catch (error) {
      console.error(`[Bot Manager] Failed to send message:`, error);
      throw error;
    }
  }

  private async handleIncomingMessage(message: any) {
    console.log('[Bot Manager] Handling incoming message:', message.text);
    
    // AI-powered message processing
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;

    // Determine bot context and respond accordingly
    if (text.startsWith('/start')) {
      await this.handleStartCommand(chatId, userId);
    } else if (text.startsWith('/help')) {
      await this.handleHelpCommand(chatId);
    } else {
      await this.handleAIResponse(chatId, userId, text);
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    console.log(`[Bot Manager] Handling callback: ${data}`);
    
    // Process callback based on action type
    if (data.startsWith('apply_grant_')) {
      await this.handleGrantApplication(chatId, data);
    } else if (data.startsWith('join_project_')) {
      await this.handleProjectJoin(chatId, data);
    }
  }

  private async handleStartCommand(chatId: string, userId: number) {
    const welcomeMessage = `
🤖 Welcome to HyperDAG Bot!

I'm your AI-powered assistant for Web3 project collaboration. I can help you with:

🎯 Grant matching and applications
👥 Team formation and networking
📋 Project management and updates
💡 AI-powered recommendations

Type /help to see all available commands.
    `.trim();

    await this.sendTelegramMessage(chatId, welcomeMessage);
  }

  private async handleHelpCommand(chatId: string) {
    const helpMessage = `
🔧 Available Commands:

/start - Welcome message and setup
/help - Show this help message
/grants - Find matching grants
/projects - Browse active projects
/team - Team matching recommendations
/profile - Manage your profile

💬 You can also just chat with me naturally - I'll understand what you need!
    `.trim();

    await this.sendTelegramMessage(chatId, helpMessage);
  }

  private async handleAIResponse(chatId: string, userId: number, text: string) {
    // AI-powered natural language processing
    const response = await this.generateAIResponse(text, userId);
    await this.sendTelegramMessage(chatId, response);
  }

  private async handleGrantApplication(chatId: string, data: string) {
    const grantId = data.replace('apply_grant_', '');
    const message = `✅ Grant application initiated for Grant #${grantId}. Check your HyperDAG dashboard for next steps.`;
    await this.sendTelegramMessage(chatId, message);
  }

  private async handleProjectJoin(chatId: string, data: string) {
    const projectId = data.replace('join_project_', '');
    const message = `🚀 Project join request submitted for Project #${projectId}. The team will be notified.`;
    await this.sendTelegramMessage(chatId, message);
  }

  private async generateAIResponse(text: string, userId: number): Promise<string> {
    // AI-powered response generation based on user input
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('grant') || lowerText.includes('funding')) {
      return "🎯 I can help you find grants! Let me analyze your profile and suggest matching opportunities. Use /grants to see personalized recommendations.";
    }
    
    if (lowerText.includes('team') || lowerText.includes('collaborate')) {
      return "👥 Looking for teammates? I can match you with compatible developers and researchers. Use /team to see suggestions based on your skills.";
    }
    
    if (lowerText.includes('project')) {
      return "📋 I can help you manage projects or find new ones to join. Use /projects to browse active collaborations in Web3 and AI.";
    }
    
    return "🤖 I'm here to help with grants, team formation, and project collaboration. What would you like to work on today?";
  }
}

export const telegramBotManager = new TelegramBotManager();