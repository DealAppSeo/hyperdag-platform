/**
 * HyperCrowd Funding Distribution System
 * 
 * This service handles the allocation, tracking, and distribution of funds to projects.
 * Key features:
 * 1. Milestone-based fund release
 * 2. Multi-source fund allocation
 * 3. On-chain verification and transparency
 * 4. Reputation impact tracking
 */

import { log } from '../../utils/logger';
import { storage } from '../../storage';
import { hyperCrowdContract, claimGrantMatch, approveGrantMatch } from '../blockchain/contract-service';
import { recordReputationActivity } from '../reputation';
import { redundantStorage } from '../redundancy/storage/redundant-storage-service';

// Import types
import type { 
  Project, 
  GrantMatch, 
  Milestone, 
  FundingDistribution,
  FundingAllocation
} from '../../../shared/schema';

// Funding distribution status types
export enum FundingStatus {
  PENDING = 'pending',
  ALLOCATED = 'allocated',
  APPROVED = 'approved',
  RELEASED = 'released',
  CLAIMED = 'claimed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// Milestones status types
export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

// Distribution parameters
const DEFAULT_MILESTONE_PERCENTAGE = 0.2; // 20% per milestone by default
const REPUTATION_BOOST_MULTIPLIER = 1.05; // 5% boost for high reputation
const REPUTATION_THRESHOLD = 80; // Reputation threshold for boost

/**
 * Create funding distribution plan for a project
 */
export async function createFundingDistribution(
  projectId: number,
  grantMatches: GrantMatch[],
  milestoneCount: number = 5
): Promise<FundingDistribution> {
  try {
    log(`Creating funding distribution for project ${projectId} with ${grantMatches.length} grant matches`, 'funding');
    
    // Get project details
    const project = await storage.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Get creator's reputation score
    const repScore = await storage.getUserReputation(project.creatorId);
    
    // Calculate total potential funding
    const totalFunding = grantMatches.reduce((sum, match) => sum + (match.potentialFunding || 0), 0);
    
    // Apply reputation boost if applicable
    const appliedRepBoost = repScore > REPUTATION_THRESHOLD;
    const adjustedFunding = appliedRepBoost 
      ? totalFunding * REPUTATION_BOOST_MULTIPLIER
      : totalFunding;
    
    // Create milestone allocations
    const milestonePercentages = generateMilestonePercentages(milestoneCount);
    
    // Create funding allocations for each grant match
    const allocations: FundingAllocation[] = grantMatches.map((match, index) => {
      const matchFunding = match.potentialFunding || 0;
      const percentOfTotal = matchFunding / totalFunding;
      
      return {
        id: index + 1,
        projectId,
        grantMatchId: match.id,
        grantSourceId: match.grantSourceId,
        amount: matchFunding,
        percentOfTotal: percentOfTotal,
        status: FundingStatus.PENDING,
        milestoneAllocations: milestonePercentages.map((percentage, milestoneIdx) => ({
          milestoneId: milestoneIdx + 1,
          percentage,
          amount: matchFunding * percentage,
          status: FundingStatus.PENDING
        }))
      };
    });
    
    // Create the funding distribution record
    const distribution: FundingDistribution = {
      id: Date.now(), // Temporary ID, will be replaced in storage
      projectId,
      totalAmount: adjustedFunding,
      allocatedAmount: totalFunding,
      remainingAmount: totalFunding,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: FundingStatus.PENDING,
      reputationBoostApplied: appliedRepBoost,
      milestoneCount,
      milestonePercentages,
      allocations,
      onchainVerified: false
    };
    
    // Store the funding distribution
    const savedDistribution = await storage.createFundingDistribution(distribution);
    
    log(`Created funding distribution plan for project ${projectId} with ${allocations.length} allocations`, 'funding');
    
    return savedDistribution;
  } catch (error) {
    log(`Error creating funding distribution: ${error.message}`, 'funding');
    throw error;
  }
}

/**
 * Approve funding allocation from a specific grant source
 */
export async function approveFundingAllocation(
  projectId: number,
  grantMatchId: number,
  adminId: number
): Promise<FundingAllocation> {
  try {
    log(`Approving funding allocation for project ${projectId}, grant match ${grantMatchId}`, 'funding');
    
    // Get the funding distribution
    const distribution = await storage.getFundingDistributionByProject(projectId);
    if (!distribution) {
      throw new Error(`Funding distribution for project ${projectId} not found`);
    }
    
    // Find the specific allocation
    const allocation = distribution.allocations.find(a => a.grantMatchId === grantMatchId);
    if (!allocation) {
      throw new Error(`Allocation for grant match ${grantMatchId} not found`);
    }
    
    // Check if it's already approved
    if (allocation.status === FundingStatus.APPROVED) {
      log(`Allocation for grant match ${grantMatchId} already approved`, 'funding');
      return allocation;
    }
    
    // Update allocation status
    const updatedAllocation = {
      ...allocation,
      status: FundingStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: adminId
    };
    
    // Update the allocation in storage
    const result = await storage.updateFundingAllocation(updatedAllocation);
    
    // Get grant match details for blockchain interaction
    const grantMatch = await storage.getGrantMatch(grantMatchId);
    if (grantMatch && grantMatch.grantSourceId) {
      try {
        // Attempts to record the approval on-chain if blockchain is available
        const adminWallet = await storage.getUserWallet(adminId);
        if (adminWallet && adminWallet.privateKey) {
          // Record on blockchain
          await approveGrantMatch(
            adminWallet,
            grantMatch.grantSourceId,
            projectId
          );
          
          // Update on-chain verification status
          await storage.updateFundingDistributionField(
            distribution.id,
            'onchainVerified',
            true
          );
          
          log(`Recorded funding approval on blockchain for project ${projectId}, grant ${grantMatch.grantSourceId}`, 'funding');
        }
      } catch (blockchainError) {
        // Log error but don't fail the approval process
        log(`Failed to record funding approval on blockchain: ${blockchainError.message}`, 'funding');
      }
    }
    
    // Record this approval in the reputation system
    try {
      // Get project creator
      const project = await storage.getProjectById(projectId);
      if (project) {
        await recordReputationActivity(project.creatorId, 'funding_approved', 5, {
          projectId,
          grantMatchId,
          amount: allocation.amount
        });
      }
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'funding');
    }
    
    log(`Successfully approved funding allocation for project ${projectId}, grant match ${grantMatchId}`, 'funding');
    
    return result;
  } catch (error) {
    log(`Error approving funding allocation: ${error.message}`, 'funding');
    throw error;
  }
}

