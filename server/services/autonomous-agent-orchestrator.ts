// Autonomous Agent Orchestrator - AI Auto Dev Symphony Implementation
// Coordinates 8 autonomous agents with equal priority and free tier optimization

import { resourceArbitrageEngine } from './resource-arbitrage-engine';
import { prometheusMetrics } from './monitoring/prometheus-metrics';
import { providerRouter } from './provider-router';

interface AgentTask {
  type: string;
  priority: number;
  estimatedCost: number;
  deadline?: Date;
  payload: any;
}

interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  avgCost: number;
  lastActiveTime: Date;
}

export class AutonomousAgentOrchestrator {
  private agentTypes = [
    'conference-hunter',
    'grant-writer', 
    'partnership-builder',
    'viral-content-creator',
    'head-hunter',
    'marketing-pr',
    'team-builder',
    'social-problem-solver'
  ];

  private agentPerformance = new Map<string, AgentPerformance>();
  private taskQueue: AgentTask[] = [];
  private isActive = true;
  private dailyBudget = 10.00; // Default $10/day budget
  private spentToday = 0;
  private lastResetTime = Date.now();

  constructor() {
    this.initializeAgents();
    
    // ⚠️ BLOAT PURGE: Disable auto-start to fix screen flashing
    // Re-enable by setting: ENABLE_ORCHESTRATOR=true in .env
    if (process.env.ENABLE_ORCHESTRATOR === 'true') {
      this.startExecutionLoop();
      console.log('[Orchestrator] ✅ Auto-execution enabled');
    } else {
      console.log('[Orchestrator] ⚙️  Auto-execution DISABLED (reduce server load)');
    }
  }

  private initializeAgents() {
    this.agentTypes.forEach(type => {
      this.agentPerformance.set(type, {
        tasksCompleted: 0,
        successRate: 0.8,
        avgCost: 0.02,
        lastActiveTime: new Date()
      });
    });
    console.log('[Orchestrator] Initialized 8 autonomous agents with equal priority');
  }

  private async startExecutionLoop() {
    console.log('[Orchestrator] Starting autonomous execution loop (15 minute intervals)');
    
    while (this.isActive) {
      try {
        await this.executeMainLoop();
        await this.sleep(15 * 60 * 1000); // 15 minute intervals (was 30 seconds)
      } catch (error) {
        console.error('[Orchestrator] Execution loop error:', error);
        await this.sleep(5 * 60 * 1000); // 5 minutes on error (was 1 minute)
      }
    }
  }

  private async executeMainLoop() {
    // 1. CHECK mobile commands (would come from API)
    await this.checkMobileCommands();
    
    // 2. SCAN for new opportunities
    await this.scanForOpportunities();
    
    // 3. EXECUTE priority tasks with equal rotation
    await this.executeTasksWithRotation();
    
    // 4. OPTIMIZE running agents
    await this.optimizeAgentPerformance();
    
    // 5. LEARN from outcomes
    await this.updateLearning();
    
    // 6. REPORT progress (once per cycle since cycles are now 15 minutes)
    await this.reportProgress();
  }

  private async checkMobileCommands() {
    // In production, this would check Supabase for mobile commands
    // For now, we'll use environment variables or API calls
    const newBudget = process.env.DAILY_BUDGET;
    if (newBudget && parseFloat(newBudget) !== this.dailyBudget) {
      this.dailyBudget = parseFloat(newBudget);
      console.log(`[Orchestrator] Budget updated to $${this.dailyBudget}/day`);
    }
  }

  private async scanForOpportunities() {
    // Get arbitrage opportunities
    const opportunities = await resourceArbitrageEngine.scanForOpportunities();
    
    // Convert opportunities to agent tasks
    opportunities.forEach(opp => {
      if (opp.immediateAction) {
        this.addTask({
          type: this.selectAgentForOpportunity(opp),
          priority: 10, // High priority for immediate action
          estimatedCost: 0, // Free tier or arbitrage
          payload: { opportunity: opp }
        });
      }
    });

    // Add daily routine tasks for all agents
    this.addRoutineTasks();
  }

  private selectAgentForOpportunity(opportunity: any): string {
    if (opportunity.sector === 'gaming' || opportunity.sector === 'mining') {
      return 'partnership-builder'; // Build partnerships with compute providers
    }
    if (opportunity.type === 'ai-free-tier') {
      return 'viral-content-creator'; // Use free AI for content creation
    }
    return 'social-problem-solver'; // Default to social impact
  }

