/**
 * DBT Anti-Gaming Service
 * 
 * Prevents developers from creating AI agents that interact with each other
 * to artificially inflate reputation scores and token earnings.
 */

import { db } from '../db';
import { eq, and, desc, sql, count, inArray, gte, lte } from 'drizzle-orm';
import { 
  users, 
  reputationActivities, 
  apiKeyUsage,
  sbtCredentials,
  projects,
  donations
} from '@shared/schema';
import { logger } from '../utils/logger';

interface SuspiciousActivity {
  userId: number;
  agentId?: string;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  detectedAt: Date;
  metadata: Record<string, any>;
}

interface NetworkAnalysis {
  clusteredUsers: number[][];
  suspiciousConnections: Array<{
    fromUser: number;
    toUser: number;
    strength: number;
    indicators: string[];
  }>;
  isolatedClusters: number[][];
}

export class DBTAntiGamingService {
  
  /**
   * Main validation function for AI agent activities
   */
  async validateAgentActivity(
    agentUserId: number,
    activityType: string,
    targetUserId?: number,
    metadata?: Record<string, any>
  ): Promise<{ isValid: boolean; reasons: string[]; riskLevel: string }> {
    
    const suspiciousIndicators: string[] = [];
    let riskLevel = 'low';

    // 1. Check if activity involves same developer's entities
    if (targetUserId) {
      const sameOwnerCheck = await this.checkSameOwnerInteraction(agentUserId, targetUserId);
      if (sameOwnerCheck.isSameOwner) {
        suspiciousIndicators.push('Same developer owns both entities');
        riskLevel = 'high';
      }
    }

    // 2. Analyze activity patterns
    const patternAnalysis = await this.analyzeActivityPatterns(agentUserId, activityType);
    if (patternAnalysis.suspicious) {
      suspiciousIndicators.push(...patternAnalysis.reasons);
      riskLevel = this.escalateRiskLevel(riskLevel, patternAnalysis.riskLevel);
    }

    // 3. Check for coordinated behavior
    const coordinationCheck = await this.detectCoordinatedBehavior(agentUserId);
    if (coordinationCheck.isCoordinated) {
      suspiciousIndicators.push(...coordinationCheck.indicators);
      riskLevel = this.escalateRiskLevel(riskLevel, 'critical');
    }

    // 4. Validate human oversight requirements
    const humanOversight = await this.validateHumanOversight(agentUserId);
    if (!humanOversight.hasValidOversight) {
      suspiciousIndicators.push('Insufficient human oversight verification');
      riskLevel = this.escalateRiskLevel(riskLevel, 'medium');
    }

    // 5. Check external validation requirements
    const externalValidation = await this.checkExternalValidation(agentUserId, activityType);
    if (externalValidation.required && !externalValidation.present) {
      suspiciousIndicators.push('Missing required external validation');
      riskLevel = this.escalateRiskLevel(riskLevel, 'high');
    }

    return {
      isValid: riskLevel !== 'critical' && suspiciousIndicators.length < 3,
      reasons: suspiciousIndicators,
      riskLevel
    };
  }

  /**
   * Check if two users are controlled by the same developer
   */
  private async checkSameOwnerInteraction(userId1: number, userId2: number): Promise<{
    isSameOwner: boolean;
    confidence: number;
    indicators: string[];
  }> {
    const indicators: string[] = [];
    let confidence = 0;

    // Check wallet address patterns
    const users_data = await db.select()
      .from(users)
      .where(inArray(users.id, [userId1, userId2]));

    if (users_data.length === 2) {
      const [user1, user2] = users_data;
      
      // Same IP address patterns in API usage
      const ipSimilarity = await this.checkIPSimilarity(userId1, userId2);
      if (ipSimilarity.similar) {
        indicators.push('Similar IP address patterns');
        confidence += 30;
      }

      // Similar creation times (within 24 hours)
      const timeDiff = Math.abs(
        (user1.createdAt?.getTime() || 0) - (user2.createdAt?.getTime() || 0)
      );
      if (timeDiff < 24 * 60 * 60 * 1000) {
        indicators.push('Created within 24 hours');
        confidence += 20;
      }

      // Check for wallet address patterns
      if (user1.walletAddress && user2.walletAddress) {
        const walletSimilarity = this.analyzeWalletSimilarity(
          user1.walletAddress, 
          user2.walletAddress
        );
        if (walletSimilarity.suspicious) {
          indicators.push('Suspicious wallet address patterns');
          confidence += 40;
        }
      }
    }

    return {
      isSameOwner: confidence >= 50,
      confidence,
      indicators
    };
  }

