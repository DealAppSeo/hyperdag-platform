/**
 * HyperCrowd Team Recommendation Engine
 * 
 * Intelligently recommends team members from users who have opted into the HyperCrowd ecosystem
 * based on grant requirements, skills matching, and collaboration history
 */

import { smartAI } from './smart-ai-service';
import { storage } from '../storage';

export interface TeamRecommendation {
  recommendedTeam: TeamMember[];
  alternativeTeams: TeamMember[][];
  skillsGapAnalysis: SkillsGap;
  collaborationOptimization: CollaborationStrategy;
  budgetAllocation: BudgetAllocation;
}

export interface TeamMember {
  userId: number;
  username: string;
  role: string;
  skills: string[];
  experience: ExperienceLevel;
  availability: AvailabilityStatus;
  reputationScore: number;
  previousGrantsWon: number;
  collaborationHistory: CollaborationRecord[];
  portfolioHighlights: string[];
  recommendationScore: number;
  fitReason: string[];
}

export interface ExperienceLevel {
  yearsOfExperience: number;
  expertiseAreas: string[];
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'expert';
  publications: number;
  patents: number;
}

export interface AvailabilityStatus {
  hoursPerWeek: number;
  startDate: Date;
  endDate: Date;
  timezone: string;
  overlappingProjects: number;
}

export interface CollaborationRecord {
  projectId: number;
  role: string;
  outcome: 'successful' | 'partial' | 'unsuccessful';
  rating: number;
  duration: number;
}

export interface SkillsGap {
  requiredSkills: string[];
  coveredSkills: string[];
  missingSkills: string[];
  overlapPercentage: number;
  criticalGaps: CriticalGap[];
  recommendations: string[];
}

export interface CriticalGap {
  skill: string;
  importance: 'high' | 'medium' | 'low';
  alternatives: string[];
  trainingOptions: string[];
}

export interface CollaborationStrategy {
  teamStructure: TeamStructure;
  communicationPlan: CommunicationPlan;
  workflowOptimization: WorkflowOptimization;
  conflictMitigation: ConflictMitigation[];
}

export interface TeamStructure {
  leadRole: string;
  coreTeam: string[];
  supportingRoles: string[];
  decisionMaking: DecisionMakingProcess;
}

export interface DecisionMakingProcess {
  structure: 'hierarchical' | 'collaborative' | 'consensus';
  finalDecisionMaker: string;
  votingRights: string[];
}

export interface CommunicationPlan {
  primaryChannels: string[];
  meetingSchedule: MeetingSchedule[];
  reportingStructure: ReportingStructure[];
  documentationStandards: string[];
}

export interface MeetingSchedule {
  type: 'standup' | 'review' | 'planning' | 'retrospective';
  frequency: string;
  duration: number;
  participants: string[];
}

export interface ReportingStructure {
  from: string;
  to: string;
  frequency: string;
  format: string;
}

export interface WorkflowOptimization {
  taskDistribution: TaskDistribution[];
  milestoneAlignment: MilestoneAlignment[];
  qualityAssurance: QualityAssurance;
}

export interface TaskDistribution {
  role: string;
  responsibilities: string[];
  dependencies: string[];
  estimatedHours: number;
}

export interface MilestoneAlignment {
  milestone: string;
  responsibleRoles: string[];
  deadline: Date;
  deliverables: string[];
}

export interface QualityAssurance {
  reviewProcess: string;
  standards: string[];
  checkpoints: string[];
}

export interface ConflictMitigation {
  potentialConflict: string;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  prevention: string[];
  resolution: string[];
}

export interface BudgetAllocation {
  totalBudget: number;
  memberAllocations: MemberAllocation[];
  contingency: number;
  equipmentCosts: number;
  overheadCosts: number;
}

export interface MemberAllocation {
  userId: number;
  role: string;
  hourlyRate: number;
  estimatedHours: number;
  totalAllocation: number;
  benefits: number;
}

export interface GrantRequirement {
  requiredSkills: string[];
  teamSize: number;
  roles: string[];
  experienceLevel: string;
  budget: number;
  duration: number;
  specializations: string[];
}

