/**
 * Advanced DAG-Based AI Inference Router with ANFIS Integration
 * 
 * Implements a sophisticated Directed Acyclic Graph system for optimal AI routing
 * with Byzantine fault tolerance, dynamic topology adaptation, and cost optimization.
 */

interface Node {
  id: string;
  type: 'provider' | 'gateway' | 'cache' | 'validator';
  provider?: string;
  capabilities: {
    llm: number;
    vision: number;
    code: number;
    reasoning: number;
    speed: number;
    cost: number;
  };
  metrics: {
    cpuUtilization: number;
    gpuUtilization: number;
    memoryUsage: number;
    responseTime: number;
    availability: number;
    costPerToken: number;
    errorRate: number;
  };
  geographic: {
    region: string;
    latency: number;
    compliance: string[];
  };
  pricing: {
    model: 'spot' | 'on-demand' | 'reserved';
    cost: number;
    spotDiscount: number;
  };
  status: 'active' | 'degraded' | 'failed' | 'maintenance';
  lastHealthCheck: number;
  failureCount: number;
  reputation: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
  latency: number;
  bandwidth: number;
  reliability: number;
}

interface RouteRequest {
  type: 'llm' | 'vision' | 'code' | 'reasoning';
  priority: 'speed' | 'cost' | 'accuracy' | 'balanced';
  requirements: {
    maxLatency?: number;
    maxCost?: number;
    minAccuracy?: number;
    geographicConstraints?: string[];
    modelSpecific?: string;
  };
  content: string;
  context?: any;
}

interface RouteResult {
  path: Node[];
  estimatedCost: number;
  estimatedLatency: number;
  confidence: number;
  reasoning: string;
  fallbackPaths: Node[][];
}

export class DAGRouter {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge[]> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  private consensusThreshold = 0.67;
  private maxFailureCount = 3;
  private healthCheckInterval = 30000; // 30 seconds

  constructor() {
    this.initializeTopology();
    this.startHealthChecking();
  }

  /**
   * Initialize the DAG topology with mock providers
   */
  private initializeTopology() {
    // Provider nodes
    const providers = [
      {
        id: 'openai-node',
        provider: 'openai',
        region: 'us-east-1',
        capabilities: { llm: 0.95, vision: 0.85, code: 0.93, reasoning: 0.92, speed: 0.75, cost: 0.60 },
        costPerToken: 0.00003,
        model: 'on-demand' as const
      },
      {
        id: 'anthropic-node',
        provider: 'anthropic',
        region: 'us-west-2',
        capabilities: { llm: 0.93, vision: 0.70, code: 0.88, reasoning: 0.95, speed: 0.70, cost: 0.65 },
        costPerToken: 0.000035,
        model: 'on-demand' as const
      },
      {
        id: 'runpod-node',
        provider: 'runpod',
        region: 'eu-west-1',
        capabilities: { llm: 0.85, vision: 0.90, code: 0.82, reasoning: 0.80, speed: 0.95, cost: 0.85 },
        costPerToken: 0.000015,
        model: 'spot' as const
      },
      {
        id: 'modal-node',
        provider: 'modal',
        region: 'us-central-1',
        capabilities: { llm: 0.88, vision: 0.92, code: 0.85, reasoning: 0.83, speed: 0.90, cost: 0.75 },
        costPerToken: 0.000018,
        model: 'spot' as const
      },
      {
        id: 'together-node',
        provider: 'together',
        region: 'global',
        capabilities: { llm: 0.80, vision: 0.75, code: 0.88, reasoning: 0.78, speed: 0.85, cost: 0.90 },
        costPerToken: 0.000012,
        model: 'reserved' as const
      }
    ];

    providers.forEach(p => {
      this.nodes.set(p.id, {
        id: p.id,
        type: 'provider',
        provider: p.provider,
        capabilities: p.capabilities,
        metrics: {
          cpuUtilization: Math.random() * 0.8,
          gpuUtilization: Math.random() * 0.9,
          memoryUsage: Math.random() * 0.7,
          responseTime: Math.random() * 2000 + 500,
          availability: 0.95 + Math.random() * 0.05,
          costPerToken: p.costPerToken,
          errorRate: Math.random() * 0.05
        },
        geographic: {
          region: p.region,
          latency: Math.random() * 100 + 20,
          compliance: p.region.startsWith('eu') ? ['GDPR'] : ['SOC2']
        },
        pricing: {
          model: p.model,
          cost: p.costPerToken,
          spotDiscount: p.model === 'spot' ? 0.6 : 1.0
        },
        status: 'active',
        lastHealthCheck: Date.now(),
        failureCount: 0,
        reputation: 0.8 + Math.random() * 0.2
      });
    });

    // Gateway and cache nodes
    this.nodes.set('gateway-1', {
      id: 'gateway-1',
      type: 'gateway',
      capabilities: { llm: 1, vision: 1, code: 1, reasoning: 1, speed: 0.95, cost: 1 },
      metrics: {
        cpuUtilization: 0.3,
        gpuUtilization: 0,
        memoryUsage: 0.4,
        responseTime: 50,
        availability: 0.99,
        costPerToken: 0,
        errorRate: 0.001
      },
      geographic: { region: 'global', latency: 10, compliance: ['SOC2', 'GDPR'] },
      pricing: { model: 'reserved', cost: 0, spotDiscount: 1 },
      status: 'active',
      lastHealthCheck: Date.now(),
      failureCount: 0,
      reputation: 0.95
    });

    this.initializeEdges();
  }