  private addRoutineTasks() {
    // Add one task per agent type per cycle (equal priority)
    this.agentTypes.forEach(agentType => {
      this.addTask({
        type: agentType,
        priority: 5, // Normal priority
        estimatedCost: this.estimateTaskCost(agentType),
        payload: this.generateRoutinePayload(agentType)
      });
    });
  }

  private generateRoutinePayload(agentType: string): any {
    const routinePayloads = {
      'conference-hunter': {
        action: 'search',
        keywords: ['AI', 'Web3', 'Social Impact', 'Blockchain'],
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days out
        filters: { virtual: true, prizePool: '>$1000' }
      },
      'grant-writer': {
        action: 'search',
        keywords: ['AI innovation', 'Social impact', 'Open source'],
        amountRange: { min: 10000, max: 1000000 },
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days out
      },
      'partnership-builder': {
        action: 'identify',
        targetSectors: ['AI/ML companies', 'Web3 platforms', 'Social enterprises'],
        partnershipType: 'strategic alliance',
        mutualValue: 'AI optimization services'
      },
      'viral-content-creator': {
        action: 'create',
        platforms: ['LinkedIn', 'Twitter', 'Medium'],
        topics: ['AI Symphony', 'Cost optimization', 'Social impact'],
        engagementGoal: '>100 interactions'
      },
      'head-hunter': {
        action: 'search',
        skills: ['AI/ML engineering', 'Web3 development', 'Social impact'],
        experience: '3+ years',
        culture: 'purpose-driven'
      },
      'marketing-pr': {
        action: 'campaign',
        audience: 'AI developers and social entrepreneurs',
        message: 'AI Symphony cost optimization platform',
        channels: ['social media', 'tech blogs', 'podcasts']
      },
      'team-builder': {
        action: 'assess',
        currentTeam: 'solo founder',
        neededRoles: ['AI engineer', 'Business development', 'Marketing'],
        timeline: '3-6 months'
      },
      'social-problem-solver': {
        action: 'identify',
        problemTypes: ['Access to AI', 'Digital divide', 'Education gap'],
        aiSolutions: ['Cost optimization', 'Free tier maximization'],
        impactPotential: 'high'
      }
    };

    return routinePayloads[agentType as keyof typeof routinePayloads] || { action: 'default' };
  }