export class HyperCrowdTeamRecommendationService {
  /**
   * Generate team recommendations for grant applications
   */
  async generateTeamRecommendations(
    grantRequirements: GrantRequirement[], 
    userId: number,
    preferences: any
  ): Promise<TeamRecommendation> {
    console.log(`Generating team recommendations for ${grantRequirements.length} grants...`);
    
    // Get all available team members from HyperCrowd ecosystem
    const availableMembers = await this.getAvailableHyperCrowdMembers();
    
    // Analyze combined grant requirements
    const combinedRequirements = this.combineGrantRequirements(grantRequirements);
    
    // Score and rank potential team members
    const scoredMembers = await this.scoreTeamMembers(availableMembers, combinedRequirements, userId);
    
    // Generate optimal team composition
    const recommendedTeam = await this.generateOptimalTeam(scoredMembers, combinedRequirements);
    
    // Generate alternative team options
    const alternativeTeams = await this.generateAlternativeTeams(scoredMembers, combinedRequirements, recommendedTeam);
    
    // Analyze skills gaps
    const skillsGapAnalysis = await this.analyzeSkillsGaps(recommendedTeam, combinedRequirements);
    
    // Optimize collaboration strategy
    const collaborationOptimization = await this.optimizeCollaboration(recommendedTeam, grantRequirements);
    
    // Calculate budget allocation
    const budgetAllocation = await this.calculateBudgetAllocation(recommendedTeam, combinedRequirements);
    
    return {
      recommendedTeam,
      alternativeTeams,
      skillsGapAnalysis,
      collaborationOptimization,
      budgetAllocation
    };
  }

  /**
   * Get available HyperCrowd ecosystem members
   */
  private async getAvailableHyperCrowdMembers(): Promise<TeamMember[]> {
    try {
      // Get users who have opted into HyperCrowd
      const users = await storage.query(`
        SELECT * FROM users 
        WHERE "openToCollaboration" = true 
        AND "reputationScore" > 0
        ORDER BY "reputationScore" DESC
        LIMIT 100
      `);
      
      const teamMembers: TeamMember[] = [];
      
      for (const user of users) {
        // Get user's skills and experience
        const skills = user.skills ? JSON.parse(user.skills) : [];
        const interests = user.interests ? JSON.parse(user.interests) : [];
        
        // Get collaboration history
        const collaborationHistory = await this.getUserCollaborationHistory(user.id);
        
        // Calculate experience level
        const experience = this.calculateExperienceLevel(user, collaborationHistory);
        
        // Determine availability
        const availability = await this.determineAvailability(user.id);
        
        const teamMember: TeamMember = {
          userId: user.id,
          username: user.username,
          role: this.determineRoleFromSkills(skills),
          skills: [...skills, ...interests],
          experience,
          availability,
          reputationScore: user.reputationScore || 0,
          previousGrantsWon: await this.countPreviousGrants(user.id),
          collaborationHistory,
          portfolioHighlights: this.extractPortfolioHighlights(user),
          recommendationScore: 0,
          fitReason: []
        };
        
        teamMembers.push(teamMember);
      }
      
      return teamMembers;
      
    } catch (error) {
      console.warn('Failed to get HyperCrowd members:', error);
      return this.generateSampleTeamMembers();
    }
  }