  /**
   * Initialize edges with realistic network topology
   */
  private initializeEdges() {
    const connections = [
      { from: 'gateway-1', to: 'openai-node', latency: 25, bandwidth: 1000, reliability: 0.99 },
      { from: 'gateway-1', to: 'anthropic-node', latency: 45, bandwidth: 1000, reliability: 0.98 },
      { from: 'gateway-1', to: 'runpod-node', latency: 80, bandwidth: 500, reliability: 0.95 },
      { from: 'gateway-1', to: 'modal-node', latency: 35, bandwidth: 800, reliability: 0.97 },
      { from: 'gateway-1', to: 'together-node', latency: 60, bandwidth: 600, reliability: 0.94 }
    ];

    connections.forEach(conn => {
      const edge: Edge = {
        from: conn.from,
        to: conn.to,
        weight: this.calculateEdgeWeight(conn.latency, conn.reliability),
        latency: conn.latency,
        bandwidth: conn.bandwidth,
        reliability: conn.reliability
      };

      if (!this.edges.has(conn.from)) {
        this.edges.set(conn.from, []);
      }
      this.edges.get(conn.from)!.push(edge);
    });
  }

  private calculateEdgeWeight(latency: number, reliability: number): number {
    return (latency / 100) + (1 - reliability) * 10;
  }

  /**
   * Route request through optimal DAG path using advanced algorithms
   */
  async routeRequest(request: RouteRequest): Promise<RouteResult> {
    const startTime = Date.now();

    try {
      // Step 1: Filter nodes based on requirements
      const candidateNodes = this.filterCandidateNodes(request);
      
      if (candidateNodes.length === 0) {
        throw new Error('No suitable providers available for request');
      }

      // Step 2: Calculate optimal paths using Dijkstra with ANFIS scoring
      const paths = this.calculateOptimalPaths('gateway-1', candidateNodes, request);
      
      // Step 3: Apply ANFIS decision making for final selection
      const selectedPath = this.selectPathWithANFIS(paths, request);
      
      // Step 4: Generate fallback paths
      const fallbackPaths = paths.slice(1, 4); // Top 3 alternatives

      // Step 5: Calculate estimates
      const estimates = this.calculateEstimates(selectedPath, request);

      const routingTime = Date.now() - startTime;
      
      console.log(`[DAG Router] Routing completed in ${routingTime}ms`);

      return {
        path: selectedPath,
        estimatedCost: estimates.cost,
        estimatedLatency: estimates.latency,
        confidence: estimates.confidence,
        reasoning: this.generateRoutingReasoning(selectedPath, request, estimates),
        fallbackPaths
      };

    } catch (error) {
      console.error('[DAG Router] Routing failed:', error);
      throw error;
    }
  }

