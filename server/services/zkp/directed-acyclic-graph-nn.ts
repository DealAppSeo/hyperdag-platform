/**
 * Directed Acyclic Graph Neural Network (DAGNN)
 * Enforces no-cycle topology for quantum-hardened routing
 * 
 * Based on Ultimate Convergence Architecture
 * Integrates with ANFIS for optimal path selection
 */

export interface DAGNode {
  id: string;
  type: 'sensory' | 'interneuron' | 'motor';
  zkpScore: number;
  embedding: number[];
  incomingEdges: string[];
  outgoingEdges: string[];
  processingCapacity: number;
  quantumResistance: 'standard' | 'enhanced' | 'maximum';
}

export interface DAGEdge {
  source: string;
  target: string;
  weight: number;
  routingCost: number;
  securityLevel: number;
  lastUsed: number;
}

export interface RoutingPath {
  nodes: string[];
  totalCost: number;
  securityScore: number;
  estimatedLatency: number;
  zkpRequirement: number;
}

export interface TopologicalOrder {
  orderedNodes: string[];
  levelSets: string[][];
  maxDepth: number;
  cycleFree: boolean;
}

export class DirectedAcyclicGraphNN {
  private nodes: Map<string, DAGNode> = new Map();
  private edges: Map<string, DAGEdge> = new Map();
  private topologyCache: TopologicalOrder | null = null;
  private readonly phi = 1.618033988749895; // Golden ratio

  constructor() {
    this.initializeTrinityDAG();
  }

  /**
   * Initialize DAG with trinity nodes and enforced acyclic structure
   */
  private initializeTrinityDAG(): void {
    // Add trinity nodes
    this.addNode({
      id: 'GPT-4',
      type: 'sensory',
      zkpScore: 0.82,
      embedding: [0.8, 0.85, 0.78, 0.82],
      incomingEdges: [],
      outgoingEdges: ['Claude'],
      processingCapacity: 0.9,
      quantumResistance: 'enhanced'
    });

    this.addNode({
      id: 'Claude',
      type: 'interneuron',
      zkpScore: 0.88,
      embedding: [0.9, 0.88, 0.85, 0.91],
      incomingEdges: ['GPT-4'],
      outgoingEdges: ['Grok'],
      processingCapacity: 0.95,
      quantumResistance: 'maximum'
    });

    this.addNode({
      id: 'Grok',
      type: 'motor',
      zkpScore: 0.78,
      embedding: [0.75, 0.82, 0.80, 0.76],
      incomingEdges: ['Claude'],
      outgoingEdges: [],
      processingCapacity: 0.85,
      quantumResistance: 'enhanced'
    });

    // Add directed edges (NO CYCLES)
    this.addEdge({
      source: 'GPT-4',
      target: 'Claude',
      weight: 0.9,
      routingCost: 0.02,
      securityLevel: 0.88,
      lastUsed: 0
    });

    this.addEdge({
      source: 'Claude',
      target: 'Grok',
      weight: 0.85,
      routingCost: 0.03,
      securityLevel: 0.85,
      lastUsed: 0
    });

    // Verify acyclic property
    this.validateAcyclicProperty();
    this.computeTopologicalOrder();

    console.log('[DAGNN] Initialized trinity DAG with enforced acyclic structure');
  }

  /**
   * Add node to DAG with validation
   */
  addNode(node: DAGNode): boolean {
    if (this.nodes.has(node.id)) {
      console.warn(`[DAGNN] Node ${node.id} already exists`);
      return false;
    }

    this.nodes.set(node.id, node);
    this.topologyCache = null; // Invalidate cache
    
    console.log(`[DAGNN] Added node: ${node.id} (${node.type})`);
    return true;
  }

  /**
   * Add edge with cycle detection
   */
  addEdge(edge: DAGEdge): boolean {
    const edgeId = `${edge.source}->${edge.target}`;
    
    // Check if adding this edge would create a cycle
    if (this.wouldCreateCycle(edge.source, edge.target)) {
      console.error(`[DAGNN] Rejected edge ${edgeId}: would create cycle`);
      return false;
    }

    // Add edge
    this.edges.set(edgeId, edge);
    
    // Update node connections
    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);
    