  /**
   * Generate sample team members for demonstration
   */
  private generateSampleTeamMembers(): TeamMember[] {
    return [
      {
        userId: 101,
        username: 'AliceAI',
        role: 'AI Research Lead',
        skills: ['Machine Learning', 'Deep Learning', 'Python', 'TensorFlow', 'Research'],
        experience: {
          yearsOfExperience: 8,
          expertiseAreas: ['AI', 'Machine Learning', 'Computer Vision'],
          seniorityLevel: 'expert',
          publications: 25,
          patents: 3
        },
        availability: {
          hoursPerWeek: 30,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          timezone: 'UTC-8',
          overlappingProjects: 1
        },
        reputationScore: 95,
        previousGrantsWon: 7,
        collaborationHistory: [],
        portfolioHighlights: ['Led $2M NSF AI Institute', 'Published in Nature AI', '500+ citations'],
        recommendationScore: 0,
        fitReason: []
      },
      {
        userId: 102,
        username: 'BobBlockchain',
        role: 'Web3 Technical Lead',
        skills: ['Solidity', 'Web3', 'Blockchain', 'Smart Contracts', 'DeFi'],
        experience: {
          yearsOfExperience: 6,
          expertiseAreas: ['Blockchain', 'Web3', 'DeFi'],
          seniorityLevel: 'senior',
          publications: 12,
          patents: 1
        },
        availability: {
          hoursPerWeek: 40,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          timezone: 'UTC+0',
          overlappingProjects: 0
        },
        reputationScore: 88,
        previousGrantsWon: 4,
        collaborationHistory: [],
        portfolioHighlights: ['Built $10M TVL DeFi protocol', 'Ethereum Foundation grant recipient'],
        recommendationScore: 0,
        fitReason: []
      },
      {
        userId: 103,
        username: 'CarolData',
        role: 'Data Science Lead',
        skills: ['Data Science', 'Analytics', 'R', 'Python', 'Statistics'],
        experience: {
          yearsOfExperience: 5,
          expertiseAreas: ['Data Science', 'Analytics', 'Statistics'],
          seniorityLevel: 'senior',
          publications: 8,
          patents: 0
        },
        availability: {
          hoursPerWeek: 25,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          timezone: 'UTC-5',
          overlappingProjects: 2
        },
        reputationScore: 82,
        previousGrantsWon: 3,
        collaborationHistory: [],
        portfolioHighlights: ['NIH data analysis expertise', 'Healthcare AI applications'],
        recommendationScore: 0,
        fitReason: []
      },
      {
        userId: 104,
        username: 'DaveDevOps',
        role: 'Technical Infrastructure Lead',
        skills: ['DevOps', 'Cloud Architecture', 'Kubernetes', 'AWS', 'Infrastructure'],
        experience: {
          yearsOfExperience: 7,
          expertiseAreas: ['DevOps', 'Cloud', 'Infrastructure'],
          seniorityLevel: 'senior',
          publications: 3,
          patents: 0
        },
        availability: {
          hoursPerWeek: 35,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          timezone: 'UTC-7',
          overlappingProjects: 1
        },
        reputationScore: 79,
        previousGrantsWon: 2,
        collaborationHistory: [],
        portfolioHighlights: ['Scaled systems to 1M+ users', 'Multi-cloud expertise'],
        recommendationScore: 0,
        fitReason: []
      },
      {
        userId: 105,
        username: 'EveEthics',
        role: 'AI Ethics & Policy Lead',
        skills: ['AI Ethics', 'Policy', 'Governance', 'Compliance', 'Research'],
        experience: {
          yearsOfExperience: 4,
          expertiseAreas: ['AI Ethics', 'Policy', 'Governance'],
          seniorityLevel: 'mid',
          publications: 15,
          patents: 0
        },
        availability: {
          hoursPerWeek: 20,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          timezone: 'UTC+1',
          overlappingProjects: 3
        },
        reputationScore: 85,
        previousGrantsWon: 5,
        collaborationHistory: [],
        portfolioHighlights: ['EU AI Act compliance expert', 'UNESCO AI Ethics advisor'],
        recommendationScore: 0,
        fitReason: []
      }
    ];
  }

  /**
   * Combine requirements from multiple grants
   */
  private combineGrantRequirements(grantRequirements: GrantRequirement[]): GrantRequirement {
    const allSkills = [...new Set(grantRequirements.flatMap(g => g.requiredSkills))];
    const allRoles = [...new Set(grantRequirements.flatMap(g => g.roles))];
    const allSpecializations = [...new Set(grantRequirements.flatMap(g => g.specializations))];
    
    return {
      requiredSkills: allSkills,
      teamSize: Math.max(...grantRequirements.map(g => g.teamSize)),
      roles: allRoles,
      experienceLevel: this.determineHighestExperienceLevel(grantRequirements.map(g => g.experienceLevel)),
      budget: grantRequirements.reduce((sum, g) => sum + g.budget, 0),
      duration: Math.max(...grantRequirements.map(g => g.duration)),
      specializations: allSpecializations
    };
  }

