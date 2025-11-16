/**
 * Discord Integration Service for HyperDAG
 * 
 * Provides comprehensive Discord integration including:
 * - OAuth authentication
 * - Community notifications
 * - Developer matchmaking via Discord channels
 * - Project collaboration spaces
 * - Grant opportunity alerts
 */

import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';

interface DiscordConfig {
  botToken: string;
  clientId: string;
  clientSecret: string;
  guildId: string; // Your HyperDAG Discord server ID
  channels: {
    announcements: string;
    projects: string;
    grants: string;
    networking: string;
    general: string;
  };
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  verified: boolean;
  email?: string;
}

interface ProjectAnnouncement {
  title: string;
  description: string;
  creator: string;
  skills: string[];
  lookingFor: string[];
  budget?: string;
  deadline?: string;
  url: string;
}

interface GrantOpportunity {
  title: string;
  description: string;
  amount: string;
  deadline: string;
  tags: string[];
  applicationUrl: string;
}

export class DiscordIntegrationService {
  private client: Client;
  private config: DiscordConfig;
  private isReady = false;

  constructor(config: DiscordConfig) {
    this.config = config;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize Discord bot connection
   */
  async initialize(): Promise<void> {
    try {
      await this.client.login(this.config.botToken);
      console.log('[Discord] Bot connected successfully');
    } catch (error) {
      console.error('[Discord] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Set up Discord event handlers
   */
  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      this.isReady = true;
      console.log(`[Discord] Ready! Logged in as ${this.client.user?.tag}`);
    });

    this.client.on('guildMemberAdd', async (member) => {
      await this.handleNewMember(member);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      await this.handleMessage(message);
    });
  }

  /**
   * Handle new Discord server members
   */
  private async handleNewMember(member: any): Promise<void> {
    try {
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x7C3AED)
        .setTitle('Welcome to HyperDAG! 🚀')
        .setDescription(`Hey ${member.user.username}! Welcome to the future of Web3 collaboration.`)
        .addFields(
          { name: '🎯 Get Started', value: 'Visit https://hyperdag.org to create your profile' },
          { name: '🤝 Find Teams', value: 'Check out #projects to join exciting Web3 builds' },
          { name: '💰 Discover Grants', value: 'Browse #grants for funding opportunities' },
          { name: '🧠 AI Matching', value: 'Our AI will suggest perfect collaboration matches' }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      const channel = this.client.channels.cache.get(this.config.channels.general) as TextChannel;
      if (channel) {
        await channel.send({ embeds: [welcomeEmbed] });
      }
    } catch (error) {
      console.error('[Discord] Error handling new member:', error);
    }
  }

  /**
   * Handle Discord messages for commands
   */
  private async handleMessage(message: any): Promise<void> {
    if (!message.content.startsWith('!hyperdag')) return;

    const args = message.content.slice('!hyperdag'.length).trim().split(' ');
    const command = args[0];

    switch (command) {
      case 'profile':
        await this.handleProfileCommand(message);
        break;
      case 'projects':
        await this.handleProjectsCommand(message);
        break;
      case 'grants':
        await this.handleGrantsCommand(message);
        break;
      case 'match':
        await this.handleMatchCommand(message);
        break;
      default:
        await this.handleHelpCommand(message);
    }
  }

  /**
   * Announce new project to Discord community
   */
  async announceProject(project: ProjectAnnouncement): Promise<void> {
    if (!this.isReady) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle(`🚀 New Project: ${project.title}`)
        .setDescription(project.description)
        .addFields(
          { name: '👨‍💻 Creator', value: project.creator, inline: true },
          { name: '💰 Budget', value: project.budget || 'Open to discussion', inline: true },
          { name: '⏰ Deadline', value: project.deadline || 'Flexible', inline: true },
          { name: '🛠️ Skills Needed', value: project.skills.join(', '), inline: false },
          { name: '🔍 Looking For', value: project.lookingFor.join(', '), inline: false }
        )
        .setURL(project.url)
        .setTimestamp();

      const channel = this.client.channels.cache.get(this.config.channels.projects) as TextChannel;
      if (channel) {
        const message = await channel.send({ 
          embeds: [embed],
          content: '🔥 **New collaboration opportunity!** React with 👋 if interested!'
        });
        await message.react('👋');
        await message.react('🚀');
      }
    } catch (error) {
      console.error('[Discord] Error announcing project:', error);
    }
  }