/**
 * Release funds for a specific milestone
 */
export async function releaseMilestoneFunding(
  projectId: number,
  milestoneId: number,
  adminId: number
): Promise<void> {
  try {
    log(`Releasing funding for project ${projectId}, milestone ${milestoneId}`, 'funding');
    
    // Get the funding distribution
    const distribution = await storage.getFundingDistributionByProject(projectId);
    if (!distribution) {
      throw new Error(`Funding distribution for project ${projectId} not found`);
    }
    
    // Verify milestone status
    const milestone = await storage.getProjectMilestone(projectId, milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} for project ${projectId} not found`);
    }
    
    if (milestone.status !== MilestoneStatus.VERIFIED) {
      throw new Error(`Milestone ${milestoneId} has not been verified yet`);
    }
    
    // Update milestone allocation status for each approved allocation
    const approvedAllocations = distribution.allocations.filter(
      a => a.status === FundingStatus.APPROVED
    );
    
    if (approvedAllocations.length === 0) {
      throw new Error(`No approved allocations found for project ${projectId}`);
    }
    
    // Calculate total amount being released
    let totalReleased = 0;
    
    // Process each allocation
    for (const allocation of approvedAllocations) {
      // Find the milestone allocation
      const milestoneAllocation = allocation.milestoneAllocations.find(
        ma => ma.milestoneId === milestoneId
      );
      
      if (milestoneAllocation && milestoneAllocation.status === FundingStatus.PENDING) {
        // Update milestone allocation status
        milestoneAllocation.status = FundingStatus.RELEASED;
        milestoneAllocation.releasedAt = new Date();
        milestoneAllocation.releasedById = adminId;
        
        // Add to total released
        totalReleased += milestoneAllocation.amount;
        
        // Update in storage
        await storage.updateMilestoneAllocation(
          allocation.id,
          milestoneId,
          milestoneAllocation
        );
      }
    }
    
    // Update the distribution's remaining amount
    const remainingAmount = distribution.remainingAmount - totalReleased;
    await storage.updateFundingDistributionField(
      distribution.id,
      'remainingAmount',
      remainingAmount
    );
    
    // Record in reputation system
    try {
      const project = await storage.getProjectById(projectId);
      if (project) {
        await recordReputationActivity(project.creatorId, 'milestone_funded', 10, {
          projectId,
          milestoneId,
          releasedAmount: totalReleased
        });
      }
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'funding');
    }
    
    log(`Successfully released ${totalReleased} for project ${projectId}, milestone ${milestoneId}`, 'funding');
  } catch (error) {
    log(`Error releasing milestone funding: ${error.message}`, 'funding');
    throw error;
  }
}

/**
 * Claim released funds for a project
 */
export async function claimReleasedFunds(
  projectId: number,
  userId: number
): Promise<number> {
  try {
    log(`Claiming released funds for project ${projectId} by user ${userId}`, 'funding');
    
    // Verify project ownership
    const project = await storage.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    if (project.creatorId !== userId) {
      throw new Error(`User ${userId} is not the creator of project ${projectId}`);
    }
    
    // Get the funding distribution
    const distribution = await storage.getFundingDistributionByProject(projectId);
    if (!distribution) {
      throw new Error(`Funding distribution for project ${projectId} not found`);
    }
    
    // Find all released milestone allocations that haven't been claimed
    let totalToClaim = 0;
    let claimedAllocations = [];
    
    for (const allocation of distribution.allocations) {
      // Find released but unclaimed milestone allocations
      const releasedAllocations = allocation.milestoneAllocations.filter(
        ma => ma.status === FundingStatus.RELEASED && !ma.claimedAt
      );
      
      if (releasedAllocations.length > 0) {
        // Calculate amount to claim from this allocation
        const allocationAmount = releasedAllocations.reduce(
          (sum, ma) => sum + ma.amount, 0
        );
        
        totalToClaim += allocationAmount;
        
        // Update milestone allocations as claimed
        for (const ma of releasedAllocations) {
          ma.status = FundingStatus.CLAIMED;
          ma.claimedAt = new Date();
          
          // Update in storage
          await storage.updateMilestoneAllocation(
            allocation.id,
            ma.milestoneId,
            ma
          );
        }
        
        claimedAllocations.push({
          allocationId: allocation.id,
          grantMatchId: allocation.grantMatchId,
          amount: allocationAmount
        });
      }
    }
    
    if (totalToClaim === 0) {
      throw new Error(`No released funds available to claim for project ${projectId}`);
    }
    
    // Record the claim transaction
    const claimTransaction = {
      projectId,
      userId,
      amount: totalToClaim,
      claimedAt: new Date(),
      allocations: claimedAllocations,
      txHash: null // Will be updated if blockchain transaction succeeds
    };
    
    // Save the claim transaction
    const savedClaim = await storage.createFundingClaim(claimTransaction);
    
    // Try to record on blockchain if possible
    try {
      const userWallet = await storage.getUserWallet(userId);
      if (userWallet && userWallet.privateKey) {
        for (const claimed of claimedAllocations) {
          const grantMatch = await storage.getGrantMatch(claimed.grantMatchId);
          if (grantMatch && grantMatch.grantSourceId) {
            const receipt = await claimGrantMatch(
              userWallet,
              grantMatch.grantSourceId,
              projectId
            );
            
            // Update transaction hash if available
            if (receipt && receipt.hash) {
              await storage.updateFundingClaimField(
                savedClaim.id,
                'txHash',
                receipt.hash
              );
            }
          }
        }
      }
    } catch (blockchainError) {
      log(`Failed to record claim on blockchain: ${blockchainError.message}`, 'funding');
      // Continue despite blockchain error
    }
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'funding_claimed', 3, {
        projectId,
        amount: totalToClaim
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'funding');
    }
    
    log(`Successfully claimed ${totalToClaim} for project ${projectId}`, 'funding');
    
    return totalToClaim;
  } catch (error) {
    log(`Error claiming released funds: ${error.message}`, 'funding');
    throw error;
  }
}

/**
 * Generate milestone percentages for a funding distribution
 */
function generateMilestonePercentages(milestoneCount: number): number[] {
  if (milestoneCount <= 0) {
    return [];
  }
  
  if (milestoneCount === 1) {
    return [1]; // 100% for a single milestone
  }
  
  // For most cases, distribute evenly but with a slightly larger final milestone
  const basePercentage = 1 / milestoneCount;
  const percentages = Array(milestoneCount).fill(basePercentage);
  
  // Adjust final milestone to be slightly larger
  // This encourages project completion
  if (milestoneCount > 2) {
    const adjustment = 0.05; // 5% bonus to final milestone
    percentages[milestoneCount - 1] += adjustment;
    
    // Distribute the adjustment evenly among other milestones
    const smallAdjustment = adjustment / (milestoneCount - 1);
    for (let i = 0; i < milestoneCount - 1; i++) {
      percentages[i] -= smallAdjustment;
    }
  }
  
  // Make sure we add up to exactly 1.0
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 1) {
    percentages[milestoneCount - 1] += (1 - sum);
  }
  
  return percentages;
}

/**
 * Update milestone status and potentially trigger funding release
 */
export async function updateMilestoneStatus(
  projectId: number,
  milestoneId: number,
  status: MilestoneStatus,
  verifierId?: number
): Promise<Milestone> {
  try {
    log(`Updating milestone ${milestoneId} status to ${status} for project ${projectId}`, 'funding');
    
    // Verify milestone
    const milestone = await storage.getProjectMilestone(projectId, milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} for project ${projectId} not found`);
    }
    
    // Update milestone status
    const updatedMilestone = {
      ...milestone,
      status,
      updatedAt: new Date()
    };
    
    // If milestone is being verified, record verifier
    if (status === MilestoneStatus.VERIFIED && verifierId) {
      updatedMilestone.verifiedById = verifierId;
      updatedMilestone.verifiedAt = new Date();
      
      // Store verification evidence in redundant storage
      try {
        const verificationData = {
          projectId,
          milestoneId,
          verifierId,
          timestamp: new Date().toISOString(),
          milestoneName: milestone.name,
          deliverables: milestone.deliverables
        };
        
        const cid = await redundantStorage.storeJSON(
          `project_${projectId}/milestone_${milestoneId}/verification.json`,
          verificationData
        );
        
        if (cid) {
          updatedMilestone.verificationCid = cid;
        }
      } catch (storageError) {
        log(`Failed to store verification evidence: ${storageError.message}`, 'funding');
        // Continue despite storage error
      }
      
      // Record in reputation system
      try {
        const project = await storage.getProjectById(projectId);
        if (project) {
          await recordReputationActivity(project.creatorId, 'milestone_verified', 8, {
            projectId,
            milestoneId,
            milestoneName: milestone.name
          });
          
          // Also record for verifier if available
          if (verifierId) {
            await recordReputationActivity(verifierId, 'verified_milestone', 2, {
              projectId,
              milestoneId,
              milestoneName: milestone.name
            });
          }
        }
      } catch (repError) {
        log(`Failed to record reputation activity: ${repError.message}`, 'funding');
      }
    }
    
    // Update milestone in storage
    const result = await storage.updateProjectMilestone(projectId, milestoneId, updatedMilestone);
    
    log(`Successfully updated milestone ${milestoneId} status to ${status} for project ${projectId}`, 'funding');
    
    return result;
  } catch (error) {
    log(`Error updating milestone status: ${error.message}`, 'funding');
    throw error;
  }
}