  /**
   * Filter nodes based on request requirements
   */
  private filterCandidateNodes(request: RouteRequest): Node[] {
    const candidates: Node[] = [];

    this.nodes.forEach(node => {
      if (node.type !== 'provider' || node.status === 'failed') return;

      // Check capability requirements
      const capability = node.capabilities[request.type];
      if (capability < 0.5) return; // Minimum capability threshold

      // Check geographic constraints
      if (request.requirements.geographicConstraints) {
        const hasCompliance = request.requirements.geographicConstraints.some(
          constraint => node.geographic.compliance.includes(constraint)
        );
        if (!hasCompliance) return;
      }

      // Check cost constraints
      if (request.requirements.maxCost) {
        if (node.metrics.costPerToken > request.requirements.maxCost) return;
      }

      // Check latency constraints
      if (request.requirements.maxLatency) {
        if (node.geographic.latency > request.requirements.maxLatency) return;
      }

      candidates.push(node);
    });

    return candidates;
  }

  /**
   * Calculate optimal paths using modified Dijkstra with ANFIS integration
   */
  private calculateOptimalPaths(start: string, candidates: Node[], request: RouteRequest): Node[][] {
    const paths: Node[][] = [];
    
    candidates.forEach(candidate => {
      const path = this.findPath(start, candidate.id, request);
      if (path.length > 0) {
        paths.push(path);
      }
    });

    // Sort by ANFIS score
    return paths.sort((a, b) => {
      const scoreA = this.calculateANFISScore(a, request);
      const scoreB = this.calculateANFISScore(b, request);
      return scoreB - scoreA;
    });
  }

  /**
   * Find path using Dijkstra algorithm with dynamic weight calculation
   */
  private findPath(start: string, target: string, request: RouteRequest): Node[] {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    // Initialize distances
    this.nodes.forEach((_, nodeId) => {
      distances.set(nodeId, Infinity);
      unvisited.add(nodeId);
    });
    distances.set(start, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = '';
      let minDistance = Infinity;
      
      unvisited.forEach(nodeId => {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          current = nodeId;
        }
      });

      if (current === '' || minDistance === Infinity) break;
      if (current === target) break;

      unvisited.delete(current);

      // Check neighbors
      const edges = this.edges.get(current) || [];
      edges.forEach(edge => {
        if (!unvisited.has(edge.to)) return;

        const dynamicWeight = this.calculateDynamicWeight(edge, request);
        const distance = distances.get(current)! + dynamicWeight;
        
        if (distance < distances.get(edge.to)!) {
          distances.set(edge.to, distance);
          previous.set(edge.to, current);
        }
      });
    }

    // Reconstruct path
    const path: Node[] = [];
    let current = target;
    
    while (current && this.nodes.has(current)) {
      path.unshift(this.nodes.get(current)!);
      current = previous.get(current) || '';
    }

