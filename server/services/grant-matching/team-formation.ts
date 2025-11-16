/**
 * HyperCrowd Team Formation System
 * 
 * This service helps users form project teams based on complementary skills:
 * 1. Team member recommendations based on skills and reputation
 * 2. Team collaboration tools and communication
 * 3. Role assignment and responsibility management
 * 4. Team reputation scoring for grant applications
 */

import { log } from '../../utils/logger';
import { storage } from '../../storage';
import { smartAI } from '../redundancy/ai/smart-ai-service';
import { recordReputationActivity, calculateRepScore } from '../reputation';
import { calculateSemanticSimilarity } from '../ai-utils';

// Import types
import type { 
  User, 
  Project, 
  ProjectTeamMember, 
  ProjectProposal,
  TeamInvitation,
  TeamRecommendation,
  UserSkill,
  RFP
} from '../../../shared/schema';

// Constants
const MAX_TEAM_SIZE = 10;
const DEFAULT_RECOMMENDATION_COUNT = 5;
const MATCHING_THRESHOLD = 0.6; // 60% match or better
const REPUTATION_WEIGHT = 0.3;
const SKILL_MATCH_WEIGHT = 0.5;
const ACTIVITY_WEIGHT = 0.2;

// Request statuses
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Find team member recommendations based on project needs
 */