/**
 * Get funding distribution summary for a project
 */
export async function getProjectFundingSummary(projectId: number): Promise<any> {
  try {
    // Get the project
    const project = await storage.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    // Get funding distribution
    const distribution = await storage.getFundingDistributionByProject(projectId);
    if (!distribution) {
      return {
        projectId,
        title: project.title,
        hasFunding: false,
        message: "No funding has been allocated to this project yet"
      };
    }
    
    // Get project milestones
    const milestones = await storage.getProjectMilestones(projectId);
    
    // Create milestone summary with funding data
    const milestoneSummary = milestones.map(milestone => {
      // Calculate total funding allocated to this milestone
      let allocated = 0;
      let released = 0;
      let claimed = 0;
      
      distribution.allocations.forEach(allocation => {
        const ma = allocation.milestoneAllocations.find(
          ma => ma.milestoneId === milestone.id
        );
        
        if (ma) {
          allocated += ma.amount;
          
          if (ma.status === FundingStatus.RELEASED || ma.status === FundingStatus.CLAIMED) {
            released += ma.amount;
          }
          
          if (ma.status === FundingStatus.CLAIMED) {
            claimed += ma.amount;
          }
        }
      });
      
      return {
        ...milestone,
        funding: {
          allocated,
          released,
          claimed,
          remaining: allocated - claimed
        }
      };
    });
    
    // Calculate overall summary
    const totalAllocated = distribution.totalAmount;
    const totalReleased = distribution.allocations.reduce((sum, allocation) => {
      return sum + allocation.milestoneAllocations.reduce((mSum, ma) => {
        return mSum + (ma.status === FundingStatus.RELEASED || ma.status === FundingStatus.CLAIMED ? ma.amount : 0);
      }, 0);
    }, 0);
    
    const totalClaimed = distribution.allocations.reduce((sum, allocation) => {
      return sum + allocation.milestoneAllocations.reduce((mSum, ma) => {
        return mSum + (ma.status === FundingStatus.CLAIMED ? ma.amount : 0);
      }, 0);
    }, 0);
    
    // Create funding summary
    return {
      projectId,
      title: project.title,
      hasFunding: true,
      summary: {
        totalAllocated,
        totalReleased,
        totalClaimed,
        remainingToRelease: totalAllocated - totalReleased,
        remainingToClaim: totalReleased - totalClaimed,
        milestoneCount: milestones.length,
        completedMilestones: milestones.filter(m => 
          m.status === MilestoneStatus.COMPLETED || 
          m.status === MilestoneStatus.VERIFIED
        ).length,
        verifiedMilestones: milestones.filter(m => 
          m.status === MilestoneStatus.VERIFIED
        ).length,
        onchainVerified: distribution.onchainVerified
      },
      milestones: milestoneSummary,
      grantSources: distribution.allocations.map(allocation => {
        const grantSource = allocation.grantSource || {
          id: allocation.grantSourceId,
          name: `Grant Source #${allocation.grantSourceId}`
        };
        
        return {
          id: grantSource.id,
          name: grantSource.name,
          amount: allocation.amount,
          status: allocation.status
        };
      })
    };
  } catch (error) {
    log(`Error getting project funding summary: ${error.message}`, 'funding');
    throw error;
  }
}