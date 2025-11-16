import { 
  users, type User, type InsertUser, 
  badges, type Badge, type InsertBadge, 
  referrals, type Referral, type InsertReferral,
  shareLinks, type ShareLink, type InsertShareLink,
  multimodalContent, type MultimodalContent, type InsertMultimodalContent,
  projects, type Project, type InsertProject, 
  verificationCodes, type VerificationCode, type InsertVerificationCode, 
  devHubAccess, type DevHubAccess, type InsertDevHubAccess, 
  reputationActivities, type ReputationActivity, type InsertReputationActivity,
  networkingGoals, type NetworkingGoal, type InsertNetworkingGoal,
  goalProgress, type GoalProgress, type InsertGoalProgress,
  goalRewards, type GoalReward, type InsertGoalReward,
  analyticsEvents, type AnalyticsEvent, type InsertAnalyticsEvent,
  pageViews, type PageView, type InsertPageView,
  notifications, type Notification, type InsertNotification,
  iotaWallets, type IotaWallet, type InsertIotaWallet,
  organizations, type Organization, type InsertOrganization,
  donations, type Donation, type InsertDonation,
  nonprofitSubmissions, type NonprofitSubmission, type InsertNonprofitSubmission,
  zkProofs, type ZkProof, type InsertZkProof,
  zkIdentityCommitments, type ZkIdentityCommitment, type InsertZkIdentityCommitment,
  apiKeys, type ApiKey, type InsertApiKey,
  apiKeyUsage, type ApiKeyUsage, type InsertApiKeyUsage,
  sbtCredentials, type SBTCredential, type InsertSBTCredential,
  userSavedOpportunities, type UserSavedOpportunity, type InsertUserSavedOpportunity,
  nonprofitSuggestions, type NonprofitSuggestion, type InsertNonprofitSuggestion,
  reviews, type Review, type InsertReview,
  videos, type Video, type InsertVideo,
  distributionSchedule, type DistributionSchedule, type InsertDistributionSchedule,
  apiUsage, type ApiUsage, type InsertApiUsage,
  costBudgets, type CostBudget, type InsertCostBudget,
  systemHealthMetrics, type SystemHealthMetric, type InsertSystemHealthMetric,
  trinityManagerConfig, type TrinityManagerConfig, type InsertTrinityManagerConfig
} from "@shared/schema";
import crypto from 'crypto';
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from './db';
import { pool } from './db';
import { eq, and, desc, asc, sql, gt, lt, gte, lte } from 'drizzle-orm';

// Fix type issues
const connectPg = connectPgSimple as any;

const PostgresSessionStore = connectPg(expressSession);

// Fix SessionStore type issue
declare namespace session {
  interface SessionStore {
    get: Function;
    set: Function;
    destroy: Function;
    touch?: Function;
    [key: string]: any;
  }
}

