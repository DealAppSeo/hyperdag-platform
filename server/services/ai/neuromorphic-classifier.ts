/**
 * Neuromorphic Agent Classification System
 * Based on biological neuron principles for optimal AI orchestration
 */

export enum NeuronType {
  SENSORY = 'sensory',
  INTERNEURON = 'interneuron', 
  MOTOR = 'motor'
}

export interface NeuromorphicAgent {
  id: string;
  type: NeuronType;
  specialization: string;
  capabilities: string[];
  performance: {
    accuracy: number;
    latency: number;
    reliability: number;
  };
  connectionStrength: number;
}

export interface TrinityFormation {
  sensory: NeuromorphicAgent;
  interneuron: NeuromorphicAgent;
  motor: NeuromorphicAgent;
  synergyScore: number;
  informationFlow: number;
}

export class NeuromorphicClassifier {
  private agents: Map<string, NeuromorphicAgent> = new Map();
  private trinityFormations: TrinityFormation[] = [];
  private readonly phi = 1.618033988749895; // Golden ratio

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Initialize agents with neuromorphic classifications
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: NeuromorphicAgent[] = [
      // Sensory Neurons - Environmental perception and data gathering
      {
        id: 'web-search-sensory',
        type: NeuronType.SENSORY,
        specialization: 'Web information gathering',
        capabilities: ['search', 'crawl', 'extract', 'monitor'],
        performance: { accuracy: 0.85, latency: 2000, reliability: 0.90 },
        connectionStrength: 0.8
      },
      {
        id: 'api-connector-sensory', 
        type: NeuronType.SENSORY,
        specialization: 'External API interfacing',
        capabilities: ['rest-api', 'graphql', 'websocket', 'stream'],
        performance: { accuracy: 0.92, latency: 500, reliability: 0.95 },
        connectionStrength: 0.85
      },
      {
        id: 'database-sensor',
        type: NeuronType.SENSORY,
        specialization: 'Data source monitoring', 
        capabilities: ['query', 'monitor', 'sync', 'validate'],
        performance: { accuracy: 0.98, latency: 200, reliability: 0.99 },
        connectionStrength: 0.9
      },

      // Interneurons - Processing, reasoning, and pattern recognition
      {
        id: 'anfis-processor',
        type: NeuronType.INTERNEURON,
        specialization: 'Fuzzy logic reasoning',
        capabilities: ['fuzzy-logic', 'neural-adaptation', 'optimization'],
        performance: { accuracy: 0.88, latency: 150, reliability: 0.93 },
        connectionStrength: 0.95
      },
      {
        id: 'pattern-analyzer',
        type: NeuronType.INTERNEURON, 
        specialization: 'Pattern recognition and analysis',
        capabilities: ['pattern-match', 'anomaly-detect', 'classify'],
        performance: { accuracy: 0.91, latency: 300, reliability: 0.87 },
        connectionStrength: 0.88
      },
      {
        id: 'reasoning-engine',
        type: NeuronType.INTERNEURON,
        specialization: 'Logical inference and validation',
        capabilities: ['logical-reasoning', 'validation', 'inference'],
        performance: { accuracy: 0.94, latency: 400, reliability: 0.91 },
        connectionStrength: 0.92
      },

      // Motor Neurons - Action execution and output generation  
      {
        id: 'code-generator',
        type: NeuronType.MOTOR,
        specialization: 'Code and script generation',
        capabilities: ['code-gen', 'refactor', 'optimize', 'test'],
        performance: { accuracy: 0.86, latency: 1000, reliability: 0.89 },
        connectionStrength: 0.83
      },
      {
        id: 'content-creator',
        type: NeuronType.MOTOR,
        specialization: 'Content and document generation',
        capabilities: ['write', 'format', 'design', 'publish'],
        performance: { accuracy: 0.89, latency: 1500, reliability: 0.85 },
        connectionStrength: 0.87
      },
      {
        id: 'action-executor',
        type: NeuronType.MOTOR,
        specialization: 'System commands and API calls',
        capabilities: ['execute', 'deploy', 'configure', 'control'],
        performance: { accuracy: 0.93, latency: 800, reliability: 0.94 },
        connectionStrength: 0.91
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    console.log(`[Neuromorphic Classifier] Initialized ${defaultAgents.length} agents across all neuron types`);
  }

  /**
   * Form optimal trinity combinations using biological principles
   */
  formOptimalTrinity(task: { complexity: number; domain: string; requiresAction: boolean }): TrinityFormation {
    const sensoryAgents = this.getAgentsByType(NeuronType.SENSORY);
    const interneurons = this.getAgentsByType(NeuronType.INTERNEURON);
    const motorAgents = this.getAgentsByType(NeuronType.MOTOR);

    // Select best agents for task using multiplicative scoring
    const bestSensory = this.selectOptimalAgent(sensoryAgents, task);
    const bestInterneuron = this.selectOptimalAgent(interneurons, task);  
    const bestMotor = this.selectOptimalAgent(motorAgents, task);

    // Calculate trinity synergy using multiplicative enhancement
    const synergyScore = this.calculateTrinitySynergy(bestSensory, bestInterneuron, bestMotor);
    
    // Information flow through the trinity (sensory → inter → motor)
    const informationFlow = this.calculateInformationFlow(bestSensory, bestInterneuron, bestMotor);

    const trinity: TrinityFormation = {
      sensory: bestSensory,
      interneuron: bestInterneuron,
      motor: bestMotor,
      synergyScore,
      informationFlow
    };

    this.trinityFormations.push(trinity);
    
    console.log(`[Neuromorphic] Formed trinity with ${synergyScore.toFixed(3)} synergy score`);
    return trinity;
  }

  /**
   * Calculate multiplicative synergy: Performance = (S × I × M)^(1/φ)
   */
  private calculateTrinitySynergy(sensory: NeuromorphicAgent, inter: NeuromorphicAgent, motor: NeuromorphicAgent): number {
    const sensoryScore = (sensory.performance.accuracy * sensory.connectionStrength);
    const interScore = (inter.performance.accuracy * inter.connectionStrength);
    const motorScore = (motor.performance.accuracy * motor.connectionStrength);

    // Multiplicative enhancement formula from patent
    return Math.pow(sensoryScore * interScore * motorScore, 1 / this.phi);
  }

  /**
   * Calculate information flow efficiency through trinity
   */
  private calculateInformationFlow(sensory: NeuromorphicAgent, inter: NeuromorphicAgent, motor: NeuromorphicAgent): number {
    // Information theory: flow = min(channel capacities) in sequence
    const sensoryCapacity = sensory.performance.reliability / (sensory.performance.latency / 1000);
    const interCapacity = inter.performance.reliability / (inter.performance.latency / 1000);  
    const motorCapacity = motor.performance.reliability / (motor.performance.latency / 1000);

    // Flow limited by bottleneck but enhanced by multiplicative synergy
    const bottleneck = Math.min(sensoryCapacity, interCapacity, motorCapacity);
    const enhancement = Math.sqrt(sensoryCapacity * interCapacity * motorCapacity);
    
    return bottleneck * Math.pow(enhancement, 1/this.phi);
  }

  private getAgentsByType(type: NeuronType): NeuromorphicAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  private selectOptimalAgent(candidates: NeuromorphicAgent[], task: any): NeuromorphicAgent {
    return candidates.reduce((best, current) => {
      const bestScore = this.scoreAgentForTask(best, task);
      const currentScore = this.scoreAgentForTask(current, task);
      return currentScore > bestScore ? current : best;
    });
  }

  private scoreAgentForTask(agent: NeuromorphicAgent, task: any): number {
    // Multi-factor scoring considering task requirements
    let score = agent.performance.accuracy * agent.connectionStrength;
    
    // Boost score for relevant capabilities
    if (task.domain && agent.specialization.includes(task.domain)) {
      score *= 1.2;
    }

    // Consider reliability for complex tasks
    if (task.complexity > 0.7) {
      score *= agent.performance.reliability;
    }

    return score;
  }

  /**
   * Get neuromorphic classification for agent type recommendation
   */
  classifyAgentRole(capabilities: string[]): NeuronType {
    const sensoryKeywords = ['search', 'crawl', 'monitor', 'sense', 'detect', 'input', 'gather'];
    const interneuronKeywords = ['analyze', 'process', 'reason', 'validate', 'transform', 'logic'];
    const motorKeywords = ['generate', 'create', 'execute', 'deploy', 'build', 'output', 'action'];

    let sensoryScore = 0;
    let interneuronScore = 0; 
    let motorScore = 0;

    capabilities.forEach(cap => {
      if (sensoryKeywords.some(kw => cap.toLowerCase().includes(kw))) sensoryScore++;
      if (interneuronKeywords.some(kw => cap.toLowerCase().includes(kw))) interneuronScore++;
      if (motorKeywords.some(kw => cap.toLowerCase().includes(kw))) motorScore++;
    });

    if (interneuronScore >= sensoryScore && interneuronScore >= motorScore) return NeuronType.INTERNEURON;
    if (motorScore >= sensoryScore) return NeuronType.MOTOR;
    return NeuronType.SENSORY;
  }

  /**
   * Get current trinity formations and performance metrics
   */
  getTrinityMetrics(): { 
    totalFormations: number;
    avgSynergyScore: number;
    avgInformationFlow: number;
    optimalFormations: TrinityFormation[];
  } {
    const avgSynergyScore = this.trinityFormations.reduce((sum, t) => sum + t.synergyScore, 0) / this.trinityFormations.length || 0;
    const avgInformationFlow = this.trinityFormations.reduce((sum, t) => sum + t.informationFlow, 0) / this.trinityFormations.length || 0;
    
    // Get top-performing formations
    const optimalFormations = this.trinityFormations
      .sort((a, b) => b.synergyScore - a.synergyScore)
      .slice(0, 3);

    return {
      totalFormations: this.trinityFormations.length,
      avgSynergyScore,
      avgInformationFlow, 
      optimalFormations
    };
  }
}

// Export singleton instance
export const neuromorphicClassifier = new NeuromorphicClassifier();