export async function findTeamRecommendations(
  projectOrProposalId: number,
  isProposal: boolean,
  userId: number,
  count: number = DEFAULT_RECOMMENDATION_COUNT
): Promise<TeamRecommendation[]> {
  try {
    log(`Finding team recommendations for ${isProposal ? 'proposal' : 'project'} ${projectOrProposalId}`, 'team-formation');
    
    // Get project/proposal data
    let skills: string[] = [];
    let title: string = '';
    let description: string = '';
    let existingTeamMemberIds: number[] = [];
    let rfpId: number | null = null;
    
    if (isProposal) {
      const proposal = await storage.getProjectProposal(projectOrProposalId);
      if (!proposal) {
        throw new Error(`Proposal with ID ${projectOrProposalId} not found`);
      }
      
      skills = proposal.skillsRequired || [];
      title = proposal.title;
      description = proposal.description;
      existingTeamMemberIds = proposal.teamMembers.map(tm => tm.userId);
      rfpId = proposal.rfpId;
    } else {
      const project = await storage.getProjectById(projectOrProposalId);
      if (!project) {
        throw new Error(`Project with ID ${projectOrProposalId} not found`);
      }
      
      skills = project.skillsRequired || [];
      title = project.title;
      description = project.description;
      existingTeamMemberIds = project.teamMembers.map(tm => tm.userId);
      rfpId = project.rfpId;
    }
    
    // Get RFP data if available
    if (rfpId) {
      const rfp = await storage.getRfpById(rfpId);
      if (rfp && rfp.skillsRequired && rfp.skillsRequired.length > 0) {
        // Add any missing skills from the RFP
        rfp.skillsRequired.forEach(skill => {
          if (!skills.includes(skill)) {
            skills.push(skill);
          }
        });
      }
    }
    
    // If no skills are specified, extract them from description
    if (skills.length === 0) {
      skills = await extractSkillsFromDescription(title, description);
    }
    
    log(`Looking for users with skills: ${skills.join(', ')}`, 'team-formation');
    
    // Get users with relevant skills
    const users = await storage.getUsersBySkills(skills);
    
    // Filter out existing team members and the requester
    const filteredUsers = users.filter(user => 
      !existingTeamMemberIds.includes(user.id) && user.id !== userId
    );
    
    // Calculate match scores for each user
    const recommendations: TeamRecommendation[] = await Promise.all(
      filteredUsers.map(async user => {
        // Calculate skill match score
        const skillMatchScore = calculateSkillMatchScore(skills, user.skills || []);
        
        // Get user reputation
        const repScore = await calculateRepScore(user.id) || 0;
        
        // Get activity score (proxy by recent reputation activity)
        const activityScore = await calculateUserActivityScore(user.id);
        
        // Calculate combined score with weights
        const combinedScore = 
          (skillMatchScore * SKILL_MATCH_WEIGHT) +
          (Math.min(repScore / 100, 1) * REPUTATION_WEIGHT) +
          (activityScore * ACTIVITY_WEIGHT);
        
        // Suggested role based on skills
        const suggestedRole = determineSuggestedRole(user.skills || [], skills);
        
        return {
          userId: user.id,
          username: user.username,
          skills: user.skills || [],
          matchScore: combinedScore,
          reputationScore: repScore,
          suggestedRole,
          profileImageUrl: user.profileImageUrl || null,
          bio: user.bio || null,
          matchingSkills: user.skills?.filter(skill => 
            skills.some(s => s.toLowerCase() === skill.toLowerCase())
          ) || []
        };
      })
    );
    
    // Sort by match score and limit results
    const sortedRecommendations = recommendations
      .filter(rec => rec.matchScore >= MATCHING_THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, count);
    
    log(`Found ${sortedRecommendations.length} team recommendations`, 'team-formation');
    
    return sortedRecommendations;
  } catch (error) {
    log(`Error finding team recommendations: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Extract skills from project description using AI if available
 */
async function extractSkillsFromDescription(
  title: string,
  description: string
): Promise<string[]> {
  try {
    // Try to extract skills using AI
    try {
      if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.PERPLEXITY_API_KEY) {
        const prompt = `
Based on the following project information, identify the technical and non-technical skills that would be needed for the project team.

TITLE: ${title}
DESCRIPTION: ${description}

Return ONLY a comma-separated list of skills (e.g., JavaScript, Smart Contract Development, UX Design, Project Management).
Do not include any other text in your response.
`;

        const aiResponse = await smartAI.complete({
          prompt,
          max_tokens: 100,
          temperature: 0.3
        });
        
        // Parse the comma-separated skills
        const skills = aiResponse.content
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
        
        if (skills.length > 0) {
          return skills;
        }
      }
    } catch (aiError) {
      log(`Error extracting skills with AI: ${aiError.message}`, 'team-formation');
      // Continue with fallback extraction
    }
    
    // Fallback: Extract based on common skill keywords
    return extractSkillsFromText(description);
  } catch (error) {
    log(`Error extracting skills from description: ${error.message}`, 'team-formation');
    return getDefaultSkills();
  }
}

/**
 * Extract skills from text using keyword matching
 */
function extractSkillsFromText(text: string): string[] {
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
    
    // Normalize text
    const normalizedText = text.toLowerCase();
    
    // Find skill matches
    const matches = skillKeywords.filter(skill => 
      normalizedText.includes(skill.toLowerCase())
    );
    
    // Deduplicate and format
    return [...new Set(matches)].map(skill => 
      skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );
  } catch (error) {
    log(`Error extracting skills from text: ${error.message}`, 'team-formation');
    return getDefaultSkills();
  }
}

/**
 * Get default skills when extraction fails
 */
function getDefaultSkills(): string[] {
  return [
    'JavaScript',
    'Solidity',
    'Smart Contracts',
    'Project Management',
    'Design',
    'Community Management'
  ];
}

/**
 * Calculate skill match score between required skills and user skills
 */
function calculateSkillMatchScore(requiredSkills: string[], userSkills: string[]): number {
  if (requiredSkills.length === 0 || userSkills.length === 0) {
    return 0;
  }
  
  // Count matching skills (case-insensitive)
  const matchingSkills = requiredSkills.filter(skill => 
    userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
  );
  
  // Calculate match percentage
  return matchingSkills.length / requiredSkills.length;
}

/**
 * Calculate user activity score (0-1) based on recent activity
 */
async function calculateUserActivityScore(userId: number): Promise<number> {
  try {
    // Get recent reputation activities as a proxy for overall activity
    const recentActivities = await storage.getUserRecentReputationActivities(userId, 30); // Last 30 days
    
    if (!recentActivities || recentActivities.length === 0) {
      return 0;
    }
    
    // Calculate activity score (0-1) based on number of activities
    // More than 20 activities in a month is considered very active (1.0)
    return Math.min(recentActivities.length / 20, 1);
  } catch (error) {
    log(`Error calculating user activity score: ${error.message}`, 'team-formation');
    return 0.5; // Default to middle value on error
  }
}

/**
 * Determine suggested role based on skills
 */
function determineSuggestedRole(userSkills: string[], projectSkills: string[]): string {
  try {
    // Define role categories with associated skills
    const roleMappings: Record<string, string[]> = {
      'Frontend Developer': ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML', 'CSS', 'UI', 'UX', 'Frontend'],
      'Backend Developer': ['Node', 'Express', 'API', 'Database', 'Server', 'Backend'],
      'Blockchain Developer': ['Solidity', 'Smart Contract', 'Web3', 'Blockchain', 'DeFi', 'NFT', 'DAO'],
      'Designer': ['Design', 'UI', 'UX', 'Figma', 'Adobe', 'Graphics'],
      'Project Manager': ['Project Management', 'Coordination', 'Planning', 'Agile', 'Scrum'],
      'Community Manager': ['Community', 'Marketing', 'Social Media', 'Engagement', 'Communication'],
      'Researcher': ['Research', 'Analysis', 'Data Science', 'Financial Modeling']
    };
    
    // Count matches for each role
    const roleScores: Record<string, number> = {};
    
    for (const [role, roleSkills] of Object.entries(roleMappings)) {
      // Count user skills that match this role
      const matchCount = userSkills.filter(skill => 
        roleSkills.some(roleSkill => 
          skill.toLowerCase().includes(roleSkill.toLowerCase()) || 
          roleSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      
      roleScores[role] = matchCount;
    }
    
    // Find the role with the highest score
    let bestRole = 'Team Member';
    let highestScore = 0;
    
    for (const [role, score] of Object.entries(roleScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestRole = role;
      }
    }
    
    // Return the best matching role
    return bestRole;
  } catch (error) {
    log(`Error determining suggested role: ${error.message}`, 'team-formation');
    return 'Team Member'; // Default fallback role
  }
}

/**
 * Create a team invitation for a project or proposal
 */
export async function createTeamInvitation(
  fromUserId: number,
  toUserId: number,
  projectOrProposalId: number,
  isProposal: boolean,
  role: string,
  message: string
): Promise<TeamInvitation> {
  try {
    log(`Creating team invitation from user ${fromUserId} to user ${toUserId}`, 'team-formation');
    
    // Verify the sender is the project/proposal owner
    if (isProposal) {
      const proposal = await storage.getProjectProposal(projectOrProposalId);
      if (!proposal) {
        throw new Error(`Proposal with ID ${projectOrProposalId} not found`);
      }
      
      if (proposal.creatorId !== fromUserId) {
        throw new Error(`User ${fromUserId} is not the creator of proposal ${projectOrProposalId}`);
      }
      
      // Check if team is already full
      if (proposal.teamMembers.length >= MAX_TEAM_SIZE) {
        throw new Error(`Team for proposal ${projectOrProposalId} is already at maximum size (${MAX_TEAM_SIZE})`);
      }
      
      // Check if user is already on the team
      if (proposal.teamMembers.some(member => member.userId === toUserId)) {
        throw new Error(`User ${toUserId} is already a member of the team for proposal ${projectOrProposalId}`);
      }
    } else {
      const project = await storage.getProjectById(projectOrProposalId);
      if (!project) {
        throw new Error(`Project with ID ${projectOrProposalId} not found`);
      }
      
      if (project.creatorId !== fromUserId) {
        throw new Error(`User ${fromUserId} is not the creator of project ${projectOrProposalId}`);
      }
      
      // Check if team is already full
      if (project.teamMembers.length >= MAX_TEAM_SIZE) {
        throw new Error(`Team for project ${projectOrProposalId} is already at maximum size (${MAX_TEAM_SIZE})`);
      }
      
      // Check if user is already on the team
      if (project.teamMembers.some(member => member.userId === toUserId)) {
        throw new Error(`User ${toUserId} is already a member of the team for project ${projectOrProposalId}`);
      }
    }
    
    // Check if there is already a pending invitation
    const existingInvitation = await storage.getTeamInvitationByUserAndTarget(
      fromUserId,
      toUserId,
      projectOrProposalId,
      isProposal
    );
    
    if (existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
      throw new Error(`User ${toUserId} already has a pending invitation for this ${isProposal ? 'proposal' : 'project'}`);
    }
    
    // Create expiration date (7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    
    // Create the invitation
    const invitation: TeamInvitation = {
      id: 0, // Will be set by storage
      fromUserId,
      toUserId,
      projectId: isProposal ? null : projectOrProposalId,
      proposalId: isProposal ? projectOrProposalId : null,
      role,
      message,
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      respondedAt: null,
      expiresAt: expirationDate
    };
    
    // Save the invitation
    const savedInvitation = await storage.createTeamInvitation(invitation);
    
    log(`Created team invitation ${savedInvitation.id}`, 'team-formation');
    
    // Record in reputation system
    try {
      await recordReputationActivity(fromUserId, 'team_invitation_sent', 1, {
        invitationId: savedInvitation.id,
        invitedUserId: toUserId
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'team-formation');
    }
    
    return savedInvitation;
  } catch (error) {
    log(`Error creating team invitation: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Respond to a team invitation (accept or reject)
 */
export async function respondToTeamInvitation(
  invitationId: number,
  userId: number,
  accept: boolean
): Promise<TeamInvitation> {
  try {
    log(`User ${userId} ${accept ? 'accepting' : 'rejecting'} invitation ${invitationId}`, 'team-formation');
    
    // Get the invitation
    const invitation = await storage.getTeamInvitation(invitationId);
    if (!invitation) {
      throw new Error(`Invitation with ID ${invitationId} not found`);
    }
    
    // Verify this invitation is for the correct user
    if (invitation.toUserId !== userId) {
      throw new Error(`Invitation ${invitationId} is not for user ${userId}`);
    }
    
    // Check if the invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error(`Invitation ${invitationId} has already been ${invitation.status}`);
    }
    
    // Check if the invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Update invitation status to expired
      const expiredInvitation = {
        ...invitation,
        status: InvitationStatus.EXPIRED,
        updatedAt: new Date()
      };
      
      await storage.updateTeamInvitation(invitationId, expiredInvitation);
      
      throw new Error(`Invitation ${invitationId} has expired`);
    }
    
    // Update the invitation status
    const updatedInvitation = {
      ...invitation,
      status: accept ? InvitationStatus.ACCEPTED : InvitationStatus.REJECTED,
      respondedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save the updated invitation
    const savedInvitation = await storage.updateTeamInvitation(invitationId, updatedInvitation);
    
    // If accepted, add the user to the team
    if (accept) {
      if (invitation.proposalId) {
        // Add to proposal team
        await addUserToProposalTeam(invitation.proposalId, userId, invitation.role);
      } else if (invitation.projectId) {
        // Add to project team
        await addUserToProjectTeam(invitation.projectId, userId, invitation.role);
      }
      
      // Record reputation activities
      try {
        // For the person accepting the invitation
        await recordReputationActivity(userId, 'team_invitation_accepted', 3, {
          invitationId
        });
        
        // For the person who sent the invitation
        await recordReputationActivity(invitation.fromUserId, 'team_member_joined', 2, {
          invitationId,
          userId
        });
      } catch (repError) {
        log(`Failed to record reputation activity: ${repError.message}`, 'team-formation');
      }
    } else {
      // Record reputation activity for rejection
      try {
        await recordReputationActivity(userId, 'team_invitation_rejected', 0, {
          invitationId
        });
      } catch (repError) {
        log(`Failed to record reputation activity: ${repError.message}`, 'team-formation');
      }
    }
    
    log(`User ${userId} ${accept ? 'accepted' : 'rejected'} invitation ${invitationId}`, 'team-formation');
    
    return savedInvitation;
  } catch (error) {
    log(`Error responding to team invitation: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Add a user to a project team
 */
async function addUserToProjectTeam(
  projectId: number,
  userId: number,
  role: string
): Promise<void> {
  try {
    // Get the project
    const project = await storage.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    // Get user details
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Create team member
    const teamMember: ProjectTeamMember = {
      userId,
      role,
      skills: user.skills || [],
      contributions: `${role} responsibilities`,
      joinedAt: new Date(),
      status: 'active'
    };
    
    // Add to team
    const updatedTeam = [...project.teamMembers, teamMember];
    
    // Update project
    const updatedProject = {
      ...project,
      teamMembers: updatedTeam,
      updatedAt: new Date()
    };
    
    // Save the updated project
    await storage.updateProject(projectId, updatedProject);
    
    log(`Added user ${userId} to project ${projectId} team as ${role}`, 'team-formation');
  } catch (error) {
    log(`Error adding user to project team: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Add a user to a proposal team
 */
async function addUserToProposalTeam(
  proposalId: number,
  userId: number,
  role: string
): Promise<void> {
  try {
    // Get the proposal
    const proposal = await storage.getProjectProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found`);
    }
    
    // Get user details
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Create team member
    const teamMember: ProjectTeamMember = {
      userId,
      role,
      skills: user.skills || [],
      contributions: `${role} responsibilities`,
      joinedAt: new Date(),
      status: 'active'
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
    await storage.updateProjectProposal(proposalId, updatedProposal);
    
    log(`Added user ${userId} to proposal ${proposalId} team as ${role}`, 'team-formation');
  } catch (error) {
    log(`Error adding user to proposal team: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Remove a user from a team
 */
export async function removeTeamMember(
  projectOrProposalId: number,
  isProposal: boolean,
  userId: number,
  memberIdToRemove: number,
  reason: string
): Promise<void> {
  try {
    log(`Removing user ${memberIdToRemove} from ${isProposal ? 'proposal' : 'project'} ${projectOrProposalId}`, 'team-formation');
    
    // Verify the requester is the project/proposal owner
    if (isProposal) {
      const proposal = await storage.getProjectProposal(projectOrProposalId);
      if (!proposal) {
        throw new Error(`Proposal with ID ${projectOrProposalId} not found`);
      }
      
      // Only the creator can remove members
      if (proposal.creatorId !== userId) {
        throw new Error(`User ${userId} is not authorized to remove team members from proposal ${projectOrProposalId}`);
      }
      
      // Cannot remove the creator
      if (memberIdToRemove === proposal.creatorId) {
        throw new Error(`Cannot remove the creator from the team`);
      }
      
      // Check if the member exists in the team
      if (!proposal.teamMembers.some(member => member.userId === memberIdToRemove)) {
        throw new Error(`User ${memberIdToRemove} is not a member of the team for proposal ${projectOrProposalId}`);
      }
      
      // Filter out the member to remove
      const updatedTeam = proposal.teamMembers.filter(member => member.userId !== memberIdToRemove);
      
      // Update proposal
      const updatedProposal = {
        ...proposal,
        teamMembers: updatedTeam,
        updatedAt: new Date()
      };
      
      // Save the updated proposal
      await storage.updateProjectProposal(projectOrProposalId, updatedProposal);
    } else {
      const project = await storage.getProjectById(projectOrProposalId);
      if (!project) {
        throw new Error(`Project with ID ${projectOrProposalId} not found`);
      }
      
      // Only the creator can remove members
      if (project.creatorId !== userId) {
        throw new Error(`User ${userId} is not authorized to remove team members from project ${projectOrProposalId}`);
      }
      
      // Cannot remove the creator
      if (memberIdToRemove === project.creatorId) {
        throw new Error(`Cannot remove the creator from the team`);
      }
      
      // Check if the member exists in the team
      if (!project.teamMembers.some(member => member.userId === memberIdToRemove)) {
        throw new Error(`User ${memberIdToRemove} is not a member of the team for project ${projectOrProposalId}`);
      }
      
      // Filter out the member to remove
      const updatedTeam = project.teamMembers.filter(member => member.userId !== memberIdToRemove);
      
      // Update project
      const updatedProject = {
        ...project,
        teamMembers: updatedTeam,
        updatedAt: new Date()
      };
      
      // Save the updated project
      await storage.updateProject(projectOrProposalId, updatedProject);
    }
    
    // Record in reputation system
    try {
      await recordReputationActivity(userId, 'team_member_removed', 0, {
        projectOrProposalId,
        isProposal,
        removedUserId: memberIdToRemove,
        reason
      });
    } catch (repError) {
      log(`Failed to record reputation activity: ${repError.message}`, 'team-formation');
    }
    
    log(`Removed user ${memberIdToRemove} from ${isProposal ? 'proposal' : 'project'} ${projectOrProposalId}`, 'team-formation');
  } catch (error) {
    log(`Error removing team member: ${error.message}`, 'team-formation');
    throw error;
  }
}

/**
 * Calculate team strength score (0-1) based on skills match and reputation
 */
export async function calculateTeamStrengthScore(
  projectOrProposalId: number,
  isProposal: boolean
): Promise<{ 
  overallScore: number; 
  skillCoverage: number;
  reputationScore: number;
  diversityScore: number;
  missingSkills: string[];
}> {
  try {
    log(`Calculating team strength for ${isProposal ? 'proposal' : 'project'} ${projectOrProposalId}`, 'team-formation');
    
    // Get project/proposal data
    let requiredSkills: string[] = [];
    let teamMembers: ProjectTeamMember[] = [];
    let rfpId: number | null = null;
    
    if (isProposal) {
      const proposal = await storage.getProjectProposal(projectOrProposalId);
      if (!proposal) {
        throw new Error(`Proposal with ID ${projectOrProposalId} not found`);
      }
      
      requiredSkills = proposal.skillsRequired || [];
      teamMembers = proposal.teamMembers;
      rfpId = proposal.rfpId;
    } else {
      const project = await storage.getProjectById(projectOrProposalId);
      if (!project) {
        throw new Error(`Project with ID ${projectOrProposalId} not found`);
      }
      
      requiredSkills = project.skillsRequired || [];
      teamMembers = project.teamMembers;
      rfpId = project.rfpId;
    }
    
    // Get RFP data if available
    if (rfpId) {
      const rfp = await storage.getRfpById(rfpId);
      if (rfp && rfp.skillsRequired && rfp.skillsRequired.length > 0) {
        // Add any missing skills from the RFP
        rfp.skillsRequired.forEach(skill => {
          if (!requiredSkills.includes(skill)) {
            requiredSkills.push(skill);
          }
        });
      }
    }
    
    // If still no required skills, use team skills as the baseline
    if (requiredSkills.length === 0) {
      const allTeamSkills = teamMembers.flatMap(member => member.skills || []);
      requiredSkills = [...new Set(allTeamSkills)];
    }
    
    // Get user details for reputation scores
    const teamUserIds = teamMembers.map(member => member.userId);
    const teamUsers = await Promise.all(
      teamUserIds.map(userId => storage.getUserById(userId))
    );
    
    // Calculate reputation scores
    const reputationScores = await Promise.all(
      teamUserIds.map(userId => calculateRepScore(userId).catch(() => 0))
    );
    
    // Calculate average team reputation (0-1)
    const avgReputation = reputationScores.length > 0
      ? reputationScores.reduce((sum, score) => sum + (score / 100), 0) / reputationScores.length
      : 0;
    
    // Calculate skill coverage
    const teamSkills = teamMembers.flatMap(member => member.skills || []);
    const uniqueTeamSkills = [...new Set(teamSkills)];
    
    const coveredSkills = requiredSkills.filter(skill => 
      uniqueTeamSkills.some(teamSkill => 
        teamSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    
    const skillCoverage = requiredSkills.length > 0
      ? coveredSkills.length / requiredSkills.length
      : 0;
    
    // Calculate missing skills
    const missingSkills = requiredSkills.filter(skill => 
      !uniqueTeamSkills.some(teamSkill => 
        teamSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    
    // Calculate skill diversity (higher is better)
    const roleCount = new Set(teamMembers.map(member => member.role)).size;
    const diversityScore = Math.min(roleCount / 3, 1); // Normalize to 0-1, at least 3 roles for max score
    
    // Calculate overall score with weights
    const overallScore = (
      (skillCoverage * 0.5) + 
      (avgReputation * 0.3) + 
      (diversityScore * 0.2)
    );
    
    log(`Team strength calculated for ${isProposal ? 'proposal' : 'project'} ${projectOrProposalId}: ${overallScore.toFixed(2)}`, 'team-formation');
    
    return {
      overallScore,
      skillCoverage,
      reputationScore: avgReputation,
      diversityScore,
      missingSkills
    };
  } catch (error) {
    log(`Error calculating team strength: ${error.message}`, 'team-formation');
    throw error;
  }
}