  /**
   * Score team members based on grant requirements
   */
  private async scoreTeamMembers(
    members: TeamMember[], 
    requirements: GrantRequirement, 
    requesterId: number
  ): Promise<TeamMember[]> {
    const scoredMembers: TeamMember[] = [];
    
    for (const member of members) {
      if (member.userId === requesterId) continue; // Skip the requester
      
      let score = 0;
      const fitReasons: string[] = [];
      
      // Skills matching (40% of score)
      const skillsMatch = this.calculateSkillsMatch(member.skills, requirements.requiredSkills);
      score += skillsMatch * 40;
      if (skillsMatch > 0.7) fitReasons.push(`Strong skills match (${Math.round(skillsMatch * 100)}%)`);
      
      // Experience level (25% of score)
      const experienceMatch = this.calculateExperienceMatch(member.experience, requirements.experienceLevel);
      score += experienceMatch * 25;
      if (experienceMatch > 0.8) fitReasons.push('Excellent experience level');
      
      // Reputation score (15% of score)
      const reputationScore = Math.min(member.reputationScore / 100, 1);
      score += reputationScore * 15;
      if (member.reputationScore > 80) fitReasons.push('High reputation score');
      
      // Grant success history (10% of score)
      const grantSuccessScore = Math.min(member.previousGrantsWon / 10, 1);
      score += grantSuccessScore * 10;
      if (member.previousGrantsWon > 2) fitReasons.push('Proven grant success history');
      
      // Availability (10% of score)
      const availabilityScore = this.calculateAvailabilityScore(member.availability, requirements);
      score += availabilityScore * 10;
      if (availabilityScore > 0.8) fitReasons.push('Good availability match');
      
      // Use AI for detailed analysis
      try {
        const aiAnalysis = await this.analyzeTeamMemberFit(member, requirements);
        if (aiAnalysis.additionalScore) {
          score += aiAnalysis.additionalScore;
        }
        if (aiAnalysis.insights) {
          fitReasons.push(...aiAnalysis.insights);
        }
      } catch (error) {
        console.warn('AI analysis failed for member:', member.username);
      }
      
      scoredMembers.push({
        ...member,
        recommendationScore: Math.min(100, score),
        fitReason: fitReasons
      });
    }
    
    return scoredMembers.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Generate optimal team composition
   */
  private async generateOptimalTeam(
    scoredMembers: TeamMember[], 
    requirements: GrantRequirement
  ): Promise<TeamMember[]> {
    const team: TeamMember[] = [];
    const requiredRoles = requirements.roles;
    const requiredSkills = requirements.requiredSkills;
    const maxTeamSize = requirements.teamSize;
    
    // Ensure we have members for each required role
    for (const role of requiredRoles) {
      const candidatesForRole = scoredMembers.filter(m => 
        m.role.toLowerCase().includes(role.toLowerCase()) ||
        this.roleSkillsMatch(m.skills, role)
      );
      
      if (candidatesForRole.length > 0 && team.length < maxTeamSize) {
        const bestCandidate = candidatesForRole[0];
        if (!team.find(t => t.userId === bestCandidate.userId)) {
          team.push(bestCandidate);
        }
      }
    }
    
    // Fill remaining spots with highest-scoring members
    for (const member of scoredMembers) {
      if (team.length >= maxTeamSize) break;
      if (!team.find(t => t.userId === member.userId)) {
        team.push(member);
      }
    }
    
    return team;
  }

  /**
   * Generate alternative team compositions
   */
  private async generateAlternativeTeams(
    scoredMembers: TeamMember[], 
    requirements: GrantRequirement, 
    primaryTeam: TeamMember[]
  ): Promise<TeamMember[][]> {
    const alternatives: TeamMember[][] = [];
    const primaryMemberIds = new Set(primaryTeam.map(m => m.userId));
    
    // Generate 3 alternative teams
    for (let i = 0; i < 3; i++) {
      const alternativeTeam: TeamMember[] = [];
      const usedIds = new Set(primaryMemberIds);
      
      // Use different selection criteria for alternatives
      const availableMembers = scoredMembers.filter(m => !usedIds.has(m.userId));
      
      for (const role of requirements.roles) {
        const candidatesForRole = availableMembers.filter(m => 
          !usedIds.has(m.userId) &&
          (m.role.toLowerCase().includes(role.toLowerCase()) ||
           this.roleSkillsMatch(m.skills, role))
        );
        
        if (candidatesForRole.length > i && alternativeTeam.length < requirements.teamSize) {
          const candidate = candidatesForRole[i];
          alternativeTeam.push(candidate);
          usedIds.add(candidate.userId);
        }
      }
      
      // Fill with remaining high-scoring members
      for (const member of availableMembers) {
        if (alternativeTeam.length >= requirements.teamSize) break;
        if (!usedIds.has(member.userId)) {
          alternativeTeam.push(member);
          usedIds.add(member.userId);
        }
      }
      
      if (alternativeTeam.length > 0) {
        alternatives.push(alternativeTeam);
      }
    }
    
    return alternatives;
  }

  /**
   * Analyze skills gaps in the team
   */
  private async analyzeSkillsGaps(team: TeamMember[], requirements: GrantRequirement): Promise<SkillsGap> {
    const teamSkills = [...new Set(team.flatMap(m => m.skills))];
    const requiredSkills = requirements.requiredSkills;
    const coveredSkills = requiredSkills.filter(skill => 
      teamSkills.some(teamSkill => 
        teamSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(teamSkill.toLowerCase())
      )
    );
    const missingSkills = requiredSkills.filter(skill => !coveredSkills.includes(skill));
    
    const overlapPercentage = (coveredSkills.length / requiredSkills.length) * 100;
    
    const criticalGaps: CriticalGap[] = missingSkills.map(skill => ({
      skill,
      importance: this.assessSkillImportance(skill, requirements),
      alternatives: this.findAlternativeSkills(skill),
      trainingOptions: this.suggestTrainingOptions(skill)
    }));
    
    const recommendations = await this.generateSkillsRecommendations(missingSkills, team);
    
    return {
      requiredSkills,
      coveredSkills,
      missingSkills,
      overlapPercentage,
      criticalGaps,
      recommendations
    };
  }

  /**
   * Optimize collaboration strategy
   */
  private async optimizeCollaboration(team: TeamMember[], grantRequirements: GrantRequirement[]): Promise<CollaborationStrategy> {
    // Determine team structure
    const leadMember = team.reduce((lead, member) => 
      member.experience.seniorityLevel === 'expert' && member.reputationScore > lead.reputationScore ? member : lead
    );
    
    const teamStructure: TeamStructure = {
      leadRole: leadMember.role,
      coreTeam: team.filter(m => m.experience.seniorityLevel === 'senior' || m.experience.seniorityLevel === 'expert').map(m => m.role),
      supportingRoles: team.filter(m => m.experience.seniorityLevel === 'junior' || m.experience.seniorityLevel === 'mid').map(m => m.role),
      decisionMaking: {
        structure: 'collaborative',
        finalDecisionMaker: leadMember.role,
        votingRights: team.filter(m => m.experience.seniorityLevel !== 'junior').map(m => m.role)
      }
    };
    
    // Communication plan
    const communicationPlan: CommunicationPlan = {
      primaryChannels: ['Slack', 'Video calls', 'Email'],
      meetingSchedule: [
        {
          type: 'standup',
          frequency: 'Weekly',
          duration: 30,
          participants: team.map(m => m.role)
        },
        {
          type: 'review',
          frequency: 'Bi-weekly',
          duration: 60,
          participants: teamStructure.coreTeam
        }
      ],
      reportingStructure: [
        {
          from: 'All members',
          to: leadMember.role,
          frequency: 'Weekly',
          format: 'Status report'
        }
      ],
      documentationStandards: ['Shared repositories', 'Progress tracking', 'Meeting notes']
    };
    
    // Workflow optimization
    const workflowOptimization: WorkflowOptimization = {
      taskDistribution: team.map(member => ({
        role: member.role,
        responsibilities: this.assignResponsibilities(member, grantRequirements),
        dependencies: this.identifyDependencies(member, team),
        estimatedHours: this.estimateHours(member, grantRequirements)
      })),
      milestoneAlignment: this.createMilestoneAlignment(team, grantRequirements),
      qualityAssurance: {
        reviewProcess: 'Peer review with lead approval',
        standards: ['Code review', 'Documentation review', 'Progress validation'],
        checkpoints: ['Weekly status', 'Monthly deliverables', 'Quarterly assessment']
      }
    };
    
    // Conflict mitigation
    const conflictMitigation: ConflictMitigation[] = [
      {
        potentialConflict: 'Time zone coordination challenges',
        probability: 0.7,
        impact: 'medium',
        prevention: ['Overlap hours identification', 'Asynchronous communication protocols'],
        resolution: ['Flexible meeting times', 'Recorded sessions']
      },
      {
        potentialConflict: 'Technical approach disagreements',
        probability: 0.4,
        impact: 'high',
        prevention: ['Early technical alignment sessions', 'Clear decision-making process'],
        resolution: ['Technical lead final decision', 'Proof of concept evaluation']
      }
    ];
    
    return {
      teamStructure,
      communicationPlan,
      workflowOptimization,
      conflictMitigation
    };
  }

  /**
   * Calculate budget allocation for team members
   */
  private async calculateBudgetAllocation(team: TeamMember[], requirements: GrantRequirement): Promise<BudgetAllocation> {
    const totalBudget = requirements.budget * 0.7; // 70% for personnel
    const memberAllocations: MemberAllocation[] = [];
    
    for (const member of team) {
      const hourlyRate = this.calculateHourlyRate(member);
      const estimatedHours = this.estimateHours(member, [requirements]);
      const totalAllocation = hourlyRate * estimatedHours;
      const benefits = totalAllocation * 0.25; // 25% benefits
      
      memberAllocations.push({
        userId: member.userId,
        role: member.role,
        hourlyRate,
        estimatedHours,
        totalAllocation,
        benefits
      });
    }
    
    const totalPersonnelCosts = memberAllocations.reduce((sum, alloc) => sum + alloc.totalAllocation + alloc.benefits, 0);
    
    return {
      totalBudget: requirements.budget,
      memberAllocations,
      contingency: totalBudget * 0.1,
      equipmentCosts: requirements.budget * 0.15,
      overheadCosts: requirements.budget * 0.15
    };
  }

  // Helper methods
  private calculateSkillsMatch(memberSkills: string[], requiredSkills: string[]): number {
    const matches = requiredSkills.filter(required => 
      memberSkills.some(memberSkill => 
        memberSkill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(memberSkill.toLowerCase())
      )
    );
    return matches.length / requiredSkills.length;
  }

  private calculateExperienceMatch(experience: ExperienceLevel, required: string): number {
    const experienceLevels = { 'junior': 1, 'mid': 2, 'senior': 3, 'expert': 4 };
    const requiredLevel = experienceLevels[required.toLowerCase() as keyof typeof experienceLevels] || 2;
    const memberLevel = experienceLevels[experience.seniorityLevel];
    
    return Math.min(memberLevel / requiredLevel, 1);
  }

  private calculateAvailabilityScore(availability: AvailabilityStatus, requirements: GrantRequirement): number {
    const requiredHours = 30; // Default required hours per week
    const score = Math.min(availability.hoursPerWeek / requiredHours, 1);
    return availability.overlappingProjects > 2 ? score * 0.7 : score;
  }

  private async analyzeTeamMemberFit(member: TeamMember, requirements: GrantRequirement): Promise<any> {
    // Placeholder for AI analysis
    return { additionalScore: 0, insights: [] };
  }

  private roleSkillsMatch(skills: string[], role: string): boolean {
    const roleKeywords = role.toLowerCase().split(' ');
    return roleKeywords.some(keyword => 
      skills.some(skill => skill.toLowerCase().includes(keyword))
    );
  }

  private determineHighestExperienceLevel(levels: string[]): string {
    const priority = { 'expert': 4, 'senior': 3, 'mid': 2, 'junior': 1 };
    return levels.reduce((highest, level) => {
      const currentPriority = priority[level.toLowerCase() as keyof typeof priority] || 1;
      const highestPriority = priority[highest.toLowerCase() as keyof typeof priority] || 1;
      return currentPriority > highestPriority ? level : highest;
    }, 'junior');
  }

  private assessSkillImportance(skill: string, requirements: GrantRequirement): 'high' | 'medium' | 'low' {
    const criticalSkills = ['AI', 'Machine Learning', 'Blockchain', 'Research'];
    return criticalSkills.some(critical => skill.toLowerCase().includes(critical.toLowerCase())) ? 'high' : 'medium';
  }

  private findAlternativeSkills(skill: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      'machine learning': ['deep learning', 'neural networks', 'statistical modeling'],
      'blockchain': ['distributed systems', 'cryptography', 'peer-to-peer networks'],
      'web3': ['decentralized applications', 'smart contracts', 'cryptocurrency']
    };
    return alternatives[skill.toLowerCase()] || [];
  }