  private async executeTasksWithRotation() {
    if (this.taskQueue.length === 0) return;

    // Sort tasks by priority and agent rotation
    const sortedTasks = this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // Among same priority, prefer agents that haven't run recently
      const aLastActive = this.agentPerformance.get(a.type)?.lastActiveTime || new Date(0);
      const bLastActive = this.agentPerformance.get(b.type)?.lastActiveTime || new Date(0);
      return aLastActive.getTime() - bLastActive.getTime();
    });

    // Execute up to 3 tasks in parallel (budget permitting)
    const tasksToExecute = sortedTasks.slice(0, 3).filter(task => 
      this.spentToday + task.estimatedCost <= this.dailyBudget
    );

    await Promise.all(tasksToExecute.map(task => this.executeTask(task)));
  }

  private async executeTask(task: AgentTask) {
    console.log(`[${task.type}] Executing task with priority ${task.priority}`);
    
    try {
      // Route through resource arbitrage for optimal cost
      const result = await resourceArbitrageEngine.coordinateWithANFIS({
        taskType: task.type,
        payload: task.payload,
        prioritizeCost: true
      });

      // Execute task with real APIs
      const success = await this.executeTaskReal(task, result);
      
      // Update performance metrics
      this.updateAgentPerformance(task.type, success, result.cost || task.estimatedCost);
      
      // Remove completed task
      this.taskQueue = this.taskQueue.filter(t => t !== task);
      
      console.log(`[${task.type}] Task completed. Success: ${success}, Cost: $${result.cost || 0}`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[${task.type}] Task execution failed:`, errorMsg);
      this.updateAgentPerformance(task.type, false, task.estimatedCost);
    }
  }

  private async executeTaskReal(task: AgentTask, routingResult: any): Promise<boolean> {
    // Execute with real API providers using your actual keys
    try {
      const providerResult = await providerRouter.executeTask({
        type: task.type,
        payload: task.payload,
        prioritizeCost: true
      });
      
      console.log(`[${task.type}] ✅ Real API execution via ${providerResult.provider} - Cost: $${providerResult.cost.toFixed(4)}`);
      return providerResult.success;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[${task.type}] Real API execution failed:`, errorMsg);
      return false;
    }
  }

  private updateAgentPerformance(agentType: string, success: boolean, cost: number) {
    const perf = this.agentPerformance.get(agentType);
    if (!perf) return;

    perf.tasksCompleted++;
    perf.successRate = (perf.successRate * 0.9) + (success ? 0.1 : 0);
    perf.avgCost = (perf.avgCost * 0.8) + (cost * 0.2);
    perf.lastActiveTime = new Date();
    
    this.spentToday += cost;
  }

  private async optimizeAgentPerformance() {
    // Analyze which agents are performing best
    const performances = Array.from(this.agentPerformance.entries());
    const bestPerformers = performances
      .sort((a, b) => b[1].successRate - a[1].successRate)
      .slice(0, 3);

    // Give slight priority boost to best performers
    bestPerformers.forEach(([agentType, perf]) => {
      const relevantTasks = this.taskQueue.filter(t => t.type === agentType);
      relevantTasks.forEach(task => task.priority += 1);
    });
  }

  private async updateLearning() {
    // Learn from resource arbitrage patterns
    const freeTierStatus = resourceArbitrageEngine.getFreeTierStatus();
    
    // REMOVED: No longer adding extra tasks to avoid rate limits
    // The 15-minute interval is already optimal for free tier usage
    
    if (this.spentToday / this.dailyBudget > 0.8) {
      // Approaching budget limit, prioritize free tier
      console.log('[Orchestrator] Learning: Prioritizing free tier due to budget');
      this.taskQueue.forEach(task => {
        if (task.estimatedCost === 0) task.priority += 2;
      });
    }
  }

  private async reportProgress() {
    const totalTasks = Array.from(this.agentPerformance.values())
      .reduce((sum, perf) => sum + perf.tasksCompleted, 0);
    
    const avgSuccessRate = Array.from(this.agentPerformance.values())
      .reduce((sum, perf) => sum + perf.successRate, 0) / this.agentTypes.length;

    const freeTierStatus = resourceArbitrageEngine.getFreeTierStatus();

    console.log('[Orchestrator] Progress Report:');
    console.log(`  Tasks completed today: ${totalTasks}`);
    console.log(`  Average success rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`  Budget used: $${this.spentToday.toFixed(2)}/${this.dailyBudget}`);
    console.log(`  Free tier utilization: ${freeTierStatus.averageUtilization.toFixed(1)}%`);
  }

  private addTask(task: AgentTask) {
    this.taskQueue.push(task);
  }

  private estimateTaskCost(agentType: string): number {
    // Most tasks should be free tier (return 0)
    // Only complex tasks need paid tier
    const costEstimates = {
      'conference-hunter': 0,      // Free tier search and application
      'grant-writer': 0.05,        // Might need premium AI for complex proposals
      'partnership-builder': 0,   // Free tier outreach
      'viral-content-creator': 0,  // Free tier content generation
      'head-hunter': 0,           // Free tier search
      'marketing-pr': 0.02,       // Occasional premium for campaigns
      'team-builder': 0,          // Free tier analysis
      'social-problem-solver': 0   // Free tier problem identification
    };

    return costEstimates[agentType as keyof typeof costEstimates] || 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external control
  pauseAll() {
    this.isActive = false;
    console.log('[Orchestrator] All agents paused');
  }

  resumeAll() {
    this.isActive = true;
    this.startExecutionLoop();
    console.log('[Orchestrator] All agents resumed');
  }

  adjustBudget(newBudget: number) {
    this.dailyBudget = newBudget;
    console.log(`[Orchestrator] Budget adjusted to $${newBudget}/day`);
  }

  getStatus() {
    const freeTierStatus = resourceArbitrageEngine.getFreeTierStatus();
    
    return {
      active: this.isActive,
      agentCount: this.agentTypes.length,
      queuedTasks: this.taskQueue.length,
      dailyBudget: this.dailyBudget,
      spentToday: this.spentToday,
      freeTierUtilization: freeTierStatus.averageUtilization,
      agentPerformance: Object.fromEntries(this.agentPerformance)
    };
  }
}

export const autonomousOrchestrator = new AutonomousAgentOrchestrator();