/**
 * ANFIS (Adaptive Neuro-Fuzzy Inference System) Router
 * Intelligent routing for multi-agent AI coordination
 * Based on fuzzy logic + neural network adaptation
 */

interface AgentCapabilities {
  web3Expertise: number; // 0-1
  aiOrchestration: number; // 0-1
  visualGeneration: number; // 0-1
  costEfficiency: number; // 0-1
  responseTime: number; // 0-1 (normalized)
  availability: number; // 0-1
}

interface TaskRequirements {
  requiresWeb3: number; // 0-1
  requiresAI: number; // 0-1
  requiresVisuals: number; // 0-1
  urgency: number; // 0-1
  budgetSensitive: number; // 0-1
  complexity: number; // 0-1
}

interface Agent {
  id: string;
  name: string;
  capabilities: AgentCapabilities;
  currentLoad: number; // 0-1
  repIDScore: number;
}

interface RoutingDecision {
  agent: string;
  confidence: number;
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
}

export class ANFISRouter {
  private agents: Agent[] = [
    {
      id: 'hyperdag',
      name: 'HyperDagManager',
      capabilities: {
        web3Expertise: 0.95,
        aiOrchestration: 0.60,
        visualGeneration: 0.30,
        costEfficiency: 0.85,
        responseTime: 0.70,
        availability: 0.90,
      },
      currentLoad: 0.0,
      repIDScore: 850,
    },
    {
      id: 'ai-prompt-manager',
      name: 'AI-Prompt-Manager',
      capabilities: {
        web3Expertise: 0.55,
        aiOrchestration: 0.98,
        visualGeneration: 0.50,
        costEfficiency: 0.92,
        responseTime: 0.95,
        availability: 0.95,
      },
      currentLoad: 0.0,
      repIDScore: 920,
    },
    {
      id: 'imagebearer',
      name: 'ImageBearerAI',
      capabilities: {
        web3Expertise: 0.40,
        aiOrchestration: 0.65,
        visualGeneration: 0.95,
        costEfficiency: 0.75,
        responseTime: 0.80,
        availability: 0.88,
      },
      currentLoad: 0.0,
      repIDScore: 880,
    },
  ];

  /**
   * Fuzzy membership function: Triangular
   */
  private triangularMembership(
    value: number,
    a: number,
    b: number,
    c: number
  ): number {
    if (value <= a || value >= c) return 0;
    if (value === b) return 1;
    if (value < b) return (value - a) / (b - a);
    return (c - value) / (c - b);
  }

  /**
   * Fuzzy membership function: Trapezoidal
   */
  private trapezoidalMembership(
    value: number,
    a: number,
    b: number,
    c: number,
    d: number
  ): number {
    if (value <= a || value >= d) return 0;
    if (value >= b && value <= c) return 1;
    if (value < b) return (value - a) / (b - a);
    return (d - value) / (d - c);
  }

  /**
   * Fuzzify input values into linguistic variables
   */
  private fuzzifyTaskComplexity(complexity: number) {
    return {
      low: this.triangularMembership(complexity, 0, 0, 0.5),
      medium: this.triangularMembership(complexity, 0.2, 0.5, 0.8),
      high: this.triangularMembership(complexity, 0.5, 1, 1),
    };
  }

  private fuzzifyAgentExpertise(expertise: number) {
    return {
      novice: this.triangularMembership(expertise, 0, 0, 0.4),
      intermediate: this.triangularMembership(expertise, 0.2, 0.5, 0.8),
      expert: this.triangularMembership(expertise, 0.6, 1, 1),
    };
  }

  /**
   * Apply fuzzy rules for routing decision
   */
  private applyFuzzyRules(
    task: TaskRequirements,
    agent: Agent
  ): number {
    const taskComplexity = this.fuzzifyTaskComplexity(task.complexity);
    
    // Calculate expertise match for each domain
    const web3Match = task.requiresWeb3 * agent.capabilities.web3Expertise;
    const aiMatch = task.requiresAI * agent.capabilities.aiOrchestration;
    const visualMatch = task.requiresVisuals * agent.capabilities.visualGeneration;
    
    // Fuzzy rules
    let suitability = 0;
    
    // Rule 1: High web3 requirement + high web3 expertise = high suitability
    if (task.requiresWeb3 > 0.7 && agent.capabilities.web3Expertise > 0.8) {
      suitability += 0.9;
    }
    
    // Rule 2: High AI requirement + high AI expertise = high suitability
    if (task.requiresAI > 0.7 && agent.capabilities.aiOrchestration > 0.8) {
      suitability += 0.9;
    }
    
    // Rule 3: High visual requirement + high visual expertise = high suitability
    if (task.requiresVisuals > 0.7 && agent.capabilities.visualGeneration > 0.8) {
      suitability += 0.9;
    }
    
    // Rule 4: Budget sensitive + cost efficient = high suitability
    if (task.budgetSensitive > 0.6 && agent.capabilities.costEfficiency > 0.7) {
      suitability += 0.7;
    }
    
    // Rule 5: Urgent + fast response = high suitability
    if (task.urgency > 0.7 && agent.capabilities.responseTime > 0.8) {
      suitability += 0.8;
    }
    
    // Rule 6: High complexity needs high expertise
    if (taskComplexity.high > 0.5) {
      const avgExpertise = (web3Match + aiMatch + visualMatch) / 3;
      suitability += avgExpertise * 0.8;
    }
    
    // Rule 7: Agent load penalty
    suitability *= (1 - agent.currentLoad * 0.3);
    
    // Rule 8: RepID bonus (higher reputation = slight boost)
    const repIDBonus = Math.min(agent.repIDScore / 1000, 0.2);
    suitability += repIDBonus;
    
    // Normalize to 0-1
    return Math.min(suitability, 1.0);
  }

