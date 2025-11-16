import { pgTable, serial, text, timestamp, boolean, jsonb, integer, uuid, decimal, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for OAuth and authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: text('email').notNull().unique(),
  username: text('username'),
  name: text('name'),
  avatar: text('avatar'),
  isVerified: boolean('is_verified').notNull().default(false),
  
  // 4-Factor Authentication fields
  authLevel: integer('auth_level').notNull().default(1), // 1=password, 2=2FA, 3=wallet, 4=PoL+biometric
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  totpSecret: text('totp_secret'), // Permanent TOTP secret after verification
  tempTotpSecret: text('temp_totp_secret'), // Temporary secret during setup
  walletAddress: text('wallet_address'), // Connected Web3 wallet (user-provided)
  serverWalletAddress: text('server_wallet_address'), // Server-generated gasless wallet
  serverWalletPrivateKey: text('server_wallet_private_key'), // Encrypted private key
  lastProofOfLife: timestamp('last_proof_of_life'), // Last PoL verification timestamp
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// RepID Credentials (Soulbound NFT + ZKP)
export const repidCredentials = pgTable('repid_credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  walletAddress: text('wallet_address').notNull(),
  repidScore: integer('repid_score').notNull().default(0),
  nftTokenId: text('nft_token_id'),
  contractAddress: text('contract_address'),
  network: text('network').notNull().default('polygon-cardona'),
  zkpProof: text('zkp_proof'),
  publicSignals: jsonb('public_signals').$type<Record<string, any>>(),
  isSoulbound: boolean('is_soulbound').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastVerified: timestamp('last_verified'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// Newsletter Subscribers
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source').default('landing'),
  interests: jsonb('interests').$type<string[]>().default([]),
  repidEligible: boolean('repid_eligible').default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at'),
});

// Early Access Applications
export const earlyAccessApplications = pgTable('early_access_applications', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  company: text('company'),
  role: text('role'),
  projectDescription: text('project_description'),
  useCase: text('use_case'),
  technicalBackground: text('technical_background'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  reviewNotes: text('review_notes'),
  approvedAt: timestamp('approved_at'),
  accessLevel: text('access_level').default('basic'), // 'basic', 'premium', 'enterprise'
});

// Developer API Keys
export const developerApiKeys = pgTable('developer_api_keys', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  keyName: text('key_name').notNull(),
  apiKey: text('api_key').notNull().unique(),
  permissions: jsonb('permissions').notNull().$type<string[]>(),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// System Health Metrics
export const systemHealthMetrics = pgTable('system_health_metrics', {
  id: serial('id').primaryKey(),
  service: text('service').notNull(),
  status: text('status').notNull(), // 'operational', 'degraded', 'outage'
  responseTime: integer('response_time'), // in milliseconds
  uptime: integer('uptime'), // percentage
  lastCheck: timestamp('last_check').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// API Usage Analytics
export const apiUsageAnalytics = pgTable('api_usage_analytics', {
  id: serial('id').primaryKey(),
  apiKey: text('api_key').notNull(),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// ========================================
// SOUL BOUND TOKEN (SBT) SYSTEM TABLES
// ========================================

// Core Soul Bound Tokens table
export const soulBoundTokens = pgTable('soul_bound_tokens', {
  id: serial('id').primaryKey(),
  tokenId: uuid('token_id').defaultRandom().notNull().unique(),
  owner: text('owner').notNull(), // wallet address
  tokenType: text('token_type').notNull(), // 'SBT' | 'DBT' | 'CBT'
  
  // Multi-dimensional reputation system
  reputationScore: decimal('reputation_score', { precision: 10, scale: 3 }).notNull().default('0'),
  technicalSkill: decimal('technical_skill', { precision: 5, scale: 2 }).notNull().default('0'),
  socialEngagement: decimal('social_engagement', { precision: 5, scale: 2 }).notNull().default('0'),
  creativeContribution: decimal('creative_contribution', { precision: 5, scale: 2 }).notNull().default('0'),
  impactScore: decimal('impact_score', { precision: 5, scale: 2 }).notNull().default('0'),
  
  // Governance and authentication
  votingWeight: decimal('voting_weight', { precision: 10, scale: 3 }).notNull().default('0'),
  governanceParticipation: decimal('governance_participation', { precision: 5, scale: 2 }).notNull().default('0'),
  authenticationLevel: integer('authentication_level').notNull().default(1), // 1-4 levels
  
  // Transfer restrictions and binding
  transferable: boolean('transferable').notNull().default(false),
  soulBound: boolean('soul_bound').notNull().default(true),
  
  // Privacy and verification
  privacySettings: jsonb('privacy_settings').$type<{
    hideReputation: boolean;
    hideContributions: boolean;
    allowAnalytics: boolean;
    anonymousVoting: boolean;
  }>(),
  
  // Metadata and timestamps
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastReputationUpdate: timestamp('last_reputation_update').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('sbt_owner_idx').on(table.owner),
  tokenTypeIdx: index('sbt_token_type_idx').on(table.tokenType),
  reputationIdx: index('sbt_reputation_idx').on(table.reputationScore),
}));

// Contribution tracking for reputation calculation
export const sbtContributions = pgTable('sbt_contributions', {
  id: serial('id').primaryKey(),
  sbtId: integer('sbt_id').notNull(),
  contributionType: text('contribution_type').notNull(), // 'code' | 'governance' | 'mentorship' | 'content' | 'nonprofit'
  value: decimal('value', { precision: 10, scale: 3 }).notNull(),
  impactMultiplier: decimal('impact_multiplier', { precision: 5, scale: 2 }).notNull().default('1'),
  
  // Zero-Knowledge Proof for verification
  zkpCommitment: text('zkp_commitment'),
  zkpProofHash: text('zkp_proof_hash'),
  verificationStatus: text('verification_status').notNull().default('pending'), // 'pending' | 'verified' | 'rejected'
  
  // Contribution details
  description: text('description'),
  externalReference: text('external_reference'), // GitHub commit, DAO proposal ID, etc.
  category: text('category'), // technical, social, creative, impact
  
  // Timestamps
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at'),
  
  // ANFIS calculation metadata
  anfisScore: decimal('anfis_score', { precision: 5, scale: 3 }),
  reputationImpact: decimal('reputation_impact', { precision: 10, scale: 3 }),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  sbtIdIdx: index('contrib_sbt_id_idx').on(table.sbtId),
  typeIdx: index('contrib_type_idx').on(table.contributionType),
  timestampIdx: index('contrib_timestamp_idx').on(table.timestamp),
}));

// ========================================
// ZERO-KNOWLEDGE PROOF SYSTEM TABLES  
// ========================================

// ZKP Circuits and Templates
export const zkpCircuits = pgTable('zkp_circuits', {
  id: serial('id').primaryKey(),
  circuitName: text('circuit_name').notNull().unique(),
  circuitType: text('circuit_type').notNull(), // 'identity' | 'reputation' | 'skill' | 'governance'
  
  // Circuit specifications
  constraints: jsonb('constraints').$type<{
    inputCount: number;
    outputCount: number;
    witnessCount: number;
    constraintCount: number;
  }>(),
  
  // Circuit files and metadata  
  wasmPath: text('wasm_path'),
  zkeyPath: text('zkey_path'),
  verificationKey: jsonb('verification_key').$type<Record<string, any>>(),
  
  // Status and versioning
  version: text('version').notNull().default('1.0'),
  status: text('status').notNull().default('active'), // 'active' | 'deprecated' | 'testing'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  circuitNameIdx: index('zkp_circuit_name_idx').on(table.circuitName),
  typeIdx: index('zkp_circuit_type_idx').on(table.circuitType),
}));

// Zero-Knowledge Proofs table
export const zkpProofs = pgTable('zkp_proofs', {
  id: serial('id').primaryKey(),
  proofId: uuid('proof_id').defaultRandom().notNull().unique(),
  sbtId: integer('sbt_id').notNull(),
  circuitId: integer('circuit_id').notNull(),
  
  // Proof data
  proofType: text('proof_type').notNull(), // 'skill_verification' | 'reputation_threshold' | 'governance_eligibility'
  statement: text('statement').notNull(), // Human-readable claim being proven
  
  // Cryptographic proof components
  proof: jsonb('proof').$type<{
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
    protocol: string;
    curve: string;
  }>(),
  
  publicSignals: jsonb('public_signals').$type<string[]>(),
  commitment: text('commitment'), // Commitment to private inputs
  
  // Verification and validity
  verified: boolean('verified').notNull().default(false),
  verificationResult: jsonb('verification_result').$type<{
    valid: boolean;
    verifiedAt: string;
    verifierVersion: string;
    publicInputsHash: string;
  }>(),
  
  // Usage and expiry
  usageCount: integer('usage_count').notNull().default(0),
  maxUsages: integer('max_usages').default(1),
  expiresAt: timestamp('expires_at'),
  
  // Privacy settings
  anonymousUsage: boolean('anonymous_usage').notNull().default(false),
  publiclyVerifiable: boolean('publicly_verifiable').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used'),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  sbtIdIdx: index('zkp_sbt_id_idx').on(table.sbtId),
  proofTypeIdx: index('zkp_proof_type_idx').on(table.proofType),
  verifiedIdx: index('zkp_verified_idx').on(table.verified),
  expiryIdx: index('zkp_expiry_idx').on(table.expiresAt),
}));

// ========================================
// DAO GOVERNANCE SYSTEM TABLES
// ========================================

// DAO Proposals with purpose-weighted voting
export const daoProposals = pgTable('dao_proposals', {
  id: serial('id').primaryKey(),
  proposalId: uuid('proposal_id').defaultRandom().notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  
  // Proposal categorization
  category: text('category').notNull(), // 'technical' | 'funding' | 'governance' | 'social_impact'
  proposalType: text('proposal_type').notNull(), // 'funding' | 'parameter_change' | 'feature_request' | 'partnership'
  
  // Voting mechanics
  votingType: text('voting_type').notNull().default('quadratic'), // 'simple' | 'quadratic' | 'weighted'
  requiredParticipation: decimal('required_participation', { precision: 5, scale: 2 }).notNull().default('25.0'),
  consensusThreshold: decimal('consensus_threshold', { precision: 5, scale: 2 }).notNull().default('66.7'),
  
  // Purpose alignment weighting
  technicalWeight: decimal('technical_weight', { precision: 3, scale: 2 }).notNull().default('1.0'),
  socialWeight: decimal('social_weight', { precision: 3, scale: 2 }).notNull().default('1.0'),
  creativeWeight: decimal('creative_weight', { precision: 3, scale: 2 }).notNull().default('1.0'),
  impactWeight: decimal('impact_weight', { precision: 3, scale: 2 }).notNull().default('1.0'),
  
  // Proposal lifecycle
  status: text('status').notNull().default('draft'), // 'draft' | 'active' | 'passed' | 'rejected' | 'executed'
  submittedBy: text('submitted_by').notNull(), // SBT owner address
  
  // Timing
  votingStartsAt: timestamp('voting_starts_at'),
  votingEndsAt: timestamp('voting_ends_at'),
  executionDeadline: timestamp('execution_deadline'),
  
  // Results
  totalVotes: integer('total_votes').notNull().default(0),
  participationRate: decimal('participation_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  consensusScore: decimal('consensus_score', { precision: 5, scale: 2 }).notNull().default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  categoryIdx: index('dao_proposal_category_idx').on(table.category),
  statusIdx: index('dao_proposal_status_idx').on(table.status),
  votingPeriodIdx: index('dao_proposal_voting_period_idx').on(table.votingStartsAt, table.votingEndsAt),
}));

// Quadratic voting records with ZKP privacy
export const daoVotes = pgTable('dao_votes', {
  id: serial('id').primaryKey(),
  proposalId: integer('proposal_id').notNull(),
  voterSbtId: integer('voter_sbt_id').notNull(),
  
  // Anonymous voting via ZKP
  anonymousVoterId: text('anonymous_voter_id'), // ZKP-generated anonymous ID
  zkpEligibilityProof: text('zkp_eligibility_proof'), // Proof of voting eligibility
  
  // Quadratic voting mechanics
  voteStrength: decimal('vote_strength', { precision: 10, scale: 3 }).notNull(),
  quadraticCost: decimal('quadratic_cost', { precision: 10, scale: 3 }).notNull(),
  votingCreditsUsed: decimal('voting_credits_used', { precision: 10, scale: 3 }).notNull(),
  
  // Vote content
  position: text('position').notNull(), // 'for' | 'against' | 'abstain'
  reasoning: text('reasoning'), // Optional vote explanation
  
  // Purpose-weighted calculation
  purposeWeightedPower: decimal('purpose_weighted_power', { precision: 10, scale: 3 }).notNull(),
  purposeAlignmentScore: decimal('purpose_alignment_score', { precision: 5, scale: 2 }).notNull(),
  
  // Privacy and verification
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  zkpVerified: boolean('zkp_verified').notNull().default(false),
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  proposalIdIdx: index('dao_vote_proposal_id_idx').on(table.proposalId),
  voterSbtIdIdx: index('dao_vote_voter_sbt_id_idx').on(table.voterSbtId),
  anonymousVoterIdx: index('dao_vote_anonymous_voter_idx').on(table.anonymousVoterId),
}));

// ========================================
// ANFIS REPUTATION ENGINE TABLES
// ========================================

// ANFIS fuzzy rules for reputation calculation
export const anfisFuzzyRules = pgTable('anfis_fuzzy_rules', {
  id: serial('id').primaryKey(),
  ruleName: text('rule_name').notNull().unique(),
  ruleType: text('rule_type').notNull(), // 'reputation' | 'routing' | 'governance'
  
  // Fuzzy rule definition
  antecedent: text('antecedent').notNull(), // IF clause
  consequent: text('consequent').notNull(), // THEN clause
  confidence: decimal('confidence', { precision: 5, scale: 3 }).notNull().default('1.0'),
  
  // Neural network weights
  weights: jsonb('weights').$type<number[]>(),
  bias: decimal('bias', { precision: 10, scale: 6 }).notNull().default('0'),
  
  // Performance tracking
  activationCount: integer('activation_count').notNull().default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 3 }).notNull().default('0'),
  lastActivation: timestamp('last_activation'),
  
  // Learning parameters
  learningRate: decimal('learning_rate', { precision: 5, scale: 4 }).notNull().default('0.01'),
  adaptationEnabled: boolean('adaptation_enabled').notNull().default(true),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ruleTypeIdx: index('anfis_rule_type_idx').on(table.ruleType),
  activeIdx: index('anfis_rule_active_idx').on(table.isActive),
}));

