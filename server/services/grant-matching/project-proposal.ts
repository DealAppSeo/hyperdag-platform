/**
 * HyperCrowd Project Proposal Submission System
 * 
 * This service handles the entire lifecycle of project proposals:
 * 1. Proposal creation and validation
 * 2. Team formation and management
 * 3. Submission to grant providers
 * 4. Proposal scoring and evaluation
 * 5. Automated feedback and improvements
 */

import { log } from '../../utils/logger';
import { storage } from '../../storage';
import { smartAI } from '../redundancy/ai/smart-ai-service';
import { redundantStorage } from '../redundancy/storage/redundant-storage-service';
import { recordReputationActivity } from '../reputation';
import { MilestoneStatus } from './funding-distribution';

// Import types
import type { 
  Project, 
  ProjectProposal, 
  RFP, 
  User, 
  ProjectTeamMember,
  ProposalReview,
  Milestone
} from '../../../shared/schema';

// Proposal status types
export enum ProposalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISIONS_REQUESTED = 'revisions_requested',
  FUNDED = 'funded'
}

// Review status types
export enum ReviewStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

// Constants
const MIN_PROPOSAL_SCORE = 0.6; // 60% minimum score for automated approval
const MAX_TEAM_SIZE = 10;
const DEFAULT_MILESTONE_COUNT = 5;

/**
 * Create a new project proposal from an RFP
 */