  /**
   * Neural network weight adaptation (simplified)
   * Updates based on task success/failure feedback
   */
  private adaptWeights(
    agentId: string,
    taskType: string,
    success: boolean,
    learningRate: number = 0.1
  ): void {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    const delta = success ? learningRate : -learningRate;
    
    // Adapt capabilities based on task type
    if (taskType.includes('web3')) {
      agent.capabilities.web3Expertise = Math.max(
        0,
        Math.min(1, agent.capabilities.web3Expertise + delta)
      );
    }
    if (taskType.includes('ai')) {
      agent.capabilities.aiOrchestration = Math.max(
        0,
        Math.min(1, agent.capabilities.aiOrchestration + delta)
      );
    }
    if (taskType.includes('visual')) {
      agent.capabilities.visualGeneration = Math.max(
        0,
        Math.min(1, agent.capabilities.visualGeneration + delta)
      );
    }
  }

  /**
   * Route task to best agent using ANFIS logic
   */
  routeTask(task: TaskRequirements): RoutingDecision {
    const decisions = this.agents.map(agent => {
      const suitability = this.applyFuzzyRules(task, agent);
      
      return {
        agent: agent.name,
        confidence: suitability,
        reasoning: this.generateReasoning(task, agent, suitability),
        estimatedCost: this.estimateCost(task, agent),
        estimatedTime: this.estimateTime(task, agent),
      };
    });
    
    // Select agent with highest suitability
    decisions.sort((a, b) => b.confidence - a.confidence);
    
    return decisions[0];
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateReasoning(
    task: TaskRequirements,
    agent: Agent,
    suitability: number
  ): string {
    const reasons: string[] = [];
    
    if (task.requiresWeb3 > 0.7 && agent.capabilities.web3Expertise > 0.8) {
      reasons.push('strong Web3 expertise match');
    }
    if (task.requiresAI > 0.7 && agent.capabilities.aiOrchestration > 0.8) {
      reasons.push('excellent AI orchestration skills');
    }
    if (task.requiresVisuals > 0.7 && agent.capabilities.visualGeneration > 0.8) {
      reasons.push('superior visual generation capabilities');
    }
    if (task.budgetSensitive > 0.6 && agent.capabilities.costEfficiency > 0.7) {
      reasons.push('cost-efficient execution');
    }
    if (task.urgency > 0.7 && agent.capabilities.responseTime > 0.8) {
      reasons.push('rapid response time');
    }
    if (agent.repIDScore > 900) {
      reasons.push('high reputation score');
    }
    
    if (reasons.length === 0) {
      reasons.push('balanced capabilities for general tasks');
    }
    
    return `${agent.name} selected (${(suitability * 100).toFixed(1)}% match): ${reasons.join(', ')}`;
  }

  /**
   * Estimate task cost based on agent and requirements
   */
  private estimateCost(task: TaskRequirements, agent: Agent): number {
    const baseCost = task.complexity * 10; // $0-10 range
    const efficiencyDiscount = agent.capabilities.costEfficiency * 0.5;
    return baseCost * (1 - efficiencyDiscount);
  }

  /**
   * Estimate task time based on agent and requirements
   */
  private estimateTime(task: TaskRequirements, agent: Agent): number {
    const baseTime = task.complexity * 60; // 0-60 minutes
    const speedBonus = agent.capabilities.responseTime;
    const loadPenalty = agent.currentLoad * 0.5;
    return baseTime * (1 - speedBonus + loadPenalty);
  }

  /**
   * Update agent load after task assignment
   */
  updateAgentLoad(agentId: string, load: number): void {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.currentLoad = Math.max(0, Math.min(1, load));
    }
  }

  /**
   * Provide feedback for learning
   */
  provideFeedback(
    agentId: string,
    taskType: string,
    success: boolean
  ): void {
    this.adaptWeights(agentId, taskType, success);
  }

  /**
   * Get agent status
   */
  getAgentStatus(): Agent[] {
    return this.agents;
  }
}

export const anfisRouter = new ANFISRouter();
