import { db } from '../../db.js';
import { daoProposals, daoVotes, soulBoundTokens, zkpProofs } from '../../../shared/schema.js';
import { eq, and, desc, gte, lte, sum, count } from 'drizzle-orm';
import type { 
  DaoProposal, 
  InsertDaoProposal, 
  DaoVote, 
  InsertDaoVote,
  SoulBoundToken 
} from '../../../shared/schema.js';
import { reputationANFIS } from '../anfis/reputation-anfis.js';
import { zkpSystem } from '../zkp/zkp-system.js';

/**
 * Purpose-Weighted DAO Governance System
 * 
 * Features:
 * - Purpose-weighted voting based on SBT reputation dimensions
 * - Quadratic voting to prevent vote buying
 * - ZKP-enabled anonymous voting
 * - Multi-stakeholder governance (humans, AI agents, non-profits)
 * - ANFIS-optimized decision processing
 */
export class PurposeWeightedDAO {
  
  /**
   * Create a new DAO proposal
   */
  async createProposal(proposal: {
    title: string;
    description: string;
    category: 'technical' | 'funding' | 'governance' | 'social_impact';
    proposalType: 'funding' | 'parameter_change' | 'feature_request' | 'partnership';
    submittedBy: string; // SBT owner address
    votingDuration?: number; // hours, default 168 (1 week)
    requiredParticipation?: number; // percentage, default 25%
    consensusThreshold?: number; // percentage, default 66.7%
    purposeWeights?: {
      technical?: number;
      social?: number;
      creative?: number;
      impact?: number;
    };
  }): Promise<DaoProposal> {
    
    // Validate submitter has SBT
    const submitterSBT = await db
      .select()
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.owner, proposal.submittedBy))
      .limit(1);

    if (submitterSBT.length === 0) {
      throw new Error('Proposal submitter must have a valid SBT');
    }

    // Check submitter eligibility
    const isEligible = await this.checkProposalEligibility(submitterSBT[0], proposal.category);
    if (!isEligible) {
      throw new Error('Submitter does not meet eligibility requirements for this proposal category');
    }

    const votingDuration = proposal.votingDuration || 168; // 1 week default
    const votingStartsAt = new Date();
    const votingEndsAt = new Date(Date.now() + votingDuration * 60 * 60 * 1000);

    // Set purpose weights based on category
    const purposeWeights = proposal.purposeWeights || this.getDefaultPurposeWeights(proposal.category);

    const proposalData: InsertDaoProposal = {
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      proposalType: proposal.proposalType,
      submittedBy: proposal.submittedBy,
      votingType: 'quadratic',
      requiredParticipation: (proposal.requiredParticipation || 25).toString(),
      consensusThreshold: (proposal.consensusThreshold || 66.7).toString(),
      technicalWeight: purposeWeights.technical.toString(),
      socialWeight: purposeWeights.social.toString(),
      creativeWeight: purposeWeights.creative.toString(),
      impactWeight: purposeWeights.impact.toString(),
      status: 'active',
      votingStartsAt,
      votingEndsAt,
      executionDeadline: new Date(votingEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week after voting
      metadata: {
        submitterReputation: parseFloat(submitterSBT[0].reputationScore),
        votingDurationHours: votingDuration,
        autoCreated: false
      }
    };

    const [newProposal] = await db.insert(daoProposals).values(proposalData).returning();
    
    console.log(`[DAO Governance] Created proposal "${proposal.title}" by ${proposal.submittedBy} in ${proposal.category} category`);
    return newProposal;
  }

  /**
   * Cast a vote with quadratic cost and purpose weighting
   */
  async castVote(vote: {
    proposalId: number;
    voterAddress: string;
    position: 'for' | 'against' | 'abstain';
    voteStrength: number; // 1-100, quadratic cost applied
    reasoning?: string;
    anonymous?: boolean;
  }): Promise<DaoVote> {
    
    // Get voter SBT
    const voterSBT = await db
      .select()
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.owner, vote.voterAddress))
      .limit(1);

    if (voterSBT.length === 0) {
      throw new Error('Voter must have a valid SBT');
    }

    // Get proposal
    const [proposal] = await db
      .select()
      .from(daoProposals)
      .where(eq(daoProposals.id, vote.proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check voting period
    const now = new Date();
    if (now < proposal.votingStartsAt || now > proposal.votingEndsAt) {
      throw new Error('Voting period is not active');
    }

    // Check if already voted
    const existingVote = await db
      .select()
      .from(daoVotes)
      .where(and(
        eq(daoVotes.proposalId, vote.proposalId),
        eq(daoVotes.voterSbtId, voterSBT[0].id)
      ))
      .limit(1);

    if (existingVote.length > 0) {
      throw new Error('Already voted on this proposal');
    }

    // Calculate quadratic cost
    const quadraticCost = vote.voteStrength * vote.voteStrength;
    const maxVotes = Math.sqrt(parseFloat(voterSBT[0].votingWeight));
    
    if (vote.voteStrength > maxVotes) {
      throw new Error(`Vote strength ${vote.voteStrength} exceeds maximum ${maxVotes.toFixed(1)} based on voting weight`);
    }

    // Calculate purpose-weighted voting power
    const votingPower = await reputationANFIS.calculateVotingPower(
      voterSBT[0], 
      proposal.category, 
      proposal.proposalType
    );

    const purposeWeightedPower = vote.voteStrength * votingPower.totalWeight;

    // Generate ZKP for anonymous voting if requested
    let anonymousVoterId = null;
    let zkpEligibilityProof = null;

    if (vote.anonymous) {
      const zkpProof = await zkpSystem.generateGovernanceProof(
        voterSBT[0].id,
        proposal.proposalType,
        proposal.category
      );
      
      anonymousVoterId = zkpProof.metadata?.anonymousVoterId as string;
      zkpEligibilityProof = zkpProof.proofId;
    }

    const voteData: InsertDaoVote = {
      proposalId: vote.proposalId,
      voterSbtId: voterSBT[0].id,
      anonymousVoterId,
      zkpEligibilityProof,
      voteStrength: vote.voteStrength.toString(),
      quadraticCost: quadraticCost.toString(),
      votingCreditsUsed: quadraticCost.toString(),
      position: vote.position,
      reasoning: vote.reasoning,
      purposeWeightedPower: purposeWeightedPower.toString(),
      purposeAlignmentScore: votingPower.alignment.toString(),
      isAnonymous: vote.anonymous || false,
      zkpVerified: vote.anonymous || false,
      metadata: {
        voterReputation: parseFloat(voterSBT[0].reputationScore),
        voterAuthLevel: voterSBT[0].authenticationLevel,
        purposeWeighting: votingPower.reasoning,
        votingPowerCalculation: {
          baseWeight: votingPower.baseWeight,
          purposeMultiplier: votingPower.purposeWeight,
          totalWeight: votingPower.totalWeight
        }
      }
    };

    const [newVote] = await db.insert(daoVotes).values(voteData).returning();

    // Update proposal vote count
    await this.updateProposalStats(vote.proposalId);

    console.log(`[DAO Governance] ${vote.anonymous ? 'Anonymous' : 'Public'} vote cast on proposal ${vote.proposalId}: ${vote.position} with strength ${vote.voteStrength} (weighted power: ${purposeWeightedPower.toFixed(2)})`);
    
    return newVote;
  }

  /**
   * Process governance decision through DAG routing
   */
  async processGovernanceDecision(proposalId: number): Promise<{
    proposalId: number;
    outcome: 'passed' | 'rejected' | 'insufficient_participation';
    participationRate: number;
    consensusStrength: number;
    votingSummary: {
      totalVotes: number;
      forVotes: number;
      againstVotes: number;
      abstainVotes: number;
      totalWeightedPower: number;
    };
    executionTimestamp?: Date;
    reasoning: string;
  }> {
    
    // Get proposal
    const [proposal] = await db
      .select()
      .from(daoProposals)
      .where(eq(daoProposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get all votes
    const votes = await db
      .select()
      .from(daoVotes)
      .where(eq(daoVotes.proposalId, proposalId));

    // Calculate voting statistics
    const votingSummary = this.calculateVotingSummary(votes);
    
    // Get total eligible voters (approximate)
    const [totalSBTs] = await db
      .select({ count: count() })
      .from(soulBoundTokens);

    const participationRate = (votes.length / (totalSBTs.count || 1)) * 100;
    const requiredParticipation = parseFloat(proposal.requiredParticipation);

    // Check participation threshold
    if (participationRate < requiredParticipation) {
      await db
        .update(daoProposals)
        .set({
          status: 'rejected',
          participationRate: participationRate.toString(),
          consensusScore: '0',
          updatedAt: new Date()
        })
        .where(eq(daoProposals.id, proposalId));

      return {
        proposalId,
        outcome: 'insufficient_participation',
        participationRate,
        consensusStrength: 0,
        votingSummary,
        reasoning: `Insufficient participation: ${participationRate.toFixed(1)}% (required: ${requiredParticipation}%)`
      };
    }

    // Calculate consensus based on purpose-weighted votes
    const totalWeightedFor = votingSummary.forVotes;
    const totalWeightedAgainst = votingSummary.againstVotes;
    const totalWeightedVotes = totalWeightedFor + totalWeightedAgainst; // Exclude abstains from consensus

    const consensusPercentage = totalWeightedVotes > 0 ? (totalWeightedFor / totalWeightedVotes) * 100 : 0;
    const consensusThreshold = parseFloat(proposal.consensusThreshold);

    const outcome = consensusPercentage >= consensusThreshold ? 'passed' : 'rejected';
    const consensusStrength = Math.abs(consensusPercentage - 50); // Distance from 50% = strength

    // Update proposal status
    const executionTimestamp = outcome === 'passed' ? new Date() : undefined;
    
    await db
      .update(daoProposals)
      .set({
        status: outcome,
        totalVotes: votes.length,
        participationRate: participationRate.toString(),
        consensusScore: consensusStrength.toString(),
        updatedAt: new Date(),
        metadata: {
          ...proposal.metadata as any,
          finalResults: {
            consensusPercentage,
            votingSummary,
            executionTimestamp
          }
        }
      })
      .where(eq(daoProposals.id, proposalId));

    const reasoning = `Consensus: ${consensusPercentage.toFixed(1)}% (threshold: ${consensusThreshold}%). Participation: ${participationRate.toFixed(1)}%. Weighted votes: For ${totalWeightedFor.toFixed(1)}, Against ${totalWeightedAgainst.toFixed(1)}`;

    console.log(`[DAO Governance] Proposal ${proposalId} ${outcome}: ${reasoning}`);

    return {
      proposalId,
      outcome,
      participationRate,
      consensusStrength,
      votingSummary,
      executionTimestamp,
      reasoning
    };
  }

  /**
   * Get governance voting power for an address
   */
  async getVotingPower(
    voterAddress: string, 
    proposalId?: number
  ): Promise<{
    baseVotingWeight: number;
    maxVoteStrength: number;
    votingCreditsAvailable: number;
    purposeAlignment?: {
      category: string;
      alignment: number;
      multiplier: number;
    };
    eligibility: boolean;
    reasoning: string;
  }> {
    
    const [sbt] = await db
      .select()
      .from(soulBoundTokens)
      .where(eq(soulBoundTokens.owner, voterAddress))
      .limit(1);

    if (!sbt) {
      return {
        baseVotingWeight: 0,
        maxVoteStrength: 0,
        votingCreditsAvailable: 0,
        eligibility: false,
        reasoning: 'No SBT found for this address'
      };
    }

    const baseVotingWeight = parseFloat(sbt.votingWeight);
    const maxVoteStrength = Math.sqrt(baseVotingWeight);

    let purposeAlignment;
    let eligibility = true;

    if (proposalId) {
      const [proposal] = await db
        .select()
        .from(daoProposals)
        .where(eq(daoProposals.id, proposalId))
        .limit(1);

      if (proposal) {
        eligibility = await this.checkVotingEligibility(sbt, proposal.category);
        
        const votingPower = await reputationANFIS.calculateVotingPower(
          sbt, 
          proposal.category, 
          proposal.proposalType
        );

        purposeAlignment = {
          category: proposal.category,
          alignment: votingPower.alignment,
          multiplier: votingPower.purposeWeight
        };
      }
    }

    // Calculate available voting credits (simplified - would be more complex in production)
    const votingCreditsAvailable = baseVotingWeight;

    const reasoning = `Base weight: ${baseVotingWeight.toFixed(2)}, Max strength: ${maxVoteStrength.toFixed(1)}${purposeAlignment ? `, Purpose alignment: ${(purposeAlignment.alignment * 100).toFixed(1)}%` : ''}`;

    return {
      baseVotingWeight,
      maxVoteStrength,
      votingCreditsAvailable,
      purposeAlignment,
      eligibility,
      reasoning
    };
  }

  /**
   * Get active proposals
   */
  async getActiveProposals(category?: string): Promise<DaoProposal[]> {
    const now = new Date();
    
    let query = db
      .select()
      .from(daoProposals)
      .where(and(
        eq(daoProposals.status, 'active'),
        lte(daoProposals.votingStartsAt, now),
        gte(daoProposals.votingEndsAt, now)
      ));

    if (category) {
      query = query.where(and(
        eq(daoProposals.status, 'active'),
        lte(daoProposals.votingStartsAt, now),
        gte(daoProposals.votingEndsAt, now),
        eq(daoProposals.category, category)
      ));
    }

    return await query.orderBy(desc(daoProposals.createdAt));
  }

  /**
   * Get proposal results
   */
  async getProposalResults(proposalId: number): Promise<{
    proposal: DaoProposal;
    votes: DaoVote[];
    summary: any;
    analysis: any;
  }> {
    
    const [proposal] = await db
      .select()
      .from(daoProposals)
      .where(eq(daoProposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const votes = await db
      .select()
      .from(daoVotes)
      .where(eq(daoVotes.proposalId, proposalId))
      .orderBy(desc(daoVotes.timestamp));

    const summary = this.calculateVotingSummary(votes);
    const analysis = this.analyzeVotingPatterns(votes, proposal);

    return {
      proposal,
      votes,
      summary,
      analysis
    };
  }

  // Private helper methods

  private async checkProposalEligibility(sbt: SoulBoundToken, category: string): Promise<boolean> {
    const reputation = parseFloat(sbt.reputationScore);
    const authLevel = sbt.authenticationLevel;

    // Basic requirements
    if (reputation < 50) return false;
    if (authLevel < 2) return false;

    // Category-specific requirements
    switch (category) {
      case 'technical':
        return parseFloat(sbt.technicalSkill) >= 40;
      case 'funding':
        return reputation >= 100 && authLevel >= 3;
      case 'governance':
        return parseFloat(sbt.governanceParticipation) >= 5;
      case 'social_impact':
        return parseFloat(sbt.impactScore) >= 30;
      default:
        return true;
    }
  }

  private async checkVotingEligibility(sbt: SoulBoundToken, category: string): Promise<boolean> {
    const reputation = parseFloat(sbt.reputationScore);
    const authLevel = sbt.authenticationLevel;

    // Basic voting requirements (lower than proposal creation)
    if (reputation < 25) return false;
    if (authLevel < 1) return false;

    return true; // Most SBT holders can vote
  }

  private getDefaultPurposeWeights(category: string): { technical: number; social: number; creative: number; impact: number } {
    switch (category) {
      case 'technical':
        return { technical: 2.0, social: 0.5, creative: 0.8, impact: 1.0 };
      case 'funding':
        return { technical: 1.0, social: 1.5, creative: 1.2, impact: 2.0 };
      case 'governance':
        return { technical: 1.0, social: 2.0, creative: 1.0, impact: 1.5 };
      case 'social_impact':
        return { technical: 0.8, social: 1.8, creative: 1.5, impact: 2.0 };
      default:
        return { technical: 1.0, social: 1.0, creative: 1.0, impact: 1.0 };
    }
  }

  private calculateVotingSummary(votes: DaoVote[]): {
    totalVotes: number;
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    totalWeightedPower: number;
  } {
    
    let totalVotes = votes.length;
    let forVotes = 0;
    let againstVotes = 0;
    let abstainVotes = 0;
    let totalWeightedPower = 0;

    votes.forEach(vote => {
      const weightedPower = parseFloat(vote.purposeWeightedPower);
      totalWeightedPower += weightedPower;

      switch (vote.position) {
        case 'for':
          forVotes += weightedPower;
          break;
        case 'against':
          againstVotes += weightedPower;
          break;
        case 'abstain':
          abstainVotes += weightedPower;
          break;
      }
    });

    return {
      totalVotes,
      forVotes,
      againstVotes,
      abstainVotes,
      totalWeightedPower
    };
  }

  private analyzeVotingPatterns(votes: DaoVote[], proposal: DaoProposal): {
    averageVoteStrength: number;
    anonymousVotePercentage: number;
    purposeAlignmentDistribution: Record<string, number>;
    consensusEvolution: Array<{ timestamp: Date; consensusScore: number }>;
  } {
    
    const totalVotes = votes.length;
    if (totalVotes === 0) {
      return {
        averageVoteStrength: 0,
        anonymousVotePercentage: 0,
        purposeAlignmentDistribution: {},
        consensusEvolution: []
      };
    }

    const averageVoteStrength = votes.reduce((sum, vote) => sum + parseFloat(vote.voteStrength), 0) / totalVotes;
    const anonymousVotes = votes.filter(vote => vote.isAnonymous).length;
    const anonymousVotePercentage = (anonymousVotes / totalVotes) * 100;

    // Purpose alignment distribution
    const alignmentRanges = { low: 0, medium: 0, high: 0 };
    votes.forEach(vote => {
      const alignment = parseFloat(vote.purposeAlignmentScore);
      if (alignment < 0.3) alignmentRanges.low++;
      else if (alignment < 0.7) alignmentRanges.medium++;
      else alignmentRanges.high++;
    });

    const purposeAlignmentDistribution = {
      'Low (0-30%)': (alignmentRanges.low / totalVotes) * 100,
      'Medium (30-70%)': (alignmentRanges.medium / totalVotes) * 100,
      'High (70-100%)': (alignmentRanges.high / totalVotes) * 100
    };

    // Consensus evolution over time (simplified)
    const consensusEvolution = this.calculateConsensusEvolution(votes);

    return {
      averageVoteStrength,
      anonymousVotePercentage,
      purposeAlignmentDistribution,
      consensusEvolution
    };
  }

  private calculateConsensusEvolution(votes: DaoVote[]): Array<{ timestamp: Date; consensusScore: number }> {
    const sortedVotes = votes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const evolution = [];
    
    let cumulativeFor = 0;
    let cumulativeAgainst = 0;

    sortedVotes.forEach((vote, index) => {
      const power = parseFloat(vote.purposeWeightedPower);
      
      if (vote.position === 'for') cumulativeFor += power;
      else if (vote.position === 'against') cumulativeAgainst += power;

      const total = cumulativeFor + cumulativeAgainst;
      const consensusScore = total > 0 ? (cumulativeFor / total) * 100 : 50;

      evolution.push({
        timestamp: vote.timestamp,
        consensusScore
      });
    });

    return evolution;
  }

  private async updateProposalStats(proposalId: number): Promise<void> {
    const [voteCount] = await db
      .select({ count: count() })
      .from(daoVotes)
      .where(eq(daoVotes.proposalId, proposalId));

    await db
      .update(daoProposals)
      .set({
        totalVotes: voteCount.count,
        updatedAt: new Date()
      })
      .where(eq(daoProposals.id, proposalId));
  }
}

// Export singleton instance
export const daoGovernance = new PurposeWeightedDAO();