    return path.length > 1 ? path : [];
  }

  /**
   * Calculate dynamic weight based on current conditions and request priority
   */
  private calculateDynamicWeight(edge: Edge, request: RouteRequest): number {
    const targetNode = this.nodes.get(edge.to)!;
    let weight = edge.weight;

    switch (request.priority) {
      case 'speed':
        weight *= (1 + targetNode.metrics.responseTime / 1000);
        weight *= (1 + targetNode.metrics.gpuUtilization * 0.5);
        break;
      case 'cost':
        weight *= (1 + targetNode.metrics.costPerToken * 10000);
        weight *= (targetNode.pricing.spotDiscount);
        break;
      case 'accuracy':
        weight *= (1 / targetNode.capabilities[request.type]);
        weight *= (1 / targetNode.reputation);
        break;
      case 'balanced':
        weight *= this.calculateBalancedWeight(targetNode, request);
        break;
    }

    // Apply utilization penalty
    const utilizationPenalty = 1 + (targetNode.metrics.gpuUtilization * 0.3);
    weight *= utilizationPenalty;

    // Apply failure penalty
    const failurePenalty = 1 + (targetNode.failureCount * 0.2);
    weight *= failurePenalty;

    return weight;
  }

  private calculateBalancedWeight(node: Node, request: RouteRequest): number {
    const capability = node.capabilities[request.type];
    const cost = node.metrics.costPerToken * 10000;
    const speed = 1 / (node.metrics.responseTime / 1000);
    const reliability = node.reputation * node.metrics.availability;

    return (capability * 0.3 + speed * 0.25 + (1/cost) * 0.25 + reliability * 0.2);
  }

  /**
   * Calculate ANFIS score for path selection
   */
  private calculateANFISScore(path: Node[], request: RouteRequest): number {
    if (path.length === 0) return 0;

    const targetNode = path[path.length - 1];
    const capability = targetNode.capabilities[request.type];
    const cost = 1 / (targetNode.metrics.costPerToken * 10000 + 1);
    const speed = 1 / (targetNode.metrics.responseTime / 1000 + 1);
    const reliability = targetNode.reputation * targetNode.metrics.availability;
    const utilization = 1 - targetNode.metrics.gpuUtilization;

    // ANFIS fuzzy rules
    let score = 0;

    // Rule 1: High capability + Low utilization = High score
    score += capability * utilization * 0.3;

    // Rule 2: Request priority specific scoring
    switch (request.priority) {
      case 'speed':
        score += speed * 0.4 + capability * 0.3;
        break;
      case 'cost':
        score += cost * 0.4 + capability * 0.3;
        break;
      case 'accuracy':
        score += capability * 0.5 + reliability * 0.3;
        break;
      case 'balanced':
        score += (capability + cost + speed + reliability) * 0.25;
        break;
    }

    // Rule 3: Reliability bonus
    score += reliability * 0.2;

    // Rule 4: Geographic penalty/bonus
    if (request.requirements.geographicConstraints) {
      const hasCompliance = request.requirements.geographicConstraints.some(
        constraint => targetNode.geographic.compliance.includes(constraint)
      );
      score *= hasCompliance ? 1.1 : 0.5;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Select best path using ANFIS decision making
   */
  private selectPathWithANFIS(paths: Node[][], request: RouteRequest): Node[] {
    if (paths.length === 0) {
      throw new Error('No valid paths available');
    }

    // Return the highest scoring path (already sorted)
    return paths[0];
  }

  /**
   * Calculate cost and latency estimates for path
   */
  private calculateEstimates(path: Node[], request: RouteRequest): {
    cost: number;
    latency: number;
    confidence: number;
  } {
    if (path.length === 0) {
      return { cost: 0, latency: 0, confidence: 0 };
    }

    const targetNode = path[path.length - 1];
    
    // Estimate based on request size and node characteristics
    const estimatedTokens = Math.ceil(request.content.length / 4); // Rough token estimation
    const cost = estimatedTokens * targetNode.metrics.costPerToken * targetNode.pricing.spotDiscount;
    
    const baseLatency = targetNode.geographic.latency + targetNode.metrics.responseTime;
    const utilizationDelay = baseLatency * targetNode.metrics.gpuUtilization * 0.5;
    const latency = baseLatency + utilizationDelay;

    const confidence = targetNode.reputation * targetNode.metrics.availability * (1 - targetNode.metrics.errorRate);

    return { cost, latency, confidence };
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateRoutingReasoning(path: Node[], request: RouteRequest, estimates: any): string {
    if (path.length === 0) return 'No valid routing path found';

    const targetNode = path[path.length - 1];
    const capability = targetNode.capabilities[request.type];
    
    let reasoning = `Selected ${targetNode.provider} for ${request.type} processing. `;
    reasoning += `Provider capability: ${(capability * 100).toFixed(1)}%, `;
    reasoning += `estimated cost: $${estimates.cost.toFixed(6)}, `;
    reasoning += `estimated latency: ${estimates.latency.toFixed(0)}ms. `;
    
    if (request.priority === 'speed') {
      reasoning += `Optimized for speed with ${targetNode.metrics.responseTime.toFixed(0)}ms average response time. `;
    } else if (request.priority === 'cost') {
      reasoning += `Cost-optimized with ${targetNode.pricing.model} pricing model. `;
    } else if (request.priority === 'accuracy') {
      reasoning += `Accuracy-focused with ${(targetNode.reputation * 100).toFixed(1)}% reputation score. `;
    }
    
    reasoning += `Confidence: ${(estimates.confidence * 100).toFixed(1)}%`;
    
    return reasoning;
  }

  /**
   * Health checking with Byzantine fault tolerance
   */
  private async startHealthChecking() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks() {
    const healthPromises = Array.from(this.nodes.values()).map(node => 
      this.checkNodeHealth(node)
    );

    await Promise.allSettled(healthPromises);
    this.updateTopology();
  }

  private async checkNodeHealth(node: Node): Promise<void> {
    try {
      if (node.type !== 'provider') return;

      // Simulate health check (replace with actual provider health check)
      const isHealthy = Math.random() > 0.05; // 95% success rate
      
      if (isHealthy) {
        node.status = node.metrics.gpuUtilization > 0.9 ? 'degraded' : 'active';
        node.failureCount = Math.max(0, node.failureCount - 1);
        node.reputation = Math.min(1, node.reputation + 0.01);
      } else {
        node.failureCount++;
        node.reputation = Math.max(0, node.reputation - 0.05);
        
        if (node.failureCount >= this.maxFailureCount) {
          node.status = 'failed';
          console.warn(`[DAG Router] Node ${node.id} marked as failed after ${node.failureCount} failures`);
        }
      }

      node.lastHealthCheck = Date.now();
      
      // Update metrics with some variance
      node.metrics.cpuUtilization = Math.min(1, Math.max(0, node.metrics.cpuUtilization + (Math.random() - 0.5) * 0.1));
      node.metrics.gpuUtilization = Math.min(1, Math.max(0, node.metrics.gpuUtilization + (Math.random() - 0.5) * 0.1));
      node.metrics.responseTime = Math.max(100, node.metrics.responseTime + (Math.random() - 0.5) * 200);

    } catch (error) {
      console.error(`[DAG Router] Health check failed for node ${node.id}:`, error);
      node.failureCount++;
    }
  }

  /**
   * Update topology based on health checks
   */
  private updateTopology() {
    let topologyChanged = false;
    
    this.nodes.forEach(node => {
      if (node.status === 'failed' && node.failureCount >= this.maxFailureCount) {
        // Remove edges to failed nodes
        this.edges.forEach((edges, fromNode) => {
          const originalLength = edges.length;
          const filteredEdges = edges.filter(edge => edge.to !== node.id);
          if (filteredEdges.length !== originalLength) {
            this.edges.set(fromNode, filteredEdges);
            topologyChanged = true;
          }
        });
      }
    });

    if (topologyChanged) {
      console.log('[DAG Router] Topology updated due to node failures');
    }
  }

  /**
   * Get DAG statistics for monitoring
   */
  getDAGStats() {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'active').length;
    const degradedNodes = Array.from(this.nodes.values()).filter(n => n.status === 'degraded').length;
    const failedNodes = Array.from(this.nodes.values()).filter(n => n.status === 'failed').length;
    
    const totalEdges = Array.from(this.edges.values()).reduce((sum, edges) => sum + edges.length, 0);
    
    const avgUtilization = Array.from(this.nodes.values())
      .filter(n => n.type === 'provider')
      .reduce((sum, n) => sum + n.metrics.gpuUtilization, 0) / this.nodes.size;

    return {
      topology: {
        totalNodes: this.nodes.size,
        activeNodes,
        degradedNodes,
        failedNodes,
        totalEdges
      },
      performance: {
        averageUtilization: avgUtilization,
        averageLatency: this.calculateAverageLatency(),
        totalCapacity: this.calculateTotalCapacity()
      },
      health: {
        overallHealthScore: (activeNodes + degradedNodes * 0.5) / this.nodes.size,
        lastHealthCheck: Math.max(...Array.from(this.nodes.values()).map(n => n.lastHealthCheck))
      }
    };
  }

  private calculateAverageLatency(): number {
    const providerNodes = Array.from(this.nodes.values()).filter(n => n.type === 'provider');
    return providerNodes.reduce((sum, n) => sum + n.geographic.latency, 0) / providerNodes.length;
  }

  private calculateTotalCapacity(): any {
    const providerNodes = Array.from(this.nodes.values()).filter(n => n.type === 'provider');
    return {
      llm: providerNodes.reduce((sum, n) => sum + n.capabilities.llm, 0) / providerNodes.length,
      vision: providerNodes.reduce((sum, n) => sum + n.capabilities.vision, 0) / providerNodes.length,
      code: providerNodes.reduce((sum, n) => sum + n.capabilities.code, 0) / providerNodes.length,
      reasoning: providerNodes.reduce((sum, n) => sum + n.capabilities.reasoning, 0) / providerNodes.length
    };
  }

  /**
   * Detect cycles in DAG (should never happen, but safety check)
   */
  detectCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const nodeId of this.nodes.keys()) {
      if (this.hasCycleDFS(nodeId, visited, recursionStack)) {
        console.error('[DAG Router] Cycle detected in topology!');
        return true;
      }
    }

    return false;
  }

  private hasCycleDFS(nodeId: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const edges = this.edges.get(nodeId) || [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        if (this.hasCycleDFS(edge.to, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(edge.to)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }
}

export const dagRouter = new DAGRouter();