// ANFIS learning history and adaptation
export const anfisLearningHistory = pgTable('anfis_learning_history', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').notNull(),
  sbtId: integer('sbt_id'), // Optional: specific to SBT calculation
  
  // Input values for learning
  inputValues: jsonb('input_values').$type<Record<string, number>>(),
  expectedOutput: decimal('expected_output', { precision: 10, scale: 6 }),
  actualOutput: decimal('actual_output', { precision: 10, scale: 6 }),
  
  // Learning metrics
  errorValue: decimal('error_value', { precision: 10, scale: 6 }),
  weightAdjustment: jsonb('weight_adjustment').$type<number[]>(),
  biasAdjustment: decimal('bias_adjustment', { precision: 10, scale: 6 }),
  
  // Context
  learningContext: text('learning_context'), // 'reputation_calculation' | 'routing_decision' | 'governance_vote'
  feedback: text('feedback'), // Success/failure feedback
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  ruleIdIdx: index('anfis_learning_rule_id_idx').on(table.ruleId),
  timestampIdx: index('anfis_learning_timestamp_idx').on(table.timestamp),
}));

// ========================================
// SHAREABLE VIRALITY & MULTIMODAL SYSTEM
// ========================================

// Share links for social media virality
export const shareLinks = pgTable('share_links', {
  id: serial('id').primaryKey(),
  linkId: uuid('link_id').defaultRandom().notNull().unique(),
  userId: integer('user_id').notNull(),
  
  // Share content details
  contentType: text('content_type').notNull(), // 'submission' | 'achievement' | 'leaderboard' | 'agent_story'
  contentId: text('content_id').notNull(), // ID of the shared content
  title: text('title').notNull(),
  description: text('description').notNull(),
  
  // Social media templates (pre-filled posts)
  twitterTemplate: text('twitter_template'),
  linkedinTemplate: text('linkedin_template'),
  facebookTemplate: text('facebook_template'),
  
  // Preview generation
  previewImageUrl: text('preview_image_url'), // Generated screenshot/preview
  previewGenerated: boolean('preview_generated').notNull().default(false),
  
  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  shareCount: integer('share_count').notNull().default(0),
  conversionCount: integer('conversion_count').notNull().default(0),
  
  // Reward tracking
  repIdRewardEarned: decimal('rep_id_reward_earned', { precision: 10, scale: 3 }).notNull().default('0'),
  rewardsClaimed: boolean('rewards_claimed').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdIdx: index('share_links_user_id_idx').on(table.userId),
  contentTypeIdx: index('share_links_content_type_idx').on(table.contentType),
  createdAtIdx: index('share_links_created_at_idx').on(table.createdAt),
}));

// Referral tracking with enhanced rewards
export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id').notNull(),
  referredId: integer('referred_id'),
  referralCode: text('referral_code').notNull().unique(),
  
  // Referral details
  referralSource: text('referral_source'), // 'twitter' | 'linkedin' | 'direct_link'
  shareLinkId: integer('share_link_id'), // Link to shareLinks if from social share
  
  // Status tracking
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'rewarded'
  completedAt: timestamp('completed_at'),
  
  // Reward tracking
  repIdReward: decimal('rep_id_reward', { precision: 10, scale: 3 }).notNull().default('50.0'),
  sbtUpgradeEarned: boolean('sbt_upgrade_earned').notNull().default(false),
  gaslessTokensEarned: integer('gasless_tokens_earned').notNull().default(0),
  
  // Monetization sharing (88-98% to referrer for UGC)
  monetizationShare: decimal('monetization_share', { precision: 5, scale: 2 }).notNull().default('90.0'),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).notNull().default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  referrerIdx: index('referrals_referrer_idx').on(table.referrerId),
  referredIdx: index('referrals_referred_idx').on(table.referredId),
  codeIdx: index('referrals_code_idx').on(table.referralCode),
  statusIdx: index('referrals_status_idx').on(table.status),
}));

// Multimodal content library (GIFs, infographics, videos)
export const multimodalContent = pgTable('multimodal_content', {
  id: serial('id').primaryKey(),
  contentId: uuid('content_id').defaultRandom().notNull().unique(),
  
  // Content identification
  title: text('title').notNull(),
  description: text('description').notNull(),
  contentType: text('content_type').notNull(), // 'gif' | 'infographic' | 'video' | 'diagram'
  category: text('category').notNull(), // 'repid_boost' | 'quadratic_voting' | 'agent_journey' | 'zkp_explanation'
  
  // File details
  fileUrl: text('file_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fileSizeMb: decimal('file_size_mb', { precision: 8, scale: 2 }),
  durationSeconds: integer('duration_seconds'), // For videos/GIFs
  
  // Display settings
  displayContext: text('display_context').array(), // ['tooltip', 'modal', 'onboarding', 'help']
  triggerElement: text('trigger_element'), // Element ID that triggers this content
  
  // Educational content
  educationalValue: text('educational_value'), // Brief explanation of what users learn
  analogyText: text('analogy_text'), // Simple analogy (e.g., "Like a video game level-up")
  
  // Usage tracking
  viewCount: integer('view_count').notNull().default(0),
  averageViewDuration: decimal('average_view_duration', { precision: 5, scale: 2 }),
  helpfulVotes: integer('helpful_votes').notNull().default(0),
  
  // Cost optimization
  generationCost: decimal('generation_cost', { precision: 8, scale: 4 }).notNull().default('0'),
  routingProvider: text('routing_provider'), // ANFIS-routed provider used
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  categoryIdx: index('multimodal_category_idx').on(table.category),
  contentTypeIdx: index('multimodal_content_type_idx').on(table.contentType),
  activeIdx: index('multimodal_active_idx').on(table.isActive),
}));

