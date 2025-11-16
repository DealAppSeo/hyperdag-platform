/**
 * HyperCrowd RFP/RFI Conversion System
 * 
 * This service handles the conversion of RFIs to RFPs based on community voting:
 * 1. Community voting on RFIs
 * 2. Automatic conversion of popular RFIs to RFPs
 * 3. RFI management and lifecycle
 * 4. Community feedback collection
 */

import { log } from '../../utils/logger';
import { storage } from '../../storage';
import { smartAI } from '../redundancy/ai/smart-ai-service';
import { redundantStorage } from '../redundancy/storage/redundant-storage-service';
import { recordReputationActivity } from '../reputation';

// Import types
import type { 
  RFI, 
  RFP, 
  RFIVote, 
  User,
  RFIComment
} from '../../../shared/schema';

// Status types
export enum RFIStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

export enum RFPStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Constants
const CONVERSION_THRESHOLD = 10; // Votes needed to convert RFI to RFP
const DEFAULT_RFI_EXPIRY_DAYS = 30; // Default expiration in days
const VOTE_COOLDOWN_HOURS = 24; // Hours before a user can vote on another RFI

/**
 * Create a new Request for Information (RFI)
 */
export async function createRFI(
  userId: number,
  rfiData: Partial<RFI>
): Promise<RFI> {
  try {
    log(`Creating RFI by user ${userId}`, 'rfi-conversion');
    
    // Validate required fields
    if (!rfiData.title || rfiData.title.trim().length < 5) {
      throw new Error('Title is too short or missing');
    }
    
    if (!rfiData.description || rfiData.description.trim().length < 20) {
      throw new Error('Description is too short or missing');
    }
    
    // Get user details to verify they can create RFIs
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Calculate expiration date (default to 30 days if not provided)
    const expiryDays = rfiData.expiryDays || DEFAULT_RFI_EXPIRY_DAYS;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiryDays);
    
    // Prepare RFI object
    const rfi: RFI = {
      id: 0, // Will be set by storage
      title: rfiData.title,
      description: rfiData.description,
      creatorId: userId,
      categories: rfiData.categories || [],
      status: RFIStatus.DRAFT,
      voteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      expirationDate,
      convertedToRfpId: null,
      votes: [],
      comments: []
    };
    
    // Save the RFI
    const savedRFI = await storage.createRFI(rfi);
    
    log(`Created RFI ${savedRFI.id} by user ${userId}`, 'rfi-conversion');
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'rfi_created', 3, {
        rfiId: savedRFI.id,
        rfiTitle: savedRFI.title
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'rfi-conversion');
    }
    
    return savedRFI;
  } catch (error) {
    log(`Error creating RFI: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}

/**
 * Publish a draft RFI
 */
export async function publishRFI(
  rfiId: number,
  userId: number
): Promise<RFI> {
  try {
    log(`Publishing RFI ${rfiId} by user ${userId}`, 'rfi-conversion');
    
    // Get the RFI
    const rfi = await storage.getRFIById(rfiId);
    if (!rfi) {
      throw new Error(`RFI with ID ${rfiId} not found`);
    }
    
    // Verify ownership
    if (rfi.creatorId !== userId) {
      throw new Error(`User ${userId} is not authorized to publish RFI ${rfiId}`);
    }
    
    // Verify RFI is in draft status
    if (rfi.status !== RFIStatus.DRAFT) {
      throw new Error(`RFI ${rfiId} cannot be published in its current status: ${rfi.status}`);
    }
    
    // Update RFI status
    const updatedRFI = {
      ...rfi,
      status: RFIStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save the updated RFI
    const result = await storage.updateRFI(rfiId, updatedRFI);
    
    log(`Published RFI ${rfiId}`, 'rfi-conversion');
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'rfi_published', 5, {
        rfiId,
        rfiTitle: rfi.title
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'rfi-conversion');
    }
    
    return result;
  } catch (error) {
    log(`Error publishing RFI: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}

/**
 * Vote on an RFI
 */
export async function voteOnRFI(
  rfiId: number,
  userId: number,
  voteValue: 1 | 0 | -1, // 1: upvote, 0: neutral, -1: downvote
  comment?: string
): Promise<{ rfi: RFI, converted: boolean }> {
  try {
    log(`User ${userId} voting on RFI ${rfiId} with value ${voteValue}`, 'rfi-conversion');
    
    // Get the RFI
    const rfi = await storage.getRFIById(rfiId);
    if (!rfi) {
      throw new Error(`RFI with ID ${rfiId} not found`);
    }
    
    // Check if the RFI is published
    if (rfi.status !== RFIStatus.PUBLISHED) {
      throw new Error(`Cannot vote on RFI ${rfiId} in its current status: ${rfi.status}`);
    }
    
    // Check if the RFI has expired
    if (rfi.expirationDate && rfi.expirationDate < new Date()) {
      throw new Error(`RFI ${rfiId} has expired and cannot receive votes`);
    }
    
    // Check for vote cooldown
    const canVote = await checkVoteCooldown(userId);
    if (!canVote) {
      throw new Error(`User ${userId} must wait before voting on another RFI`);
    }
    
    // Check if the user has already voted on this RFI
    const existingVoteIndex = rfi.votes.findIndex(v => v.userId === userId);
    
    // Calculate vote change
    let voteChange = voteValue;
    
    if (existingVoteIndex >= 0) {
      // User has already voted, calculate the change
      const existingVote = rfi.votes[existingVoteIndex];
      voteChange = voteValue - existingVote.value;
      
      // Update the existing vote
      rfi.votes[existingVoteIndex] = {
        ...existingVote,
        value: voteValue,
        updatedAt: new Date()
      };
    } else {
      // Add a new vote
      rfi.votes.push({
        userId,
        value: voteValue,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Update vote count
    rfi.voteCount += voteChange;
    
    // Add a comment if provided
    if (comment && comment.trim().length > 0) {
      rfi.comments.push({
        userId,
        text: comment.trim(),
        createdAt: new Date()
      });
    }
    
    // Update the RFI
    const updatedRFI = {
      ...rfi,
      updatedAt: new Date()
    };
    
    // Save the updated RFI
    const result = await storage.updateRFI(rfiId, updatedRFI);
    
    // Check if the RFI should be converted to an RFP
    let converted = false;
    if (result.voteCount >= CONVERSION_THRESHOLD && result.status === RFIStatus.PUBLISHED) {
      converted = true;
      // Convert the RFI to an RFP
      const rfp = await convertRFIToRFP(rfiId);
      
      // Update RFI status after conversion
      const convertedRFI = {
        ...result,
        status: RFIStatus.CONVERTED,
        convertedToRfpId: rfp.id,
        updatedAt: new Date()
      };
      
      await storage.updateRFI(rfiId, convertedRFI);
      
      log(`Converted RFI ${rfiId} to RFP ${rfp.id} after reaching ${result.voteCount} votes`, 'rfi-conversion');
    }
    
    // Record in reputation system
    try {
      // Record vote activity
      await recordReputationActivity(userId, 'rfi_voted', 1, {
        rfiId,
        voteValue
      });
      
      // Record comment activity if applicable
      if (comment && comment.trim().length > 0) {
        await recordReputationActivity(userId, 'rfi_commented', 2, {
          rfiId,
          commentLength: comment.trim().length
        });
      }
      
      // If converted, give bonus to creator
      if (converted) {
        await recordReputationActivity(rfi.creatorId, 'rfi_converted', 10, {
          rfiId,
          finalVotes: result.voteCount
        });
      }
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'rfi-conversion');
    }
    
    log(`User ${userId} voted on RFI ${rfiId}. New vote count: ${result.voteCount}`, 'rfi-conversion');
    
    return { 
      rfi: converted ? await storage.getRFIById(rfiId) : result, 
      converted 
    };
  } catch (error) {
    log(`Error voting on RFI: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}

/**
 * Check if a user has waited long enough to vote again
 */
async function checkVoteCooldown(userId: number): Promise<boolean> {
  try {
    // Get the user's latest vote
    const latestVote = await storage.getLatestRFIVoteByUser(userId);
    
    if (!latestVote) {
      return true; // No previous votes, can vote
    }
    
    // Calculate time since last vote
    const now = new Date();
    const lastVoteTime = latestVote.updatedAt || latestVote.createdAt;
    const hoursSinceLastVote = (now.getTime() - lastVoteTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastVote >= VOTE_COOLDOWN_HOURS;
  } catch (error) {
    log(`Error checking vote cooldown: ${error.message}`, 'rfi-conversion');
    return true; // Allow voting on error (fail open)
  }
}

/**
 * Convert an RFI to an RFP
 */
async function convertRFIToRFP(rfiId: number): Promise<RFP> {
  try {
    log(`Converting RFI ${rfiId} to RFP`, 'rfi-conversion');
    
    // Get the RFI
    const rfi = await storage.getRFIById(rfiId);
    if (!rfi) {
      throw new Error(`RFI with ID ${rfiId} not found`);
    }
    
    // Check if the RFI has already been converted
    if (rfi.status === RFIStatus.CONVERTED && rfi.convertedToRfpId) {
      // Return the existing RFP
      const existingRFP = await storage.getRfpById(rfi.convertedToRfpId);
      if (existingRFP) {
        return existingRFP;
      }
    }
    
    // Check if the RFI has enough votes
    if (rfi.voteCount < CONVERSION_THRESHOLD) {
      throw new Error(`RFI ${rfiId} does not have enough votes for conversion (${rfi.voteCount}/${CONVERSION_THRESHOLD})`);
    }
    
    // Generate funding goal suggestion using AI if available
    let fundingGoal = 0;
    try {
      if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.PERPLEXITY_API_KEY) {
        const prompt = `
Based on the following Request for Information (RFI), suggest a reasonable funding goal in USD.
Consider the complexity, scope, and potential impact of the project described.

RFI TITLE: ${rfi.title}
RFI DESCRIPTION: ${rfi.description}
CATEGORIES: ${rfi.categories.join(', ')}

Return ONLY a number representing the suggested funding goal in USD (e.g., 25000).
`;

        const aiResponse = await smartAI.complete({
          prompt,
          max_tokens: 50,
          temperature: 0.3
        });
        
        // Extract the numeric value from the response
        const match = aiResponse.content.match(/\d+/);
        if (match) {
          fundingGoal = parseInt(match[0], 10);
        }
      }
    } catch (aiError) {
      log(`Error generating funding goal with AI: ${aiError.message}`, 'rfi-conversion');
      // Continue with default funding goal
    }
    
    // If AI failed or no suggestion, use a default based on categories
    if (fundingGoal <= 0) {
      fundingGoal = estimateDefaultFundingGoal(rfi.categories);
    }
    
    // Generate skills required suggestion
    let skillsRequired: string[] = [];
    try {
      // Extract skills from RFI comments
      skillsRequired = extractSkillsFromComments(rfi.comments);
      
      // If not enough skills extracted, try AI
      if (skillsRequired.length < 3 && 
          (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.PERPLEXITY_API_KEY)) {
        const prompt = `
Based on the following Request for Information (RFI), suggest a list of required skills
for potential contributors to implement this project successfully.

RFI TITLE: ${rfi.title}
RFI DESCRIPTION: ${rfi.description}
CATEGORIES: ${rfi.categories.join(', ')}

Return a comma-separated list of skills (e.g., JavaScript, UX Design, Smart Contract Development).
`;

        const aiResponse = await smartAI.complete({
          prompt,
          max_tokens: 100,
          temperature: 0.3
        });
        
        // Parse the comma-separated skills
        const aiSkills = aiResponse.content
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
        
        skillsRequired = [...new Set([...skillsRequired, ...aiSkills])];
      }
    } catch (aiError) {
      log(`Error generating skills with AI: ${aiError.message}`, 'rfi-conversion');
      // Continue with extracted skills or defaults
    }
    
    // Ensure we have some skills
    if (skillsRequired.length === 0) {
      skillsRequired = generateDefaultSkills(rfi.categories);
    }
    
    // Prepare RFP object
    const rfp: RFP = {
      id: 0, // Will be set by storage
      title: rfi.title,
      description: rfi.description,
      categories: rfi.categories,
      creatorId: rfi.creatorId,
      sourceRfiId: rfi.id,
      fundingGoal,
      skillsRequired,
      status: RFPStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      expirationDate: calculateRFPExpirationDate(),
      viewCount: 0,
      proposalCount: 0
    };
    
    // Save the RFP
    const savedRFP = await storage.createRFP(rfp);
    
    log(`Created RFP ${savedRFP.id} from RFI ${rfiId}`, 'rfi-conversion');
    
    return savedRFP;
  } catch (error) {
    log(`Error converting RFI to RFP: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}

/**
 * Extract skills from RFI comments
 */
function extractSkillsFromComments(comments: RFIComment[]): string[] {
  try {
    // Common skill keywords to look for
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'rust', 'solidity', 'react', 'vue', 
      'angular', 'node', 'web3', 'blockchain', 'smart contract', 'frontend', 
      'backend', 'fullstack', 'design', 'ui', 'ux', 'product management', 
      'project management', 'defi', 'nft', 'dao', 'tokenomics', 'security',
      'testing', 'qa', 'devops', 'machine learning', 'ai', 'data science',
      'marketing', 'community', 'research', 'legal', 'governance'
    ];
    
    // Combine all comment text
    const commentText = comments
      .map(comment => comment.text.toLowerCase())
      .join(' ');
    
    // Find skill matches
    const matches = skillKeywords.filter(skill => 
      commentText.includes(skill.toLowerCase())
    );
    
    // Deduplicate and format
    return [...new Set(matches)].map(skill => 
      skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );
  } catch (error) {
    log(`Error extracting skills from comments: ${error.message}`, 'rfi-conversion');
    return [];
  }
}

/**
 * Estimate a default funding goal based on categories
 */
function estimateDefaultFundingGoal(categories: string[]): number {
  // Baseline funding amount
  let baseAmount = 5000;
  
  // Category-based adjustments
  const categoryModifiers: Record<string, number> = {
    'Research': 10000,
    'Development': 7500,
    'Infrastructure': 15000,
    'Education': 3000,
    'Social Impact': 5000,
    'DeFi': 12000,
    'NFT': 8000,
    'DAO': 12000,
    'Governance': 7000,
    'Security': 15000,
    'Privacy': 10000,
    'Scalability': 20000,
    'Interoperability': 15000
  };
  
  // Apply category modifiers
  let additionalAmount = 0;
  for (const category of categories) {
    // Match category regardless of case
    const matchedCategory = Object.keys(categoryModifiers).find(key => 
      key.toLowerCase() === category.toLowerCase()
    );
    
    if (matchedCategory) {
      additionalAmount += categoryModifiers[matchedCategory];
    }
  }
  
  // Calculate total with diminishing returns for multiple categories
  const totalAmount = baseAmount + (additionalAmount / Math.sqrt(categories.length || 1));
  
  // Round to nearest $1000
  return Math.round(totalAmount / 1000) * 1000;
}

/**
 * Generate default skills based on categories
 */
function generateDefaultSkills(categories: string[]): string[] {
  const categorySkillMap: Record<string, string[]> = {
    'Research': ['Research', 'Data Analysis', 'Technical Writing'],
    'Development': ['JavaScript', 'TypeScript', 'Smart Contracts'],
    'Infrastructure': ['DevOps', 'Security', 'Networking'],
    'Education': ['Content Creation', 'Community Management', 'Technical Writing'],
    'Social Impact': ['Project Management', 'Community Outreach', 'Metrics Analysis'],
    'DeFi': ['Solidity', 'Financial Modeling', 'Protocol Design'],
    'NFT': ['Web3.js', 'Design', 'Smart Contracts'],
    'DAO': ['Governance Design', 'Smart Contracts', 'Community Management'],
    'Governance': ['Legal Expertise', 'Protocol Design', 'Governance Systems'],
    'Security': ['Security Auditing', 'Blockchain Security', 'Cryptography'],
    'Privacy': ['Cryptography', 'ZK-Proofs', 'Protocol Design'],
    'Scalability': ['Layer 2 Solutions', 'Performance Optimization', 'Protocol Design'],
    'Interoperability': ['Cross-chain Development', 'Protocol Design', 'API Integration']
  };
  
  // Collect skills from all categories
  const skills: string[] = [];
  
  for (const category of categories) {
    // Match category regardless of case
    const matchedCategory = Object.keys(categorySkillMap).find(key => 
      key.toLowerCase() === category.toLowerCase()
    );
    
    if (matchedCategory) {
      skills.push(...categorySkillMap[matchedCategory]);
    }
  }
  
  // Add some default skills for all projects
  const defaultSkills = ['Project Management', 'Documentation', 'Testing'];
  skills.push(...defaultSkills);
  
  // Deduplicate
  return [...new Set(skills)];
}

/**
 * Calculate expiration date for an RFP (90 days from now)
 */
function calculateRFPExpirationDate(): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 90);
  return expirationDate;
}

/**
 * Get trending RFIs (most votes in the last 7 days)
 */
export async function getTrendingRFIs(limit: number = 10): Promise<RFI[]> {
  try {
    log(`Getting trending RFIs (limit: ${limit})`, 'rfi-conversion');
    
    // Calculate date for "last 7 days"
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get all published RFIs
    const rfis = await storage.getActiveRFIs();
    
    // Filter and sort RFIs based on recent votes
    const sortedRFIs = rfis
      .map(rfi => {
        // Count recent votes
        const recentVotes = rfi.votes.filter(vote => 
          vote.createdAt >= sevenDaysAgo
        ).reduce((total, vote) => total + vote.value, 0);
        
        return {
          rfi,
          recentVotes
        };
      })
      .sort((a, b) => b.recentVotes - a.recentVotes || b.rfi.voteCount - a.rfi.voteCount)
      .map(item => item.rfi)
      .slice(0, limit);
    
    log(`Found ${sortedRFIs.length} trending RFIs`, 'rfi-conversion');
    
    return sortedRFIs;
  } catch (error) {
    log(`Error getting trending RFIs: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}

/**
 * Check and update expired RFIs
 */
export async function checkAndUpdateExpiredRFIs(): Promise<number> {
  try {
    log('Checking for expired RFIs', 'rfi-conversion');
    
    // Get all published RFIs
    const rfis = await storage.getActiveRFIs();
    
    // Current date
    const now = new Date();
    
    // Track how many RFIs were expired
    let expiredCount = 0;
    
    // Check each RFI
    for (const rfi of rfis) {
      if (rfi.expirationDate && rfi.expirationDate < now && rfi.status === RFIStatus.PUBLISHED) {
        // RFI has expired
        const updatedRFI = {
          ...rfi,
          status: RFIStatus.EXPIRED,
          updatedAt: now
        };
        
        await storage.updateRFI(rfi.id, updatedRFI);
        expiredCount++;
        
        log(`RFI ${rfi.id} marked as expired`, 'rfi-conversion');
      }
    }
    
    log(`Updated ${expiredCount} expired RFIs`, 'rfi-conversion');
    
    return expiredCount;
  } catch (error) {
    log(`Error checking expired RFIs: ${error.message}`, 'rfi-conversion');
    throw error;
  }
}