  private suggestTrainingOptions(skill: string): string[] {
    return [`Online courses in ${skill}`, `Certification programs`, `Workshop attendance`];
  }

  private async generateSkillsRecommendations(missingSkills: string[], team: TeamMember[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    for (const skill of missingSkills) {
      recommendations.push(`Consider adding team member with ${skill} expertise`);
      recommendations.push(`Provide training in ${skill} for existing team members`);
    }
    
    return recommendations;
  }

  private assignResponsibilities(member: TeamMember, requirements: GrantRequirement[]): string[] {
    // Generate role-specific responsibilities
    const baseResponsibilities = [
      `Lead ${member.role.toLowerCase()} activities`,
      'Contribute to project deliverables',
      'Participate in team meetings and reviews'
    ];
    
    return baseResponsibilities;
  }

  private identifyDependencies(member: TeamMember, team: TeamMember[]): string[] {
    // Identify role dependencies
    return team.filter(t => t.userId !== member.userId).map(t => t.role).slice(0, 2);
  }

  private estimateHours(member: TeamMember, requirements: GrantRequirement[]): number {
    // Base estimation logic
    const baseHours = 200;
    const complexityMultiplier = requirements.length > 1 ? 1.5 : 1;
    return baseHours * complexityMultiplier;
  }

  private createMilestoneAlignment(team: TeamMember[], requirements: GrantRequirement[]): MilestoneAlignment[] {
    const duration = Math.max(...requirements.map(r => r.duration));
    const milestones: MilestoneAlignment[] = [];
    
    const quarterDuration = duration / 4;
    for (let i = 1; i <= 4; i++) {
      milestones.push({
        milestone: `Quarter ${i} Deliverables`,
        responsibleRoles: team.map(m => m.role),
        deadline: new Date(Date.now() + i * quarterDuration * 24 * 60 * 60 * 1000),
        deliverables: [`Q${i} progress report`, `Q${i} technical deliverables`]
      });
    }
    
    return milestones;
  }

  private calculateHourlyRate(member: TeamMember): number {
    const baseRates = {
      'expert': 150,
      'senior': 120,
      'mid': 90,
      'junior': 60
    };
    
    const baseRate = baseRates[member.experience.seniorityLevel];
    const reputationBonus = (member.reputationScore - 50) / 50 * 20; // Up to $20 bonus
    
    return Math.max(baseRate + reputationBonus, baseRate * 0.8);
  }

  // Placeholder methods for database operations
  private async getUserCollaborationHistory(userId: number): Promise<CollaborationRecord[]> {
    return [];
  }

  private calculateExperienceLevel(user: any, collaborationHistory: CollaborationRecord[]): ExperienceLevel {
    return {
      yearsOfExperience: 3,
      expertiseAreas: ['Technology'],
      seniorityLevel: 'mid',
      publications: 0,
      patents: 0
    };
  }

  private async determineAvailability(userId: number): Promise<AvailabilityStatus> {
    return {
      hoursPerWeek: 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      timezone: 'UTC',
      overlappingProjects: 1
    };
  }

  private determineRoleFromSkills(skills: string[]): string {
    if (skills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('machine learning'))) {
      return 'AI Research Lead';
    }
    if (skills.some(s => s.toLowerCase().includes('blockchain') || s.toLowerCase().includes('web3'))) {
      return 'Web3 Technical Lead';
    }
    if (skills.some(s => s.toLowerCase().includes('data'))) {
      return 'Data Science Lead';
    }
    return 'Technical Lead';
  }

  private async countPreviousGrants(userId: number): Promise<number> {
    return Math.floor(Math.random() * 5);
  }

  private extractPortfolioHighlights(user: any): string[] {
    return ['Experienced team member', 'Strong technical background'];
  }
}

export const hyperCrowdTeamRecommendationService = new HyperCrowdTeamRecommendationService();