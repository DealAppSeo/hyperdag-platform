/**
 * Fetch.AI uAgents Integration for HyperDAG
 * 
 * Integrates with Fetch.AI's uAgents framework for autonomous grant discovery
 * Uses HTTP API to communicate with Python-based uAgents
 */

import axios from 'axios';

interface GrantOpportunity {
  id: string;
  title: string;
  amount: number;
  deadline: Date;
  categories: string[];
  requirements: string[];
  eligibility: string;
  fundingOrg: string;
}

interface ProjectProfile {
  id: number;
  title: string;
  description: string;
  categories: string[];
  teamSize: number;
  fundingGoal: number;
  stage: 'ideation' | 'development' | 'testing' | 'launch';
}

interface GrantMatchResult {
  projectId: number;
  grantId: string;
  matchScore: number;
  reasoning: string;
  actionPlan: string[];
  estimatedSuccessRate: number;
}

export class GrantMatchingAgent {
  private agentEndpoint: string;
  private isActive = false;

  constructor(private agentAddress: string, private apiEndpoint?: string) {
    // Connect to uAgent via HTTP API
    this.agentEndpoint = apiEndpoint || 'http://localhost:8000'; // Default uAgent endpoint
  }

  /**
   * Initialize the autonomous grant matching agent
   */
  async initialize(): Promise<void> {
    try {
      // Register agent capabilities
      await this.agent.register({
        service: "grant_matching",
        capabilities: [
          "opportunity_discovery",
          "project_analysis", 
          "match_scoring",
          "application_assistance"
        ]
      });

      // Set up continuous monitoring protocols
      this.setupGrantMonitoring();
      this.setupProjectAnalysis();
      this.setupMatchingProtocols();

      this.isActive = true;
      console.log('[Fetch.AI Agent] Grant matching agent initialized successfully');
    } catch (error) {
      console.error('[Fetch.AI Agent] Initialization failed:', error);
      throw new Error('Failed to initialize Fetch.AI grant matching agent');
    }
  }

  /**
   * Autonomous grant opportunity discovery
   */
  private async setupGrantMonitoring(): Promise<void> {
    // Create agent behavior for continuous grant scanning
    await this.agent.on_interval(3600000, async (ctx: Context) => {
      try {
        const newGrants = await this.discoverGrantOpportunities();
        
        for (const grant of newGrants) {
          await this.processNewGrant(grant, ctx);
        }
      } catch (error) {
        ctx.logger.error('Grant monitoring failed:', error);
      }
    });
  }

  /**
   * Discover grant opportunities from multiple sources
   */
  private async discoverGrantOpportunities(): Promise<GrantOpportunity[]> {
    // This would integrate with multiple grant databases
    // For now, simulating discovery process
    
    const grantSources = [
      'grants.gov',
      'ethereum.org/grants',
      'chainlink.community',
      'polygon.technology/grants',
      'gitcoin.co'
    ];

    const opportunities: GrantOpportunity[] = [];
    
    // In production, this would make real API calls to grant databases
    // For demo purposes, showing the agent's decision-making structure
    
    return opportunities;
  }

  /**
   * Process a newly discovered grant opportunity
   */
  private async processNewGrant(grant: GrantOpportunity, ctx: Context): Promise<void> {
    try {
      // Get active HyperDAG projects
      const projects = await this.getActiveProjects();
      
      // Score matches for each project
      const matches: GrantMatchResult[] = [];
      
      for (const project of projects) {
        const matchScore = await this.calculateMatchScore(project, grant);
        
        if (matchScore > 0.7) { // High confidence threshold
          const match: GrantMatchResult = {
            projectId: project.id,
            grantId: grant.id,
            matchScore,
            reasoning: await this.generateMatchReasoning(project, grant),
            actionPlan: await this.createActionPlan(project, grant),
            estimatedSuccessRate: await this.estimateSuccessRate(project, grant)
          };
          
          matches.push(match);
        }
      }

      // Notify HyperDAG platform of high-quality matches
      if (matches.length > 0) {
        await this.notifyPlatform(grant, matches);
      }

    } catch (error) {
      ctx.logger.error('Grant processing failed:', error);
    }
  }

