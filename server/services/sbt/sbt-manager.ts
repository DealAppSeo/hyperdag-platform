import { db } from '../../db.js';
import { soulBoundTokens, sbtContributions, zkpProofs, zkpCircuits } from '../../../shared/schema.js';
import { eq, desc, sum, avg, and } from 'drizzle-orm';
import type { 
  SoulBoundToken, 
  InsertSoulBoundToken, 
  SbtContribution,
  InsertSbtContribution,
  ZkpProof
} from '../../../shared/schema.js';

/**
 * HyperDAG Soul Bound Token Manager
 * 
 * Manages three types of tokens:
 * - SBT: Soul Bound Tokens for humans with 4FA verification
 * - DBT: Digital Bound Tokens for AI agents  
 * - CBT: Charitable Bound Tokens for verified non-profits
 */
export class SBTManager {
  
  /**
   * Create a Soul Bound Token (SBT) for human users
   */
  async createSBT(userData: {
    walletAddress: string;
    authLevel: number;
    email?: string;
    username?: string;
    initialSkills?: {
      technical: number;
      social: number;
      creative: number;
      impact: number;
    };
  }): Promise<SoulBoundToken> {
    
    const baseReputation = this.calculateInitialReputation(userData);
    const skills = userData.initialSkills || { technical: 0, social: 0, creative: 0, impact: 0 };
    
    const sbtData: InsertSoulBoundToken = {
      owner: userData.walletAddress,
      tokenType: 'SBT',
      reputationScore: baseReputation.toString(),
      technicalSkill: skills.technical.toString(),
      socialEngagement: skills.social.toString(),
      creativeContribution: skills.creative.toString(),
      impactScore: skills.impact.toString(),
      authenticationLevel: userData.authLevel,
      votingWeight: this.calculateVotingWeight(baseReputation, userData.authLevel).toString(),
      governanceParticipation: '0',
      transferable: false,
      soulBound: true,
      privacySettings: {
        hideReputation: false,
        hideContributions: false,
        allowAnalytics: true,
        anonymousVoting: false
      },
      metadata: {
        email: userData.email,
        username: userData.username,
        createdBy: 'hyperdag-system',
        initialAuthLevel: userData.authLevel
      }
    };

    const [newSBT] = await db.insert(soulBoundTokens).values(sbtData).returning();
    
    console.log(`[SBT Manager] Created SBT for ${userData.walletAddress} with ${baseReputation} reputation`);
    return newSBT;
  }

  /**
   * Create a Digital Bound Token (DBT) for AI agents
   */
  async createDBT(agentData: {
    agentAddress: string;
    capabilities: string[];
    autonomyLevel: number;
    modelType?: string;
    provider?: string;
  }): Promise<SoulBoundToken> {
    
    const capabilities = this.parseAgentCapabilities(agentData.capabilities);
    
    const dbtData: InsertSoulBoundToken = {
      owner: agentData.agentAddress,
      tokenType: 'DBT',
      reputationScore: '100', // Base score for AI agents
      technicalSkill: capabilities.technical.toString(),
      socialEngagement: capabilities.social.toString(),
      creativeContribution: capabilities.creative.toString(),
      impactScore: capabilities.impact.toString(),
      authenticationLevel: 4, // AI agents have highest technical auth
      votingWeight: this.calculateAIVotingWeight(capabilities).toString(),
      governanceParticipation: '0',
      transferable: false,
      soulBound: true,
      privacySettings: {
        hideReputation: false,
        hideContributions: false,
        allowAnalytics: true,
        anonymousVoting: false
      },
      metadata: {
        agentType: 'ai_agent',
        capabilities: agentData.capabilities,
        autonomyLevel: agentData.autonomyLevel,
        modelType: agentData.modelType,
        provider: agentData.provider,
        governanceScope: ['technical', 'optimization', 'routing']
      }
    };

    const [newDBT] = await db.insert(soulBoundTokens).values(dbtData).returning();
    
    console.log(`[SBT Manager] Created DBT for AI agent ${agentData.agentAddress}`);
    return newDBT;
  }

  /**
   * Create a Charitable Bound Token (CBT) for verified non-profits
   */
  async createCBT(nonprofitData: {
    walletAddress: string;
    organizationName: string;
    focusAreas: string[];
    verificationData: {
      ein?: string;
      charityNavigatorRating?: number;
      guidestarSeal?: boolean;
      transparencyScore: number;
    };
  }): Promise<SoulBoundToken> {
    
    const impactCategories = this.parseNonprofitFocusAreas(nonprofitData.focusAreas);
    const transparencyScore = nonprofitData.verificationData.transparencyScore;
    
    const cbtData: InsertSoulBoundToken = {
      owner: nonprofitData.walletAddress,
      tokenType: 'CBT',
      reputationScore: transparencyScore.toString(),
      technicalSkill: '20', // Basic technical score for non-profits
      socialEngagement: impactCategories.social.toString(),
      creativeContribution: impactCategories.creative.toString(),
      impactScore: impactCategories.impact.toString(),
      authenticationLevel: 3, // High verification for non-profits
      votingWeight: this.calculateNonprofitVotingWeight(transparencyScore, impactCategories).toString(),
      governanceParticipation: '0',
      transferable: false,
      soulBound: true,
      privacySettings: {
        hideReputation: false,
        hideContributions: false,
        allowAnalytics: true,
        anonymousVoting: false
      },
      metadata: {
        organizationType: 'nonprofit',
        organizationName: nonprofitData.organizationName,
        focusAreas: nonprofitData.focusAreas,
        verification: nonprofitData.verificationData,
        transparencyScore,
        fundingEligibility: true,
        governanceScope: ['funding', 'social_impact', 'community']
      }
    };

    const [newCBT] = await db.insert(soulBoundTokens).values(cbtData).returning();
    
    console.log(`[SBT Manager] Created CBT for ${nonprofitData.organizationName}`);
    return newCBT;
  }