// Legacy compatibility exports (empty tables to prevent import errors)
export const badges = pgTable('badges_placeholder', { id: serial('id').primaryKey() });
export const projects = pgTable('projects_placeholder', { id: serial('id').primaryKey() });
export const verificationCodes = pgTable('verification_codes_placeholder', { id: serial('id').primaryKey() });
export const devHubAccess = pgTable('dev_hub_access_placeholder', { id: serial('id').primaryKey() });
export const reputationActivities = pgTable('reputation_activities_placeholder', { id: serial('id').primaryKey() });
export const networkingGoals = pgTable('networking_goals_placeholder', { id: serial('id').primaryKey() });
export const goalProgress = pgTable('goal_progress_placeholder', { id: serial('id').primaryKey() });
export const goalRewards = pgTable('goal_rewards_placeholder', { id: serial('id').primaryKey() });
export const analyticsEvents = pgTable('analytics_events_placeholder', { id: serial('id').primaryKey() });
export const pageViews = pgTable('page_views_placeholder', { id: serial('id').primaryKey() });
export const notifications = pgTable('notifications_placeholder', { id: serial('id').primaryKey() });
export const iotaWallets = pgTable('iota_wallets_placeholder', { id: serial('id').primaryKey() });
export const organizations = pgTable('organizations_placeholder', { id: serial('id').primaryKey() });
export const donations = pgTable('donations_placeholder', { id: serial('id').primaryKey() });
// ========================================
// PURPOSE HUB: GRANTS, HACKATHONS, NONPROFITS  
// ========================================