  /**
   * Announce grant opportunity to Discord community
   */
  async announceGrant(grant: GrantOpportunity): Promise<void> {
    if (!this.isReady) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle(`💰 Grant Opportunity: ${grant.title}`)
        .setDescription(grant.description)
        .addFields(
          { name: '💵 Amount', value: grant.amount, inline: true },
          { name: '📅 Deadline', value: grant.deadline, inline: true },
          { name: '🏷️ Tags', value: grant.tags.join(', '), inline: false }
        )
        .setURL(grant.applicationUrl)
        .setTimestamp();

      const channel = this.client.channels.cache.get(this.config.channels.grants) as TextChannel;
      if (channel) {
        const message = await channel.send({ 
          embeds: [embed],
          content: '💡 **New funding opportunity discovered!** Don\'t miss out!'
        });
        await message.react('💰');
        await message.react('📋');
      }
    } catch (error) {
      console.error('[Discord] Error announcing grant:', error);
    }
  }

  /**
   * Send AI-powered team matching notification
   */
  async notifyTeamMatch(userId: string, matchData: any): Promise<void> {
    if (!this.isReady) return;

    try {
      const user = await this.client.users.fetch(userId);
      
      const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle('🧠 AI Found Perfect Team Matches!')
        .setDescription('Our neural consensus engine discovered potential collaborators for you.')
        .addFields(
          { name: '🎯 Match Score', value: `${matchData.score}% compatibility`, inline: true },
          { name: '🛠️ Shared Skills', value: matchData.sharedSkills.join(', '), inline: false },
          { name: '🚀 Suggested Projects', value: matchData.suggestedProjects.join('\n'), inline: false }
        )
        .setFooter({ text: 'Visit HyperDAG to connect with your matches!' })
        .setTimestamp();

      await user.send({ embeds: [embed] });
    } catch (error) {
      console.error('[Discord] Error sending team match notification:', error);
    }
  }

  /**
   * Handle profile command
   */
  private async handleProfileCommand(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x7C3AED)
      .setTitle('🔗 Link Your HyperDAG Profile')
      .setDescription('Connect your Discord to unlock AI-powered team matching!')
      .addFields(
        { name: '1️⃣ Visit HyperDAG', value: '[Create Profile](https://hyperdag.org/auth)' },
        { name: '2️⃣ Connect Discord', value: 'Link your account in Settings > Social Connections' },
        { name: '3️⃣ Get Matched', value: 'Our AI will find perfect collaboration partners' }
      );

    await message.reply({ embeds: [embed] });
  }

  /**
   * Handle projects command
   */
  private async handleProjectsCommand(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🚀 Active Projects')
      .setDescription('Discover exciting Web3 projects seeking collaborators!')
      .addFields(
        { name: '🔍 Browse Projects', value: '[View All](https://hyperdag.org/projects)' },
        { name: '➕ Create Project', value: '[Start Building](https://hyperdag.org/projects/create)' },
        { name: '🤖 AI Recommendations', value: 'Get personalized project suggestions based on your skills' }
      );

    await message.reply({ embeds: [embed] });
  }

  /**
   * Handle grants command
   */
  private async handleGrantsCommand(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('💰 Grant Opportunities')
      .setDescription('Funding opportunities matched to your interests!')
      .addFields(
        { name: '🔍 Discover Grants', value: '[Browse All](https://hyperdag.org/grantflow)' },
        { name: '🎯 AI Matching', value: 'Get grants recommended based on your project goals' },
        { name: '📊 Success Tips', value: 'Access our grant application optimization tools' }
      );

    await message.reply({ embeds: [embed] });
  }

  /**
   * Handle match command
   */
  private async handleMatchCommand(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setTitle('🧠 AI Team Matching')
      .setDescription('Let our neural consensus engine find your perfect collaborators!')
      .addFields(
        { name: '🔗 Link Profile First', value: 'Connect your HyperDAG profile to enable AI matching' },
        { name: '🎯 Smart Recommendations', value: 'Get matched based on skills, interests, and goals' },
        { name: '⚡ Real-time Updates', value: 'Receive instant notifications for new matches' }
      );

    await message.reply({ embeds: [embed] });
  }

  /**
   * Handle help command
   */
  private async handleHelpCommand(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x6366F1)
      .setTitle('🤖 HyperDAG Bot Commands')
      .setDescription('Available commands for the HyperDAG community:')
      .addFields(
        { name: '!hyperdag profile', value: 'Link your HyperDAG profile', inline: true },
        { name: '!hyperdag projects', value: 'Browse active projects', inline: true },
        { name: '!hyperdag grants', value: 'Discover funding opportunities', inline: true },
        { name: '!hyperdag match', value: 'AI team matching info', inline: true }
      )
      .setFooter({ text: 'Visit hyperdag.org for full platform access' });

    await message.reply({ embeds: [embed] });
  }

  /**
   * Get Discord OAuth URL for user authentication
   */
  getOAuthUrl(redirectUri: string): string {
    const scopes = ['identify', 'email', 'guilds.join'];
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' ')
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for user tokens
   */
  async exchangeOAuthCode(code: string, redirectUri: string): Promise<any> {
    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      return await tokenResponse.json();
    } catch (error) {
      console.error('[Discord] OAuth exchange error:', error);
      throw error;
    }
  }

  /**
   * Get Discord user info from access token
   */
  async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    try {
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return await userResponse.json();
    } catch (error) {
      console.error('[Discord] User fetch error:', error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
    }
  }
}

export default DiscordIntegrationService;