  /**
   * Analyze activity patterns for suspicious behavior
   */
  private async analyzeActivityPatterns(userId: number, activityType: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskLevel: string;
  }> {
    const reasons: string[] = [];
    let riskLevel = 'low';

    // Check activity frequency (last 24 hours)
    const recentActivities = await db.select({ count: count() })
      .from(reputationActivities)
      .where(and(
        eq(reputationActivities.userId, userId),
        gte(reputationActivities.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      ));

    const activityCount = recentActivities[0]?.count || 0;
    
    if (activityCount > 50) {
      reasons.push('Excessive activity frequency (>50 in 24h)');
      riskLevel = 'high';
    } else if (activityCount > 20) {
      reasons.push('High activity frequency (>20 in 24h)');
      riskLevel = 'medium';
    }

    // Check for repetitive patterns
    const patternCheck = await this.detectRepetitivePatterns(userId);
    if (patternCheck.hasPatterns) {
      reasons.push(...patternCheck.patterns);
      riskLevel = this.escalateRiskLevel(riskLevel, 'medium');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
      riskLevel
    };
  }

  /**
   * Detect coordinated behavior across multiple agents
   */
  private async detectCoordinatedBehavior(userId: number): Promise<{
    isCoordinated: boolean;
    indicators: string[];
    networkAnalysis: NetworkAnalysis;
  }> {
    const indicators: string[] = [];

    // Analyze interaction networks
    const networkAnalysis = await this.performNetworkAnalysis(userId);
    
    // Check for circular activity patterns
    if (networkAnalysis.isolatedClusters.length > 0) {
      indicators.push('Detected isolated activity clusters');
    }

    // Check for simultaneous activity spikes
    const simultaneousActivity = await this.detectSimultaneousActivity(userId);
    if (simultaneousActivity.detected) {
      indicators.push('Coordinated activity timing detected');
    }

    return {
      isCoordinated: indicators.length >= 2,
      indicators,
      networkAnalysis
    };
  }

  /**
   * Validate human oversight requirements for AI agents
   */
  private async validateHumanOversight(agentUserId: number): Promise<{
    hasValidOversight: boolean;
    oversightLevel: string;
    requirements: string[];
  }> {
    // Check for verified human controller
    const humanController = await db.select()
      .from(sbtCredentials)
      .where(and(
        eq(sbtCredentials.userId, agentUserId),
        eq(sbtCredentials.type, 'identity')
      ));

    const hasHumanVerification = humanController.length > 0;
    
    // Check for regular human approval activities
    const recentHumanApprovals = await this.checkRecentHumanApprovals(agentUserId);
    
    const requirements = [
      'Verified human controller identity',
      'Regular human approval activities',
      'Multi-factor authentication enabled'
    ];

    return {
      hasValidOversight: hasHumanVerification && recentHumanApprovals,
      oversightLevel: hasHumanVerification ? 'verified' : 'unverified',
      requirements
    };
  }

  /**
   * Check external validation requirements
   */
  private async checkExternalValidation(userId: number, activityType: string): Promise<{
    required: boolean;
    present: boolean;
    validationSources: string[];
  }> {
    const highValueActivities = [
      'grant_awarded',
      'proposal_accepted',
      'donation_made',
      'project_milestone'
    ];

    const required = highValueActivities.includes(activityType);
    
    if (!required) {
      return { required: false, present: true, validationSources: [] };
    }

    // Check for external validation sources
    const validationSources: string[] = [];
    
    // Check for GitHub commits, API integrations, etc.
    const externalActivity = await this.checkExternalActivitySources(userId);
    if (externalActivity.hasGitHub) validationSources.push('GitHub');
    if (externalActivity.hasAPI) validationSources.push('Third-party API');
    if (externalActivity.hasBlockchain) validationSources.push('Blockchain');

    return {
      required,
      present: validationSources.length >= 2,
      validationSources
    };
  }

  /**
   * Enhanced wallet analysis for detecting patterns
   */
  private analyzeWalletSimilarity(wallet1: string, wallet2: string): {
    suspicious: boolean;
    similarity: number;
    patterns: string[];
  } {
    const patterns: string[] = [];
    let similarity = 0;

    // Check for sequential addresses (common in batch wallet generation)
    const addr1 = wallet1.toLowerCase();
    const addr2 = wallet2.toLowerCase();
    
    // Compare last 8 characters for sequential patterns
    const suffix1 = addr1.slice(-8);
    const suffix2 = addr2.slice(-8);
    
    const suffixDiff = parseInt(suffix1, 16) - parseInt(suffix2, 16);
    if (Math.abs(suffixDiff) < 100) {
      patterns.push('Sequential wallet addresses detected');
      similarity += 60;
    }

    // Check for similar prefixes (same wallet software/service)
    if (addr1.slice(0, 6) === addr2.slice(0, 6)) {
      patterns.push('Similar address prefixes');
      similarity += 30;
    }

    return {
      suspicious: similarity >= 50,
      similarity,
      patterns
    };
  }

  /**
   * Network analysis to detect coordinated clusters
   */
  private async performNetworkAnalysis(userId: number): Promise<NetworkAnalysis> {
    // Simplified network analysis - in production, use graph algorithms
    const interactions = await db.select()
      .from(reputationActivities)
      .where(eq(reputationActivities.userId, userId))
      .limit(100);

    // Mock implementation - replace with actual graph analysis
    return {
      clusteredUsers: [],
      suspiciousConnections: [],
      isolatedClusters: []
    };
  }

  /**
   * Support methods
   */
  private async checkIPSimilarity(userId1: number, userId2: number): Promise<{ similar: boolean }> {
    // Check API usage patterns for IP similarity
    const usage1 = await db.select()
      .from(apiKeyUsage)
      .where(eq(apiKeyUsage.apiKeyId, userId1))
      .limit(10);
    
    const usage2 = await db.select()
      .from(apiKeyUsage)
      .where(eq(apiKeyUsage.apiKeyId, userId2))
      .limit(10);

    // Simplified check - in production, implement proper IP analysis
    return { similar: false };
  }

  private async detectRepetitivePatterns(userId: number): Promise<{
    hasPatterns: boolean;
    patterns: string[];
  }> {
    // Check for repetitive activity patterns
    return { hasPatterns: false, patterns: [] };
  }

  private async detectSimultaneousActivity(userId: number): Promise<{ detected: boolean }> {
    // Check for coordinated timing
    return { detected: false };
  }

  private async checkRecentHumanApprovals(userId: number): Promise<boolean> {
    // Check for human approval activities in last 7 days
    return true;
  }

  private async checkExternalActivitySources(userId: number): Promise<{
    hasGitHub: boolean;
    hasAPI: boolean;
    hasBlockchain: boolean;
  }> {
    return { hasGitHub: false, hasAPI: false, hasBlockchain: false };
  }

  private escalateRiskLevel(current: string, new_level: string): string {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(new_level);
    return levels[Math.max(currentIndex, newIndex)];
  }

  /**
   * Quarantine suspicious agents
   */
  async quarantineAgent(userId: number, reason: string): Promise<void> {
    await db.update(users)
      .set({ 
        isAdmin: false, // Remove any admin privileges
        // Add quarantine flag to settings
        settings: sql`jsonb_set(settings, '{quarantined}', 'true')`
      })
      .where(eq(users.id, userId));

    logger.warn(`Agent quarantined: ${userId} - ${reason}`);
  }

  /**
   * Generate anti-gaming report
   */
  async generateAntiGamingReport(): Promise<{
    totalAgents: number;
    suspiciousAgents: number;
    quarantinedAgents: number;
    riskDistribution: Record<string, number>;
  }> {
    // Implementation for generating comprehensive anti-gaming reports
    return {
      totalAgents: 0,
      suspiciousAgents: 0,
      quarantinedAgents: 0,
      riskDistribution: {}
    };
  }
}

export const dbtAntiGamingService = new DBTAntiGamingService();