// Comprehensive Grants Database
export const grants = pgTable('grants', {
  id: serial('id').primaryKey(),
  grantId: uuid('grant_id').defaultRandom().notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  organization: text('organization').notNull(),
  
  // Financial details
  fundingMin: decimal('funding_min', { precision: 12, scale: 2 }),
  fundingMax: decimal('funding_max', { precision: 12, scale: 2 }),
  totalBudget: decimal('total_budget', { precision: 15, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  
  // Application details
  applicationDeadline: timestamp('application_deadline'),
  projectStartDate: timestamp('project_start_date'),
  projectEndDate: timestamp('project_end_date'),
  applicationUrl: text('application_url'),
  
  // Categories and tags
  category: text('category').notNull(), // 'web3', 'ai', 'climate', 'health', 'education'
  subcategory: text('subcategory'),
  techStack: text('tech_stack').array(), // ['blockchain', 'machine-learning', 'smart-contracts']
  themes: text('themes').array(), // ['defi', 'identity', 'sustainability']
  
  // Target demographics
  eligibilityRequirements: text('eligibility_requirements').array(),
  targetStage: text('target_stage').notNull(), // 'idea', 'prototype', 'mvp', 'scaling'
  targetRegions: text('target_regions').array(),
  
  // Grant specifics
  grantType: text('grant_type').notNull(), // 'research', 'development', 'infrastructure', 'community'
  deliverables: text('deliverables').array(),
  reportingRequirements: text('reporting_requirements'),
  
  // Status and metadata
  status: text('status').notNull().default('active'), // 'active', 'closed', 'paused'
  priority: integer('priority').notNull().default(3), // 1-5 priority ranking
  difficultyLevel: integer('difficulty_level').default(3), // 1-5 technical difficulty
  
  // URLs and contacts
  websiteUrl: text('website_url'),
  contactEmail: text('contact_email'),
  
  // Search and matching
  searchKeywords: text('search_keywords').array(),
  matchingScore: decimal('matching_score', { precision: 5, scale: 3 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  categoryIdx: index('grants_category_idx').on(table.category),
  deadlineIdx: index('grants_deadline_idx').on(table.applicationDeadline),
  statusIdx: index('grants_status_idx').on(table.status),
  fundingIdx: index('grants_funding_idx').on(table.fundingMax),
}));

// Comprehensive Hackathons Database
export const hackathons = pgTable('hackathons', {
  id: serial('id').primaryKey(),
  hackathonId: uuid('hackathon_id').defaultRandom().notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  organizer: text('organizer').notNull(),
  
  // Event details
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  registrationDeadline: timestamp('registration_deadline'),
  submissionDeadline: timestamp('submission_deadline'),
  
  // Location and format
  location: text('location'), // 'Online', 'San Francisco, CA', 'Hybrid'
  format: text('format').notNull(), // 'in-person', 'virtual', 'hybrid'
  timezone: text('timezone').default('UTC'),
  
  // Prize and participation
  totalPrizePool: decimal('total_prize_pool', { precision: 12, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  maxParticipants: integer('max_participants'),
  currentParticipants: integer('current_participants').default(0),
  
  // Technical focus
  techStack: text('tech_stack').array(),
  tracks: text('tracks').array(), // ['DeFi', 'Gaming', 'AI Agents', 'Infrastructure']
  themes: text('themes').array(),
  sponsors: text('sponsors').array(),
  
  // Prizes breakdown
  prizeStructure: jsonb('prize_structure').$type<{
    first: number;
    second?: number;
    third?: number;
    special?: Array<{ name: string; amount: number; sponsor?: string }>;
  }>(),
  
  // Requirements and judging
  eligibilityRequirements: text('eligibility_requirements').array(),
  judgingCriteria: text('judging_criteria').array(),
  submissionRequirements: text('submission_requirements').array(),
  
  // URLs and resources
  websiteUrl: text('website_url'),
  registrationUrl: text('registration_url'),
  discordUrl: text('discord_url'),
  telegramUrl: text('telegram_url'),
  
  // Status and metadata
  status: text('status').notNull().default('upcoming'), // 'upcoming', 'active', 'completed', 'cancelled'
  difficultyLevel: integer('difficulty_level').default(3),
  
  // Search and matching
  searchKeywords: text('search_keywords').array(),
  matchingScore: decimal('matching_score', { precision: 5, scale: 3 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  startDateIdx: index('hackathons_start_date_idx').on(table.startDate),
  statusIdx: index('hackathons_status_idx').on(table.status),
  tracksIdx: index('hackathons_tracks_idx').on(table.tracks),
  prizePoolIdx: index('hackathons_prize_pool_idx').on(table.totalPrizePool),
}));

// Comprehensive Nonprofits Database  
export const nonprofits = pgTable('nonprofits', {
  id: serial('id').primaryKey(),
  nonprofitId: uuid('nonprofit_id').defaultRandom().notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  mission: text('mission'),
  
  // Legal and verification
  ein: text('ein'), // Tax ID
  registrationNumber: text('registration_number'),
  legalStatus: text('legal_status'), // '501c3', 'charity', 'foundation'
  verificationStatus: text('verification_status').notNull().default('pending'), // 'verified', 'pending', 'rejected'
  
  // Contact and location
  websiteUrl: text('website_url'),
  contactEmail: text('contact_email'),
  headquarters: text('headquarters'),
  operatingRegions: text('operating_regions').array(),
  
  // Focus areas and impact
  focusAreas: text('focus_areas').array(), // ['education', 'healthcare', 'environment', 'poverty']
  targetBeneficiaries: text('target_beneficiaries').array(),
  impactMetrics: jsonb('impact_metrics').$type<{
    beneficiariesServed?: number;
    yearsOperating?: number;
    projectsCompleted?: number;
    fundsDistributed?: number;
  }>(),
  
  // Technology adoption
  techAdoption: jsonb('tech_adoption').$type<{
    blockchain: boolean;
    ai: boolean;
    web3: boolean;
    level: 'beginner' | 'intermediate' | 'advanced';
  }>(),
  
  // Funding and transparency
  annualBudget: decimal('annual_budget', { precision: 15, scale: 2 }),
  fundingSources: text('funding_sources').array(), // ['grants', 'donations', 'government']
  transparencyScore: decimal('transparency_score', { precision: 3, scale: 2 }).default('0'),
  charityNavigatorRating: integer('charity_navigator_rating'), // 1-4 stars
  guidestarSeal: boolean('guidestar_seal').default(false),
  
  // Collaboration opportunities
  partnershipInterests: text('partnership_interests').array(),
  skillsNeeded: text('skills_needed').array(),
  volunteerOpportunities: text('volunteer_opportunities').array(),
  
  // Search and matching
  searchKeywords: text('search_keywords').array(),
  matchingScore: decimal('matching_score', { precision: 5, scale: 3 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  focusAreasIdx: index('nonprofits_focus_areas_idx').on(table.focusAreas),
  verificationIdx: index('nonprofits_verification_idx').on(table.verificationStatus),
  transparencyIdx: index('nonprofits_transparency_idx').on(table.transparencyScore),
  regionsIdx: index('nonprofits_regions_idx').on(table.operatingRegions),
}));

export const nonprofitSubmissions = pgTable('nonprofit_submissions_placeholder', { id: serial('id').primaryKey() });
export const zkProofs = pgTable('zk_proofs_placeholder', { id: serial('id').primaryKey() });
export const zkIdentityCommitments = pgTable('zk_identity_commitments_placeholder', { id: serial('id').primaryKey() });
export const apiKeys = pgTable('api_keys_placeholder', { id: serial('id').primaryKey() });
export const apiKeyUsage = pgTable('api_key_usage_placeholder', { id: serial('id').primaryKey() });
export const sbtCredentials = pgTable('sbt_credentials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  credentialType: text('credential_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  verificationStatus: text('verification_status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});
// User saved opportunities and matches
export const userSavedOpportunities = pgTable('user_saved_opportunities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  opportunityType: text('opportunity_type').notNull(), // 'grant', 'hackathon', 'nonprofit'
  opportunityId: text('opportunity_id').notNull(), // UUID of the opportunity
  savedAt: timestamp('saved_at').defaultNow().notNull(),
  notes: text('notes'),
  reminderDate: timestamp('reminder_date'),
  status: text('status').default('saved'), // 'saved', 'applied', 'interested', 'not_interested'
}, (table) => ({
  userIdIdx: index('saved_opportunities_user_id_idx').on(table.userId),
  typeIdx: index('saved_opportunities_type_idx').on(table.opportunityType),
}));

// AI-powered opportunity matching and recommendations
export const opportunityMatches = pgTable('opportunity_matches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  opportunityType: text('opportunity_type').notNull(),
  opportunityId: text('opportunity_id').notNull(),
  
  // Matching algorithm results
  matchScore: decimal('match_score', { precision: 5, scale: 3 }).notNull(),
  matchReasons: text('match_reasons').array(), // ['tech_stack_match', 'experience_level', 'location']
  
  // AI analysis
  aiAnalysis: jsonb('ai_analysis').$type<{
    strengths: string[];
    recommendations: string[];
    successProbability: number;
    competitionLevel: 'low' | 'medium' | 'high';
  }>(),
  
  // User interaction
  viewed: boolean('viewed').default(false),
  viewedAt: timestamp('viewed_at'),
  userFeedback: text('user_feedback'), // 'relevant', 'not_relevant', 'interested'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  userIdIdx: index('opportunity_matches_user_id_idx').on(table.userId),
  scoreIdx: index('opportunity_matches_score_idx').on(table.matchScore),
  typeIdx: index('opportunity_matches_type_idx').on(table.opportunityType),
}));

export const nonprofitSuggestions = pgTable('nonprofit_suggestions_placeholder', { id: serial('id').primaryKey() });

// ========================================
// QUANTUMMATH.AI MATHEMATICAL SERVICES
// ========================================

// Mathematical discovery service orders
export const mathDiscoveryOrders = pgTable('math_discovery_orders', {
  id: serial('id').primaryKey(),
  orderId: uuid('order_id').defaultRandom().notNull().unique(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  companyName: text('company_name'),
  
  // Service details
  serviceType: text('service_type').notNull(), // 'breakthrough_insight' | 'continuous_discovery' | 'custom_modeling'
  problemDescription: text('problem_description').notNull(),
  mathDomain: text('math_domain').notNull(), // 'number_theory' | 'optimization' | 'graph_theory' | 'topology' | 'analysis'
  urgencyLevel: text('urgency_level').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'critical'
  
  // Pricing and payment
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'paid' | 'refunded'
  stripePaymentId: text('stripe_payment_id'),
  
  // Delivery and status
  status: text('status').notNull().default('received'), // 'received' | 'analyzing' | 'breakthrough_found' | 'delivered' | 'completed'
  expectedDelivery: timestamp('expected_delivery'),
  deliveredAt: timestamp('delivered_at'),
  
  // Results
  discoveryResult: text('discovery_result'),
  unityScore: decimal('unity_score', { precision: 5, scale: 3 }),
  breakthroughLevel: text('breakthrough_level'), // 'insight' | 'theorem' | 'conjecture_progress' | 'millennium_prize_candidate'
  
  // AI agent assignment
  assignedAgent: text('assigned_agent'), // 'mel' | 'ai-prompt-manager' | 'hyperdag-manager'
  agentConfidence: decimal('agent_confidence', { precision: 5, scale: 3 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// Email subscribers for marketing
export const emailSubscribers = pgTable('email_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  source: text('source').notNull(), // 'landing_page' | 'blog' | 'social' | 'referral'
  tags: text('tags').array(), // Interest tags
  isDoubleOptIn: boolean('is_double_opt_in').notNull().default(false),
  unsubscribed: boolean('unsubscribed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// Content marketing pieces
export const contentPieces = pgTable('content_pieces', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  contentType: text('content_type').notNull(), // 'blog_post' | 'social_post' | 'email' | 'video_script'
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  
  // SEO and social
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  tags: text('tags').array(),
  hashtags: text('hashtags').array(),
  
  // Performance tracking
  views: integer('views').notNull().default(0),
  engagements: integer('engagements').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  
  // Publishing
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'scheduled'
  publishedAt: timestamp('published_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// Offloaded Files (MD, docs, non-runtime files stored in database to reduce deployment size)
export const offloadedFiles = pgTable('offloaded_files', {
  id: serial('id').primaryKey(),
  filePath: text('file_path').notNull().unique(), // Original file path (e.g., "README.md", "docs/api/README.md")
  fileName: text('file_name').notNull(), // File name only (e.g., "README.md")
  fileType: text('file_type').notNull(), // 'markdown' | 'text' | 'script' | 'html' | 'config'
  category: text('category').notNull(), // 'documentation' | 'test' | 'deployment' | 'validation' | 'other'
  content: text('content').notNull(), // Actual file content
  size: integer('size').notNull(), // File size in bytes
  checksum: text('checksum'), // MD5 or SHA256 for integrity verification
  offloadedAt: timestamp('offloaded_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<{
    originalLocation?: string;
    tags?: string[];
    lastModified?: string;
    description?: string;
  }>(),
}, (table) => ({
  categoryIdx: index('offloaded_files_category_idx').on(table.category),
  fileTypeIdx: index('offloaded_files_type_idx').on(table.fileType),
  fileNameIdx: index('offloaded_files_name_idx').on(table.fileName),
}));

// Additional developer platform tables (preserved)
export const developerServices = pgTable('developer_services_placeholder', { id: serial('id').primaryKey() });
export const serviceUsage = pgTable('service_usage_placeholder', { id: serial('id').primaryKey() });
export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  activityType: text('activity_type').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// QuantumMath.ai service schemas
export const insertMathDiscoveryOrderSchema = createInsertSchema(mathDiscoveryOrders).omit({
  id: true,
  orderId: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
});

// ========================================
// PURPOSE HUB SCHEMA EXPORTS
// ========================================

// Grant schemas
export const insertGrantSchema = createInsertSchema(grants).omit({
  id: true,
  grantId: true,
  createdAt: true,
  updatedAt: true,
});
export type Grant = typeof grants.$inferSelect;
export type InsertGrant = z.infer<typeof insertGrantSchema>;

// Hackathon schemas  
export const insertHackathonSchema = createInsertSchema(hackathons).omit({
  id: true,
  hackathonId: true,
  createdAt: true,
  updatedAt: true,
});
export type Hackathon = typeof hackathons.$inferSelect;
export type InsertHackathon = z.infer<typeof insertHackathonSchema>;

// Nonprofit schemas
export const insertNonprofitSchema = createInsertSchema(nonprofits).omit({
  id: true,
  nonprofitId: true,
  createdAt: true,
  updatedAt: true,
});
export type Nonprofit = typeof nonprofits.$inferSelect;
export type InsertNonprofit = z.infer<typeof insertNonprofitSchema>;

// User interaction schemas
export const insertUserSavedOpportunitySchema = createInsertSchema(userSavedOpportunities).omit({
  id: true,
  savedAt: true,
});
export type UserSavedOpportunity = typeof userSavedOpportunities.$inferSelect;
export type InsertUserSavedOpportunity = z.infer<typeof insertUserSavedOpportunitySchema>;

export const insertOpportunityMatchSchema = createInsertSchema(opportunityMatches).omit({
  id: true,
  createdAt: true,
});
export type OpportunityMatch = typeof opportunityMatches.$inferSelect;
export type InsertOpportunityMatch = z.infer<typeof insertOpportunityMatchSchema>;

export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers).omit({
  id: true,
  createdAt: true,
});

export const insertContentPieceSchema = createInsertSchema(contentPieces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertOffloadedFileSchema = createInsertSchema(offloadedFiles).omit({
  id: true,
  offloadedAt: true,
});

// Additional schema exports for compatibility
export const insertServiceUsageSchema = z.object({ id: z.number().optional() });

// Zod Schemas for developer platform
export const insertEarlyAccessApplicationSchema = createInsertSchema(earlyAccessApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  name: z.string().optional(),
  role: z.string().optional(),
  projectDescription: z.string().optional(),
  useCase: z.string().optional(),
  technicalBackground: z.string().optional(),
});

export const insertDeveloperApiKeySchema = createInsertSchema(developerApiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertSystemHealthMetricSchema = createInsertSchema(systemHealthMetrics).omit({
  id: true,
  lastCheck: true,
});

export const insertApiUsageAnalyticSchema = createInsertSchema(apiUsageAnalytics).omit({
  id: true,
  timestamp: true,
});

// ========================================
// SHAREABLE VIRALITY & MULTIMODAL SCHEMAS
// ========================================

// Share Links schemas
export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  linkId: true,
  createdAt: true,
});
export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;

// Referral schemas
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Multimodal Content schemas
export const insertMultimodalContentSchema = createInsertSchema(multimodalContent).omit({
  id: true,
  contentId: true,
  createdAt: true,
  updatedAt: true,
});
export type MultimodalContent = typeof multimodalContent.$inferSelect;
export type InsertMultimodalContent = z.infer<typeof insertMultimodalContentSchema>;

// ========================================
// SBT + ZKP SYSTEM ZOD SCHEMAS
// ========================================

// Soul Bound Token schemas
export const insertSoulBoundTokenSchema = createInsertSchema(soulBoundTokens).omit({
  id: true,
  tokenId: true,
  createdAt: true,
  updatedAt: true,
  lastReputationUpdate: true,
});

export const insertSbtContributionSchema = createInsertSchema(sbtContributions).omit({
  id: true,
  timestamp: true,
  verifiedAt: true,
});

// ZKP system schemas
export const insertZkpCircuitSchema = createInsertSchema(zkpCircuits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertZkpProofSchema = createInsertSchema(zkpProofs).omit({
  id: true,
  proofId: true,
  createdAt: true,
  lastUsed: true,
});

// DAO governance schemas
export const insertDaoProposalSchema = createInsertSchema(daoProposals).omit({
  id: true,
  proposalId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDaoVoteSchema = createInsertSchema(daoVotes).omit({
  id: true,
  timestamp: true,
});

// ANFIS reputation engine schemas
export const insertAnfisFuzzyRuleSchema = createInsertSchema(anfisFuzzyRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivation: true,
});

export const insertAnfisLearningHistorySchema = createInsertSchema(anfisLearningHistory).omit({
  id: true,
  timestamp: true,
});

// Type exports for developer platform
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type EarlyAccessApplication = typeof earlyAccessApplications.$inferSelect;
export type InsertEarlyAccessApplication = z.infer<typeof insertEarlyAccessApplicationSchema>;

export type DeveloperApiKey = typeof developerApiKeys.$inferSelect;
export type InsertDeveloperApiKey = z.infer<typeof insertDeveloperApiKeySchema>;

export type SystemHealthMetric = typeof systemHealthMetrics.$inferSelect;
export type InsertSystemHealthMetric = z.infer<typeof insertSystemHealthMetricSchema>;

export type ApiUsageAnalytic = typeof apiUsageAnalytics.$inferSelect;

// QuantumMath.ai service types
export type MathDiscoveryOrder = typeof mathDiscoveryOrders.$inferSelect;
export type InsertMathDiscoveryOrder = z.infer<typeof insertMathDiscoveryOrderSchema>;

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;

export type ContentPiece = typeof contentPieces.$inferSelect;
export type InsertContentPiece = z.infer<typeof insertContentPieceSchema>;
export type InsertApiUsageAnalytic = z.infer<typeof insertApiUsageAnalyticSchema>;

export type OffloadedFile = typeof offloadedFiles.$inferSelect;
export type InsertOffloadedFile = z.infer<typeof insertOffloadedFileSchema>;

// ========================================
// SBT + ZKP SYSTEM TYPE EXPORTS
// ========================================

// Soul Bound Token types
export type SoulBoundToken = typeof soulBoundTokens.$inferSelect;
export type InsertSoulBoundToken = z.infer<typeof insertSoulBoundTokenSchema>;

export type SbtContribution = typeof sbtContributions.$inferSelect;
export type InsertSbtContribution = z.infer<typeof insertSbtContributionSchema>;

// ZKP system types
export type ZkpCircuit = typeof zkpCircuits.$inferSelect;
export type InsertZkpCircuit = z.infer<typeof insertZkpCircuitSchema>;

export type ZkpProof = typeof zkpProofs.$inferSelect;
export type InsertZkpProof = z.infer<typeof insertZkpProofSchema>;

// DAO governance types
export type DaoProposal = typeof daoProposals.$inferSelect;
export type InsertDaoProposal = z.infer<typeof insertDaoProposalSchema>;

export type DaoVote = typeof daoVotes.$inferSelect;
export type InsertDaoVote = z.infer<typeof insertDaoVoteSchema>;

// ANFIS reputation engine types
export type AnfisFuzzyRule = typeof anfisFuzzyRules.$inferSelect;
export type InsertAnfisFuzzyRule = z.infer<typeof insertAnfisFuzzyRuleSchema>;

export type AnfisLearningHistory = typeof anfisLearningHistory.$inferSelect;
export type InsertAnfisLearningHistory = z.infer<typeof insertAnfisLearningHistorySchema>;

// Legacy compatibility type exports
export type Badge = { id: number };
export type InsertBadge = { id?: number };
export type Project = { id: number };
export type InsertProject = { id?: number };
export type VerificationCode = { id: number };
export type InsertVerificationCode = { id?: number };
export type DevHubAccess = { id: number };
export type InsertDevHubAccess = { id?: number };
export type ReputationActivity = { id: number };
export type InsertReputationActivity = { id?: number };
export type NetworkingGoal = { id: number };
export type InsertNetworkingGoal = { id?: number };
export type GoalProgress = { id: number };
export type InsertGoalProgress = { id?: number };
export type GoalReward = { id: number };
export type InsertGoalReward = { id?: number };
export type AnalyticsEvent = { id: number };
export type InsertAnalyticsEvent = { id?: number };
export type PageView = { id: number };
export type InsertPageView = { id?: number };
export type Notification = { id: number };
export type InsertNotification = { id?: number };
export type IotaWallet = { id: number };
export type InsertIotaWallet = { id?: number };
export type Organization = { id: number };
export type InsertOrganization = { id?: number };
export type Donation = { id: number };
export type InsertDonation = { id?: number };
export type NonprofitSubmission = { id: number };
export type InsertNonprofitSubmission = { id?: number };
export type ZkProof = { id: number };
export type InsertZkProof = { id?: number };
export type ZkIdentityCommitment = { id: number };
export type InsertZkIdentityCommitment = { id?: number };
export type ApiKey = { id: number };
export type InsertApiKey = { id?: number };
export type ApiKeyUsage = { id: number };
export type InsertApiKeyUsage = { id?: number };
export type SBTCredential = { id: number };
export type InsertSBTCredential = { id?: number };
export type UserSavedPurpose = { id: number };
export type InsertUserSavedPurpose = { id?: number };
export type NonprofitSuggestion = { id: number };
export type InsertNonprofitSuggestion = { id?: number };

// ========================================
// WEIGHTED REPID RATING SYSTEM
// ========================================

// Multi-dimensional RepID ratings from users/agents/AI
export const repidRatings = pgTable('repid_ratings', {
  id: serial('id').primaryKey(),
  ratingId: uuid('rating_id').defaultRandom().notNull().unique(),
  
  // Who is rating whom
  raterType: text('rater_type').notNull(), // 'user' | 'agent' | 'ai_model'
  raterId: integer('rater_id').notNull(), // User ID or SBT ID
  raterWallet: text('rater_wallet'), // Wallet address for identity
  raterRepID: decimal('rater_repid', { precision: 10, scale: 3 }).notNull(), // Rater's RepID at time of rating
  
  targetType: text('target_type').notNull(), // 'user' | 'agent' | 'ai_model'
  targetId: integer('target_id').notNull(), // User ID or SBT ID
  targetWallet: text('target_wallet'),
  
  // Multi-dimensional ratings (1-10 scale)
  factualScore: decimal('factual_score', { precision: 4, scale: 2 }).notNull(), // 0-10
  truthfulScore: decimal('truthful_score', { precision: 4, scale: 2 }).notNull(), // 0-10
  authenticScore: decimal('authentic_score', { precision: 4, scale: 2 }).notNull(), // 0-10
  helpfulScore: decimal('helpful_score', { precision: 4, scale: 2 }).notNull(), // 0-10
  
  // Rating metadata
  ratingType: text('rating_type').notNull().default('peer'), // 'peer' | 'self' | 'challenge'
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull().default('1.0'), // 0-1
  
  // Weighting factors
  calculatedWeight: decimal('calculated_weight', { precision: 10, scale: 6 }).notNull(), // Final weight applied
  zkpBonus: decimal('zkp_bonus', { precision: 3, scale: 2 }).notNull().default('0'), // +0.5 for ZKP proof
  faithMultiplier: decimal('faith_multiplier', { precision: 3, scale: 2 }).notNull().default('0'), // +0.2 for scripture
  selfRatingPenalty: decimal('self_rating_penalty', { precision: 3, scale: 2 }).notNull().default('0'), // -0.8 for self-ratings
  
  // ZKP verification
  zkpProofHash: text('zkp_proof_hash'),
  zkpVerified: boolean('zkp_verified').notNull().default(false),
  
  // Scripture/faith context
  scriptureReference: text('scripture_reference'),
  faithContext: text('faith_context'),
  
  // Context and evidence
  context: text('context'), // Why this rating was given
  evidence: jsonb('evidence').$type<{
    verificationTaskId?: string;
    factCheckSource?: string;
    interactionLog?: string;
    userFeedback?: string;
  }>(),
  
  // Time decay tracking
  decayFactor: decimal('decay_factor', { precision: 5, scale: 4 }).notNull().default('1.0'), // Decreases over time
  lastDecayUpdate: timestamp('last_decay_update').defaultNow().notNull(),
  
  // Manipulation detection flags
  flaggedAsManipulation: boolean('flagged_as_manipulation').notNull().default(false),
  manipulationReason: text('manipulation_reason'),
  reviewedByModerator: boolean('reviewed_by_moderator').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  raterIdx: index('rating_rater_idx').on(table.raterId),
  targetIdx: index('rating_target_idx').on(table.targetId),
  typeIdx: index('rating_type_idx').on(table.ratingType),
  createdIdx: index('rating_created_idx').on(table.createdAt),
  flaggedIdx: index('rating_flagged_idx').on(table.flaggedAsManipulation),
}));

// Dynamic user API keys tied to RepID for accountability
export const repidUserApiKeys = pgTable('repid_user_api_keys', {
  id: serial('id').primaryKey(),
  keyId: uuid('key_id').defaultRandom().notNull().unique(),
  
  // User linkage
  userId: integer('user_id').notNull(), // Links to users table
  sbtId: integer('sbt_id'), // Links to soulBoundTokens if exists
  walletAddress: text('wallet_address').notNull(),
  
  // API key credentials
  apiKey: text('api_key').notNull().unique(), // Public identifier (e.g., purposehub_user_abc123)
  apiSecretHash: text('api_secret_hash').notNull(), // SHA-256 hash of secret (never store plain text)
  keyName: text('key_name').notNull(), // User-friendly name
  
  // RepID-based access control
  currentRepID: decimal('current_repid', { precision: 10, scale: 3 }).notNull(), // Updated on each RepID change
  minimumRepIDRequired: decimal('minimum_repid_required', { precision: 10, scale: 3 }).notNull().default('0'),
  
  // Rate limiting based on RepID
  rateLimitTier: text('rate_limit_tier').notNull().default('basic'), // 'basic' | 'standard' | 'premium' | 'unlimited'
  baseRateLimit: integer('base_rate_limit').notNull().default(100), // Requests per hour
  repidMultiplier: decimal('repid_multiplier', { precision: 5, scale: 2 }).notNull().default('1.0'), // RepID/100 = multiplier
  
  // Permissions scoped to this key
  permissions: jsonb('permissions').notNull().$type<{
    repid: string[]; // ['create', 'update', 'verify', 'read', 'batch']
    ratings: string[]; // ['submit', 'view', 'aggregate']
    dao: string[]; // ['vote', 'propose', 'delegate']
    zkp: string[]; // ['generate', 'verify']
  }>(),
  
  // Usage tracking
  totalRequests: integer('total_requests').notNull().default(0),
  successfulRequests: integer('successful_requests').notNull().default(0),
  failedRequests: integer('failed_requests').notNull().default(0),
  lastUsed: timestamp('last_used'),
  
  // Abuse prevention
  abuseFlagCount: integer('abuse_flag_count').notNull().default(0),
  suspendedUntil: timestamp('suspended_until'),
  revocationReason: text('revocation_reason'),
  
  // Key lifecycle
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  rotatedFrom: text('rotated_from'), // Previous key ID if rotated
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdx: index('repid_apikey_user_idx').on(table.userId),
  walletIdx: index('repid_apikey_wallet_idx').on(table.walletAddress),
  activeIdx: index('repid_apikey_active_idx').on(table.isActive),
  tierIdx: index('repid_apikey_tier_idx').on(table.rateLimitTier),
}));

// Aggregated RepID scores with Adaptive Weighted Consensus
export const repidAggregatedScores = pgTable('repid_aggregated_scores', {
  id: serial('id').primaryKey(),
  
  // Target entity
  entityType: text('entity_type').notNull(), // 'user' | 'agent' | 'ai_model'
  entityId: integer('entity_id').notNull(),
  walletAddress: text('wallet_address'),
  
  // Multi-dimensional aggregated scores (EMA-weighted)
  factualScore: decimal('factual_score', { precision: 5, scale: 2 }).notNull().default('5.0'), // 0-10
  truthfulScore: decimal('truthful_score', { precision: 5, scale: 2 }).notNull().default('5.0'),
  authenticScore: decimal('authentic_score', { precision: 5, scale: 2 }).notNull().default('5.0'),
  helpfulScore: decimal('helpful_score', { precision: 5, scale: 2 }).notNull().default('5.0'),
  
  // Composite RepID calculation
  compositeRepID: decimal('composite_repid', { precision: 10, scale: 3 }).notNull().default('50.0'), // Weighted sum
  dimensionWeights: jsonb('dimension_weights').notNull().$type<{
    factual: number; // Default 0.3
    truthful: number; // Default 0.3
    authentic: number; // Default 0.2
    helpful: number; // Default 0.2
  }>(),
  
  // EMA parameters
  emaAlpha: decimal('ema_alpha', { precision: 3, scale: 2 }).notNull().default('0.2'), // 0.1-0.3 for moderate responsiveness
  previousRepID: decimal('previous_repid', { precision: 10, scale: 3 }),
  
  // Rating statistics
  totalRatingsReceived: integer('total_ratings_received').notNull().default(0),
  peerRatingsCount: integer('peer_ratings_count').notNull().default(0),
  selfRatingsCount: integer('self_ratings_count').notNull().default(0),
  challengeRatingsCount: integer('challenge_ratings_count').notNull().default(0),
  
  // Confidence and uncertainty
  bayesianPriorWeight: decimal('bayesian_prior_weight', { precision: 5, scale: 4 }).notNull().default('1.0'), // Higher for new entities
  confidenceInterval: decimal('confidence_interval', { precision: 5, scale: 2 }), // 95% CI width
  scoreVariance: decimal('score_variance', { precision: 10, scale: 4 }), // Measure of rating agreement
  
  // ANFIS aggregation metadata
  anfisFuzzyRules: jsonb('anfis_fuzzy_rules').$type<{
    ruleCount: number;
    learningRate: number;
    epochs: number;
    convergence: number;
  }>(),
  anfisLastTraining: timestamp('anfis_last_training'),
  
  // Decay tracking
  lastDecayReset: timestamp('last_decay_reset').defaultNow().notNull(),
  purposeDiscoveryBonus: boolean('purpose_discovery_bonus').notNull().default(false),
  
  // Manipulation risk assessment
  manipulationRiskScore: decimal('manipulation_risk_score', { precision: 5, scale: 2 }).notNull().default('0'),
  ratingSpikesDetected: integer('rating_spikes_detected').notNull().default(0),
  cliqueParticipation: integer('clique_participation').notNull().default(0),
  
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  entityIdx: index('repid_agg_entity_idx').on(table.entityType, table.entityId),
  walletIdx: index('repid_agg_wallet_idx').on(table.walletAddress),
  repidIdx: index('repid_agg_repid_idx').on(table.compositeRepID),
  riskIdx: index('repid_agg_risk_idx').on(table.manipulationRiskScore),
}));

// Manipulation detection alerts and flagged patterns
export const repidManipulationAlerts = pgTable('repid_manipulation_alerts', {
  id: serial('id').primaryKey(),
  alertId: uuid('alert_id').defaultRandom().notNull().unique(),
  
  // Alert type and severity
  alertType: text('alert_type').notNull(), // 'rating_spike' | 'clique_detected' | 'self_rating_abuse' | 'coordinated_attack'
  severity: text('severity').notNull(), // 'low' | 'medium' | 'high' | 'critical'
  
  // Involved entities
  primaryEntityId: integer('primary_entity_id').notNull(),
  involvedEntities: jsonb('involved_entities').notNull().$type<{
    entityId: number;
    walletAddress: string;
    role: string; // 'perpetrator' | 'victim' | 'accomplice'
  }[]>(),
  
  // Detection details
  detectionMethod: text('detection_method').notNull(), // 'statistical_anomaly' | 'graph_analysis' | 'pattern_matching'
  evidence: jsonb('evidence').$type<{
    ratingIds?: string[];
    statisticalTest?: string;
    pValue?: number;
    effectSize?: number;
    graphMetrics?: {
      clusteringCoefficient?: number;
      modularity?: number;
      suspiciousEdges?: number;
    };
  }>(),
  
  // Statistical analysis
  zScore: decimal('z_score', { precision: 5, scale: 2 }), // How many standard deviations from normal
  pValue: decimal('p_value', { precision: 10, scale: 8 }), // Statistical significance
  effectSize: decimal('effect_size', { precision: 5, scale: 2 }), // Cohen's d or similar
  
  // Status and resolution
  status: text('status').notNull().default('pending'), // 'pending' | 'under_review' | 'confirmed' | 'false_positive' | 'resolved'
  reviewedBy: integer('reviewed_by'), // Moderator user ID
  actionTaken: text('action_taken'), // 'warning' | 'repid_penalty' | 'api_key_suspension' | 'account_flag'
  resolutionNotes: text('resolution_notes'),
  
  // Automated response
  autoFlagged: boolean('auto_flagged').notNull().default(true),
  requiresHumanReview: boolean('requires_human_review').notNull().default(false),
  
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  entityIdx: index('manip_entity_idx').on(table.primaryEntityId),
  typeIdx: index('manip_type_idx').on(table.alertType),
  severityIdx: index('manip_severity_idx').on(table.severity),
  statusIdx: index('manip_status_idx').on(table.status),
  detectedIdx: index('manip_detected_idx').on(table.detectedAt),
}));

// Zod schemas for weighted RepID system
export const insertRepidRatingSchema = createInsertSchema(repidRatings).omit({ id: true, ratingId: true, createdAt: true, updatedAt: true });
export const insertRepidUserApiKeySchema = createInsertSchema(repidUserApiKeys).omit({ id: true, keyId: true, createdAt: true, updatedAt: true });
export const insertRepidAggregatedScoreSchema = createInsertSchema(repidAggregatedScores).omit({ id: true });
export const insertRepidManipulationAlertSchema = createInsertSchema(repidManipulationAlerts).omit({ id: true, alertId: true, detectedAt: true });

// TypeScript types
export type RepidRating = typeof repidRatings.$inferSelect;
export type InsertRepidRating = z.infer<typeof insertRepidRatingSchema>;
export type RepidUserApiKey = typeof repidUserApiKeys.$inferSelect;
export type InsertRepidUserApiKey = z.infer<typeof insertRepidUserApiKeySchema>;
export type RepidAggregatedScore = typeof repidAggregatedScores.$inferSelect;
export type InsertRepidAggregatedScore = z.infer<typeof insertRepidAggregatedScoreSchema>;
export type RepidManipulationAlert = typeof repidManipulationAlerts.$inferSelect;
export type InsertRepidManipulationAlert = z.infer<typeof insertRepidManipulationAlertSchema>;

// ========================================
// VIDEO PLATFORM TABLES
// ========================================

// Reviews table - stores review data from various platforms
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  businessName: text('business_name').notNull(),
  platform: text('platform').notNull(), // 'google', 'yelp', 'facebook'
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  reviewerName: text('reviewer_name'),
  reviewDate: timestamp('review_date'),
  processed: boolean('processed').default(false),
  videoGenerated: boolean('video_generated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Videos table - stores generated video content and metadata
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id'),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds'),
  fileSizeMb: decimal('file_size_mb', { precision: 10, scale: 2 }),
  platformUrls: jsonb('platform_urls').$type<Record<string, string>>(),
  generationCost: decimal('generation_cost', { precision: 10, scale: 4 }),
  status: text('status').default('pending'),
  provider: text('provider'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// AI CONCIERGE API PLATFORM TABLES
// ========================================

// AI Providers with real-time pricing and capabilities
export const aiProviders = pgTable('ai_providers', {
  id: serial('id').primaryKey(),
  providerName: text('provider_name').notNull().unique(), // 'openai' | 'anthropic' | 'gemini' | 'perplexity'
  displayName: text('display_name').notNull(),
  
  // Model capabilities
  models: jsonb('models').notNull().$type<{
    modelId: string;
    displayName: string;
    contextWindow: number;
    maxTokens: number;
    capabilities: string[]; // ['chat', 'completion', 'embeddings', 'vision']
  }[]>(),
  
  // Pricing per model (per 1M tokens)
  pricing: jsonb('pricing').notNull().$type<{
    modelId: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    lastUpdated: string;
  }[]>(),
  
  // Provider performance metrics
  averageLatency: integer('average_latency').notNull().default(0), // milliseconds
  uptimePercentage: decimal('uptime_percentage', { precision: 5, scale: 2 }).notNull().default('99.9'),
  errorRate: decimal('error_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  
  // ANFIS routing weights
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).notNull().default('8.0'), // 0-10
  costEfficiency: decimal('cost_efficiency', { precision: 5, scale: 2 }).notNull().default('5.0'), // 0-10
  speedScore: decimal('speed_score', { precision: 5, scale: 2 }).notNull().default('5.0'), // 0-10
  reliabilityScore: decimal('reliability_score', { precision: 5, scale: 2 }).notNull().default('9.0'), // 0-10
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  apiKeyConfigured: boolean('api_key_configured').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastHealthCheck: timestamp('last_health_check'),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  providerNameIdx: index('ai_provider_name_idx').on(table.providerName),
  activeIdx: index('ai_provider_active_idx').on(table.isActive),
}));

// AI Request logs with cost tracking and ANFIS routing decisions
export const aiRequests = pgTable('ai_requests', {
  id: serial('id').primaryKey(),
  requestId: uuid('request_id').defaultRandom().notNull().unique(),
  
  // User and API key
  userId: integer('user_id').notNull(),
  apiKeyId: integer('api_key_id').notNull(), // Links to developerApiKeys
  
  // Request details
  endpoint: text('endpoint').notNull(), // '/api/ai/chat', '/api/ai/completion'
  model: text('model'), // Requested model (optional)
  provider: text('provider'), // ANFIS-selected provider
  actualModel: text('actual_model').notNull(), // Actual model used
  
  // Request/Response payload
  requestPayload: jsonb('request_payload').notNull().$type<{
    messages?: { role: string; content: string }[];
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  }>(),
  
  responsePayload: jsonb('response_payload').$type<{
    choices?: any[];
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    error?: string;
  }>(),
  
  // Token usage and costs
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  
  actualCost: decimal('actual_cost', { precision: 10, scale: 6 }).notNull(), // What we paid
  openaiEquivalentCost: decimal('openai_equivalent_cost', { precision: 10, scale: 6 }).notNull(), // What OpenAI would cost
  costSavings: decimal('cost_savings', { precision: 10, scale: 6 }).notNull(), // Savings vs OpenAI
  savingsPercentage: decimal('savings_percentage', { precision: 5, scale: 2 }).notNull(),
  
  // ANFIS routing decision
  anfisScore: decimal('anfis_score', { precision: 5, scale: 3 }).notNull(), // Routing confidence
  routingFactors: jsonb('routing_factors').$type<{
    costWeight: number;
    qualityWeight: number;
    speedWeight: number;
    reliabilityWeight: number;
    selectedReason: string;
  }>(),
  
  // Performance metrics
  latencyMs: integer('latency_ms').notNull(), // Total request time
  ttfbMs: integer('ttfb_ms'), // Time to first byte (for streaming)
  statusCode: integer('status_code').notNull(),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  
  // Request metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdIdx: index('ai_req_user_id_idx').on(table.userId),
  apiKeyIdIdx: index('ai_req_api_key_id_idx').on(table.apiKeyId),
  providerIdx: index('ai_req_provider_idx').on(table.provider),
  createdAtIdx: index('ai_req_created_at_idx').on(table.createdAt),
  successIdx: index('ai_req_success_idx').on(table.success),
}));

// User credit system with transaction history
export const userCredits = pgTable('user_credits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  
  // Credit balances (in USD)
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).notNull().default('5.00'), // $5 free
  lifetimeEarned: decimal('lifetime_earned', { precision: 12, scale: 2 }).notNull().default('5.00'),
  lifetimeSpent: decimal('lifetime_spent', { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Referral earnings
  referralEarnings: decimal('referral_earnings', { precision: 10, scale: 2 }).notNull().default('0'),
  totalReferrals: integer('total_referrals').notNull().default(0),
  
  // Savings tracking
  totalSavings: decimal('total_savings', { precision: 12, scale: 2 }).notNull().default('0'),
  savingsThisMonth: decimal('savings_this_month', { precision: 10, scale: 2 }).notNull().default('0'),
  lastMonthReset: timestamp('last_month_reset').defaultNow().notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdIdx: index('user_credits_user_id_idx').on(table.userId),
}));

// Credit transaction history
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  transactionId: uuid('transaction_id').defaultRandom().notNull().unique(),
  
  userId: integer('user_id').notNull(),
  
  // Transaction details
  type: text('type').notNull(), // 'signup_bonus' | 'referral_reward' | 'api_usage' | 'purchase' | 'refund'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Positive for credit, negative for debit
  
  balanceBefore: decimal('balance_before', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  
  // Context
  description: text('description').notNull(),
  relatedRequestId: text('related_request_id'), // Links to aiRequests if applicable
  relatedReferralId: integer('related_referral_id'), // Links to referrals if applicable
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdIdx: index('credit_tx_user_id_idx').on(table.userId),
  typeIdx: index('credit_tx_type_idx').on(table.type),
  createdAtIdx: index('credit_tx_created_at_idx').on(table.createdAt),
}));

// Cost savings analytics and comparisons
export const costSavingsAnalytics = pgTable('cost_savings_analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  
  // Time period
  periodType: text('period_type').notNull(), // 'daily' | 'weekly' | 'monthly' | 'all_time'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Usage statistics
  totalRequests: integer('total_requests').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  
  // Cost breakdown by provider
  providerBreakdown: jsonb('provider_breakdown').notNull().$type<{
    provider: string;
    requests: number;
    cost: number;
    tokens: number;
  }[]>(),
  
  // Savings calculations
  totalActualCost: decimal('total_actual_cost', { precision: 10, scale: 2 }).notNull(),
  totalOpenaiEquivalentCost: decimal('total_openai_equivalent_cost', { precision: 10, scale: 2 }).notNull(),
  totalSavings: decimal('total_savings', { precision: 10, scale: 2 }).notNull(),
  averageSavingsPercentage: decimal('average_savings_percentage', { precision: 5, scale: 2 }).notNull(),
  
  // Performance metrics
  averageLatency: integer('average_latency').notNull(),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  metadata: jsonb('metadata').$type<Record<string, any>>(),
}, (table) => ({
  userIdIdx: index('cost_savings_user_id_idx').on(table.userId),
  periodIdx: index('cost_savings_period_idx').on(table.periodType, table.periodStart),
}));

// Distribution schedule - manages when and where videos are posted
export const distributionSchedule = pgTable('distribution_schedule', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id'),
  platform: text('platform').notNull(),
  scheduledTime: timestamp('scheduled_time').notNull(),
  posted: boolean('posted').default(false),
  postUrl: text('post_url'),
  engagementStats: jsonb('engagement_stats').$type<{
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  }>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// API usage tracking for cost monitoring
export const apiUsage = pgTable('api_usage', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(),
  endpoint: text('endpoint').notNull(),
  cost: decimal('cost', { precision: 10, scale: 4 }).notNull(),
  success: boolean('success').notNull(),
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Cost budgets and limits
export const costBudgets = pgTable('cost_budgets', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(),
  dailyLimit: decimal('daily_limit', { precision: 10, scale: 2 }),
  monthlyLimit: decimal('monthly_limit', { precision: 10, scale: 2 }),
  currentDailySpend: decimal('current_daily_spend', { precision: 10, scale: 4 }).default('0'),
  currentMonthlySpend: decimal('current_monthly_spend', { precision: 10, scale: 4 }).default('0'),
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('0.8'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// AI CONCIERGE API ZOD SCHEMAS & TYPES
// ========================================

export const insertAiProviderSchema = createInsertSchema(aiProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastHealthCheck: true,
});

export const insertAiRequestSchema = createInsertSchema(aiRequests).omit({
  id: true,
  requestId: true,
  createdAt: true,
});

export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMonthReset: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  transactionId: true,
  createdAt: true,
});

export const insertCostSavingsAnalyticsSchema = createInsertSchema(costSavingsAnalytics).omit({
  id: true,
  createdAt: true,
});

export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;

export type AiRequest = typeof aiRequests.$inferSelect;
export type InsertAiRequest = z.infer<typeof insertAiRequestSchema>;

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export type CostSavingsAnalytics = typeof costSavingsAnalytics.$inferSelect;
export type InsertCostSavingsAnalytics = z.infer<typeof insertCostSavingsAnalyticsSchema>;

// Zod schemas for video platform
export const insertReviewSchema = createInsertSchema(reviews);
export const insertVideoSchema = createInsertSchema(videos);
export const insertDistributionSchema = createInsertSchema(distributionSchedule);
export const insertApiUsageSchema = createInsertSchema(apiUsage);
export const insertCostBudgetSchema = createInsertSchema(costBudgets);

// Video platform types
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
export type DistributionSchedule = typeof distributionSchedule.$inferSelect;
export type InsertDistributionSchedule = typeof distributionSchedule.$inferInsert;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = typeof apiUsage.$inferInsert;
export type CostBudget = typeof costBudgets.$inferSelect;
export type InsertCostBudget = typeof costBudgets.$inferInsert;

// ========================================
// TRINITY SYMPHONY ROADMAP SYSTEM
// ========================================

// Trinity Tasks - Dynamic prioritized roadmap for AI Trinity Symphony
export const trinityTasks = pgTable('trinity_tasks', {
  id: serial('id').primaryKey(),
  taskNumber: integer('task_number').notNull().unique(), // 1-12 from priority list
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  rationale: text('rationale'), // Full description/reasoning
  priorityRank: integer('priority_rank').notNull().unique(), // 1 = highest (reorderable)
  status: text('status').notNull().default('not_started'), // 'not_started', 'in_progress', 'completed', 'blocked'
  assignedManager: text('assigned_manager').default('All'), // 'User', 'APM', 'HDM', 'Mel', 'All'
  dependencies: jsonb('dependencies').$type<number[]>().default([]), // Array of task_numbers
  estimatedEffort: text('estimated_effort'), // 'easy', 'moderate', 'hard'
  impact: text('impact'), // 'low', 'medium', 'high'
  saves: jsonb('saves').$type<string[]>().default([]), // ['time', 'money', 'both']
  improvesPerformance: boolean('improves_performance').default(false),
  getsOthersOnBoard: boolean('gets_others_on_board').default(false),
  isAutonomous: boolean('is_autonomous').default(true), // Can managers auto-update?
  verificationSteps: jsonb('verification_steps').$type<string[]>().default([]),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trinity Task Activity - Audit log for all task changes
export const trinityTaskActivity = pgTable('trinity_task_activity', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  action: text('action').notNull(), // 'created', 'status_changed', 'reordered', 'assigned', 'completed', 'notes_added'
  actor: text('actor').notNull(), // 'User', 'APM', 'HDM', 'Mel'
  oldValue: jsonb('old_value').$type<Record<string, any>>(),
  newValue: jsonb('new_value').$type<Record<string, any>>(),
  notes: text('notes'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Insert schemas
export const insertTrinityTaskSchema = createInsertSchema(trinityTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrinityTaskActivitySchema = createInsertSchema(trinityTaskActivity).omit({
  id: true,
  timestamp: true,
});

// Trinity Manager Config - Configuration for each Trinity Symphony manager
export const trinityManagerConfig = pgTable('trinity_manager_config', {
  id: serial('id').primaryKey(),
  managerId: text('manager_id').notNull().unique(), // 'User', 'APM', 'HDM', 'Mel'
  managerName: text('manager_name').notNull(), // Full name for display
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'maintenance'
  role: text('role').notNull().default('performer'), // 'conductor', 'performer', 'learner', 'observer'
  capabilities: jsonb('capabilities').$type<string[]>().default([]), // ['coding', 'debugging', 'routing', 'semantic-analysis']
  performanceMetrics: jsonb('performance_metrics').$type<{
    tasksCompleted?: number;
    tasksInProgress?: number;
    successRate?: number;
    averageCompletionTime?: number;
    tokensUsed?: number;
    costUsd?: number;
    errorRate?: number;
    p50Latency?: number;
    p95Latency?: number;
    throughput?: number;
    backlog?: number;
    confidenceAvg?: number;
    challengeRate?: number;
    escalationCount?: number;
    lastActivity?: Date;
  }>().default({}),
  rotationPolicy: jsonb('rotation_policy').$type<{
    strategy?: string;
    weights?: Record<string, number>;
    windowMs?: number;
    lastRoleChange?: Date;
    nextRoleAt?: Date;
    stickyConductor?: boolean;
  }>().default({}),
  thresholds: jsonb('thresholds').$type<{
    confidenceTarget?: number;
    minConfidence?: number;
    challengeThreshold?: number;
    autoAdjust?: boolean;
    backpressureFactor?: number;
  }>().default({}),
  budget: jsonb('budget').$type<{
    maxTokensPerHour?: number;
    maxCostPerDay?: number;
    rateLimitRps?: number;
    providerPrefs?: string[];
  }>().default({}),
  config: jsonb('config').$type<Record<string, any>>().default({}), // Manager-specific settings
  isAutonomous: boolean('is_autonomous').default(true), // Can auto-execute tasks?
  apiEndpoint: text('api_endpoint'), // Optional API endpoint for this manager
  lastSync: timestamp('last_sync'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Insert schema
export const insertTrinityManagerConfigSchema = createInsertSchema(trinityManagerConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Trinity Prompts - Central prompt distribution system
export const trinityPrompts = pgTable('trinity_prompts', {
  id: serial('id').primaryKey(),
  promptText: text('prompt_text').notNull(),
  userId: integer('user_id'), // Optional: which user submitted this
  priority: text('priority').notNull().default('normal'), // 'urgent', 'high', 'normal', 'low'
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  responseCount: integer('response_count').notNull().default(0), // How many managers have responded
  expectedManagers: jsonb('expected_managers').$type<string[]>().default(['APM', 'HDM', 'Mel']),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Trinity Prompt Responses - Track each manager's response to a prompt
export const trinityPromptResponses = pgTable('trinity_prompt_responses', {
  id: serial('id').primaryKey(),
  promptId: integer('prompt_id').notNull(),
  managerId: text('manager_id').notNull(), // 'APM', 'HDM', 'Mel'
  status: text('status').notNull().default('pending'), // 'pending', 'acknowledged', 'processing', 'completed', 'failed'
  response: text('response'), // Manager's response/acknowledgment
  tasksCreated: jsonb('tasks_created').$type<number[]>().default([]), // Task IDs created by this manager
  executionTimeMs: integer('execution_time_ms'),
  aiProvider: text('ai_provider'), // Which AI provider was used (Groq, Gemini, etc.)
  cost: decimal('cost', { precision: 10, scale: 6 }).default('0'), // Cost of processing
  error: text('error'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Insert schemas
export const insertTrinityPromptSchema = createInsertSchema(trinityPrompts).omit({
  id: true,
  createdAt: true,
});

export const insertTrinityPromptResponseSchema = createInsertSchema(trinityPromptResponses).omit({
  id: true,
  createdAt: true,
});

// Autonomous Logs - Track autonomous operation heartbeats and activities
export const autonomousLogs = pgTable('autonomous_logs', {
  id: serial('id').primaryKey(),
  agent: text('agent').notNull(), // 'APM', 'HDM', 'MEL', 'GCM'
  event: text('event').notNull(), // 'heartbeat', 'task_start', 'task_complete', 'status_update', 'rotation', 'error'
  details: jsonb('details').$type<{
    timestamp?: string;
    uptime_hours?: number;
    tasks_completed?: number;
    tasks_in_progress?: number;
    total_cost?: string;
    repid_score?: number;
    challenges_issued?: number;
    challenges_received?: number;
    next_priority?: string;
    blockers?: string[];
    rotation_cycles?: number;
    free_tier_success?: string;
    error_message?: string;
    task_id?: number;
    request_ids?: string[];
    [key: string]: any;
  }>().default({}),
  repid_tag: text('repid_tag'), // 'VERIFIED:...', 'REPORTED:...', 'INFERENCE:...', 'CHALLENGED:...'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const insertAutonomousLogSchema = createInsertSchema(autonomousLogs).omit({
  id: true,
  timestamp: true,
});

// ========================================
// HYPERDAG v0.2 - Real-time Graph Nodes
// ========================================

export const hyperdagNodes = pgTable('hyperdag_nodes', {
  id: serial('id').primaryKey(),
  nodeId: text('node_id').notNull().unique(), // Unique node identifier (e.g., 'APM-1', 'HDM-2')
  nodeType: text('node_type').notNull(), // 'manager', 'task', 'prompt', 'resource', 'chaos'
  label: text('label').notNull(), // Display name
  description: text('description'),
  
  // Graph positioning (auto-computed or user-defined)
  x: decimal('x', { precision: 10, scale: 2 }),
  y: decimal('y', { precision: 10, scale: 2 }),
  
  // Node state
  status: text('status').notNull().default('active'), // 'active', 'processing', 'idle', 'error'
  health: decimal('health', { precision: 5, scale: 2 }).default('100'), // 0-100 health score
  
  // Connections to other nodes
  connectedTo: jsonb('connected_to').$type<string[]>().default([]), // Array of node IDs
  
  // Metrics
  metrics: jsonb('metrics').$type<{
    tasksCompleted?: number;
    avgResponseTime?: number;
    cost?: string;
    errorRate?: number;
    lastActive?: string;
    cpuUsage?: number;
    memoryUsage?: number;
    requestCount?: number;
  }>().default({}),
  
  // ANFIS routing boost keywords
  keywords: jsonb('keywords').$type<string[]>().default([]), // ['chaos', 'graph', 'optimization']
  boostFactor: decimal('boost_factor', { precision: 5, scale: 2 }).default('1.0'), // ANFIS multiplier
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nodeIdIdx: index('hyperdag_nodes_node_id_idx').on(table.nodeId),
  nodeTypeIdx: index('hyperdag_nodes_node_type_idx').on(table.nodeType),
  statusIdx: index('hyperdag_nodes_status_idx').on(table.status),
}));

export const insertHyperdagNodeSchema = createInsertSchema(hyperdagNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type HyperdagNode = typeof hyperdagNodes.$inferSelect;
export type InsertHyperdagNode = z.infer<typeof insertHyperdagNodeSchema>;

// ========================================
// INFRASTRUCTURE DISCOVERY & AUDIT
// ========================================

export const infrastructureAudit = pgTable('infrastructure_audit', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(), // HDM, APM, ATS, MEL
  component: text('component').notNull(), // Replit, Supabase, GitHub, Flutter, BYOK, etc.
  status: text('status').notNull(), // active, missing, degraded, error
  url: text('url'), // Deployment URL or API endpoint
  details: text('details'), // Additional information (row counts, file counts, etc.)
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  agentIdIdx: index('infrastructure_audit_agent_id_idx').on(table.agentId),
  componentIdx: index('infrastructure_audit_component_idx').on(table.component),
  statusIdx: index('infrastructure_audit_status_idx').on(table.status),
}));

export const insertInfrastructureAuditSchema = createInsertSchema(infrastructureAudit).omit({
  id: true,
  discoveredAt: true,
});

export type InfrastructureAudit = typeof infrastructureAudit.$inferSelect;
export type InsertInfrastructureAudit = z.infer<typeof insertInfrastructureAuditSchema>;

// TypeScript types
export type TrinityTask = typeof trinityTasks.$inferSelect;
export type InsertTrinityTask = z.infer<typeof insertTrinityTaskSchema>;
export type TrinityTaskActivity = typeof trinityTaskActivity.$inferSelect;
export type InsertTrinityTaskActivity = z.infer<typeof insertTrinityTaskActivitySchema>;
export type TrinityManagerConfig = typeof trinityManagerConfig.$inferSelect;
export type InsertTrinityManagerConfig = z.infer<typeof insertTrinityManagerConfigSchema>;
export type TrinityPrompt = typeof trinityPrompts.$inferSelect;
export type InsertTrinityPrompt = z.infer<typeof insertTrinityPromptSchema>;
export type TrinityPromptResponse = typeof trinityPromptResponses.$inferSelect;
export type InsertTrinityPromptResponse = z.infer<typeof insertTrinityPromptResponseSchema>;
export type AutonomousLog = typeof autonomousLogs.$inferSelect;
export type InsertAutonomousLog = z.infer<typeof insertAutonomousLogSchema>;