export async function createProjectProposal(
  rfpId: number,
  userId: number,
  initialData?: Partial<ProjectProposal>
): Promise<ProjectProposal> {
  try {
    log(`Creating project proposal for RFP ${rfpId} by user ${userId}`, 'proposal');
    
    // Get RFP details
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      throw new Error(`RFP with ID ${rfpId} not found`);
    }
    
    // Get user details
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Generate initial milestones based on RFP if not provided
    let milestones: Partial<Milestone>[] = [];
    
    if (initialData?.milestones && initialData.milestones.length > 0) {
      milestones = initialData.milestones;
    } else {
      // Generate default milestones
      milestones = await generateDefaultMilestones(rfp, DEFAULT_MILESTONE_COUNT);
    }
    
    // Create the proposal object
    const proposal: ProjectProposal = {
      id: 0, // Will be set by storage
      rfpId,
      creatorId: userId,
      title: initialData?.title || rfp.title,
      description: initialData?.description || rfp.description,
      abstract: initialData?.abstract || generateAbstract(rfp),
      fundingGoal: initialData?.fundingGoal || rfp.fundingGoal || 0,
      timeline: initialData?.timeline || {
        startDate: new Date(),
        endDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)) // 90 days from now
      },
      status: ProposalStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      teamMembers: initialData?.teamMembers || [{
        userId,
        role: 'Project Lead',
        skills: user.skills || [],
        contributions: 'Project management and coordination',
        joinedAt: new Date()
      }],
      milestones,
      categories: initialData?.categories || rfp.categories || [],
      skillsRequired: initialData?.skillsRequired || rfp.skillsRequired || [],
      impactDescription: initialData?.impactDescription || '',
      budgetBreakdown: initialData?.budgetBreakdown || generateDefaultBudget(rfp.fundingGoal || 0),
      aiEvaluationScore: null,
      communityEvaluationScore: null,
      reviews: [],
      submissionId: null,
      lastReviewed: null
    };
    
    // Save the proposal
    const savedProposal = await storage.createProjectProposal(proposal);
    
    log(`Created project proposal ${savedProposal.id} for RFP ${rfpId}`, 'proposal');
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'proposal_created', 5, {
        proposalId: savedProposal.id,
        rfpId,
        rfpTitle: rfp.title
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'proposal');
    }
    
    return savedProposal;
  } catch (error) {
    log(`Error creating project proposal: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Update an existing project proposal
 */
export async function updateProjectProposal(
  proposalId: number,
  userId: number,
  updates: Partial<ProjectProposal>
): Promise<ProjectProposal> {
  try {
    log(`Updating project proposal ${proposalId} by user ${userId}`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Verify ownership
    if (proposal.creatorId !== userId) {
      // Check if user is a team member with edit permissions
      const teamMember = proposal.teamMembers.find(tm => tm.userId === userId);
      if (!teamMember) {
        throw new Error(`User ${userId} is not authorized to edit proposal ${proposalId}`);
      }
    }
    
    // Check if proposal can be updated
    if (proposal.status !== ProposalStatus.DRAFT && 
        proposal.status !== ProposalStatus.REVISIONS_REQUESTED) {
      throw new Error(`Proposal ${proposalId} cannot be updated in its current status: ${proposal.status}`);
    }
    
    // Prepare updated proposal
    const updatedProposal = {
      ...proposal,
      ...updates,
      updatedAt: new Date(),
      // Preserve values that shouldn't be directly updated
      id: proposal.id,
      rfpId: proposal.rfpId,
      creatorId: proposal.creatorId,
      createdAt: proposal.createdAt,
      submissionId: proposal.submissionId,
      aiEvaluationScore: proposal.aiEvaluationScore, // These should be updated via separate methods
      communityEvaluationScore: proposal.communityEvaluationScore,
      reviews: proposal.reviews
    };
    
    // If specifically updating milestones, reset its status
    if (updates.milestones) {
      updatedProposal.milestones = updates.milestones.map(milestone => ({
        ...milestone,
        status: milestone.status || MilestoneStatus.PENDING,
        updatedAt: new Date()
      }));
    }
    
    // Save the updated proposal
    const result = await storage.updateProjectProposal(proposalId, updatedProposal);
    
    log(`Updated project proposal ${proposalId}`, 'proposal');
    
    return result;
  } catch (error) {
    log(`Error updating project proposal: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Submit a proposal for review
 */
export async function submitProposalForReview(
  proposalId: number,
  userId: number
): Promise<ProjectProposal> {
  try {
    log(`Submitting proposal ${proposalId} for review by user ${userId}`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Verify ownership
    if (proposal.creatorId !== userId) {
      throw new Error(`User ${userId} is not authorized to submit proposal ${proposalId}`);
    }
    
    // Check if proposal can be submitted
    if (proposal.status !== ProposalStatus.DRAFT && 
        proposal.status !== ProposalStatus.REVISIONS_REQUESTED) {
      throw new Error(`Proposal ${proposalId} cannot be submitted in its current status: ${proposal.status}`);
    }
    
    // Validate proposal completeness
    const validationResult = await validateProposal(proposal);
    if (!validationResult.valid) {
      throw new Error(`Proposal validation failed: ${validationResult.message}`);
    }
    
    // Update proposal status
    const updatedProposal = {
      ...proposal,
      status: ProposalStatus.SUBMITTED,
      updatedAt: new Date(),
      submittedAt: new Date()
    };
    
    // Store a copy in redundant storage for verification
    try {
      const submissionData = {
        ...proposal,
        submittedAt: new Date().toISOString(),
        submittedBy: userId
      };
      
      const cid = await redundantStorage.storeJSON(
        `proposals/${proposalId}/submission.json`,
        submissionData
      );
      
      if (cid) {
        updatedProposal.submissionId = cid;
      }
    } catch (storageError) {
      log(`Failed to store proposal in redundant storage: ${storageError.message}`, 'proposal');
      // Continue despite storage error
    }
    
    // Save the updated proposal
    const result = await storage.updateProjectProposal(proposalId, updatedProposal);
    
    // Schedule AI evaluation
    try {
      await scheduleAiEvaluation(proposalId);
    } catch (aiError) {
      log(`Failed to schedule AI evaluation: ${aiError.message}`, 'proposal');
      // Continue despite AI error
    }
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'proposal_submitted', 10, {
        proposalId,
        rfpId: proposal.rfpId
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'proposal');
    }
    
    log(`Successfully submitted proposal ${proposalId} for review`, 'proposal');
    
    return result;
  } catch (error) {
    log(`Error submitting proposal for review: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Add a team member to a proposal
 */
export async function addTeamMember(
  proposalId: number,
  creatorId: number,
  newMember: { 
    userId: number; 
    role: string; 
    skills?: string[];
    contributions: string;
  }
): Promise<ProjectProposal> {
  try {
    log(`Adding team member ${newMember.userId} to proposal ${proposalId}`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Verify creator is making the request
    if (proposal.creatorId !== creatorId) {
      throw new Error(`User ${creatorId} is not authorized to add team members to proposal ${proposalId}`);
    }
    
    // Check if proposal can be edited
    if (proposal.status !== ProposalStatus.DRAFT && 
        proposal.status !== ProposalStatus.REVISIONS_REQUESTED) {
      throw new Error(`Cannot add team members to proposal ${proposalId} in its current status: ${proposal.status}`);
    }
    
    // Check team size limit
    if (proposal.teamMembers.length >= MAX_TEAM_SIZE) {
      throw new Error(`Maximum team size (${MAX_TEAM_SIZE}) reached for proposal ${proposalId}`);
    }
    
    // Check if user already exists in team
    if (proposal.teamMembers.some(tm => tm.userId === newMember.userId)) {
      throw new Error(`User ${newMember.userId} is already a team member of proposal ${proposalId}`);
    }
    
    // Get user details and skills if not provided
    if (!newMember.skills || newMember.skills.length === 0) {
      const user = await storage.getUserById(newMember.userId);
      if (user && user.skills) {
        newMember.skills = user.skills;
      }
    }
    
    // Create team member entry
    const teamMember: ProjectTeamMember = {
      userId: newMember.userId,
      role: newMember.role,
      skills: newMember.skills || [],
      contributions: newMember.contributions,
      joinedAt: new Date(),
      status: 'pending' // Requires confirmation from the user
    };
    
    // Add to team
    const updatedTeam = [...proposal.teamMembers, teamMember];
    
    // Update proposal
    const updatedProposal = {
      ...proposal,
      teamMembers: updatedTeam,
      updatedAt: new Date()
    };
    
    // Save the updated proposal
    const result = await storage.updateProjectProposal(proposalId, updatedProposal);
    
    // Create an invitation record
    await storage.createTeamInvitation({
      proposalId,
      fromUserId: creatorId,
      toUserId: newMember.userId,
      role: newMember.role,
      contributions: newMember.contributions,
      createdAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days from now
    });
    
    log(`Added team member ${newMember.userId} to proposal ${proposalId}`, 'proposal');
    
    return result;
  } catch (error) {
    log(`Error adding team member: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Accept or reject a team member invitation
 */
export async function respondToTeamInvitation(
  invitationId: number,
  userId: number,
  accept: boolean
): Promise<any> {
  try {
    log(`User ${userId} ${accept ? 'accepting' : 'rejecting'} team invitation ${invitationId}`, 'proposal');
    
    // Get the invitation
    const invitation = await storage.getTeamInvitation(invitationId);
    if (!invitation) {
      throw new Error(`Invitation with ID ${invitationId} not found`);
    }
    
    // Verify invitation is for this user
    if (invitation.toUserId !== userId) {
      throw new Error(`Invitation ${invitationId} is not for user ${userId}`);
    }
    
    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      throw new Error(`Invitation ${invitationId} has expired`);
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error(`Invitation ${invitationId} has already been ${invitation.status}`);
    }
    
    // Update invitation status
    const updatedInvitation = {
      ...invitation,
      status: accept ? 'accepted' : 'rejected',
      respondedAt: new Date()
    };
    
    // Save the updated invitation
    await storage.updateTeamInvitation(invitationId, updatedInvitation);
    
    // If accepted, update team member status in the proposal
    if (accept) {
      // Get the proposal
      const proposal = await storage.getProjectProposal(invitation.proposalId);
      if (!proposal) {
        throw new Error(`Proposal with ID ${invitation.proposalId} not found`);
      }
      
      // Update team member status
      const updatedTeam = proposal.teamMembers.map(tm => {
        if (tm.userId === userId) {
          return {
            ...tm,
            status: 'active'
          };
        }
        return tm;
      });
      
      // Update proposal
      const updatedProposal = {
        ...proposal,
        teamMembers: updatedTeam,
        updatedAt: new Date()
      };
      
      // Save the updated proposal
      await storage.updateProjectProposal(invitation.proposalId, updatedProposal);
      
      // Record in reputation system
      try {
        // For user accepting invitation
        await recordReputationActivity(userId, 'joined_project_team', 3, {
          proposalId: invitation.proposalId,
          role: invitation.role
        });
        
        // For project creator
        await recordReputationActivity(proposal.creatorId, 'team_member_joined', 1, {
          proposalId: invitation.proposalId,
          memberId: userId
        });
      } catch (repError) {
        log(`Failed to record reputation activity: ${repError.message}`, 'proposal');
      }
    }
    
    log(`User ${userId} ${accept ? 'accepted' : 'rejected'} team invitation ${invitationId}`, 'proposal');
    
    return updatedInvitation;
  } catch (error) {
    log(`Error responding to team invitation: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Evaluate a proposal using AI
 */
export async function evaluateProposalWithAI(
  proposalId: number
): Promise<{ score: number; feedback: string; strengths: string[]; weaknesses: string[] }> {
  try {
    log(`Evaluating proposal ${proposalId} with AI`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Get the RFP
    const rfp = await storage.getRfpById(proposal.rfpId);
    if (!rfp) {
      throw new Error(`RFP with ID ${proposal.rfpId} not found`);
    }
    
    // Attempt to use AI evaluation
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.PERPLEXITY_API_KEY) {
        throw new Error('No AI provider API keys available');
      }
      
      // Prepare evaluation prompt
      const evaluationPrompt = `
You are an expert grant proposal reviewer with extensive experience in evaluating project proposals.
Please evaluate the following proposal against the requirements in the Request for Proposals (RFP).

RFP DETAILS:
Title: ${rfp.title}
Description: ${rfp.description}
Funding Goal: ${rfp.fundingGoal ? `$${rfp.fundingGoal.toLocaleString()}` : 'Not specified'}
Categories: ${rfp.categories ? rfp.categories.join(', ') : 'Not specified'}
Skills Required: ${rfp.skillsRequired ? rfp.skillsRequired.join(', ') : 'Not specified'}

PROPOSAL DETAILS:
Title: ${proposal.title}
Abstract: ${proposal.abstract}
Description: ${proposal.description}
Funding Requested: $${proposal.fundingGoal.toLocaleString()}
Timeline: ${proposal.timeline.startDate.toLocaleDateString()} to ${proposal.timeline.endDate.toLocaleDateString()}
Team Size: ${proposal.teamMembers.length} members
Categories: ${proposal.categories ? proposal.categories.join(', ') : 'Not specified'}
Skills Provided: ${proposal.teamMembers.flatMap(tm => tm.skills).join(', ')}
Impact Description: ${proposal.impactDescription}

Milestones:
${proposal.milestones.map((m, i) => `${i+1}. ${m.name}: ${m.description}`).join('\n')}

Budget Breakdown:
${Object.entries(proposal.budgetBreakdown).map(([category, amount]) => `${category}: $${amount.toLocaleString()}`).join('\n')}

Based on the above, please provide:
1. An overall evaluation score between 0 and 100
2. A brief paragraph of general feedback
3. 3-5 key strengths of the proposal
4. 3-5 areas for improvement or weaknesses
5. Final recommendation (Approve, Request Revisions, or Reject)

Return your evaluation in JSON format:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "recommendation": "string"
}
`;

      // Use smart AI service to get the evaluation
      const aiResponse = await smartAI.complete({
        prompt: evaluationPrompt,
        max_tokens: 1000,
        temperature: 0.4,
        format: 'json'
      });
      
      // Parse the response
      let evaluation;
      try {
        evaluation = JSON.parse(aiResponse.content);
      } catch (parseError) {
        log(`Failed to parse AI evaluation response: ${parseError.message}`, 'proposal');
        throw new Error('Failed to parse AI evaluation response');
      }
      
      // Save the evaluation to the proposal
      const updatedProposal = {
        ...proposal,
        aiEvaluationScore: evaluation.score / 100, // Convert to 0-1 scale
        lastEvaluated: new Date(),
        status: proposal.status === ProposalStatus.SUBMITTED 
          ? ProposalStatus.UNDER_REVIEW 
          : proposal.status
      };
      
      // Create a review record
      const review: ProposalReview = {
        id: 0, // Will be set by storage
        proposalId,
        reviewerId: null, // AI review
        isAiReview: true,
        score: evaluation.score / 100,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        recommendation: evaluation.recommendation,
        createdAt: new Date(),
        status: ReviewStatus.COMPLETED
      };
      
      // Save the review
      await storage.createProposalReview(review);
      
      // Update the proposal
      await storage.updateProjectProposal(proposalId, updatedProposal);
      
      log(`AI evaluation completed for proposal ${proposalId} with score ${evaluation.score}`, 'proposal');
      
      return {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses
      };
    } catch (aiError) {
      log(`AI evaluation failed: ${aiError.message}`, 'proposal');
      
      // Return a fallback evaluation
      return {
        score: 50, // Neutral score
        feedback: "Automated evaluation failed. Please wait for manual review.",
        strengths: ["Unable to determine strengths due to evaluation error"],
        weaknesses: ["Unable to determine weaknesses due to evaluation error"]
      };
    }
  } catch (error) {
    log(`Error evaluating proposal with AI: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Schedule an AI evaluation for a proposal
 */
async function scheduleAiEvaluation(proposalId: number): Promise<void> {
  try {
    // This could be integrated with the agent system in the future
    // For now, just run the evaluation directly
    await evaluateProposalWithAI(proposalId);
  } catch (error) {
    log(`Error scheduling AI evaluation: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Add a manual review to a proposal
 */
export async function addProposalReview(
  proposalId: number,
  reviewerId: number,
  review: {
    score: number; // 0-1 scale
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  }
): Promise<ProposalReview> {
  try {
    log(`Adding review for proposal ${proposalId} by reviewer ${reviewerId}`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Check if proposal is in a reviewable state
    if (proposal.status !== ProposalStatus.SUBMITTED && 
        proposal.status !== ProposalStatus.UNDER_REVIEW) {
      throw new Error(`Proposal ${proposalId} cannot be reviewed in its current status: ${proposal.status}`);
    }
    
    // Check if reviewer has already submitted a review
    const existingReview = proposal.reviews.find(r => r.reviewerId === reviewerId && !r.isAiReview);
    if (existingReview) {
      throw new Error(`Reviewer ${reviewerId} has already submitted a review for proposal ${proposalId}`);
    }
    
    // Create the review record
    const reviewRecord: ProposalReview = {
      id: 0, // Will be set by storage
      proposalId,
      reviewerId,
      isAiReview: false,
      score: review.score,
      feedback: review.feedback,
      strengths: review.strengths,
      weaknesses: review.weaknesses,
      recommendation: review.recommendation,
      createdAt: new Date(),
      status: ReviewStatus.COMPLETED
    };
    
    // Save the review
    const savedReview = await storage.createProposalReview(reviewRecord);
    
    // Update proposal status and review calculations
    await updateProposalAfterReview(proposalId);
    
    // Record in reputation system
    try {
      await recordReputationActivity(reviewerId, 'submitted_proposal_review', 7, {
        proposalId,
        rfpId: proposal.rfpId
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'proposal');
    }
    
    log(`Added review for proposal ${proposalId} by reviewer ${reviewerId}`, 'proposal');
    
    return savedReview;
  } catch (error) {
    log(`Error adding proposal review: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Update proposal after a review is added
 */
async function updateProposalAfterReview(proposalId: number): Promise<void> {
  try {
    // Get the proposal with reviews
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Calculate combined score from manual reviews
    const manualReviews = proposal.reviews.filter(r => !r.isAiReview);
    let communityScore = null;
    
    if (manualReviews.length > 0) {
      communityScore = manualReviews.reduce((sum, review) => sum + review.score, 0) / manualReviews.length;
    }
    
    // Determine if proposal should be auto-approved or auto-rejected
    let newStatus = ProposalStatus.UNDER_REVIEW;
    
    // If we have both AI and manual scores
    if (proposal.aiEvaluationScore !== null && communityScore !== null) {
      // Calculate combined score (60% manual, 40% AI)
      const combinedScore = (communityScore * 0.6) + (proposal.aiEvaluationScore * 0.4);
      
      // Auto-approve high scores
      if (combinedScore >= MIN_PROPOSAL_SCORE && manualReviews.length >= 2) {
        newStatus = ProposalStatus.APPROVED;
      }
      
      // Auto-reject very low scores with multiple reviews
      if (combinedScore < 0.3 && manualReviews.length >= 3) {
        newStatus = ProposalStatus.REJECTED;
      }
    }
    
    // Update the proposal
    const updatedProposal = {
      ...proposal,
      communityEvaluationScore: communityScore,
      status: newStatus,
      lastReviewed: new Date(),
      updatedAt: new Date()
    };
    
    // Save the updated proposal
    await storage.updateProjectProposal(proposalId, updatedProposal);
    
    // If status changed to approved, handle the approval
    if (newStatus === ProposalStatus.APPROVED) {
      await handleProposalApproval(proposalId);
    }
    
    log(`Updated proposal ${proposalId} after review. New status: ${newStatus}`, 'proposal');
  } catch (error) {
    log(`Error updating proposal after review: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Handle a proposal approval
 */
async function handleProposalApproval(proposalId: number): Promise<void> {
  try {
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Create a project from the proposal
    const project = {
      title: proposal.title,
      description: proposal.description,
      abstract: proposal.abstract,
      creatorId: proposal.creatorId,
      rfpId: proposal.rfpId,
      fundingGoal: proposal.fundingGoal,
      timeline: proposal.timeline,
      teamMembers: proposal.teamMembers.filter(tm => tm.status === 'active'),
      milestones: proposal.milestones,
      categories: proposal.categories,
      skillsRequired: proposal.skillsRequired,
      createdAt: new Date(),
      status: 'active',
      startDate: proposal.timeline.startDate,
      endDate: proposal.timeline.endDate,
      progress: 0,
      proposalId: proposalId,
    };
    
    // Save the project
    const savedProject = await storage.createProject(project);
    
    // Update the proposal with project reference
    const updatedProposal = {
      ...proposal,
      status: ProposalStatus.APPROVED,
      projectId: savedProject.id,
      updatedAt: new Date()
    };
    
    // Save the updated proposal
    await storage.updateProjectProposal(proposalId, updatedProposal);
    
    // Record in reputation system
    try {
      await recordReputationActivity(proposal.creatorId, 'proposal_approved', 15, {
        proposalId,
        rfpId: proposal.rfpId,
        projectId: savedProject.id
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'proposal');
    }
    
    log(`Proposal ${proposalId} approved and project ${savedProject.id} created`, 'proposal');
  } catch (error) {
    log(`Error handling proposal approval: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Convert a proposal to a project
 */
export async function convertProposalToProject(
  proposalId: number,
  adminId: number
): Promise<number> {
  try {
    log(`Converting proposal ${proposalId} to project by admin ${adminId}`, 'proposal');
    
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Verify admin permission (in a real implementation, check admin status)
    const admin = await storage.getUserById(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Error(`User ${adminId} does not have admin privileges`);
    }
    
    // Check if proposal can be approved
    if (proposal.status === ProposalStatus.APPROVED || 
        proposal.status === ProposalStatus.FUNDED) {
      throw new Error(`Proposal ${proposalId} is already approved or funded`);
    }
    
    // Handle the approval
    await handleProposalApproval(proposalId);
    
    // Get the project ID
    const updatedProposal = await storage.getProjectProposal(proposalId);
    
    log(`Manually converted proposal ${proposalId} to project ${updatedProposal.projectId}`, 'proposal');
    
    return updatedProposal.projectId;
  } catch (error) {
    log(`Error converting proposal to project: ${error.message}`, 'proposal');
    throw error;
  }
}

/**
 * Validate a proposal for completeness
 */
async function validateProposal(
  proposal: ProjectProposal
): Promise<{ valid: boolean; message?: string }> {
  try {
    // Check required fields
    if (!proposal.title || proposal.title.trim().length < 5) {
      return { valid: false, message: 'Title is too short or missing' };
    }
    
    if (!proposal.description || proposal.description.trim().length < 50) {
      return { valid: false, message: 'Description is too short or missing' };
    }
    
    if (!proposal.abstract || proposal.abstract.trim().length < 20) {
      return { valid: false, message: 'Abstract is too short or missing' };
    }
    
    if (!proposal.fundingGoal || proposal.fundingGoal <= 0) {
      return { valid: false, message: 'Funding goal must be greater than zero' };
    }
    
    if (!proposal.timeline || !proposal.timeline.startDate || !proposal.timeline.endDate) {
      return { valid: false, message: 'Project timeline is incomplete' };
    }
    
    if (proposal.timeline.startDate >= proposal.timeline.endDate) {
      return { valid: false, message: 'End date must be after start date' };
    }
    
    if (!proposal.teamMembers || proposal.teamMembers.length === 0) {
      return { valid: false, message: 'Project requires at least one team member' };
    }
    
    if (!proposal.milestones || proposal.milestones.length === 0) {
      return { valid: false, message: 'Project requires at least one milestone' };
    }
    
    if (!proposal.categories || proposal.categories.length === 0) {
      return { valid: false, message: 'At least one category must be specified' };
    }
    
    if (!proposal.budgetBreakdown || Object.keys(proposal.budgetBreakdown).length === 0) {
      return { valid: false, message: 'Budget breakdown is missing' };
    }
    
    // Verify team members have required skills
    if (proposal.skillsRequired && proposal.skillsRequired.length > 0) {
      const teamSkills = proposal.teamMembers.flatMap(tm => tm.skills || []);
      const missingSkills = proposal.skillsRequired.filter(skill => 
        !teamSkills.some(ts => ts.toLowerCase() === skill.toLowerCase())
      );
      
      if (missingSkills.length > 0) {
        return { 
          valid: false, 
          message: `Team is missing required skills: ${missingSkills.join(', ')}` 
        };
      }
    }
    
    // All checks passed
    return { valid: true };
  } catch (error) {
    log(`Error validating proposal: ${error.message}`, 'proposal');
    return { valid: false, message: 'Validation error: ' + error.message };
  }
}

/**
 * Generate a default abstract from an RFP
 */
function generateAbstract(rfp: RFP): string {
  // Extract first 1-2 sentences from RFP description
  const sentences = rfp.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) {
    return `Proposal based on "${rfp.title}"`;
  }
  
  if (sentences.length === 1) {
    return sentences[0].trim() + '.';
  }
  
  return sentences.slice(0, 2).map(s => s.trim()).join('. ') + '.';
}

/**
 * Generate default milestones based on an RFP
 */
async function generateDefaultMilestones(
  rfp: RFP,
  count: number
): Promise<Partial<Milestone>[]> {
  try {
    // Try to generate milestones using AI if available
    try {
      if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.PERPLEXITY_API_KEY) {
        const prompt = `
Generate ${count} realistic milestones for a project based on this Request for Proposal:

Title: ${rfp.title}
Description: ${rfp.description}
Categories: ${rfp.categories ? rfp.categories.join(', ') : 'Not specified'}
Skills Required: ${rfp.skillsRequired ? rfp.skillsRequired.join(', ') : 'Not specified'}

For each milestone, provide:
1. A short name (max 50 chars)
2. A brief description of the milestone deliverables (1-2 sentences)
3. Estimated duration in days

Return the milestones as a JSON array:
[
  {
    "name": "string",
    "description": "string",
    "duration": number,
    "deliverables": "string"
  },
  ...
]
`;

        const aiResponse = await smartAI.complete({
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
          format: 'json'
        });
        
        let milestones = JSON.parse(aiResponse.content);
        
        // Calculate dates
        const startDate = new Date();
        let currentDate = new Date(startDate);
        
        return milestones.map((milestone, index) => {
          // Calculate target date based on duration
          const targetDate = new Date(currentDate);
          targetDate.setDate(targetDate.getDate() + milestone.duration);
          
          // Update current date for next milestone
          currentDate = new Date(targetDate);
          
          return {
            id: index + 1,
            name: milestone.name,
            description: milestone.description,
            deliverables: milestone.deliverables,
            startDate: new Date(currentDate),
            targetDate: targetDate,
            status: MilestoneStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
      }
    } catch (aiError) {
      log(`Failed to generate milestones with AI: ${aiError.message}`, 'proposal');
      // Fall back to default milestones
    }
    
    // Generate basic milestones if AI fails
    const milestones: Partial<Milestone>[] = [];
    const projectDuration = 90; // Default 90 days
    const milestoneDuration = projectDuration / count;
    
    const startDate = new Date();
    let currentDate = new Date(startDate);
    
    const defaultMilestoneNames = [
      "Project Setup",
      "Initial Development",
      "Core Features Implementation",
      "Testing and Validation",
      "Final Deliverable",
      "Documentation and Handoff",
      "Beta Release",
      "Performance Optimization",
      "Security Review",
      "Public Launch"
    ];
    
    for (let i = 0; i < count; i++) {
      // Calculate target date
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() + milestoneDuration);
      
      // Create milestone
      milestones.push({
        id: i + 1,
        name: defaultMilestoneNames[i] || `Milestone ${i + 1}`,
        description: `Complete phase ${i + 1} of the ${rfp.title} project`,
        deliverables: `Phase ${i + 1} deliverables as outlined in the project plan`,
        startDate: new Date(currentDate),
        targetDate: targetDate,
        status: MilestoneStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update current date for next milestone
      currentDate = new Date(targetDate);
    }
    
    return milestones;
  } catch (error) {
    log(`Error generating default milestones: ${error.message}`, 'proposal');
    
    // Return very basic milestones on error
    return Array(count).fill(0).map((_, i) => ({
      id: i + 1,
      name: `Milestone ${i + 1}`,
      description: `Complete phase ${i + 1}`,
      deliverables: `Phase ${i + 1} deliverables`,
      status: MilestoneStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }
}

/**
 * Generate a default budget breakdown
 */
function generateDefaultBudget(fundingGoal: number): Record<string, number> {
  const budget: Record<string, number> = {};
  
  // Default allocation percentages
  const allocations = {
    "Development": 0.5,
    "Design": 0.15,
    "Testing": 0.15,
    "Marketing": 0.1,
    "Operations": 0.1
  };
  
  // Apply percentages to funding goal
  for (const [category, percentage] of Object.entries(allocations)) {
    budget[category] = Math.round(fundingGoal * percentage);
  }
  
  return budget;
}