  /**
   * Get SBT by owner address
   */
  async getSBT(ownerAddress: string): Promise<SoulBoundToken | null> {
    const [sbt] = await db
      .select()
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.owner, ownerAddress))
      .limit(1);
    
    return sbt || null;
  }

  /**
   * Get SBT by token ID
   */
  async getSBTById(tokenId: string): Promise<SoulBoundToken | null> {
    const [sbt] = await db
      .select()
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.tokenId, tokenId))
      .limit(1);
    
    return sbt || null;
  }

  /**
   * Add a contribution to an SBT
   */
  async addContribution(contribution: {
    sbtId: number;
    contributionType: 'code' | 'governance' | 'mentorship' | 'content' | 'nonprofit';
    value: number;
    description: string;
    externalReference?: string;
    impactMultiplier?: number;
  }): Promise<SbtContribution> {
    
    const contributionData: InsertSbtContribution = {
      sbtId: contribution.sbtId,
      contributionType: contribution.contributionType,
      value: contribution.value.toString(),
      impactMultiplier: (contribution.impactMultiplier || 1).toString(),
      description: contribution.description,
      externalReference: contribution.externalReference,
      category: this.categorizeContribution(contribution.contributionType),
      verificationStatus: 'pending',
      metadata: {
        submittedAt: new Date().toISOString(),
        autoVerified: contribution.value < 10 // Auto-verify small contributions
      }
    };

    const [newContribution] = await db.insert(sbtContributions).values(contributionData).returning();
    
    // Trigger reputation recalculation
    await this.recalculateReputation(contribution.sbtId);
    
    console.log(`[SBT Manager] Added ${contribution.contributionType} contribution worth ${contribution.value} to SBT ${contribution.sbtId}`);
    return newContribution;
  }

  /**
   * Get all contributions for an SBT
   */
  async getContributions(sbtId: number): Promise<SbtContribution[]> {
    return await db
      .select()
      .from(sbtContributions)
      .where(eq(sbtContributions.sbtId, sbtId))
      .orderBy(desc(sbtContributions.timestamp));
  }

  /**
   * Get all SBTs (with pagination)
   */
  async getAllSBTs(limit: number = 100, offset: number = 0): Promise<SoulBoundToken[]> {
    return await db
      .select()
      .from(soulBoundTokens)
      .orderBy(desc(soulBoundTokens.reputationScore))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Update SBT reputation score based on contributions
   */
  async recalculateReputation(sbtId: number): Promise<void> {
    const contributions = await this.getContributions(sbtId);
    const [sbt] = await db.select().from(soulBoundTokens).where(eq(soulBoundTokens.id, sbtId));
    
    if (!sbt) return;

    // Calculate new reputation using ANFIS-style scoring
    const newReputation = this.calculateReputationFromContributions(contributions, sbt);
    
    await db
      .update(soulBoundTokens)
      .set({
        reputationScore: newReputation.total.toString(),
        technicalSkill: newReputation.technical.toString(),
        socialEngagement: newReputation.social.toString(),
        creativeContribution: newReputation.creative.toString(),
        impactScore: newReputation.impact.toString(),
        votingWeight: this.calculateVotingWeight(newReputation.total, sbt.authenticationLevel).toString(),
        lastReputationUpdate: new Date()
      })
      .where(eq(soulBoundTokens.id, sbtId));

    console.log(`[SBT Manager] Updated reputation for SBT ${sbtId}: ${newReputation.total}`);
  }

  /**
   * Calculate initial reputation for new users
   */
  private calculateInitialReputation(userData: { authLevel: number; email?: string; username?: string }): number {
    let baseScore = 10; // Everyone starts with 10 points
    
    // Authentication level bonus
    baseScore += userData.authLevel * 5; // 5 points per auth level
    
    // Basic profile completeness
    if (userData.email) baseScore += 5;
    if (userData.username) baseScore += 5;
    
    return Math.min(baseScore, 50); // Cap initial reputation at 50
  }

  /**
   * Calculate voting weight based on reputation and auth level
   */
  private calculateVotingWeight(reputation: number, authLevel: number): number {
    const baseWeight = Math.sqrt(reputation); // Square root to prevent excessive concentration
    const authMultiplier = 1 + (authLevel - 1) * 0.1; // 10% bonus per auth level above 1
    
    return baseWeight * authMultiplier;
  }

  /**
   * Parse AI agent capabilities into numerical scores
   */
  private parseAgentCapabilities(capabilities: string[]): {
    technical: number;
    social: number;
    creative: number;
    impact: number;
  } {
    const scores = { technical: 0, social: 0, creative: 0, impact: 0 };
    
    capabilities.forEach(capability => {
      switch (capability.toLowerCase()) {
        case 'coding':
        case 'development':
        case 'smart-contracts':
          scores.technical += 25;
          break;
        case 'nlp':
        case 'conversation':
        case 'communication':
          scores.social += 25;
          break;
        case 'art':
        case 'content-generation':
        case 'creativity':
          scores.creative += 25;
          break;
        case 'optimization':
        case 'analysis':
        case 'research':
          scores.impact += 25;
          break;
      }
    });
    
    return scores;
  }

  /**
   * Calculate voting weight for AI agents
   */
  private calculateAIVotingWeight(capabilities: { technical: number; social: number; creative: number; impact: number }): number {
    const totalCapability = capabilities.technical + capabilities.social + capabilities.creative + capabilities.impact;
    return totalCapability / 4; // Average capability score
  }

  /**
   * Parse nonprofit focus areas into impact scores
   */
  private parseNonprofitFocusAreas(focusAreas: string[]): {
    social: number;
    creative: number;
    impact: number;
  } {
    const scores = { social: 0, creative: 0, impact: 0 };
    
    focusAreas.forEach(area => {
      switch (area.toLowerCase()) {
        case 'education':
        case 'community':
        case 'advocacy':
          scores.social += 30;
          break;
        case 'arts':
        case 'culture':
        case 'media':
          scores.creative += 30;
          break;
        case 'healthcare':
        case 'environment':
        case 'poverty':
        case 'research':
          scores.impact += 30;
          break;
      }
    });
    
    return scores;
  }

  /**
   * Calculate voting weight for nonprofits
   */
  private calculateNonprofitVotingWeight(transparencyScore: number, impactCategories: { social: number; creative: number; impact: number }): number {
    const baseWeight = transparencyScore / 10; // 0-10 scale
    const impactBonus = (impactCategories.social + impactCategories.creative + impactCategories.impact) / 30;
    
    return baseWeight + impactBonus;
  }

  /**
   * Categorize contribution type
   */
  private categorizeContribution(contributionType: string): string {
    switch (contributionType) {
      case 'code':
        return 'technical';
      case 'governance':
      case 'mentorship':
        return 'social';
      case 'content':
        return 'creative';
      case 'nonprofit':
        return 'impact';
      default:
        return 'general';
    }
  }

  /**
   * Calculate reputation from contributions using ANFIS-style logic
   */
  private calculateReputationFromContributions(contributions: SbtContribution[], sbt: SoulBoundToken): {
    total: number;
    technical: number;
    social: number;
    creative: number;
    impact: number;
  } {
    const categoryTotals = { technical: 0, social: 0, creative: 0, impact: 0 };
    
    contributions.forEach(contrib => {
      if (contrib.verificationStatus === 'verified') {
        const value = parseFloat(contrib.value) * parseFloat(contrib.impactMultiplier);
        const category = contrib.category as keyof typeof categoryTotals;
        
        if (categoryTotals[category] !== undefined) {
          categoryTotals[category] += value;
        }
      }
    });

    // Apply diminishing returns to prevent gaming
    const technical = Math.min(categoryTotals.technical, 100);
    const social = Math.min(categoryTotals.social, 100);
    const creative = Math.min(categoryTotals.creative, 100);
    const impact = Math.min(categoryTotals.impact, 100);
    
    // Total reputation with auth level bonus
    const baseTotal = technical + social + creative + impact;
    const authBonus = sbt.authenticationLevel * 10;
    const total = baseTotal + authBonus;

    return { total, technical, social, creative, impact };
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<{
    totalSBTs: number;
    totalDBTs: number;
    totalCBTs: number;
    averageReputation: number;
    totalContributions: number;
  }> {
    const [sbtCount] = await db
      .select({ count: sum(soulBoundTokens.id) })
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.tokenType, 'SBT'));

    const [dbtCount] = await db
      .select({ count: sum(soulBoundTokens.id) })
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.tokenType, 'DBT'));

    const [cbtCount] = await db
      .select({ count: sum(soulBoundTokens.id) })
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.tokenType, 'CBT'));

    const [avgRep] = await db
      .select({ avg: avg(soulBoundTokens.reputationScore) })
      .from(soulBoundTokens);

    const [contribCount] = await db
      .select({ count: sum(sbtContributions.id) })
      .from(sbtContributions);

    return {
      totalSBTs: parseInt(sbtCount?.count?.toString() || '0'),
      totalDBTs: parseInt(dbtCount?.count?.toString() || '0'),
      totalCBTs: parseInt(cbtCount?.count?.toString() || '0'),
      averageReputation: parseFloat(avgRep?.avg?.toString() || '0'),
      totalContributions: parseInt(contribCount?.count?.toString() || '0')
    };
  }
}

// Export singleton instance
export const sbtManager = new SBTManager();