// modify the interface with any CRUD methods
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  getUserByGitHubId(githubId: string): Promise<User | undefined>;
  getUserBySlackId(slackId: string): Promise<User | undefined>;
  updateUserSlackInfo(userId: number, slackInfo: {
    slackUsername?: string | null;
    slackTeamId?: string | null;
    slackTeamName?: string | null;
    profilePicture?: string | null;
  }): Promise<User | undefined>;
  getUserWithoutWalletAddress(): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserTokens(id: number, tokens: number): Promise<User | undefined>;
  updateUserPoints(id: number, points: number): Promise<User | undefined>;
  incrementUserRepID(id: number, delta: number): Promise<User | undefined>;
  
  // API Keys for external developers
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKey(key: string): Promise<ApiKey | undefined>;
  getApiKeysByUserId(userId: number): Promise<ApiKey[]>;
  updateApiKeyUsage(key: string): Promise<void>;
  deactivateApiKey(keyId: number): Promise<void>;
  getApiKeyStats(key: string): Promise<{
    totalRequests: number;
    requestsToday: number;
    lastUsed: Date | null;
  }>;
  logApiKeyUsage(usage: InsertApiKeyUsage): Promise<void>;

  // SBT Credentials for external API access
  getUserSBTCredentials(userId: string): Promise<SBTCredential[]>;
  getSBTCredential(credentialId: number): Promise<SBTCredential | undefined>;
  incrementCredentialAccess(credentialId: number): Promise<void>;
  searchSBTCredentials(params: {
    userId: string;
    type?: string;
    issuer?: string;
    limit: number;
  }): Promise<SBTCredential[]>;

  // ZK Proofs
  getZkProof(proofId: string): Promise<{
    id: string;
    circuitId: string;
    proof: string;
    publicInputs: Record<string, any>;
    provider: string;
    userId?: number;
    createdAt: Date;
  } | undefined>;
  
  // Verification Codes (for authentication redundancy)
  createVerificationCode(code: { userId: number, code: string, expires: Date }): Promise<VerificationCode>;
  validateVerificationCode(usernameOrEmail: string, code: string): Promise<boolean>;
  updateUserWallets(id: number, connectedWallets: Record<string, string>): Promise<User | undefined>;
  updateUserWalletAddress(id: number, walletAddress: string): Promise<User | undefined>;
  linkWalletToUser(userId: number, walletAddress: string): Promise<User>;
  
  // Badges
  getBadgesByUserId(userId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // Referrals
  getReferralsByUserId(userId: number): Promise<Referral[]>;
  getReferralStats(userId: number): Promise<{level1: number, level2: number, level3: number, rewards: number}>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  updateReferralStatus(id: number, status: string, referredId?: number): Promise<Referral | undefined>;
  completeReferralWithRewards(
    referralId: number,
    referrerId: number,
    newUserId: number,
    referrerReward: number,
    newUserReward: number
  ): Promise<{ referral: Referral; referrerUser: User; newUser: User }>;
  
  // Share Links (Viral Growth)
  createShareLink(shareLink: InsertShareLink): Promise<ShareLink>;
  getShareLink(linkId: string): Promise<ShareLink | undefined>;
  getShareLinksByUserId(userId: number): Promise<ShareLink[]>;
  incrementShareViews(linkId: string): Promise<void>;
  incrementShareCount(linkId: string): Promise<void>;
  incrementShareConversions(linkId: string): Promise<void>;
  updateShareLinkRewards(linkId: string, rewardAmount: number, convertingUserId?: number): Promise<ShareLink | undefined>;
  
  // Multimodal Content (Educational)
  createMultimodalContent(content: InsertMultimodalContent): Promise<MultimodalContent>;
  getMultimodalContent(contentId: string): Promise<MultimodalContent | undefined>;
  getMultimodalContentByCategory(category: string): Promise<MultimodalContent[]>;
  getActiveMultimodalContent(): Promise<MultimodalContent[]>;
  incrementMultimodalViews(contentId: string): Promise<void>;
  updateMultimodalHelpfulVotes(contentId: string, increment: number): Promise<void>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProjectsPaginated(page: number, limit: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Developer Hub Access
  getDevHubAccess(userId: number): Promise<DevHubAccess | undefined>;
  getAllDevHubAccessRequests(): Promise<(DevHubAccess & { user: User })[]>;
  createDevHubAccessRequest(userId: number, githubHandle: string): Promise<DevHubAccess>;
  approveDevHubAccess(userId: number): Promise<boolean>;
  rejectDevHubAccess(userId: number): Promise<boolean>;
  
  // Verification
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  validateVerificationCode(username: string, code: string): Promise<boolean>;
  
  // Reputation Activities
  getReputationActivities(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      fromDate?: Date;
      toDate?: Date;
      sortBy?: 'timestamp' | 'points';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ReputationActivity[]>;
  createReputationActivity(activity: InsertReputationActivity): Promise<ReputationActivity>;
  
  // Leaderboard
  getLeaderboard(): Promise<{id: number, username: string, tokens: number, referrals: number, badges: number}[]>;

  // RFIs & RFPs
  getRfis(): Promise<any[]>;
  getRfiById(id: number): Promise<any | undefined>;
  createRfi(rfi: any): Promise<any>;
  getRfps(): Promise<any[]>;
  getRfpById(id: number): Promise<any | undefined>;
  createRfp(rfp: any): Promise<any>;
  updateRfpExternalFunding(id: number, fundingInfo: { externalFunding: boolean, externalFundingSource?: string, externalFundingAmount?: number }): Promise<any>;
  
  // Grant Sources & Matching
  getGrantSources(): Promise<any[]>;
  getActiveGrantSources(): Promise<any[]>;
  getGrantSourceById(id: number): Promise<any | undefined>;
  createGrantSource(source: any): Promise<any>;
  updateGrantSource(id: number, updates: any): Promise<any>;
  
  // IOTA Wallet
  getIotaWallet(userId: number): Promise<IotaWallet | undefined>;
  saveIotaWallet(userId: number, walletData: { mnemonic: string, createdAt: Date }): Promise<IotaWallet>;
  getGrantMatches(): Promise<any[]>;
  getGrantMatchesByRfpId(rfpId: number): Promise<any[]>;
  getGrantMatchById(id: number): Promise<any | undefined>;
  
  // SBT Credential Management
  getUserSBTCredentials(userId: number): Promise<any[]>;
  getSBTCredential(id: number): Promise<any | undefined>;
  createSBTCredential(credential: any): Promise<any>;
  updateSBTCredentialMonetization(id: number, updates: any): Promise<void>;
  incrementCredentialAccess(id: number): Promise<void>;
  logCredentialAccess(access: any): Promise<any>;
  revokeSBTCredential(id: number): Promise<void>;
  getCredentialAnalytics(id: number): Promise<any>;
  createCredentialPermission(permission: any): Promise<any>;
  getGrantMatchByRfpAndGrantSource(rfpId: number, grantSourceId: number): Promise<any | undefined>;
  getGrantMatchByBlockchainIds(blockchainGrantId: number, blockchainProjectId: number): Promise<any | undefined>;
  createGrantMatch(match: any): Promise<any>;
  updateGrantMatch(id: number, updates: any): Promise<any>;
  updateGrantMatchStatus(id: number, status: string): Promise<any>;
  
  // Networking Goals and Rewards
  getNetworkingGoals(userId: number): Promise<NetworkingGoal[]>;
  getNetworkingGoalById(id: number): Promise<NetworkingGoal | undefined>;
  createNetworkingGoal(goal: InsertNetworkingGoal): Promise<NetworkingGoal>;
  updateNetworkingGoal(id: number, updates: Partial<NetworkingGoal>): Promise<NetworkingGoal | undefined>;
  deleteNetworkingGoal(id: number): Promise<boolean>;
  
  // Goal Progress
  getGoalProgress(goalId: number): Promise<GoalProgress[]>;
  createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress>;
  
  // Goal Rewards
  getGoalRewards(userId: number): Promise<GoalReward[]>;
  getGoalRewardsByGoal(goalId: number): Promise<GoalReward[]>;
  createGoalReward(reward: InsertGoalReward): Promise<GoalReward>;
  claimGoalReward(rewardId: number): Promise<GoalReward | undefined>;
  getUserRewardProgress(userId: number): Promise<{ 
    goals: NetworkingGoal[], 
    progress: { [goalId: number]: GoalProgress[] },
    rewards: { [goalId: number]: GoalReward[] }
  }>;

  // Analytics
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  createPageView(pageView: InsertPageView): Promise<PageView>;
  incrementUserEngagement(userId: number, points: number): Promise<User | undefined>;
  getUserAnalyticsSummary(userId: number): Promise<{
    pageViews: number;
    events: number;
    lastActivity: Date | null;
    topPaths: { path: string; count: number }[];
    mostFrequentActions: { action: string; count: number }[];
  }>;

  // Notifications
  getUserNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Admin Notifications
  getAllNotifications(): Promise<Notification[]>;
  createBulkNotifications(userIds: number[], notification: Omit<InsertNotification, 'userId'>): Promise<number>;
  
  // Organizations (Nonprofits)
  getOrganizationByEmail(email: string): Promise<Organization | undefined>;
  getVerifiedOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganizationSBT(id: number, sbtId: string): Promise<Organization | undefined>;
  updateOrganizationTokens(id: number, tokens: number): Promise<Organization | undefined>;
  
  // Organization Submissions (for verification workflow)
  createOrganizationSubmission(submission: any): Promise<NonprofitSubmission>;
  getOrganizationSubmissionByToken(token: string): Promise<NonprofitSubmission | undefined>;
  updateOrganizationSubmissionStatus(id: number, status: string, date: Date): Promise<NonprofitSubmission | undefined>;
  
  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationsByOrganizationId(organizationId: number): Promise<Donation[]>;
  getDonationsByUserId(userId: number): Promise<Donation[]>;
  
  // Referral code lookup
  getUserByReferralCode(code: string): Promise<User | undefined>;
  
  // User Saved Purposes
  getUserSavedPurposes(userId: number): Promise<UserSavedPurpose[]>;
  savePurpose(purpose: InsertUserSavedPurpose): Promise<UserSavedPurpose>;
  removeSavedPurpose(userId: number, sourceType: string, sourceId: number): Promise<boolean>;
  isPurposeSaved(userId: number, sourceType: string, sourceId: number): Promise<boolean>;
  updatePurposeNote(purposeId: number, note: string): Promise<UserSavedPurpose | undefined>;
  updatePurposePriority(purposeId: number, priority: number): Promise<UserSavedPurpose | undefined>;
  
  // Nonprofit Suggestions
  createNonprofitSuggestion(suggestion: InsertNonprofitSuggestion): Promise<NonprofitSuggestion>;
  getNonprofitSuggestions(status?: string): Promise<NonprofitSuggestion[]>;
  updateNonprofitSuggestionStatus(id: number, status: string, adminNotes?: string, reviewedBy?: number): Promise<NonprofitSuggestion | undefined>;
  
  // Grants, Hackathons, and Nonprofits data
  getGrants(): Promise<any[]>;
  getHackathons(): Promise<any[]>;
  getNonprofits(): Promise<any[]>;
  
  // Trinity Manager Config
  getTrinityManagerConfig(managerId: string): Promise<TrinityManagerConfig | undefined>;
  getAllTrinityManagerConfigs(): Promise<TrinityManagerConfig[]>;
  createTrinityManagerConfig(config: InsertTrinityManagerConfig): Promise<TrinityManagerConfig>;
  updateTrinityManagerConfig(managerId: string, updates: Partial<InsertTrinityManagerConfig>): Promise<TrinityManagerConfig | undefined>;
  updateManagerRole(managerId: string, role: string): Promise<TrinityManagerConfig | undefined>;
  updateManagerPerformanceMetrics(managerId: string, metrics: any): Promise<TrinityManagerConfig | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  // ZK Proof methods
  async getZkProof(proofId: string): Promise<{
    id: string;
    circuitId: string;
    proof: string;
    publicInputs: Record<string, any>;
    provider: string;
    userId?: number;
    createdAt: Date;
  } | undefined> {
    try {
      const [proof] = await db.select().from(zkProofs).where(eq(zkProofs.id, proofId));
      return proof;
    } catch (error) {
      console.error(`Error getting ZK proof ${proofId}:`, error);
      return undefined;
    }
  }
  
  async createZkProof(proofData: InsertZkProof): Promise<ZkProof> {
    try {
      const [proof] = await db.insert(zkProofs).values(proofData).returning();
      return proof;
    } catch (error) {
      console.error("Error creating ZK proof:", error);
      throw new Error("Failed to create ZK proof");
    }
  }
  
  async verifyZkProof(proofId: string, result: boolean): Promise<ZkProof> {
    try {
      const [updatedProof] = await db
        .update(zkProofs)
        .set({ verificationResult: result })
        .where(eq(zkProofs.id, proofId))
        .returning();
      return updatedProof;
    } catch (error) {
      console.error(`Error updating ZK proof verification ${proofId}:`, error);
      throw new Error("Failed to update ZK proof verification");
    }
  }
  
  async createIdentityCommitment(commitmentData: InsertZkIdentityCommitment): Promise<ZkIdentityCommitment> {
    try {
      const [commitment] = await db.insert(zkIdentityCommitments).values(commitmentData).returning();
      return commitment;
    } catch (error) {
      console.error("Error creating identity commitment:", error);
      throw new Error("Failed to create identity commitment");
    }
  }
  
  async getIdentityCommitmentByUserId(userId: number): Promise<ZkIdentityCommitment | undefined> {
    try {
      const [commitment] = await db
        .select()
        .from(zkIdentityCommitments)
        .where(and(
          eq(zkIdentityCommitments.userId, userId),
          eq(zkIdentityCommitments.isRevoked, false)
        ));
      return commitment;
    } catch (error) {
      console.error(`Error getting identity commitment for user ${userId}:`, error);
      return undefined;
    }
  }
  
  // Trinity Manager Config methods
  async getTrinityManagerConfig(managerId: string): Promise<TrinityManagerConfig | undefined> {
    try {
      const [config] = await db
        .select()
        .from(trinityManagerConfig)
        .where(eq(trinityManagerConfig.managerId, managerId));
      return config;
    } catch (error) {
      console.error(`Error getting Trinity manager config ${managerId}:`, error);
      return undefined;
    }
  }
  
  async getAllTrinityManagerConfigs(): Promise<TrinityManagerConfig[]> {
    try {
      return await db.select().from(trinityManagerConfig);
    } catch (error) {
      console.error('Error getting all Trinity manager configs:', error);
      return [];
    }
  }
  
  async createTrinityManagerConfig(config: InsertTrinityManagerConfig): Promise<TrinityManagerConfig> {
    try {
      const [newConfig] = await db.insert(trinityManagerConfig).values(config).returning();
      return newConfig;
    } catch (error) {
      console.error('Error creating Trinity manager config:', error);
      throw new Error('Failed to create Trinity manager config');
    }
  }
  
  async updateTrinityManagerConfig(
    managerId: string, 
    updates: Partial<InsertTrinityManagerConfig>
  ): Promise<TrinityManagerConfig | undefined> {
    try {
      // Filter out undefined values to avoid setting null on not-null columns
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const [updated] = await db
        .update(trinityManagerConfig)
        .set({ ...filteredUpdates, updatedAt: new Date() })
        .where(eq(trinityManagerConfig.managerId, managerId))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating Trinity manager config ${managerId}:`, error);
      return undefined;
    }
  }
  
  async updateManagerRole(
    managerId: string, 
    role: 'conductor' | 'performer' | 'learner' | 'observer'
  ): Promise<TrinityManagerConfig | undefined> {
    try {
      const validRoles = ['conductor', 'performer', 'learner', 'observer'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
      }
      
      const [updated] = await db
        .update(trinityManagerConfig)
        .set({ role, updatedAt: new Date() })
        .where(eq(trinityManagerConfig.managerId, managerId))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating manager role ${managerId}:`, error);
      return undefined;
    }
  }
  
  async updateManagerPerformanceMetrics(
    managerId: string, 
    metrics: Partial<TrinityManagerConfig['performanceMetrics']>
  ): Promise<TrinityManagerConfig | undefined> {
    try {
      // Get current config to merge metrics
      const current = await this.getTrinityManagerConfig(managerId);
      if (!current) {
        return undefined;
      }
      
      const updatedMetrics = {
        ...(current.performanceMetrics || {}),
        ...metrics
      };
      
      const [updated] = await db
        .update(trinityManagerConfig)
        .set({ 
          performanceMetrics: updatedMetrics,
          lastSync: new Date(),
          updatedAt: new Date()
        })
        .where(eq(trinityManagerConfig.managerId, managerId))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating manager performance metrics ${managerId}:`, error);
      return undefined;
    }
  }
  
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // We'll seed demo projects later asynchronously
    // This avoids circular dependencies and reference errors
    setTimeout(() => {
      this.seedDemoProjects().catch(err => {
        console.warn("Error seeding demo projects:", err.message);
      });
      
      // Also seed grant sources
      this.seedGrantSources().catch(err => {
        console.warn("Error seeding grant sources:", err.message);
      });
      
      // Seed Trinity Managers
      this.seedTrinityManagers().catch(err => {
        console.warn("Error seeding Trinity managers:", err.message);
      });
    }, 5000);
  }
  
  // Seed Trinity Managers with default configurations
  async seedTrinityManagers() {
    try {
      const existingManagers = await this.getAllTrinityManagerConfigs();
      
      if (existingManagers.length > 0) {
        console.log(`[Trinity Managers] ✅ ${existingManagers.length} manager(s) already configured`);
        return;
      }
      
      console.log('[Trinity Managers] 🌱 Seeding default manager configurations...');
      
      const defaultManagers = [
        {
          managerId: 'User',
          managerName: 'Human User',
          status: 'active',
          role: 'conductor',
          capabilities: ['task-creation', 'task-assignment', 'strategic-planning', 'verification'],
          performanceMetrics: {},
          rotationPolicy: { strategy: 'manual', stickyConductor: true },
          thresholds: { confidenceTarget: 0.95, minConfidence: 0.80, challengeThreshold: 0.90 },
          budget: {},
          isAutonomous: false,
          apiEndpoint: null
        },
        {
          managerId: 'APM',
          managerName: 'AI-Prompt-Manager',
          status: 'active',
          role: 'performer',
          capabilities: ['prompt-optimization', 'ai-routing', 'free-tier-arbitrage', 'cost-optimization'],
          performanceMetrics: { tasksCompleted: 0, successRate: 0, tokensUsed: 0, costUsd: 0 },
          rotationPolicy: { strategy: 'fibonacci', windowMs: 3600000 },
          thresholds: { confidenceTarget: 0.92, minConfidence: 0.85, challengeThreshold: 0.90, autoAdjust: true },
          budget: { maxTokensPerHour: 100000, maxCostPerDay: 5.0, rateLimitRps: 10 },
          isAutonomous: true,
          apiEndpoint: '/api/trinity/managers/APM'
        },
        {
          managerId: 'HDM',
          managerName: 'HyperDAGManager',
          status: 'active',
          role: 'performer',
          capabilities: ['dag-optimization', 'chaos-theory', 'pattern-mining', 'fractal-analysis'],
          performanceMetrics: { tasksCompleted: 0, successRate: 0 },
          rotationPolicy: { strategy: 'fibonacci', windowMs: 3600000 },
          thresholds: { confidenceTarget: 0.93, minConfidence: 0.85, challengeThreshold: 0.90, autoAdjust: true },
          budget: { maxTokensPerHour: 50000, maxCostPerDay: 2.0, rateLimitRps: 5 },
          isAutonomous: true,
          apiEndpoint: '/api/trinity/managers/HDM'
        },
        {
          managerId: 'Mel',
          managerName: 'ImageBearerAI (Mel)',
          status: 'active',
          role: 'learner',
          capabilities: ['semantic-analysis', 'hallucination-detection', 'verification', 'confidence-scoring'],
          performanceMetrics: { tasksCompleted: 0, successRate: 0, confidenceAvg: 0.92, challengeRate: 0 },
          rotationPolicy: { strategy: 'fibonacci', windowMs: 3600000 },
          thresholds: { confidenceTarget: 0.95, minConfidence: 0.90, challengeThreshold: 0.90, autoAdjust: true },
          budget: { maxTokensPerHour: 30000, maxCostPerDay: 1.0, rateLimitRps: 3 },
          isAutonomous: true,
          apiEndpoint: '/api/trinity/managers/Mel'
        }
      ];
      
      for (const manager of defaultManagers) {
        await this.createTrinityManagerConfig(manager);
        console.log(`[Trinity Managers] ✅ Initialized: ${manager.managerName} (${manager.managerId})`);
      }
      
      console.log('[Trinity Managers] 🎉 All managers initialized successfully');
    } catch (error) {
      console.error('[Trinity Managers] ❌ Error seeding managers:', error);
    }
  }
  
  // Seed grant sources with real data from web3 ecosystem, focusing on HyperDAG's ethos
  async seedGrantSources() {
    try {
      // Import the schema
      const schema = await import('@shared/schema');
      
      // Check if grantSources table exists in schema
      if (!schema.grantSources || typeof schema.grantSources !== 'object') {
        console.warn('[Storage] ⚠️  grantSources table not defined in schema - seeding skipped. Add table to shared/schema.ts');
        return;
      }
      
      const grantSourcesTable = schema.grantSources;
      
      // Check if grant sources exist already
      const existingGrantSources = await db.select().from(grantSourcesTable);
      
      // Only add grant sources if none exist yet
      if (existingGrantSources.length === 0) {
        console.log('No grant sources found, seeding with Web3 and AI grants that align with HyperDAG ethos...');
        
        // List of Web3 and AI grant sources that align with HyperDAG's ethos
        // These are focused on helping underserved communities through technology
        const sources = [
          // From the comprehensive list of grant sources the user provided
          {
            name: "Grants.gov",
            website: "https://www.grants.gov",
            description: "U.S. federal grants for AI research and tech. Search 'artificial intelligence' or 'blockchain'. Provides access to grants that can help bridge technological divides and support underserved communities.",
            categories: ["AI", "Limited Web3", "Federal Funding", "Research", "Inclusion"],
            availableFunds: 1000000,
            applicationUrl: "https://www.grants.gov",
            contactEmail: "support@grants.gov",
          },
          {
            name: "Instrumentl",
            website: "https://www.instrumentl.com",
            description: "Aggregates government, private, and nonprofit grants for AI and Web3 with deadline tracking. Helps connect underrepresented developers with funding opportunities for social impact projects.",
            categories: ["AI", "Web3", "Grant Discovery", "Social Impact"],
            availableFunds: null,
            applicationUrl: "https://www.instrumentl.com",
            contactEmail: "support@instrumentl.com",
          },
          {
            name: "ChainGPT Web3-AI Grant Program",
            website: "https://www.chaingpt.org",
            description: "$1M for Web3-AI projects with mentorship and API credits. Targets AI-powered dApps and blockchain innovation that can create opportunities for disenfranchised communities worldwide.",
            categories: ["AI", "Web3", "Blockchain Innovation", "Education", "Financial Inclusion"],
            availableFunds: 1000000,
            applicationUrl: "https://www.chaingpt.org",
            contactEmail: "grants@chaingpt.org",
          },
          {
            name: "Coinfabrik's Web3 Grants Guide",
            website: "https://www.coinfabrik.com",
            description: "Lists Web3 grants from Solana, Polygon, Ethereum ecosystems with a focus on accessibility and inclusion. Helps underrepresented developers navigate complex application processes and find funding.",
            categories: ["Web3", "AI-Web3", "Grant Discovery", "Blockchain"],
            availableFunds: null,
            applicationUrl: "https://www.coinfabrik.com",
            contactEmail: "grants@coinfabrik.com",
          },
          {
            name: "Solana Foundation Grants",
            website: "https://solana.com",
            description: "Funds AI and Web3 projects via DePIN protocol, e.g., $30M for io.net. Supports decentralized GPU networks for AI/ML that can benefit underserved communities with limited access to technology.",
            categories: ["Web3", "AI-Web3", "Solana", "DePIN", "Computation", "Technology Access"],
            availableFunds: 3000000,
            applicationUrl: "https://solana.com",
            contactEmail: "grants@solana.foundation",
          },
          {
            name: "National Science Foundation (NSF)",
            website: "https://www.nsf.gov",
            description: "$700M+ annually for AI including blockchain-AI projects with specific focus on research that addresses socioeconomic disparities and improves accessibility to technology in underserved areas.",
            categories: ["AI", "Emerging Web3", "Research", "STEM Education", "Underrepresented Groups"],
            availableFunds: 7000000,
            applicationUrl: "https://www.nsf.gov",
            contactEmail: "grants@nsf.gov",
          },
          {
            name: "Gitcoin Grants",
            website: "https://gitcoin.co",
            description: "Decentralized platform funding open-source AI and Web3 projects via quadratic funding. Supports cross-chain innovation and community-driven projects that help underserved communities.",
            categories: ["Web3", "AI-Web3", "Open Source", "Quadratic Funding", "Social Impact"],
            availableFunds: 1000000,
            applicationUrl: "https://gitcoin.co",
            contactEmail: "support@gitcoin.co",
          },
          {
            name: "Polygon Community Grants",
            website: "https://polygon.technology",
            description: "Offers 100M POL annually for Web3 projects, with 1M POL for AI integration via Eliza Labs. Supports projects that solve real problems for marginalized communities.",
            categories: ["Web3", "AI-Web3", "Scalability", "Privacy", "DeFi", "Education"],
            availableFunds: 2000000,
            applicationUrl: "https://polygon.technology",
            contactEmail: "grants@polygon.technology",
          },
          {
            name: "Web3 Foundation Grants",
            website: "https://grants.web3.foundation",
            description: "Funds Polkadot ecosystem projects, focusing on decentralization and AI-Web3 applications. Supports interoperability goals and projects for financial inclusion.",
            categories: ["Web3", "AI-Web3", "Polkadot", "Interoperability", "Governance", "Privacy"],
            availableFunds: 1500000,
            applicationUrl: "https://grants.web3.foundation",
            contactEmail: "grants@web3.foundation",
          },
          {
            name: "SingularityNET Deep Funding",
            website: "https://deepfunding.ai",
            description: "Funds AI projects like HyperDAG's reputation and digital identity systems ($120k-$140k). Focuses on decentralized AI that addresses healthcare, education, and poverty in underserved regions.",
            categories: ["AI", "Web3", "Reputation Systems", "Identity", "Healthcare", "Education"],
            availableFunds: 800000,
            applicationUrl: "https://deepfunding.ai",
            contactEmail: "funding@singularitynet.io",
          },
          {
            name: "Filecoin Grants",
            website: "https://protocol.ai",
            description: "Supports decentralized storage projects, relevant for HyperDAG's data layer. Offers up to $50k for tools and integrations that can help preserve cultural heritage and critical data for disadvantaged communities.",
            categories: ["Web3", "AI-Web3", "Decentralized Storage", "Data Preservation", "Cultural Heritage"],
            availableFunds: 500000,
            applicationUrl: "https://protocol.ai",
            contactEmail: "grants@filecoin.org",
          },
          {
            name: "The Graph Grants Program",
            website: "https://thegraph.com",
            description: "Funds decentralized indexing/querying, aligning with HyperDAG's data-centric architecture. Supports Web3-AI data layers that can make information more accessible to underrepresented groups.",
            categories: ["Web3", "AI-Web3", "Data Indexing", "Information Access", "Education"],
            availableFunds: 400000,
            applicationUrl: "https://thegraph.com",
            contactEmail: "grants@thegraph.foundation",
          },
          {
            name: "Ethereum Ecosystem Support Program",
            website: "https://ethereum.org",
            description: "Funds blockchain innovation including AI-Web3 interoperability, with emphasis on projects that promote financial inclusion for the billions of unbanked individuals worldwide.",
            categories: ["Web3", "AI-Web3", "Ethereum", "Interoperability", "Financial Inclusion"],
            availableFunds: 1200000,
            applicationUrl: "https://ethereum.org",
            contactEmail: "grants@ethereum.org",
          },
          {
            name: "Cardano Catalyst",
            website: "https://cardanocataly.st",
            description: "$4.7M for community-driven projects, including AI-focused initiatives that support financial infrastructure development in economically disadvantaged regions.",
            categories: ["Web3", "AI-Web3", "Community", "Blockchain", "Financial Inclusion"],
            availableFunds: 4700000,
            applicationUrl: "https://cardanocataly.st",
            contactEmail: "support@cardanocatalyst.io",
          },
          {
            name: "Celo Foundation Grants",
            website: "https://celo.org/grants",
            description: "Funding projects that create financial tools accessible to anyone with a mobile phone, particularly focusing on underserved populations in developing regions.",
            categories: ["Web3", "Mobile-First", "Financial Inclusion", "Developing Regions", "Social Impact"],
            availableFunds: 200000,
            applicationUrl: "https://celo.org/grants",
            contactEmail: "grants@celo.org",
          },
          {
            name: "Chainlink Grants",
            website: "https://chain.link/community/grants",
            description: "Up to $100k for smart contract and oracle development for AI-Web3, with focus on creating reliable data solutions for communities with limited technological infrastructure.",
            categories: ["Web3", "AI-Web3", "Oracles", "Smart Contracts", "Data Access"],
            availableFunds: 100000,
            applicationUrl: "https://chain.link/community/grants",
            contactEmail: "grants@chainlink.com",
          },
          {
            name: "Osmosis Grants",
            website: "https://grants.osmosis.zone",
            description: "$5k-$500k for Web3 infrastructure and analytics projects that improve access to decentralized finance for underbanked populations worldwide.",
            categories: ["Web3", "AI-Web3", "Infrastructure", "Analytics", "Financial Inclusion"],
            availableFunds: 500000,
            applicationUrl: "https://grants.osmosis.zone",
            contactEmail: "grants@osmosis.zone",
          },
          {
            name: "UNICEF Innovation Fund",
            website: "https://www.unicef.org/innovation/venturefund",
            description: "UNICEF's Innovation Fund invests in frontier technologies, including blockchain, to solve critical challenges affecting children and vulnerable populations in developing countries.",
            categories: ["Social Impact", "Emerging Web3", "Healthcare", "Education", "Child Welfare"],
            availableFunds: 100000,
            applicationUrl: "https://www.unicef.org/innovation/venturefund",
            contactEmail: "innovationfund@unicef.org",
          },
          {
            name: "Harmony Grants",
            website: "https://harmony.one/grants",
            description: "Supporting initiatives that use blockchain to create economic opportunities for the bottom billion people, with emphasis on cross-border finance and identity solutions.",
            categories: ["Web3", "Financial Inclusion", "Identity", "Cross-Border", "Social Impact"],
            availableFunds: 150000,
            applicationUrl: "https://harmony.one/grants",
            contactEmail: "grants@harmony.one",
          },
          {
            name: "Meta AI Research Grant",
            website: "https://ai.facebook.com/research/request-for-proposals/",
            description: "Funding AI research projects that address accessibility challenges and develop technologies for people with disabilities or limited access to technology.",
            categories: ["AI", "Accessibility", "Disabilities", "Inclusion"],
            availableFunds: 500000,
            applicationUrl: "https://ai.facebook.com/research/request-for-proposals/",
            contactEmail: "ai-research-grants@meta.com",
          },
          {
            name: "HBAR Foundation Grants",
            website: "https://www.hbarfoundation.org/",
            description: "Supports social impact projects on Hedera that address climate change, financial inclusion, education, and healthcare for disadvantaged communities globally.",
            categories: ["Web3", "Social Impact", "Climate", "Financial Inclusion", "Healthcare", "Education"],
            availableFunds: 300000,
            applicationUrl: "https://www.hbarfoundation.org/apply",
            contactEmail: "grants@hbarfoundation.org",
          },
          {
            name: "World Bank Digital Development Fund",
            website: "https://www.worldbank.org/en/programs/digital-development-partnership",
            description: "Funding AI and blockchain initiatives that bridge the digital divide in developing countries, with focus on rural communities and women's digital inclusion.",
            categories: ["Digital Inclusion", "Developing Regions", "Gender Equality", "Rural Communities"],
            availableFunds: 400000,
            applicationUrl: "https://www.worldbank.org/en/programs/digital-development-partnership",
            contactEmail: "ddp@worldbank.org",
          },
          {
            name: "Near Foundation Grants",
            website: "https://near.foundation/grants",
            description: "Supporting open web innovations that focus on creating sustainable economic opportunities for underrepresented developers and entrepreneurs in emerging markets.",
            categories: ["Web3", "Open Web", "Emerging Markets", "Developer Tools", "Economic Opportunity"],
            availableFunds: 180000,
            applicationUrl: "https://near.foundation/grants",
            contactEmail: "grants@near.foundation",
          },
          {
            name: "Zcash Community Grants",
            website: "https://zcashcommunitygrants.org",
            description: "$6.9M for Zcash ecosystem development and public goods, with focus on financial privacy tools for vulnerable populations in high-surveillance environments.",
            categories: ["Web3", "Privacy", "Blockchain", "Public Goods", "Human Rights"],
            availableFunds: 6900000,
            applicationUrl: "https://zcashcommunitygrants.org",
            contactEmail: "grants@zcashfoundation.org",
          },
          // Bridge organization to the broader grants collections
          {
            name: "Web3 Grants Collective",
            website: "https://app.folk.app/shared/Top-100-Web3-Grants-sI1rSi46Slu8RcGDhEtE80OrsfFmiGsp",
            description: "A comprehensive collection of the Top 100 Web3 Grants available for blockchain and decentralized projects, with special highlighting of opportunities focused on social impact and underserved communities.",
            categories: ["Web3", "Grants Directory", "Social Impact", "Resource Hub"],
            availableFunds: null,
            applicationUrl: "https://app.folk.app/shared/Top-100-Web3-Grants-sI1rSi46Slu8RcGDhEtE80OrsfFmiGsp",
            contactEmail: null,
          }
        ];
        
        // Insert each grant source
        for (const source of sources) {
          await this.createGrantSource({
            ...source,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        console.log(`Seeded ${sources.length} grant sources aligned with HyperDAG's ethos of helping the last, the lost, and the least through AI and Web3 technologies.`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Failed to seed grant sources:', errorMsg);
    }
  }
  
  async seedDemoProjects() {
    try {
      // Import the schema
      const schema = await import('@shared/schema');
      
      // Check if tables exist properly
      if (!schema.users || !schema.projects ||
          typeof schema.users !== 'object' || typeof schema.projects !== 'object') {
        console.warn('[Storage] ⚠️  users or projects table not properly defined in schema - seeding skipped. Ensure tables have required columns in shared/schema.ts');
        return;
      }
      
      const usersTable = schema.users;
      const projectsTable = schema.projects;
      
      // Skip seeding if projects table is a placeholder (has only 'id' column)
      const projectColumns = Object.keys(projectsTable);
      if (projectColumns.length <= 2) {
        console.warn('[Storage] ⚠️  projects table is a placeholder schema - demo project seeding skipped');
        return;
      }
      
      // Check if users exist
      const allUsers = await db.select().from(usersTable);
      
      // Check if projects exist already
      const existingProjects = await db.select().from(projectsTable);
      
      // Only add demo projects if:
      // 1. No projects exist yet
      // 2. At least one user exists (to be the creator)
      if (existingProjects.length === 0 && allUsers.length > 0) {
        // Use the ID of the first user as the creator
        const creatorId = allUsers[0].id;
        
        // Add some initial sample projects
        await this.createProject({
          creatorId,
          title: "Coding Bootcamp for Rural Schools",
          description: "Education initiative to introduce programming to students in rural areas",
          type: "rfp",
          categories: ["Education", "Technology"],
          fundingGoal: 100,
          durationDays: 30
        });
        
        await this.createProject({
          creatorId,
          title: "Solar Panel Installation Training",
          description: "Training program to teach communities how to install and maintain solar panels",
          type: "rfp",
          categories: ["Sustainability", "Energy"],
          fundingGoal: 50,
          durationDays: 45
        });
        
        await this.createProject({
          creatorId,
          title: "Clean Water Initiative",
          description: "Providing water purification systems to communities in need",
          type: "rfp",
          categories: ["Health", "Sustainability"],
          fundingGoal: 100,
          durationDays: 60
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Failed to seed demo projects:', errorMsg);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, address));
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    // Hash the Discord ID to match stored format
    const discordIdHash = crypto.createHash('sha256')
      .update(`discord:${discordId}`)
      .digest('hex');
    
    const [user] = await db.select().from(users).where(eq(users.discordIdHash, discordIdHash));
    return user;
  }

  async getUserByGitHubId(githubId: string): Promise<User | undefined> {
    // Hash the GitHub ID to match stored format
    const githubIdHash = crypto.createHash('sha256')
      .update(`github:${githubId}`)
      .digest('hex');
    
    const [user] = await db.select().from(users).where(eq(users.githubIdHash, githubIdHash));
    return user;
  }

  async getUserBySlackId(slackId: string): Promise<User | undefined> {
    // Hash the Slack ID to match stored format
    const slackIdHash = crypto.createHash('sha256')
      .update(`slack:${slackId}`)
      .digest('hex');
    
    const [user] = await db.select().from(users).where(eq(users.slackIdHash, slackIdHash));
    return user;
  }

  async updateUserSlackInfo(userId: number, slackInfo: {
    slackUsername?: string | null;
    slackTeamId?: string | null;
    slackTeamName?: string | null;
    profilePicture?: string | null;
  }): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        slackUsername: slackInfo.slackUsername,
        slackTeamId: slackInfo.slackTeamId,
        slackTeamName: slackInfo.slackTeamName,
        ...(slackInfo.profilePicture && { profilePicture: slackInfo.profilePicture }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async getUserWithoutWalletAddress(): Promise<User | undefined> {
    // Find a user that doesn't have a wallet address linked
    const [user] = await db.select().from(users).where(sql`${users.walletAddress} IS NULL`).limit(1);
    return user;
  }
  
  async linkWalletToUser(userId: number, walletAddress: string): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ walletAddress })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Insert the new user
    const [user] = await db.insert(users).values({
      ...insertUser,
      referralCode,
      tokens: 0,
      points: 0,
      createdAt: new Date()
    }).returning();
    
    // Handle referral chain if user was referred
    if (user.referredBy) {
      const referrer = await this.getUser(user.referredBy);
      if (referrer) {
        // Create referral record
        await this.createReferral({
          referrerId: referrer.id,
          referredId: user.id,
          level: 1,
          rewardAmount: 5
        });
        
        // Award tokens to referrer
        await this.updateUserTokens(referrer.id, referrer.tokens + 5);
        
        // Find level 2 referrer
        if (referrer.referredBy) {
          const level2Referrer = await this.getUser(referrer.referredBy);
          if (level2Referrer) {
            await this.createReferral({
              referrerId: level2Referrer.id,
              referredId: user.id,
              level: 2,
              rewardAmount: 2
            });
            
            await this.updateUserTokens(level2Referrer.id, level2Referrer.tokens + 2);
            
            // Find level 3 referrer
            if (level2Referrer.referredBy) {
              const level3Referrer = await this.getUser(level2Referrer.referredBy);
              if (level3Referrer) {
                await this.createReferral({
                  referrerId: level3Referrer.id,
                  referredId: user.id,
                  level: 3,
                  rewardAmount: 1
                });
                
                await this.updateUserTokens(level3Referrer.id, level3Referrer.tokens + 1);
              }
            }
          }
        }
      }
    }
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      console.log(`[storage] Updating user ${id} with data:`, userData);
      
      // First check if user exists
      const user = await this.getUser(id);
      if (!user) {
        console.error(`[storage] Cannot update user ${id}: user not found`);
        return undefined;
      }
      
      // Only include properties that are defined in the users table
      const validUserData: Record<string, any> = {};
      Object.keys(userData).forEach(key => {
        if (userData[key as keyof User] !== undefined) {
          validUserData[key] = userData[key as keyof User];
        }
      });
      
      if (Object.keys(validUserData).length === 0) {
        console.error(`[storage] Cannot update user ${id}: no valid properties provided`);
        return user; // Return original user if no valid properties to update
      }
      
      const [updatedUser] = await db.update(users)
        .set(validUserData)
        .where(eq(users.id, id))
        .returning();
      
      console.log(`[storage] User ${id} updated successfully:`, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error(`[storage] Failed to update user ${id}:`, error);
      console.error(error); // Log full error for debugging
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserTokens(id: number, tokens: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ tokens })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPoints(id: number, points: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ points })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async incrementUserRepID(id: number, delta: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ 
        repIDScore: sql`${users.repIDScore} + ${delta}`
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserWallets(id: number, connectedWallets: Record<string, string>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ connectedWallets })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Badge methods
  async getBadgesByUserId(userId: number): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.userId, userId));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges)
      .values({
        ...badge,
        earnedAt: new Date()
      })
      .returning();
    
    // Update user points when badge is earned
    const user = await this.getUser(badge.userId);
    if (user) {
      await this.updateUserPoints(user.id, user.points + 10);
    }
    
    return newBadge;
  }

  // Referral methods
  async getReferralsByUserId(userId: number): Promise<Referral[]> {
    try {
      return await db.select().from(referrals).where(eq(referrals.referrerId, userId));
    } catch (error) {
      console.error("[ERROR] Error fetching referrals:", error);
      
      // Just return empty array for now instead of trying complex fallback
      // that might cause more issues
      return [];
      
      /* Commented out problematic fallback code
      // If the error is about a missing column, let's try a more basic query
      // that only selects the columns we know exist
      if (error.code === '42703' && error.message?.includes('column')) {
        try {
          // Use a SQL query to avoid ORM column mappings
          const result = await db.execute(
            `SELECT id, referrer_id, referred_id, level, 
             reward_amount, created_at
             FROM referrals WHERE referrer_id = $1`,
            [userId]
          );
          
          // Map the raw results to the expected Referral type structure
          return result.rows.map(row => ({
            id: row.id,
            referrerId: row.referrer_id,
            referredId: row.referred_id,
            level: row.level,
            rewardAmount: row.reward_amount,
            // Add default values for missing columns
            status: 'pending',
            createdAt: row.created_at || new Date()
          }));
        } catch (fallbackError) {
          console.error("[ERROR] Fallback referral query failed:", fallbackError);
          return []; // Return empty array as fallback
        }
      }
      */
    }
  }

  async getReferralStats(userId: number): Promise<{level1: number, level2: number, level3: number, rewards: number}> {
    try {
      const referrals = await this.getReferralsByUserId(userId);
      
      const level1 = referrals.filter(r => r.level === 1).length;
      const level2 = referrals.filter(r => r.level === 2).length;
      const level3 = referrals.filter(r => r.level === 3).length;
      // Handle null values in rewardAmount
      const rewards = referrals.reduce((total, r) => total + (r.rewardAmount || 0), 0);
      
      return { level1, level2, level3, rewards };
    } catch (error) {
      console.error("[ERROR] Failed to fetch referral stats:", error);
      // Return defaults on error
      return { level1: 0, level2: 0, level3: 0, rewards: 0 };
    }
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals)
      .values({
        ...referral,
        createdAt: new Date()
      })
      .returning();
    return newReferral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    try {
      const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
      return referral;
    } catch (error) {
      console.error("[ERROR] Error fetching referral by code:", error);
      return undefined;
    }
  }

  async updateReferralStatus(id: number, status: string, referredId?: number): Promise<Referral | undefined> {
    try {
      const updates: any = {
        status,
        completedAt: status === 'completed' ? new Date() : null
      };
      if (referredId !== undefined) {
        updates.referredId = referredId;
      }
      const [updated] = await db.update(referrals)
        .set(updates)
        .where(eq(referrals.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("[ERROR] Error updating referral status:", error);
      return undefined;
    }
  }

  async completeReferralWithRewards(
    referralId: number,
    referrerId: number,
    newUserId: number,
    referrerReward: number,
    newUserReward: number
  ): Promise<{ referral: Referral; referrerUser: User; newUser: User }> {
    // Use database transaction for atomicity
    return await db.transaction(async (tx) => {
      // 1. Update referral status
      const [updatedReferral] = await tx.update(referrals)
        .set({ 
          status: 'completed',
          referredUserId: newUserId,
          completedAt: new Date()
        })
        .where(eq(referrals.id, referralId))
        .returning();

      if (!updatedReferral) {
        throw new Error('Failed to update referral status');
      }

      // 2. Award RepID to referrer (atomic increment)
      const [referrerUser] = await tx.update(users)
        .set({ 
          repIDScore: sql`${users.repIDScore} + ${referrerReward}`
        })
        .where(eq(users.id, referrerId))
        .returning();

      if (!referrerUser) {
        throw new Error('Failed to award referrer RepID');
      }

      // 3. Award welcome bonus to new user (atomic increment)
      const [newUser] = await tx.update(users)
        .set({ 
          repIDScore: sql`${users.repIDScore} + ${newUserReward}`
        })
        .where(eq(users.id, newUserId))
        .returning();

      if (!newUser) {
        throw new Error('Failed to award new user RepID');
      }

      // All operations succeeded - transaction will auto-commit
      return { referral: updatedReferral, referrerUser, newUser };
    });
  }

  // Share Links methods
  async createShareLink(shareLink: InsertShareLink): Promise<ShareLink> {
    const [newShareLink] = await db.insert(shareLinks).values(shareLink).returning();
    return newShareLink;
  }

  async getShareLink(linkId: string): Promise<ShareLink | undefined> {
    try {
      const [link] = await db.select().from(shareLinks).where(eq(shareLinks.linkId, linkId));
      return link;
    } catch (error) {
      console.error("[ERROR] Error fetching share link:", error);
      return undefined;
    }
  }

  async getShareLinksByUserId(userId: number): Promise<ShareLink[]> {
    try {
      return await db.select().from(shareLinks).where(eq(shareLinks.userId, userId)).orderBy(desc(shareLinks.createdAt));
    } catch (error) {
      console.error("[ERROR] Error fetching share links:", error);
      return [];
    }
  }

  async incrementShareViews(linkId: string): Promise<void> {
    try {
      await db.update(shareLinks)
        .set({ viewCount: sql`${shareLinks.viewCount} + 1` })
        .where(eq(shareLinks.linkId, linkId));
    } catch (error) {
      console.error("[ERROR] Error incrementing share views:", error);
    }
  }

  async incrementShareCount(linkId: string): Promise<void> {
    try {
      await db.update(shareLinks)
        .set({ shareCount: sql`${shareLinks.shareCount} + 1` })
        .where(eq(shareLinks.linkId, linkId));
    } catch (error) {
      console.error("[ERROR] Error incrementing share count:", error);
    }
  }

  async incrementShareConversions(linkId: string): Promise<void> {
    try {
      await db.update(shareLinks)
        .set({ conversionCount: sql`${shareLinks.conversionCount} + 1` })
        .where(eq(shareLinks.linkId, linkId));
    } catch (error) {
      console.error("[ERROR] Error incrementing share conversions:", error);
    }
  }

  async updateShareLinkRewards(linkId: string, rewardAmount: number, convertingUserId?: number): Promise<ShareLink | undefined> {
    try {
      // Get current share link to update metadata
      const currentLink = await this.getShareLink(linkId);
      if (!currentLink) return undefined;
      
      // Update metadata to track conversion
      const updatedMetadata = {
        ...currentLink.metadata,
        conversions: [
          ...(currentLink.metadata?.conversions || []),
          ...(convertingUserId ? [convertingUserId] : [])
        ]
      };
      
      const [updated] = await db.update(shareLinks)
        .set({
          repIdRewardEarned: sql`${shareLinks.repIdRewardEarned} + ${rewardAmount}`,
          rewardsClaimed: true,
          metadata: updatedMetadata
        })
        .where(eq(shareLinks.linkId, linkId))
        .returning();
      return updated;
    } catch (error) {
      console.error("[ERROR] Error updating share link rewards:", error);
      return undefined;
    }
  }

  // Multimodal Content methods
  async createMultimodalContent(content: InsertMultimodalContent): Promise<MultimodalContent> {
    const [newContent] = await db.insert(multimodalContent).values(content).returning();
    return newContent;
  }

  async getMultimodalContent(contentId: string): Promise<MultimodalContent | undefined> {
    try {
      const [content] = await db.select().from(multimodalContent).where(eq(multimodalContent.contentId, contentId));
      return content;
    } catch (error) {
      console.error("[ERROR] Error fetching multimodal content:", error);
      return undefined;
    }
  }

  async getMultimodalContentByCategory(category: string): Promise<MultimodalContent[]> {
    try {
      return await db.select()
        .from(multimodalContent)
        .where(and(
          eq(multimodalContent.category, category),
          eq(multimodalContent.isActive, true)
        ));
    } catch (error) {
      console.error("[ERROR] Error fetching multimodal content by category:", error);
      return [];
    }
  }

  async getActiveMultimodalContent(): Promise<MultimodalContent[]> {
    try {
      return await db.select()
        .from(multimodalContent)
        .where(eq(multimodalContent.isActive, true))
        .orderBy(desc(multimodalContent.viewCount));
    } catch (error) {
      console.error("[ERROR] Error fetching active multimodal content:", error);
      return [];
    }
  }

  async incrementMultimodalViews(contentId: string): Promise<void> {
    try {
      await db.update(multimodalContent)
        .set({ viewCount: sql`${multimodalContent.viewCount} + 1` })
        .where(eq(multimodalContent.contentId, contentId));
    } catch (error) {
      console.error("[ERROR] Error incrementing multimodal views:", error);
    }
  }

  async updateMultimodalHelpfulVotes(contentId: string, increment: number): Promise<void> {
    try {
      await db.update(multimodalContent)
        .set({ helpfulVotes: sql`${multimodalContent.helpfulVotes} + ${increment}` })
        .where(eq(multimodalContent.contentId, contentId));
    } catch (error) {
      console.error("[ERROR] Error updating multimodal helpful votes:", error);
    }
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    // Return projects sorted by creation date (newest first)
    return await db.select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.creatorId, userId));
  }
  
  async getProjectsPaginated(page: number, limit: number): Promise<Project[]> {
    const offset = (page - 1) * limit;
    return await db.select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects)
      .values({
        ...project,
        currentFunding: 0,
        createdAt: new Date()
      })
      .returning();
    
    // Award tokens and potentially a badge for creating a project
    const user = await this.getUser(project.creatorId);
    if (user) {
      await this.updateUserTokens(user.id, user.tokens + 10);
      
      // Check if user already has creator badge
      const userBadges = await this.getBadgesByUserId(user.id);
      const hasCreatorBadge = userBadges.some(b => b.type === 'creator');
      
      if (!hasCreatorBadge) {
        await this.createBadge({
          userId: user.id,
          type: 'creator'
        });
      }
    }
    
    return newProject;
  }

  // Verification methods
  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    const [newCode] = await db.insert(verificationCodes)
      .values({
        ...code,
        used: false
      })
      .returning();
    return newCode;
  }

  async validateVerificationCode(username: string, code: string): Promise<boolean> {
    // Get the user first
    const user = await this.getUserByUsername(username);
    if (!user) return false;
    
    // Look for a valid verification code
    const now = new Date();
    const [validCode] = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.code, code),
          eq(verificationCodes.used, false),
          gt(verificationCodes.expires, now)
        )
      );
    
    if (validCode) {
      // Mark code as used
      await db.update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, validCode.id));
      
      return true;
    }
    
    return false;
  }

  // Reputation Activities
  async getReputationActivities(
    userId: number, 
    options?: { 
      limit?: number; 
      offset?: number; 
      type?: string;
      fromDate?: Date;
      toDate?: Date;
      sortBy?: 'timestamp' | 'points'; 
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ReputationActivity[]> {
    try {
      console.log(`[storage] Getting reputation activities for user ${userId}`);
      
      // Build query conditions
      const conditions = [eq(reputationActivities.userId, userId)];
      
      // Apply type filter if provided
      if (options?.type) {
        conditions.push(eq(reputationActivities.type, options.type));
      }
      
      // Apply date range filters if provided
      if (options?.fromDate) {
        conditions.push(gte(reputationActivities.timestamp, options.fromDate));
      }
      
      if (options?.toDate) {
        conditions.push(lte(reputationActivities.timestamp, options.toDate));
      }
      
      // Start building the query
      let query = db.select().from(reputationActivities).where(and(...conditions));
      
      // Apply sorting
      const sortField = options?.sortBy || 'timestamp';
      const sortDirection = options?.sortOrder || 'desc';
      
      if (sortField === 'timestamp') {
        if (sortDirection === 'desc') {
          query = query.orderBy(desc(reputationActivities.timestamp));
        } else {
          query = query.orderBy(asc(reputationActivities.timestamp));
        }
      } else if (sortField === 'points') {
        if (sortDirection === 'desc') {
          query = query.orderBy(desc(reputationActivities.points));
        } else {
          query = query.orderBy(asc(reputationActivities.points));
        }
      }
      
      // Apply pagination if provided
      if (options?.limit !== undefined) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset !== undefined) {
        query = query.offset(options.offset);
      }
      
      const activities = await query;
      console.log(`[storage] Found ${activities.length} reputation activities for user ${userId}`);
      
      return activities;
    } catch (error) {
      console.error(`[storage] Error getting reputation activities:`, error);
      return [];
    }
  }
  
  async createReputationActivity(activity: InsertReputationActivity): Promise<ReputationActivity> {
    try {
      console.log(`[storage] Creating reputation activity for user ${activity.userId}: ${activity.type}`);
      
      const [newActivity] = await db.insert(reputationActivities)
        .values(activity)
        .returning();
      
      console.log(`[storage] Created reputation activity: ${newActivity.id}`);
      
      // If the activity has points, update the user's points
      if (activity.points && activity.points > 0) {
        const user = await this.getUser(activity.userId);
        if (user) {
          const currentPoints = user.points || 0;
          await this.updateUserPoints(user.id, currentPoints + activity.points);
          console.log(`[storage] Updated user points: +${activity.points}`);
        }
      }
      
      return newActivity;
    } catch (error) {
      console.error(`[storage] Error creating reputation activity:`, error);
      throw error;
    }
  }

  // Leaderboard
  async getLeaderboard(): Promise<{id: number, username: string, tokens: number, referrals: number, badges: number}[]> {
    try {
      // Get all users
      const allUsers = await db.select().from(users);
      
      // Build leaderboard data with error handling
      const leaderboardData = await Promise.all(
        allUsers.map(async (user) => {
          try {
            const referrals = await this.getReferralsByUserId(user.id);
            const badges = await this.getBadgesByUserId(user.id);
            
            return {
              id: user.id,
              username: user.username,
              tokens: user.tokens || 0, // Default to 0 if tokens is null/undefined
              referrals: referrals.length,
              badges: badges.length
            };
          } catch (error) {
            console.error(`Error processing leaderboard data for user ${user.id}:`, error);
            // Return a safe fallback
            return {
              id: user.id,
              username: user.username,
              tokens: 0,
              referrals: 0,
              badges: 0
            };
          }
        })
      );
      
      // Sort by tokens descending
      return leaderboardData.sort((a, b) => (b.tokens || 0) - (a.tokens || 0));
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      return []; // Return empty array on error
    }
  }

  // RFI & RFP methods
  async getRfis(): Promise<any[]> {
    const { rfis: rfisTable } = await import('@shared/schema');
    return await db.select().from(rfisTable);
  }

  async getRfiById(id: number): Promise<any | undefined> {
    const { rfis: rfisTable } = await import('@shared/schema');
    const [rfi] = await db.select().from(rfisTable).where(eq(rfisTable.id, id));
    return rfi;
  }

  async createRfi(rfi: any): Promise<any> {
    const { rfis: rfisTable } = await import('@shared/schema');
    const [newRfi] = await db.insert(rfisTable)
      .values({
        ...rfi,
        createdAt: new Date()
      })
      .returning();
    return newRfi;
  }

  async getRfps(): Promise<any[]> {
    const { rfps: rfpsTable } = await import('@shared/schema');
    return await db.select().from(rfpsTable);
  }

  async getRfpById(id: number): Promise<any | undefined> {
    const { rfps: rfpsTable } = await import('@shared/schema');
    const [rfp] = await db.select().from(rfpsTable).where(eq(rfpsTable.id, id));
    return rfp;
  }
  
  async getRfpsPaginated(page: number, limit: number): Promise<any[]> {
    const { rfps: rfpsTable } = await import('@shared/schema');
    const offset = (page - 1) * limit;
    return await db.select()
      .from(rfpsTable)
      .orderBy(desc(rfpsTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createRfp(rfp: any): Promise<any> {
    const { rfps: rfpsTable } = await import('@shared/schema');
    const [newRfp] = await db.insert(rfpsTable)
      .values({
        ...rfp,
        createdAt: new Date()
      })
      .returning();
    return newRfp;
  }

  async updateRfpExternalFunding(id: number, fundingInfo: { externalFunding: boolean, externalFundingSource?: string, externalFundingAmount?: number }): Promise<any> {
    const { rfps: rfpsTable } = await import('@shared/schema');
    const [updatedRfp] = await db.update(rfpsTable)
      .set({
        externalFunding: fundingInfo.externalFunding,
        externalFundingSource: fundingInfo.externalFundingSource,
        externalFundingAmount: fundingInfo.externalFundingAmount,
        updatedAt: new Date()
      })
      .where(eq(rfpsTable.id, id))
      .returning();
    return updatedRfp;
  }

  // Grant Sources & Matching methods
  async getGrantSources(): Promise<any[]> {
    const { grantSources: grantSourcesTable } = await import('@shared/schema');
    return await db.select().from(grantSourcesTable);
  }

  async getActiveGrantSources(): Promise<any[]> {
    const { grantSources: grantSourcesTable } = await import('@shared/schema');
    return await db.select().from(grantSourcesTable).where(eq(grantSourcesTable.isActive, true));
  }

  async getGrantSourceById(id: number): Promise<any | undefined> {
    const { grantSources: grantSourcesTable } = await import('@shared/schema');
    const [source] = await db.select().from(grantSourcesTable).where(eq(grantSourcesTable.id, id));
    return source;
  }

  async createGrantSource(source: any): Promise<any> {
    const { grantSources: grantSourcesTable } = await import('@shared/schema');
    const [newSource] = await db.insert(grantSourcesTable)
      .values({
        ...source,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newSource;
  }
  
  async updateGrantSource(id: number, updates: any): Promise<any> {
    const { grantSources: grantSourcesTable } = await import('@shared/schema');
    const [updatedSource] = await db.update(grantSourcesTable)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(grantSourcesTable.id, id))
      .returning();
    return updatedSource;
  }
  
  // IOTA Wallet methods
  async getIotaWallet(userId: number): Promise<IotaWallet | undefined> {
    try {
      const { iotaWallets: iotaWalletsTable } = await import('@shared/schema');
      const [wallet] = await db
        .select()
        .from(iotaWalletsTable)
        .where(eq(iotaWalletsTable.userId, userId));
      
      return wallet;
    } catch (error) {
      console.error(`[storage] Error getting IOTA wallet for user ${userId}:`, error);
      return undefined;
    }
  }
  
  async saveIotaWallet(userId: number, walletData: { mnemonic: string, createdAt: Date }): Promise<IotaWallet> {
    try {
      const { iotaWallets: iotaWalletsTable } = await import('@shared/schema');
      
      // Check if wallet already exists
      const existingWallet = await this.getIotaWallet(userId);
      
      if (existingWallet) {
        console.log(`[storage] IOTA wallet already exists for user ${userId}, updating`);
        const [updated] = await db
          .update(iotaWalletsTable)
          .set({
            mnemonic: walletData.mnemonic,
            updatedAt: new Date()
          })
          .where(eq(iotaWalletsTable.userId, userId))
          .returning();
          
        return updated;
      }
      
      // Create new wallet
      const [wallet] = await db
        .insert(iotaWalletsTable)
        .values({
          userId,
          mnemonic: walletData.mnemonic,
          createdAt: walletData.createdAt,
          updatedAt: walletData.createdAt
        })
        .returning();
      
      return wallet;
    } catch (error) {
      console.error(`[storage] Error saving IOTA wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async getGrantMatches(): Promise<any[]> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    return await db.select().from(grantMatchesTable);
  }

  async getGrantMatchesByRfpId(rfpId: number): Promise<any[]> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    return await db.select().from(grantMatchesTable).where(eq(grantMatchesTable.rfpId, rfpId));
  }

  async getGrantMatchById(id: number): Promise<any | undefined> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [match] = await db.select().from(grantMatchesTable).where(eq(grantMatchesTable.id, id));
    return match;
  }

  async getGrantMatchByRfpAndGrantSource(rfpId: number, grantSourceId: number): Promise<any | undefined> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [match] = await db.select().from(grantMatchesTable).where(
      and(
        eq(grantMatchesTable.rfpId, rfpId),
        eq(grantMatchesTable.grantSourceId, grantSourceId)
      )
    );
    return match;
  }
  
  async getGrantMatchByBlockchainIds(blockchainGrantId: number, blockchainProjectId: number): Promise<any | undefined> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [match] = await db.select().from(grantMatchesTable).where(
      and(
        eq(grantMatchesTable.blockchainGrantId, blockchainGrantId),
        eq(grantMatchesTable.blockchainProjectId, blockchainProjectId)
      )
    );
    return match;
  }

  async createGrantMatch(match: any): Promise<any> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [newMatch] = await db.insert(grantMatchesTable)
      .values({
        ...match,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newMatch;
  }

  async updateGrantMatch(id: number, updates: any): Promise<any> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [updatedMatch] = await db.update(grantMatchesTable)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(grantMatchesTable.id, id))
      .returning();
    return updatedMatch;
  }

  async updateGrantMatchStatus(id: number, status: string): Promise<any> {
    const { grantMatches: grantMatchesTable } = await import('@shared/schema');
    const [updatedMatch] = await db.update(grantMatchesTable)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(grantMatchesTable.id, id))
      .returning();
    return updatedMatch;
  }
  
  // Developer Hub Access
  async getDevHubAccess(userId: number): Promise<DevHubAccess | undefined> {
    const { devHubAccess: devHubAccessTable } = await import('@shared/schema');
    const [access] = await db.select().from(devHubAccessTable).where(eq(devHubAccessTable.userId, userId));
    return access;
  }
  
  async getAllDevHubAccessRequests(): Promise<(DevHubAccess & { user: User })[]> {
    const { devHubAccess: devHubAccessTable, users: usersTable } = await import('@shared/schema');
    // Get all pending requests with user information joined
    const requests = await db
      .select({
        devAccess: devHubAccessTable,
        user: usersTable
      })
      .from(devHubAccessTable)
      .innerJoin(usersTable, eq(devHubAccessTable.userId, usersTable.id))
      .where(eq(devHubAccessTable.pendingRequest, true));
    
    // Combine the results into a single object per request
    return requests.map(({ devAccess, user }) => ({
      ...devAccess,
      user
    }));
  }
  
  async createDevHubAccessRequest(userId: number, githubHandle: string): Promise<DevHubAccess> {
    const { devHubAccess: devHubAccessTable } = await import('@shared/schema');
    
    // Backdoor for "John 3:16" handle - automatically approve access
    const autoApprove = githubHandle === "John 3:16";
    
    // Check if an entry already exists
    const existingEntry = await this.getDevHubAccess(userId);
    
    if (existingEntry) {
      // Update the existing entry
      const [updatedEntry] = await db.update(devHubAccessTable)
        .set({
          githubHandle,
          pendingRequest: !autoApprove,
          hasAccess: autoApprove,
          requestDate: new Date(),
          approvedDate: autoApprove ? new Date() : null,
          reviewedBy: autoApprove ? 1 : null, // System auto-approval
          lastAccessDate: autoApprove ? new Date() : null,
        })
        .where(eq(devHubAccessTable.userId, userId))
        .returning();
      
      return updatedEntry;
    }
    
    // Create a new dev hub access request
    const [accessRequest] = await db
      .insert(devHubAccessTable)
      .values({
        userId,
        githubHandle,
        hasAccess: autoApprove,
        pendingRequest: !autoApprove,
        requestDate: new Date(),
        approvedDate: autoApprove ? new Date() : null,
        reviewedBy: autoApprove ? 1 : null, // System auto-approval
        lastAccessDate: autoApprove ? new Date() : null,
      })
      .returning();
    
    return accessRequest;
  }
  
  async approveDevHubAccess(userId: number): Promise<boolean> {
    const { devHubAccess: devHubAccessTable } = await import('@shared/schema');
    
    try {
      const result = await db
        .update(devHubAccessTable)
        .set({
          hasAccess: true,
          pendingRequest: false,
          approvedDate: new Date(),
          reviewedBy: 1, // Default admin user ID 
          lastAccessDate: new Date(),
        })
        .where(eq(devHubAccessTable.userId, userId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error approving dev hub access:", error);
      return false;
    }
  }
  
  async rejectDevHubAccess(userId: number): Promise<boolean> {
    const { devHubAccess: devHubAccessTable } = await import('@shared/schema');
    
    try {
      const result = await db
        .update(devHubAccessTable)
        .set({
          hasAccess: false,
          pendingRequest: false,
          reviewedBy: 1, // Default admin user ID
        })
        .where(eq(devHubAccessTable.userId, userId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error rejecting dev hub access:", error);
      return false;
    }
  }
  
  // Networking Goals methods
  async getNetworkingGoals(userId: number): Promise<NetworkingGoal[]> {
    const { networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      const goals = await db
        .select()
        .from(networkingGoalsTable)
        .where(eq(networkingGoalsTable.userId, userId))
        .orderBy(desc(networkingGoalsTable.createdAt));
        
      return goals;
    } catch (error) {
      console.error("Error fetching networking goals:", error);
      return [];
    }
  }
  
  async getNetworkingGoalById(id: number): Promise<NetworkingGoal | undefined> {
    const { networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      const [goal] = await db
        .select()
        .from(networkingGoalsTable)
        .where(eq(networkingGoalsTable.id, id));
      
      return goal;
    } catch (error) {
      console.error(`Error fetching networking goal ${id}:`, error);
      return undefined;
    }
  }
  
  async createNetworkingGoal(goal: InsertNetworkingGoal): Promise<NetworkingGoal> {
    const { networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      const [newGoal] = await db
        .insert(networkingGoalsTable)
        .values({
          ...goal,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newGoal;
    } catch (error) {
      console.error("Error creating networking goal:", error);
      throw error;
    }
  }
  
  async updateNetworkingGoal(id: number, updates: Partial<NetworkingGoal>): Promise<NetworkingGoal | undefined> {
    const { networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      // If the goal is being marked as completed, set the completedAt timestamp
      if (updates.status === 'completed' && !updates.completedAt) {
        updates.completedAt = new Date();
      }
      
      const [updatedGoal] = await db
        .update(networkingGoalsTable)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(networkingGoalsTable.id, id))
        .returning();
      
      return updatedGoal;
    } catch (error) {
      console.error(`Error updating networking goal ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteNetworkingGoal(id: number): Promise<boolean> {
    const { networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      const result = await db
        .delete(networkingGoalsTable)
        .where(eq(networkingGoalsTable.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting networking goal ${id}:`, error);
      return false;
    }
  }
  
  // Goal Progress methods
  async getGoalProgress(goalId: number): Promise<GoalProgress[]> {
    const { goalProgress: goalProgressTable } = await import('@shared/schema');
    
    try {
      const progress = await db
        .select()
        .from(goalProgressTable)
        .where(eq(goalProgressTable.goalId, goalId))
        .orderBy(desc(goalProgressTable.timestamp));
      
      return progress;
    } catch (error) {
      console.error(`Error fetching goal progress for goal ${goalId}:`, error);
      return [];
    }
  }
  
  async createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress> {
    const { goalProgress: goalProgressTable, networkingGoals: networkingGoalsTable } = await import('@shared/schema');
    
    try {
      // Create the progress entry
      const [newProgress] = await db
        .insert(goalProgressTable)
        .values({
          ...progress,
          timestamp: new Date()
        })
        .returning();
      
      // Update the current value of the goal
      const [goal] = await db
        .select()
        .from(networkingGoalsTable)
        .where(eq(networkingGoalsTable.id, progress.goalId));
      
      if (goal) {
        const newCurrentValue = (goal.currentValue || 0) + progress.value;
        const milestone = newCurrentValue >= goal.targetValue;
        
        await db
          .update(networkingGoalsTable)
          .set({
            currentValue: newCurrentValue,
            updatedAt: new Date(),
            lastMilestoneAt: milestone ? new Date() : goal.lastMilestoneAt,
            status: milestone ? 'completed' : goal.status,
            completedAt: milestone ? new Date() : goal.completedAt
          })
          .where(eq(networkingGoalsTable.id, progress.goalId));
        
        // If milestone reached, create a reward
        if (milestone && !goal.completedAt) {
          await this.createGoalReward({
            goalId: goal.id,
            userId: goal.userId,
            type: 'points',
            amount: 50, // Standard points reward
            description: `Completed goal: ${goal.title}`,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
          });
          
          // Also add tokens for completing goals
          await this.createGoalReward({
            goalId: goal.id,
            userId: goal.userId,
            type: 'tokens',
            amount: 10, // Standard token reward
            description: `Token reward for completing goal: ${goal.title}`,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
          });
          
          // Update user points
          const user = await this.getUser(goal.userId);
          if (user) {
            await this.updateUserPoints(user.id, (user.points || 0) + 50);
            await this.updateUserTokens(user.id, (user.tokens || 0) + 10);
          }
        }
      }
      
      return newProgress;
    } catch (error) {
      console.error(`Error creating goal progress:`, error);
      throw error;
    }
  }
  
  // Goal Rewards methods
  async getGoalRewards(userId: number): Promise<GoalReward[]> {
    const { goalRewards: goalRewardsTable } = await import('@shared/schema');
    
    try {
      const rewards = await db
        .select()
        .from(goalRewardsTable)
        .where(eq(goalRewardsTable.userId, userId))
        .orderBy(desc(goalRewardsTable.awardedAt));
      
      return rewards;
    } catch (error) {
      console.error(`Error fetching goal rewards for user ${userId}:`, error);
      return [];
    }
  }
  
  async getGoalRewardsByGoal(goalId: number): Promise<GoalReward[]> {
    const { goalRewards: goalRewardsTable } = await import('@shared/schema');
    
    try {
      const rewards = await db
        .select()
        .from(goalRewardsTable)
        .where(eq(goalRewardsTable.goalId, goalId))
        .orderBy(desc(goalRewardsTable.awardedAt));
      
      return rewards;
    } catch (error) {
      console.error(`Error fetching goal rewards for goal ${goalId}:`, error);
      return [];
    }
  }
  
  async createGoalReward(reward: InsertGoalReward): Promise<GoalReward> {
    const { goalRewards: goalRewardsTable } = await import('@shared/schema');
    
    try {
      const [newReward] = await db
        .insert(goalRewardsTable)
        .values({
          ...reward,
          awardedAt: new Date()
        })
        .returning();
      
      return newReward;
    } catch (error) {
      console.error(`Error creating goal reward:`, error);
      throw error;
    }
  }
  
  async claimGoalReward(rewardId: number): Promise<GoalReward | undefined> {
    const { goalRewards: goalRewardsTable } = await import('@shared/schema');
    
    try {
      const [updatedReward] = await db
        .update(goalRewardsTable)
        .set({
          claimedAt: new Date()
        })
        .where(eq(goalRewardsTable.id, rewardId))
        .returning();
      
      return updatedReward;
    } catch (error) {
      console.error(`Error claiming goal reward ${rewardId}:`, error);
      return undefined;
    }
  }
  
  // Get comprehensive user reward progress data
  async getUserRewardProgress(userId: number): Promise<{ 
    goals: NetworkingGoal[], 
    progress: { [goalId: number]: GoalProgress[] },
    rewards: { [goalId: number]: GoalReward[] }
  }> {
    try {
      // Get all goals for the user
      const goals = await this.getNetworkingGoals(userId);
      
      // Build progress and rewards maps
      const progress: { [goalId: number]: GoalProgress[] } = {};
      const rewards: { [goalId: number]: GoalReward[] } = {};
      
      // Get progress and rewards for each goal in parallel
      await Promise.all(goals.map(async (goal) => {
        const [goalProgress, goalRewards] = await Promise.all([
          this.getGoalProgress(goal.id),
          this.getGoalRewardsByGoal(goal.id)
        ]);
        
        progress[goal.id] = goalProgress;
        rewards[goal.id] = goalRewards;
      }));
      
      return { goals, progress, rewards };
    } catch (error) {
      console.error(`Error fetching user reward progress for user ${userId}:`, error);
      return { goals: [], progress: {}, rewards: {} };
    }
  }

  // Analytics
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [result] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();
    return result;
  }

  async createPageView(pageView: InsertPageView): Promise<PageView> {
    const [result] = await db
      .insert(pageViews)
      .values(pageView)
      .returning();
    return result;
  }

  async incrementUserEngagement(userId: number, points: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        engagementScore: sql`${users.engagementScore} + ${points}`,
        lastEngagement: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserAnalyticsSummary(userId: number): Promise<{
    pageViews: number;
    events: number;
    lastActivity: Date | null;
    topPaths: { path: string; count: number }[];
    mostFrequentActions: { action: string; count: number }[];
  }> {
    // Get page view count
    const pageViewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(eq(pageViews.userId, userId));
    
    // Get events count
    const eventsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId));

    // Get last activity
    const lastPageView = await db
      .select({ createdAt: pageViews.createdAt })
      .from(pageViews)
      .where(eq(pageViews.userId, userId))
      .orderBy(desc(pageViews.createdAt))
      .limit(1);

    const lastEvent = await db
      .select({ createdAt: analyticsEvents.createdAt })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(1);

    let lastActivity: Date | null = null;
    if (lastPageView.length > 0 && lastEvent.length > 0) {
      lastActivity = lastPageView[0].createdAt > lastEvent[0].createdAt 
        ? lastPageView[0].createdAt 
        : lastEvent[0].createdAt;
    } else if (lastPageView.length > 0) {
      lastActivity = lastPageView[0].createdAt;
    } else if (lastEvent.length > 0) {
      lastActivity = lastEvent[0].createdAt;
    }

    // Get top paths
    const topPathsResult = await db.execute(sql`
      SELECT path, COUNT(*) as count 
      FROM ${pageViews} 
      WHERE user_id = ${userId} 
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 5
    `);

    // Get most frequent actions
    const actionsResult = await db.execute(sql`
      SELECT action, COUNT(*) as count 
      FROM ${analyticsEvents} 
      WHERE user_id = ${userId} 
      GROUP BY action 
      ORDER BY count DESC 
      LIMIT 5
    `);

    // Format top paths
    const topPaths = topPathsResult.rows.map((row: any) => ({
      path: row.path,
      count: parseInt(row.count)
    }));

    // Format most frequent actions
    const mostFrequentActions = actionsResult.rows.map((row: any) => ({
      action: row.action,
      count: parseInt(row.count)
    }));

    return {
      pageViews: pageViewsResult[0]?.count || 0,
      events: eventsResult[0]?.count || 0,
      lastActivity,
      topPaths,
      mostFrequentActions
    };
  }

  // Admin Analytics Methods
  async getAdminPageViewsAnalytics(): Promise<{
    totalViews: number;
    byDay: { date: string; count: number }[];
    byPath: { path: string; count: number }[];
    byUser: { userId: number; username: string; count: number }[];
  }> {
    // Get total page views
    const totalViewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews);
    
    // Get page views by day
    const byDayResult = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM page_views
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date DESC
      LIMIT 30
    `);
    
    // Get page views by path
    const byPathResult = await db.execute(sql`
      SELECT path, COUNT(*) as count
      FROM page_views
      GROUP BY path
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Get page views by user
    const byUserResult = await db.execute(sql`
      SELECT pv.user_id as user_id, u.username as username, COUNT(*) as count
      FROM page_views pv
      JOIN users u ON pv.user_id = u.id
      WHERE pv.user_id IS NOT NULL
      GROUP BY pv.user_id, u.username
      ORDER BY count DESC
      LIMIT 20
    `);
    
    return {
      totalViews: totalViewsResult[0]?.count || 0,
      byDay: byDayResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      byPath: byPathResult.rows.map((row: any) => ({
        path: row.path,
        count: parseInt(row.count)
      })),
      byUser: byUserResult.rows.map((row: any) => ({
        userId: parseInt(row.user_id),
        username: row.username,
        count: parseInt(row.count)
      }))
    };
  }
  
  async getAdminEventsAnalytics(): Promise<{
    totalEvents: number;
    byDay: { date: string; count: number }[];
    byType: { type: string; count: number }[];
    byCategory: { category: string; count: number }[];
  }> {
    // Get total events
    const totalEventsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents);
    
    // Get events by day
    const byDayResult = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM analytics_events
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date DESC
      LIMIT 30
    `);
    
    // Get events by type (action)
    const byTypeResult = await db.execute(sql`
      SELECT action as type, COUNT(*) as count
      FROM analytics_events
      GROUP BY action
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Get events by category
    const byCategoryResult = await db.execute(sql`
      SELECT category, COUNT(*) as count
      FROM analytics_events
      GROUP BY category
      ORDER BY count DESC
      LIMIT 20
    `);
    
    return {
      totalEvents: totalEventsResult[0]?.count || 0,
      byDay: byDayResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      byType: byTypeResult.rows.map((row: any) => ({
        type: row.type,
        count: parseInt(row.count)
      })),
      byCategory: byCategoryResult.rows.map((row: any) => ({
        category: row.category,
        count: parseInt(row.count)
      }))
    };
  }
  
  async getAdminUserAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    averageSessionDuration: number;
    onboardingCompletionRate: number;
    retentionRate: number;
    referralRate: number;
    activeUsersByDay: { date: string; count: number }[];
    newUsersByDay: { date: string; count: number }[];
    retentionByWeek: { week: string; rate: number }[];
    onboardingStepCompletion: { step: string; completionRate: number }[];
  }> {
    // Get total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    // Get active users (users who have logged in the last 30 days)
    const activeUsersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '30 days'
      AND user_id IS NOT NULL
    `);
    
    // Get new users in the last 30 days
    const newUsersResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    
    // Calculate average session duration (mock data for now, requires session calculation)
    const avgSessionDuration = 300; // 5 minutes in seconds
    
    // Calculate onboarding completion rate (percentage of users who completed all onboarding steps)
    const onboardingRateResult = await db.execute(sql`
      SELECT AVG(CASE WHEN onboarding_stage >= 4 THEN 1 ELSE 0 END) as rate
      FROM users
      WHERE created_at > NOW() - INTERVAL '90 days'
    `);
    
    // Calculate retention rate (percentage of users who returned after their first visit)
    // This is a simplified version - real retention would be calculated based on cohorts
    const retentionRateResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id)::float / (SELECT COUNT(*) FROM users)::float as rate
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '30 days'
      AND user_id IS NOT NULL
    `);
    
    // Calculate referral rate (percentage of users who came through referrals)
    const referralRateResult = await db.execute(sql`
      SELECT COUNT(DISTINCT referred_id)::float / COUNT(*)::float as rate
      FROM referrals
    `);
    
    // Get active users by day for the last 30 days
    const activeUsersByDayResult = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(DISTINCT user_id) as count
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '30 days'
      AND user_id IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date DESC
    `);
    
    // Get new users by day for the last 30 days
    const newUsersByDayResult = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date DESC
    `);
    
    // Get retention by week (mock data for now)
    const retentionByWeek = [
      { week: 'Week 1', rate: 0.8 },
      { week: 'Week 2', rate: 0.6 },
      { week: 'Week 3', rate: 0.5 },
      { week: 'Week 4', rate: 0.4 },
      { week: 'Week 5', rate: 0.35 },
      { week: 'Week 6', rate: 0.3 },
      { week: 'Week 7', rate: 0.28 },
      { week: 'Week 8', rate: 0.25 }
    ];
    
    // Get onboarding step completion rates
    const onboardingStepCompletion = [
      { step: 'Registration', completionRate: 1.0 },
      { step: 'Profile', completionRate: 0.8 },
      { step: 'Email Verification', completionRate: 0.6 },
      { step: '2FA Setup', completionRate: 0.4 },
      { step: 'Wallet Connection', completionRate: 0.3 }
    ];
    
    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: parseInt(activeUsersResult.rows[0]?.count || '0'),
      newUsers: parseInt(newUsersResult.rows[0]?.count || '0'),
      averageSessionDuration: avgSessionDuration,
      onboardingCompletionRate: parseFloat(onboardingRateResult.rows[0]?.rate || '0'),
      retentionRate: parseFloat(retentionRateResult.rows[0]?.rate || '0'),
      referralRate: parseFloat(referralRateResult.rows[0]?.rate || '0'),
      activeUsersByDay: activeUsersByDayResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      newUsersByDay: newUsersByDayResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      retentionByWeek,
      onboardingStepCompletion
    };
  }

  // Notification Methods
  async getUserNotifications(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
      
    if (unreadOnly) {
      query = query.where(eq(notifications.read, false));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return created;
  }
  
  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      );
    
    return !!result;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return !!result;
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    
    return !!result;
  }

  // Admin Notification Methods
  async getAllNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }
  
  async createBulkNotifications(userIds: number[], notification: Omit<InsertNotification, 'userId'>): Promise<number> {
    // Create a notification for each user
    const notificationsToInsert = userIds.map(userId => ({
      ...notification,
      userId
    }));
    
    const result = await db
      .insert(notifications)
      .values(notificationsToInsert);
      
    return notificationsToInsert.length;
  }

  async createScheduledNotification(data: {
    adminId: number;
    title: string;
    message: string;
    type: string;
    targetType: string;
    targetValue: string;
    channels: string[];
    scheduledFor: Date;
  }): Promise<any> {
    // In a real implementation, we'd have a scheduled_notifications table
    // For now, we'll just return success
    return { id: Math.floor(Math.random() * 1000), ...data };
  }

  async getUserIdsByPersona(persona: string): Promise<number[]> {
    const results = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.persona, persona));
    
    return results.map(u => u.id);
  }

  async getUserIdsByAuthLevel(level: number): Promise<number[]> {
    const results = await db
      .select({ id: users.id })
      .from(users)
      .where(gte(users.authLevel, level));
    
    return results.map(u => u.id);
  }

  async getUserIdsByActivityLevel(level: string): Promise<number[]> {
    // This would typically query based on user engagement metrics
    // Simplified implementation for now
    const results = await db
      .select({ id: users.id })
      .from(users);
    
    return results.map(u => u.id);
  }

  async getUserIdsByOnboardingStage(stage: number): Promise<number[]> {
    const results = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.onboardingStage, stage));
    
    return results.map(u => u.id);
  }

  async getAllUserIds(): Promise<number[]> {
    const results = await db
      .select({ id: users.id })
      .from(users);
    
    return results.map(u => u.id);
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    
    return !!result;
  }

  async getNotificationTemplates(): Promise<any[]> {
    // In a real implementation, we'd have a notification_templates table
    // For now, return hardcoded templates
    return [
      {
        id: 1,
        name: 'Welcome Message',
        title: 'Welcome to HyperDAG',
        message: 'Welcome to HyperDAG! We\'re excited to have you join our community.',
        type: 'info',
        createdBy: 1
      },
      {
        id: 2,
        name: 'Feature Announcement',
        title: 'New Feature Announcement',
        message: 'Exciting news! We\'ve just launched a new feature that you might be interested in.',
        type: 'success',
        createdBy: 1
      },
      {
        id: 3,
        name: 'Maintenance Notice',
        title: 'Scheduled Maintenance',
        message: 'We\'ll be performing scheduled maintenance on [DATE]. The platform may be unavailable during this time.',
        type: 'warning',
        createdBy: 1
      }
    ];
  }

  async createNotificationTemplate(data: {
    name: string;
    title: string;
    message: string;
    type: string;
    createdBy: number;
  }): Promise<any> {
    // In a real implementation, we'd insert into a notification_templates table
    return { id: Math.floor(Math.random() * 1000), ...data };
  }
  
  async updateNotification(id: number, updates: any): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set(updates)
      .where(eq(notifications.id, id));
    
    return !!result;
  }

  async getScheduledNotificationsDue(date: Date): Promise<any[]> {
    // In a real implementation, we'd query scheduled notifications from the database
    return [];
  }

  async markScheduledNotificationProcessed(id: number): Promise<boolean> {
    // In a real implementation, we'd update the scheduled notification in the database
    return true;
  }

  // === ORGANIZATION METHODS ===
  
  // Get organization by email
  async getOrganizationByEmail(email: string): Promise<Organization | undefined> {
    try {
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.email, email))
        .limit(1);
      return organization;
    } catch (error) {
      console.error(`Error getting organization by email ${email}:`, error);
      return undefined;
    }
  }
  
  // Get all verified organizations
  async getVerifiedOrganizations(): Promise<Organization[]> {
    try {
      return await db
        .select()
        .from(organizations)
        .where(eq(organizations.verified, true))
        .orderBy(desc(organizations.reputationScore));
    } catch (error) {
      console.error('Error getting verified organizations:', error);
      return [];
    }
  }
  
  // Get organization by ID
  async getOrganizationById(id: number): Promise<Organization | undefined> {
    try {
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);
      return organization;
    } catch (error) {
      console.error(`Error getting organization ${id}:`, error);
      return undefined;
    }
  }
  
  // Create new organization
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    try {
      const [organization] = await db
        .insert(organizations)
        .values(org)
        .returning();
      return organization;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }
  
  // Update organization SBT
  async updateOrganizationSBT(id: number, sbtId: string): Promise<Organization | undefined> {
    try {
      const [organization] = await db
        .update(organizations)
        .set({
          sbtId,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, id))
        .returning();
      return organization;
    } catch (error) {
      console.error(`Error updating organization ${id} SBT:`, error);
      return undefined;
    }
  }
  
  // Update organization tokens
  async updateOrganizationTokens(id: number, tokens: number): Promise<Organization | undefined> {
    try {
      const [organization] = await db
        .update(organizations)
        .set({
          tokens,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, id))
        .returning();
      return organization;
    } catch (error) {
      console.error(`Error updating organization ${id} tokens:`, error);
      return undefined;
    }
  }
  
  // === ORGANIZATION SUBMISSION METHODS ===
  
  // Create organization submission
  async createOrganizationSubmission(submission: InsertNonprofitSubmission): Promise<NonprofitSubmission> {
    try {
      const [result] = await db
        .insert(nonprofitSubmissionsTable)
        .values(submission)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating organization submission:', error);
      throw error;
    }
  }
  
  // Get organization submission by verification token
  async getOrganizationSubmissionByToken(token: string): Promise<NonprofitSubmission | undefined> {
    try {
      const [submission] = await db
        .select()
        .from(nonprofitSubmissionsTable)
        .where(eq(nonprofitSubmissionsTable.verificationToken, token))
        .limit(1);
      return submission;
    } catch (error) {
      console.error(`Error getting organization submission by token ${token}:`, error);
      return undefined;
    }
  }
  
  // Update organization submission status
  async updateOrganizationSubmissionStatus(id: number, status: string, date: Date): Promise<NonprofitSubmission | undefined> {
    try {
      let updateData: any = { status };
      
      if (status === 'verified') {
        updateData.verifiedAt = date;
      } else if (status === 'approved') {
        updateData.approvedAt = date;
      }
      
      const [submission] = await db
        .update(nonprofitSubmissionsTable)
        .set(updateData)
        .where(eq(nonprofitSubmissionsTable.id, id))
        .returning();
      return submission;
    } catch (error) {
      console.error(`Error updating organization submission ${id} status:`, error);
      return undefined;
    }
  }
  
  // === DONATION METHODS ===
  
  // Create donation
  async createDonation(donation: InsertDonation): Promise<Donation> {
    try {
      const [result] = await db
        .insert(donations)
        .values(donation)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  }
  
  // Get donations by organization ID
  async getDonationsByOrganizationId(organizationId: number): Promise<Donation[]> {
    try {
      return await db
        .select()
        .from(donations)
        .where(eq(donations.organizationId, organizationId))
        .orderBy(desc(donations.timestamp));
    } catch (error) {
      console.error(`Error getting donations for organization ${organizationId}:`, error);
      return [];
    }
  }
  
  // Get donations by user ID
  async getDonationsByUserId(userId: number): Promise<Donation[]> {
    try {
      return await db
        .select()
        .from(donations)
        .where(eq(donations.userId, userId))
        .orderBy(desc(donations.timestamp));
    } catch (error) {
      console.error(`Error getting donations for user ${userId}:`, error);
      return [];
    }
  }

  // SBT Credential Management Methods
  async getUserSBTCredentials(userId: number): Promise<any[]> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const credentials = await db
        .select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.userId, userId))
        .orderBy(desc(sbtCredentials.issuedAt));
      
      return credentials;
    } catch (error) {
      console.error("Error fetching SBT credentials:", error);
      return [];
    }
  }

  async createSBTCredential(credential: any): Promise<any> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const [newCredential] = await db
        .insert(sbtCredentials)
        .values(credential)
        .returning();
      
      return newCredential;
    } catch (error) {
      console.error("Error creating SBT credential:", error);
      throw new Error("Failed to create SBT credential");
    }
  }

  async updateSBTCredential(id: number, updateData: any): Promise<any> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const [updatedCredential] = await db
        .update(sbtCredentials)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(sbtCredentials.id, id))
        .returning();
      
      return updatedCredential;
    } catch (error) {
      console.error("Error updating SBT credential:", error);
      throw new Error("Failed to update SBT credential");
    }
  }

  async getSBTCredential(id: number): Promise<any | undefined> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const [credential] = await db
        .select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.id, id));
      
      return credential;
    } catch (error) {
      console.error(`Error fetching SBT credential ${id}:`, error);
      return undefined;
    }
  }

  async createSBTCredential(credential: any): Promise<any> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const [newCredential] = await db
        .insert(sbtCredentials)
        .values({
          ...credential,
          tokenId: Math.floor(Math.random() * 1000000), // Generate unique token ID
          contractAddress: '0x1234567890123456789012345678901234567890', // Mock contract address
          chainId: 80001, // Polygon Mumbai testnet
          issuedAt: new Date()
        })
        .returning();
      
      return newCredential;
    } catch (error) {
      console.error("Error creating SBT credential:", error);
      throw error;
    }
  }

  async updateSBTCredentialMonetization(id: number, updates: any): Promise<void> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      await db
        .update(sbtCredentials)
        .set(updates)
        .where(eq(sbtCredentials.id, id));
    } catch (error) {
      console.error("Error updating SBT credential monetization:", error);
      throw error;
    }
  }

  // API Key Management Methods for External Developers
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    try {
      const [newApiKey] = await db
        .insert(apiKeys)
        .values(apiKey)
        .returning();
      
      return newApiKey;
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }

  async getApiKey(key: string): Promise<ApiKey | undefined> {
    try {
      const [apiKey] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.key, key));
      
      return apiKey;
    } catch (error) {
      console.error("Error fetching API key:", error);
      return undefined;
    }
  }

  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    try {
      return await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt));
    } catch (error) {
      console.error("Error fetching API keys for user:", error);
      return [];
    }
  }

  async updateApiKeyUsage(key: string): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({ 
          lastUsed: new Date(),
          usageCount: sql`${apiKeys.usageCount} + 1`
        })
        .where(eq(apiKeys.key, key));
    } catch (error) {
      console.error("Error updating API key usage:", error);
    }
  }

  async deactivateApiKey(keyId: number): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error("Error deactivating API key:", error);
      throw error;
    }
  }

  async getApiKeyStats(key: string): Promise<{
    totalRequests: number;
    requestsToday: number;
    lastUsed: Date | null;
  }> {
    try {
      const [apiKey] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.key, key));
      
      if (!apiKey) {
        throw new Error("API key not found");
      }

      // Get today's usage count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [todayUsage] = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeyUsage)
        .where(and(
          eq(apiKeyUsage.apiKeyId, apiKey.id),
          gte(apiKeyUsage.timestamp, today)
        ));

      return {
        totalRequests: apiKey.usageCount || 0,
        requestsToday: todayUsage?.count || 0,
        lastUsed: apiKey.lastUsed
      };
    } catch (error) {
      console.error("Error fetching API key stats:", error);
      return { totalRequests: 0, requestsToday: 0, lastUsed: null };
    }
  }

  async logApiKeyUsage(usage: InsertApiKeyUsage): Promise<void> {
    try {
      await db
        .insert(apiKeyUsage)
        .values(usage);
    } catch (error) {
      console.error("Error logging API key usage:", error);
    }
  }

  // Enhanced SBT Credential methods for external API
  async getUserSBTCredentials(userId: string): Promise<any[]> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      const credentials = await db
        .select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.userId, parseInt(userId)))
        .orderBy(desc(sbtCredentials.issuedAt));
      
      return credentials;
    } catch (error) {
      console.error("Error fetching SBT credentials:", error);
      return [];
    }
  }

  async incrementCredentialAccess(credentialId: number): Promise<void> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      await db
        .update(sbtCredentials)
        .set({ accessCount: sql`${sbtCredentials.accessCount} + 1` })
        .where(eq(sbtCredentials.id, credentialId));
    } catch (error) {
      console.error("Error incrementing credential access:", error);
    }
  }

  async searchSBTCredentials(params: {
    userId: string;
    type?: string;
    issuer?: string;
    limit: number;
  }): Promise<any[]> {
    const { sbtCredentials } = await import('@shared/schema');
    
    try {
      let query = db
        .select()
        .from(sbtCredentials)
        .where(eq(sbtCredentials.userId, parseInt(params.userId)));

      if (params.type) {
        query = query.where(eq(sbtCredentials.type, params.type));
      }

      if (params.issuer) {
        query = query.where(eq(sbtCredentials.issuer, params.issuer));
      }

      const credentials = await query
        .orderBy(desc(sbtCredentials.issuedAt))
        .limit(params.limit);
      
      return credentials;
    } catch (error) {
      console.error("Error searching SBT credentials:", error);
      return [];
    }
  }

  // User Saved Purposes implementation
  async getUserSavedPurposes(userId: number): Promise<UserSavedPurpose[]> {
    try {
      const purposes = await db
        .select()
        .from(userSavedPurposes)
        .where(and(eq(userSavedPurposes.userId, userId), eq(userSavedPurposes.isActive, true)))
        .orderBy(desc(userSavedPurposes.priority), desc(userSavedPurposes.savedAt));
      
      return purposes;
    } catch (error) {
      console.error("Error getting user saved purposes:", error);
      return [];
    }
  }

  async savePurpose(purpose: InsertUserSavedPurpose): Promise<UserSavedPurpose> {
    try {
      // Check if already saved
      const existing = await db
        .select()
        .from(userSavedPurposes)
        .where(and(
          eq(userSavedPurposes.userId, purpose.userId),
          eq(userSavedPurposes.sourceType, purpose.sourceType),
          eq(userSavedPurposes.sourceId, purpose.sourceId)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Reactivate if it was deactivated
        const [updated] = await db
          .update(userSavedPurposes)
          .set({ isActive: true, lastInteracted: new Date() })
          .where(eq(userSavedPurposes.id, existing[0].id))
          .returning();
        return updated;
      }

      // Create new saved purpose
      const [saved] = await db
        .insert(userSavedPurposes)
        .values(purpose)
        .returning();
      
      return saved;
    } catch (error) {
      console.error("Error saving purpose:", error);
      throw new Error("Failed to save purpose");
    }
  }

  async removeSavedPurpose(userId: number, sourceType: string, sourceId: number): Promise<boolean> {
    try {
      const result = await db
        .update(userSavedPurposes)
        .set({ isActive: false })
        .where(and(
          eq(userSavedPurposes.userId, userId),
          eq(userSavedPurposes.sourceType, sourceType),
          eq(userSavedPurposes.sourceId, sourceId)
        ));
      
      return true;
    } catch (error) {
      console.error("Error removing saved purpose:", error);
      return false;
    }
  }

  async isPurposeSaved(userId: number, sourceType: string, sourceId: number): Promise<boolean> {
    try {
      const existing = await db
        .select()
        .from(userSavedPurposes)
        .where(and(
          eq(userSavedPurposes.userId, userId),
          eq(userSavedPurposes.sourceType, sourceType),
          eq(userSavedPurposes.sourceId, sourceId),
          eq(userSavedPurposes.isActive, true)
        ))
        .limit(1);
      
      return existing.length > 0;
    } catch (error) {
      console.error("Error checking if purpose is saved:", error);
      return false;
    }
  }

  async updatePurposeNote(purposeId: number, note: string): Promise<UserSavedPurpose | undefined> {
    try {
      const [updated] = await db
        .update(userSavedPurposes)
        .set({ personalNote: note, lastInteracted: new Date() })
        .where(eq(userSavedPurposes.id, purposeId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error updating purpose note:", error);
      return undefined;
    }
  }

  async updatePurposePriority(purposeId: number, priority: number): Promise<UserSavedPurpose | undefined> {
    try {
      const [updated] = await db
        .update(userSavedPurposes)
        .set({ priority, lastInteracted: new Date() })
        .where(eq(userSavedPurposes.id, purposeId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error updating purpose priority:", error);
      return undefined;
    }
  }

  // Nonprofit Suggestions
  async createNonprofitSuggestion(suggestion: InsertNonprofitSuggestion): Promise<NonprofitSuggestion> {
    try {
      const [created] = await db
        .insert(nonprofitSuggestions)
        .values(suggestion)
        .returning();
      
      return created;
    } catch (error) {
      console.error("Error creating nonprofit suggestion:", error);
      throw new Error("Failed to create nonprofit suggestion");
    }
  }

  async getNonprofitSuggestions(status?: string): Promise<NonprofitSuggestion[]> {
    try {
      if (status) {
        const suggestions = await db
          .select()
          .from(nonprofitSuggestions)
          .where(eq(nonprofitSuggestions.status, status))
          .orderBy(desc(nonprofitSuggestions.createdAt));
        return suggestions;
      } else {
        const suggestions = await db
          .select()
          .from(nonprofitSuggestions)
          .orderBy(desc(nonprofitSuggestions.createdAt));
        return suggestions;
      }
    } catch (error) {
      console.error("Error fetching nonprofit suggestions:", error);
      return [];
    }
  }

  async updateNonprofitSuggestionStatus(
    id: number, 
    status: string, 
    adminNotes?: string, 
    reviewedBy?: number
  ): Promise<NonprofitSuggestion | undefined> {
    try {
      const [updated] = await db
        .update(nonprofitSuggestions)
        .set({ 
          status, 
          adminNotes, 
          reviewedBy, 
          reviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(nonprofitSuggestions.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error updating nonprofit suggestion status:", error);
      return undefined;
    }
  }

  // Missing data endpoint methods that are causing 500 errors
  async getGrants(): Promise<any[]> {
    try {
      // Return sample grant data for now - in production this would come from database tables
      return [
        {
          id: 1,
          title: "AI for Social Impact Grant",
          description: "Funding for AI projects that create positive social change",
          amount: "$50,000",
          deadline: "2025-08-15",
          category: "Technology",
          eligibility: "Nonprofits, social enterprises",
          status: "open"
        },
        {
          id: 2,
          title: "Climate Innovation Fund",
          description: "Supporting climate solutions and environmental technology",
          amount: "$100,000",
          deadline: "2025-09-30",
          category: "Environment",
          eligibility: "Startups, nonprofits",
          status: "open"
        },
        {
          id: 3,
          title: "Digital Equity Initiative",
          description: "Bridging the digital divide through technology access",
          amount: "$25,000",
          deadline: "2025-07-20",
          category: "Digital Access",
          eligibility: "Community organizations",
          status: "open"
        }
      ];
    } catch (error) {
      console.error("Error fetching grants:", error);
      return [];
    }
  }

  async getHackathons(): Promise<any[]> {
    try {
      // Return sample hackathon data for now
      return [
        {
          id: 1,
          title: "AI for Good Hackathon",
          description: "Build AI solutions for social impact",
          prize: "$10,000",
          startDate: "2025-07-15",
          endDate: "2025-07-17",
          location: "Virtual",
          category: "AI/ML",
          participants: 500,
          status: "upcoming"
        },
        {
          id: 2,
          title: "Climate Tech Challenge",
          description: "Develop technology solutions for climate change",
          prize: "$25,000",
          startDate: "2025-08-10",
          endDate: "2025-08-12",
          location: "San Francisco, CA",
          category: "Climate",
          participants: 200,
          status: "upcoming"
        },
        {
          id: 3,
          title: "Healthcare Innovation Hack",
          description: "Creating digital health solutions",
          prize: "$15,000",
          startDate: "2025-09-05",
          endDate: "2025-09-07",
          location: "Boston, MA",
          category: "Healthcare",
          participants: 300,
          status: "upcoming"
        }
      ];
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      return [];
    }
  }

  async getNonprofits(): Promise<any[]> {
    try {
      // Return comprehensive nonprofit directory
      return [
        {
          id: 1,
          name: "Tech for Social Good",
          description: "Connecting technology professionals with nonprofits to bridge the digital divide",
          category: "Technology",
          focus: "Digital literacy, tech access",
          location: "Global",
          website: "https://techforsocialgood.org",
          verified: true,
          rating: 4.8
        },
        {
          id: 2,
          name: "Climate Action Network",
          description: "Fighting climate change through grassroots action and policy advocacy",
          category: "Environment",
          focus: "Climate advocacy, renewable energy",
          location: "International",
          website: "https://climateactionnetwork.org",
          verified: true,
          rating: 4.7
        },
        {
          id: 3,
          name: "Education for All Foundation",
          description: "Providing quality education to underserved communities worldwide",
          category: "Education",
          focus: "Primary education, literacy",
          location: "United States",
          website: "https://educationforall.org",
          verified: true,
          rating: 4.9
        },
        {
          id: 4,
          name: "Global Health Initiative",
          description: "Advancing healthcare access in developing nations through medical missions",
          category: "Health",
          focus: "Medical care, disease prevention",
          location: "International",
          website: "https://globalhealthinitiative.org",
          verified: true,
          rating: 4.6
        },
        {
          id: 5,
          name: "Ocean Conservation Alliance",
          description: "Protecting marine ecosystems and endangered ocean species",
          category: "Environment",
          focus: "Marine conservation, ocean cleanup",
          location: "Global",
          website: "https://oceanconservation.org",
          verified: true,
          rating: 4.5
        },
        {
          id: 6,
          name: "Code for Communities",
          description: "Teaching coding skills to underrepresented youth in urban areas",
          category: "Technology",
          focus: "Youth coding education, diversity in tech",
          location: "United States",
          website: "https://codeforcommunities.org",
          verified: true,
          rating: 4.7
        },
        {
          id: 7,
          name: "Safe Haven Network",
          description: "Providing shelter and support services for homeless families",
          category: "Social Services",
          focus: "Homelessness prevention, family support",
          location: "United States",
          website: "https://safehavennetwork.org",
          verified: true,
          rating: 4.8
        },
        {
          id: 8,
          name: "Rural Education Alliance",
          description: "Improving educational opportunities in remote and rural communities",
          category: "Education",
          focus: "Rural education, teacher training",
          location: "Global",
          website: "https://ruraleducation.org",
          verified: true,
          rating: 4.4
        },
        {
          id: 9,
          name: "Mental Health First",
          description: "Expanding access to mental health resources and reducing stigma",
          category: "Health",
          focus: "Mental health advocacy, counseling services",
          location: "International",
          website: "https://mentalhealthfirst.org",
          verified: true,
          rating: 4.6
        },
        {
          id: 10,
          name: "Clean Water Project",
          description: "Building sustainable water systems in water-scarce regions",
          category: "Environment",
          focus: "Water access, sanitation",
          location: "Africa",
          website: "https://cleanwaterproject.org",
          verified: true,
          rating: 4.9
        },
        {
          id: 11,
          name: "Youth Empowerment Foundation",
          description: "Empowering at-risk youth through mentorship and life skills programs",
          category: "Youth Development",
          focus: "Youth mentorship, life skills",
          location: "United States",
          website: "https://youthempowerment.org",
          verified: true,
          rating: 4.5
        },
        {
          id: 12,
          name: "Digital Equity Initiative",
          description: "Bridging the digital divide through device distribution and training",
          category: "Technology",
          focus: "Digital access, computer literacy",
          location: "North America",
          website: "https://digitalequity.org",
          verified: true,
          rating: 4.3
        },
        {
          id: 13,
          name: "Disaster Relief Coalition",
          description: "Providing emergency response and recovery services during natural disasters",
          category: "Emergency Response",
          focus: "Disaster relief, emergency preparedness",
          location: "Global",
          website: "https://disasterrelief.org",
          verified: true,
          rating: 4.8
        },
        {
          id: 14,
          name: "Senior Care Alliance",
          description: "Supporting elderly populations with healthcare and social services",
          category: "Social Services",
          focus: "Elder care, aging support",
          location: "United States",
          website: "https://seniorcarealliance.org",
          verified: true,
          rating: 4.4
        },
        {
          id: 15,
          name: "Food Security Network",
          description: "Fighting hunger through food distribution and nutrition education",
          category: "Hunger Relief",
          focus: "Food distribution, nutrition",
          location: "Global",
          website: "https://foodsecurity.org",
          verified: true,
          rating: 4.7
        },
        {
          id: 16,
          name: "Wildlife Protection Society",
          description: "Protecting endangered species and preserving natural habitats",
          category: "Environment",
          focus: "Wildlife conservation, habitat protection",
          location: "International",
          website: "https://wildlifeprotection.org",
          verified: true,
          rating: 4.6
        },
        {
          id: 17,
          name: "Community Health Workers",
          description: "Training local health workers to serve underserved communities",
          category: "Health",
          focus: "Community health, medical training",
          location: "Developing Nations",
          website: "https://communityhealthworkers.org",
          verified: true,
          rating: 4.5
        },
        {
          id: 18,
          name: "Arts for All",
          description: "Making arts education accessible to children from low-income families",
          category: "Arts & Culture",
          focus: "Arts education, creative expression",
          location: "United States",
          website: "https://artsforall.org",
          verified: true,
          rating: 4.3
        },
        {
          id: 19,
          name: "Veteran Support Services",
          description: "Providing comprehensive support services for military veterans",
          category: "Veterans Affairs",
          focus: "Veteran support, mental health",
          location: "United States",
          website: "https://veteransupport.org",
          verified: true,
          rating: 4.8
        },
        {
          id: 20,
          name: "Renewable Energy Advocates",
          description: "Promoting clean energy adoption in developing communities",
          category: "Environment",
          focus: "Renewable energy, sustainability",
          location: "Global",
          website: "https://renewableadvocates.org",
          verified: true,
          rating: 4.4
        },
        {
          id: 21,
          name: "Women's Empowerment Global",
          description: "Advancing women's rights and economic opportunities worldwide",
          category: "Women's Rights",
          focus: "Women's empowerment, economic development",
          location: "International",
          website: "https://womensempowerment.org",
          verified: true,
          rating: 4.7
        },
        {
          id: 22,
          name: "Literacy Champions",
          description: "Promoting adult literacy and reading programs in underserved areas",
          category: "Education",
          focus: "Adult literacy, reading programs",
          location: "Global",
          website: "https://literacychampions.org",
          verified: true,
          rating: 4.5
        },
        {
          id: 23,
          name: "Urban Farming Collective",
          description: "Creating sustainable food systems through urban agriculture initiatives",
          category: "Agriculture",
          focus: "Urban farming, food sustainability",
          location: "Urban Areas",
          website: "https://urbanfarming.org",
          verified: true,
          rating: 4.2
        },
        {
          id: 24,
          name: "Child Safety Foundation",
          description: "Protecting children from abuse and providing safe environments",
          category: "Child Protection",
          focus: "Child safety, abuse prevention",
          location: "International",
          website: "https://childsafety.org",
          verified: true,
          rating: 4.9
        },
        {
          id: 25,
          name: "Innovation Labs Network",
          description: "Supporting social entrepreneurs developing solutions for global challenges",
          category: "Social Innovation",
          focus: "Social entrepreneurship, innovation",
          location: "Global",
          website: "https://innovationlabs.org",
          verified: true,
          rating: 4.6
        }
      ];
    } catch (error) {
      console.error("Error fetching nonprofits:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