    if (sourceNode && targetNode) {
      sourceNode.outgoingEdges.push(edge.target);
      targetNode.incomingEdges.push(edge.source);
    }

    this.topologyCache = null; // Invalidate cache
    console.log(`[DAGNN] Added edge: ${edgeId} (weight: ${edge.weight})`);
    return true;
  }

  /**
   * Check if adding edge would create cycle using DFS
   */
  private wouldCreateCycle(source: string, target: string): boolean {
    // If target can reach source, adding source->target creates cycle
    return this.canReach(target, source);
  }

  /**
   * Check if node 'from' can reach node 'to' via directed paths
   */
  private canReach(from: string, to: string, visited: Set<string> = new Set()): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    
    visited.add(from);
    
    const fromNode = this.nodes.get(from);
    if (!fromNode) return false;
    
    for (const neighbor of fromNode.outgoingEdges) {
      if (this.canReach(neighbor, to, visited)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate that graph has no cycles (DAG property)
   */
  private validateAcyclicProperty(): boolean {
    const nodeIds = Array.from(this.nodes.keys());
    
    for (const nodeId of nodeIds) {
      if (this.canReach(nodeId, nodeId)) {
        throw new Error(`[DAGNN] Cycle detected involving node: ${nodeId}`);
      }
    }
    
    console.log('[DAGNN] ✅ Acyclic property validated');
    return true;
  }

  /**
   * Compute topological ordering of nodes
   */
  private computeTopologicalOrder(): TopologicalOrder {
    if (this.topologyCache) return this.topologyCache;

    const inDegree = new Map<string, number>();
    const nodeIds = Array.from(this.nodes.keys());
    
    // Initialize in-degrees
    nodeIds.forEach(id => inDegree.set(id, 0));
    
    // Calculate in-degrees
    this.edges.forEach(edge => {
      const currentDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentDegree + 1);
    });

    // Kahn's algorithm for topological sorting
    const queue: string[] = [];
    const orderedNodes: string[] = [];
    const levelSets: string[][] = [];

    // Start with nodes having no incoming edges
    nodeIds.forEach(id => {
      if (inDegree.get(id) === 0) {
        queue.push(id);
      }
    });

    let level = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel: string[] = [];
      
      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        orderedNodes.push(nodeId);
        currentLevel.push(nodeId);
        
        // Reduce in-degree of neighbors
        const node = this.nodes.get(nodeId);
        if (node) {
          node.outgoingEdges.forEach(neighborId => {
            const neighborDegree = inDegree.get(neighborId) || 0;
            inDegree.set(neighborId, neighborDegree - 1);
            
            if (neighborDegree - 1 === 0) {
              queue.push(neighborId);
            }
          });
        }
      }
      
      levelSets.push(currentLevel);
      level++;
    }

    const topology: TopologicalOrder = {
      orderedNodes,
      levelSets,
      maxDepth: level - 1,
      cycleFree: orderedNodes.length === nodeIds.length
    };

    if (!topology.cycleFree) {
      throw new Error('[DAGNN] Graph contains cycles - not a valid DAG');
    }

    this.topologyCache = topology;
    console.log(`[DAGNN] Computed topological order: [${orderedNodes.join(' → ')}]`);
    return topology;
  }

  /**
   * Find all simple paths from source to target
   */
  findAllPaths(source: string, target: string): RoutingPath[] {
    const paths: RoutingPath[] = [];
    const currentPath: string[] = [];
    
    this.dfsAllPaths(source, target, currentPath, paths, new Set());
    
    // Calculate costs and scores for each path
    const routingPaths = paths.map(path => this.calculatePathMetrics(path));
    
    console.log(`[DAGNN] Found ${routingPaths.length} paths from ${source} to ${target}`);
    return routingPaths;
  }

  /**
   * DFS to find all simple paths
   */
  private dfsAllPaths(
    current: string,
    target: string,
    currentPath: string[],
    allPaths: string[][],
    visited: Set<string>
  ): void {
    currentPath.push(current);
    visited.add(current);

    if (current === target) {
      allPaths.push([...currentPath]);
    } else {
      const node = this.nodes.get(current);
      if (node) {
        for (const neighbor of node.outgoingEdges) {
          if (!visited.has(neighbor)) {
            this.dfsAllPaths(neighbor, target, currentPath, allPaths, visited);
          }
        }
      }
    }

    currentPath.pop();
    visited.delete(current);
  }

  /**
   * Calculate metrics for a routing path
   */
  private calculatePathMetrics(path: string[]): RoutingPath {
    let totalCost = 0;
    let securityScore = 1.0;
    let estimatedLatency = 0;
    let zkpRequirement = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const edgeId = `${path[i]}->${path[i + 1]}`;
      const edge = this.edges.get(edgeId);
      const node = this.nodes.get(path[i]);

      if (edge && node) {
        totalCost += edge.routingCost;
        securityScore *= edge.securityLevel;
        estimatedLatency += (1 / node.processingCapacity) * 100; // ms
        zkpRequirement = Math.max(zkpRequirement, node.zkpScore);
      }
    }

    // Apply golden ratio enhancement to security
    securityScore = Math.pow(securityScore, 1 / this.phi);

    return {
      nodes: path,
      totalCost,
      securityScore,
      estimatedLatency,
      zkpRequirement
    };
  }

  /**
   * ANFIS-optimized path selection
   */
  selectOptimalPath(
    source: string,
    target: string,
    priorities: {
      costWeight: number;
      securityWeight: number;
      latencyWeight: number;
      zkpWeight: number;
    }
  ): RoutingPath | null {
    const allPaths = this.findAllPaths(source, target);
    if (allPaths.length === 0) return null;

    // Normalize metrics for comparison
    const maxCost = Math.max(...allPaths.map(p => p.totalCost));
    const maxLatency = Math.max(...allPaths.map(p => p.estimatedLatency));
    const maxZKP = Math.max(...allPaths.map(p => p.zkpRequirement));

    let bestPath: RoutingPath | null = null;
    let bestScore = -Infinity;

    allPaths.forEach(path => {
      // Normalize metrics (lower cost/latency is better, higher security/zkp is better)
      const costScore = 1 - (path.totalCost / maxCost);
      const securityScore = path.securityScore;
      const latencyScore = 1 - (path.estimatedLatency / maxLatency);
      const zkpScore = path.zkpRequirement / maxZKP;

      // Weighted fuzzy aggregation
      const totalScore = 
        priorities.costWeight * costScore +
        priorities.securityWeight * securityScore +
        priorities.latencyWeight * latencyScore +
        priorities.zkpWeight * zkpScore;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestPath = path;
      }
    });

    if (bestPath) {
      console.log(`[DAGNN] Selected optimal path: [${bestPath.nodes.join(' → ')}] (score: ${bestScore.toFixed(3)})`);
    }

    return bestPath;
  }

  /**
   * Update edge usage statistics
   */
  updateEdgeUsage(source: string, target: string): void {
    const edgeId = `${source}->${target}`;
    const edge = this.edges.get(edgeId);
    
    if (edge) {
      edge.lastUsed = Date.now();
      console.log(`[DAGNN] Updated edge usage: ${edgeId}`);
    }
  }

  /**
   * Get current DAG statistics
   */
  getDAGMetrics(): {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    averageZKPScore: number;
    cycleFree: boolean;
    topologicalComplexity: number;
  } {
    const topology = this.computeTopologicalOrder();
    const zkpScores = Array.from(this.nodes.values()).map(n => n.zkpScore);
    const avgZKP = zkpScores.reduce((sum, score) => sum + score, 0) / zkpScores.length;

    // Topological complexity based on level sets
    const topologicalComplexity = topology.levelSets.reduce((sum, level) => 
      sum + Math.log(level.length + 1), 0
    );

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      maxDepth: topology.maxDepth,
      averageZKPScore: avgZKP,
      cycleFree: topology.cycleFree,
      topologicalComplexity
    };
  }
}

// Export singleton instance
export const dagnnRouter = new DirectedAcyclicGraphNN();