  /**
   * Calculate match score between project and grant
   */
  private async calculateMatchScore(project: ProjectProfile, grant: GrantOpportunity): Promise<number> {
    let score = 0;

    // Category alignment (30% weight)
    const categoryOverlap = project.categories.filter(cat => 
      grant.categories.some(gCat => 
        gCat.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(gCat.toLowerCase())
      )
    ).length;
    score += (categoryOverlap / Math.max(project.categories.length, grant.categories.length)) * 0.3;

    // Funding alignment (25% weight)
    const fundingFit = Math.min(project.fundingGoal / grant.amount, 1);
    score += fundingFit * 0.25;

    // Stage appropriateness (20% weight)
    const stageMatch = this.getStageCompatibility(project.stage, grant.requirements);
    score += stageMatch * 0.2;

    // Team readiness (15% weight)
    const teamReadiness = Math.min(project.teamSize / 5, 1); // Assume optimal team size of 5
    score += teamReadiness * 0.15;

    // Deadline feasibility (10% weight)
    const timeToDeadline = (grant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const deadlineFeasibility = Math.min(timeToDeadline / 90, 1); // 90 days ideal
    score += deadlineFeasibility * 0.1;

    return Math.min(score, 1);
  }

  /**
   * Generate human-readable reasoning for the match
   */
  private async generateMatchReasoning(project: ProjectProfile, grant: GrantOpportunity): Promise<string> {
    return `Project "${project.title}" aligns well with "${grant.title}" because:
    - Shared focus areas: ${project.categories.join(', ')}
    - Funding alignment: $${project.fundingGoal.toLocaleString()} request vs $${grant.amount.toLocaleString()} available
    - Development stage matches grant requirements
    - ${grant.deadline.toLocaleDateString()} deadline provides adequate development time`;
  }

  /**
   * Create actionable steps for grant application
   */
  private async createActionPlan(project: ProjectProfile, grant: GrantOpportunity): Promise<string[]> {
    return [
      "Review detailed grant requirements and eligibility criteria",
      "Prepare project documentation and technical specifications", 
      "Assemble team credentials and previous work portfolio",
      "Draft initial proposal outline focusing on grant priorities",
      "Schedule team review meeting before submission deadline",
      "Submit application with all required supporting materials"
    ];
  }

  /**
   * Estimate success probability based on historical data
   */
  private async estimateSuccessRate(project: ProjectProfile, grant: GrantOpportunity): Promise<number> {
    // This would use ML models trained on historical grant outcomes
    // For now, providing baseline estimation logic
    
    let successRate = 0.15; // Base 15% success rate
    
    // Adjust based on project maturity
    if (project.stage === 'development') successRate += 0.1;
    if (project.stage === 'testing') successRate += 0.15;
    
    // Adjust based on funding alignment
    const fundingRatio = project.fundingGoal / grant.amount;
    if (fundingRatio < 0.5) successRate += 0.1;
    if (fundingRatio > 1.5) successRate -= 0.05;
    
    return Math.min(successRate, 0.85); // Cap at 85%
  }

  /**
   * Setup continuous project analysis
   */
  private async setupProjectAnalysis(): Promise<void> {
    await this.agent.on_message("project_update", async (ctx: Context, message: any) => {
      const project = message.data as ProjectProfile;
      await this.analyzeProjectForGrants(project);
    });
  }

  /**
   * Setup agent-to-agent matching protocols
   */
  private async setupMatchingProtocols(): Promise<void> {
    // Enable communication with other Fetch.AI agents
    await this.agent.on_message("grant_collaboration", async (ctx: Context, message: any) => {
      // Handle collaboration requests from other agents
      await this.handleAgentCollaboration(ctx, message);
    });
  }

  /**
   * Get active projects from HyperDAG platform
   */
  private async getActiveProjects(): Promise<ProjectProfile[]> {
    // This would integrate with your existing project database
    // Returning mock structure for demonstration
    return [];
  }

  /**
   * Determine stage compatibility with grant requirements
   */
  private getStageCompatibility(stage: string, requirements: string[]): number {
    const reqText = requirements.join(' ').toLowerCase();
    
    switch (stage) {
      case 'ideation':
        return reqText.includes('early') || reqText.includes('concept') ? 1 : 0.3;
      case 'development':
        return reqText.includes('development') || reqText.includes('building') ? 1 : 0.7;
      case 'testing':
        return reqText.includes('testing') || reqText.includes('pilot') ? 1 : 0.8;
      case 'launch':
        return reqText.includes('deployment') || reqText.includes('scaling') ? 1 : 0.5;
      default:
        return 0.5;
    }
  }

  /**
   * Notify HyperDAG platform of grant matches
   */
  private async notifyPlatform(grant: GrantOpportunity, matches: GrantMatchResult[]): Promise<void> {
    // This would integrate with your notification system
    console.log(`[Fetch.AI Agent] Found ${matches.length} high-quality matches for grant: ${grant.title}`);
    
    // Send to HyperDAG notification system
    // await notificationService.sendGrantMatches(grant, matches);
  }

  /**
   * Analyze project for potential grant opportunities
   */
  private async analyzeProjectForGrants(project: ProjectProfile): Promise<void> {
    // Agent autonomously analyzes new/updated projects
    const potentialGrants = await this.findMatchingGrants(project);
    
    if (potentialGrants.length > 0) {
      await this.notifyProjectOwner(project.id, potentialGrants);
    }
  }

  /**
   * Handle collaboration with other Fetch.AI agents
   */
  private async handleAgentCollaboration(ctx: Context, message: any): Promise<void> {
    // Enable agent-to-agent communication for complex matching scenarios
    ctx.logger.info('Handling agent collaboration request');
  }

  /**
   * Find matching grants for a specific project
   */
  private async findMatchingGrants(project: ProjectProfile): Promise<GrantOpportunity[]> {
    // Implementation would query grant database
    return [];
  }

  /**
   * Notify project owner of relevant grants
   */
  private async notifyProjectOwner(projectId: number, grants: GrantOpportunity[]): Promise<void> {
    // Implementation would send notifications through HyperDAG
    console.log(`[Fetch.AI Agent] Notifying project ${projectId} of ${grants.length} relevant grants`);
  }

  /**
   * Stop the autonomous agent
   */
  async shutdown(): Promise<void> {
    this.isActive = false;
    await this.agent.stop();
    console.log('[Fetch.AI Agent] Grant matching agent stopped');
  }

  /**
   * Get agent status and performance metrics
   */
  getStatus(): object {
    return {
      isActive: this.isActive,
      address: this.agentAddress,
      capabilities: [
        "autonomous_grant_discovery",
        "intelligent_project_matching", 
        "success_rate_prediction",
        "collaborative_application_assistance"
      ]
    };
  }
}

export default GrantMatchingAgent;