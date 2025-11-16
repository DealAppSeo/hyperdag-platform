/**
 * Fetch.AI Integration Service for HyperDAG
 * 
 * Connects autonomous agents to your existing grant matching and project systems
 */

import { fetchAIService } from './fetchai-uagents';
import { storage } from '../storage';

interface FetchAIConfig {
  agentAddress: string;
  seedPhrase?: string;
  networkEndpoint: string;
  enabled: boolean;
}

export class FetchAIIntegrationService {
  private grantAgent?: GrantMatchingAgent;
  private config: FetchAIConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      agentAddress: process.env.FETCHAI_AGENT_ADDRESS || '',
      seedPhrase: process.env.FETCHAI_SEED_PHRASE,
      networkEndpoint: process.env.FETCHAI_NETWORK_ENDPOINT || 'https://rest-dorado.fetch.ai',
      enabled: process.env.FETCHAI_ENABLED === 'true'
    };
  }

  /**
   * Initialize Fetch.AI integration
   */
  async initialize(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('[Fetch.AI] Integration disabled via configuration');
      return false;
    }

    if (!this.config.agentAddress) {
      console.log('[Fetch.AI] Agent address not configured. Please set FETCHAI_AGENT_ADDRESS');
      return false;
    }

    try {
      // Initialize grant matching agent
      this.grantAgent = new GrantMatchingAgent(
        this.config.agentAddress,
        this.config.seedPhrase
      );

      await this.grantAgent.initialize();
      
      // Connect agent to HyperDAG data streams
      await this.connectToProjectUpdates();
      await this.connectToGrantDatabase();

      this.isInitialized = true;
      console.log('[Fetch.AI] Integration initialized successfully');
      return true;

    } catch (error) {
      console.error('[Fetch.AI] Integration failed:', error);
      return false;
    }
  }

  /**
   * Connect agent to project update streams
   */
  private async connectToProjectUpdates(): Promise<void> {
    // Monitor project creation and updates
    setInterval(async () => {
      if (!this.isInitialized) return;

      try {
        // Get recent project updates from your existing system
        const recentProjects = await this.getRecentProjectUpdates();
        
        // Send to Fetch.AI agent for analysis
        for (const project of recentProjects) {
          await this.notifyAgentOfProjectUpdate(project);
        }
      } catch (error) {
        console.error('[Fetch.AI] Project update sync failed:', error);
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Connect agent to grant database
   */
  private async connectToGrantDatabase(): Promise<void> {
    // Sync existing grant data with agent
    try {
      const grants = await this.getExistingGrants();
      console.log(`[Fetch.AI] Synced ${grants.length} existing grants with agent`);
    } catch (error) {
      console.error('[Fetch.AI] Grant database sync failed:', error);
    }
  }

  /**
   * Get recent project updates from HyperDAG
   */
  private async getRecentProjectUpdates(): Promise<any[]> {
    // This would query your actual project database
    // For now, returning structure that would integrate with your existing system
    
    try {
      // Example: Get projects updated in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // This would use your existing database queries
      // const projects = await storage.getProjectsUpdatedSince(twentyFourHoursAgo);
      
      return []; // Replace with actual database query
    } catch (error) {
      console.error('[Fetch.AI] Failed to get recent projects:', error);
      return [];
    }
  }

  /**
   * Get existing grants from HyperDAG database
   */
  private async getExistingGrants(): Promise<any[]> {
    try {
      // This would query your existing grant sources table
      // const grants = await storage.getAllActiveGrants();
      
      return []; // Replace with actual database query
    } catch (error) {
      console.error('[Fetch.AI] Failed to get existing grants:', error);
      return [];
    }
  }

  /**
   * Notify agent of project updates
   */
  private async notifyAgentOfProjectUpdate(project: any): Promise<void> {
    if (!this.grantAgent) return;

    try {
      // Convert HyperDAG project format to agent format
      const agentProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        categories: project.categories || [],
        teamSize: project.teamRoles?.length || 1,
        fundingGoal: project.fundingGoal || 0,
        stage: this.mapProjectStage(project)
      };

      // Send to agent for analysis
      console.log(`[Fetch.AI] Analyzing project ${project.id} for grant opportunities`);
      
    } catch (error) {
      console.error('[Fetch.AI] Failed to notify agent of project update:', error);
    }
  }

  /**
   * Map HyperDAG project stages to agent format
   */
  private mapProjectStage(project: any): 'ideation' | 'development' | 'testing' | 'launch' {
    // Map your existing project stages to agent-compatible format
    if (!project.currentFunding || project.currentFunding === 0) {
      return 'ideation';
    } else if (project.currentFunding < project.fundingGoal * 0.5) {
      return 'development';
    } else if (project.currentFunding < project.fundingGoal) {
      return 'testing';
    } else {
      return 'launch';
    }
  }

  /**
   * Handle grant matches from agent
   */
  async processGrantMatch(projectId: number, grantId: string, matchData: any): Promise<void> {
    try {
      // Store the match in your existing system
      console.log(`[Fetch.AI] Processing grant match: Project ${projectId} <-> Grant ${grantId}`);
      
      // This would integrate with your existing notification system
      await this.notifyProjectOwner(projectId, grantId, matchData);
      
      // Store in grant matches table
      // await storage.createGrantMatch({
      //   projectId,
      //   grantId,
      //   matchScore: matchData.matchScore,
      //   reasoning: matchData.reasoning,
      //   actionPlan: matchData.actionPlan,
      //   estimatedSuccessRate: matchData.estimatedSuccessRate,
      //   source: 'fetchai_agent',
      //   createdAt: new Date()
      // });

    } catch (error) {
      console.error('[Fetch.AI] Failed to process grant match:', error);
    }
  }

  /**
   * Notify project owner of grant match
   */
  private async notifyProjectOwner(projectId: number, grantId: string, matchData: any): Promise<void> {
    // This would use your existing notification system
    console.log(`[Fetch.AI] Notifying project owner about grant match: ${grantId}`);
    
    // Example integration with your notification service:
    // await notificationService.sendNotification({
    //   userId: project.creatorId,
    //   type: 'grant_match',
    //   title: 'New Grant Opportunity Found',
    //   message: `Our AI agent found a ${Math.round(matchData.matchScore * 100)}% match for your project`,
    //   data: { projectId, grantId, matchData }
    // });
  }

  /**
   * Get agent status and metrics
   */
  getStatus(): object {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      agentStatus: this.grantAgent?.getStatus() || null,
      integration: {
        projectMonitoring: this.isInitialized,
        grantSync: this.isInitialized,
        notificationsBridge: this.isInitialized
      }
    };
  }

  /**
   * Shutdown Fetch.AI integration
   */
  async shutdown(): Promise<void> {
    if (this.grantAgent) {
      await this.grantAgent.shutdown();
    }
    
    this.isInitialized = false;
    console.log('[Fetch.AI] Integration shutdown complete');
  }
}

// Export singleton instance
export const fetchAIIntegration = new FetchAIIntegrationService();