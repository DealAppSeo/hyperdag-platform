/**
 * Chaotic Slime Mold API Routes - Symphony V2 Enhancement
 * Bio-inspired routing optimization with chaos theory integration
 */

import { Router } from 'express';
import { chaoticSlimeMoldOptimizer } from '../services/ai/chaotic-slime-mold-optimizer-v2.js';

const router = Router();

/**
 * Initialize slime mold network with AI provider nodes
 * POST /api/slime-mold/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const { 
      providers = ['openai', 'anthropic', 'deepseek', 'myninja', 'huggingface'],
      networkTopology = 'fully_connected' 
    } = req.body;

    // Reset network
    chaoticSlimeMoldOptimizer.reset();

    // Add AI provider nodes
    providers.forEach((provider: string, index: number) => {
      const angle = (2 * Math.PI * index) / providers.length;
      const radius = 100;
      const position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
      
      // Assign resources based on provider capabilities
      const resources = getProviderResources(provider);
      chaoticSlimeMoldOptimizer.addNode(provider, position, resources);
    });

    // Connect nodes based on topology
    if (networkTopology === 'fully_connected') {
      for (let i = 0; i < providers.length; i++) {
        for (let j = i + 1; j < providers.length; j++) {
          const strength = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
          const cost = Math.random() * 10 + 1; // 1 to 11
          chaoticSlimeMoldOptimizer.addEdge(providers[i], providers[j], strength, cost);
        }
      }
    }

    const stats = chaoticSlimeMoldOptimizer.getNetworkStats();

    res.json({
      status: 'success',
      message: 'Slime mold network initialized',
      network: {
        providers,
        topology: networkTopology,
        stats
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize slime mold network',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Calculate Lyapunov exponent for chaos detection
 * POST /api/slime-mold/lyapunov
 */
router.post('/lyapunov', async (req, res) => {
  try {
    const { timeSeries } = req.body;

    if (!Array.isArray(timeSeries) || timeSeries.length < 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Time series must be an array with at least 10 values'
      });
    }

    const lyapunovExponent = chaoticSlimeMoldOptimizer.calculateLyapunovExponent(timeSeries);
    const chaosDetected = lyapunovExponent > 0.0065; // HyperDag threshold
    
    let chaosClassification = 'stable';
    if (lyapunovExponent > 0.05) {
      chaosClassification = 'highly_chaotic';
    } else if (lyapunovExponent > 0.0065) {
      chaosClassification = 'weakly_chaotic';
    } else if (lyapunovExponent > -0.01) {
      chaosClassification = 'marginally_stable';
    }

    res.json({
      status: 'success',
      analysis: {
        lyapunovExponent,
        chaosDetected,
        chaosClassification,
        threshold: 0.0065,
        dataPoints: timeSeries.length
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate Lyapunov exponent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Apply chaos routing between providers
 * POST /api/slime-mold/route
 */
router.post('/route', async (req, res) => {
  try {
    const { source, target, forceChaoticRouting = false } = req.body;

    if (!source || !target) {
      return res.status(400).json({
        status: 'error',
        message: 'Source and target providers are required'
      });
    }

    // Get current network stats
    const networkStats = chaoticSlimeMoldOptimizer.getNetworkStats();
    
    // Apply chaos routing
    const routingResult = chaoticSlimeMoldOptimizer.applyChaosRouting(source, target);
    
    // Determine if chaos was actually applied
    const chaosApplied = routingResult.chaosContribution > 0 || forceChaoticRouting;
    
    res.json({
      status: 'success',
      routing: {
        source,
        target,
        path: routingResult.optimalPath,
        cost: routingResult.cost,
        efficiency: routingResult.efficiency,
        convergenceTime: routingResult.convergenceTime,
        chaosApplied,
        chaosContribution: routingResult.chaosContribution
      },
      networkStats: {
        lyapunovExponent: networkStats.lyapunovExponent,
        chaosLevel: networkStats.chaosLevel,
        averagePheromone: networkStats.averagePheromone
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to apply chaos routing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get network statistics and visualization data
 * GET /api/slime-mold/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = chaoticSlimeMoldOptimizer.getNetworkStats();
    
    res.json({
      status: 'success',
      stats,
      interpretation: {
        chaosLevel: stats.chaosLevel > 0.0065 ? 'chaotic' : 'stable',
        networkHealth: stats.averagePheromone > 0.5 ? 'healthy' : 'degraded',
        complexity: stats.nodeCount > 5 ? 'complex' : 'simple'
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get network statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Simulate network evolution over time
 * POST /api/slime-mold/simulate
 */
router.post('/simulate', async (req, res) => {
  try {
    const { 
      iterations = 100, 
      source = 'openai', 
      target = 'anthropic',
      enableChaos = true 
    } = req.body;

    const simulationResults = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = chaoticSlimeMoldOptimizer.applyChaosRouting(source, target);
      const stats = chaoticSlimeMoldOptimizer.getNetworkStats();
      
      simulationResults.push({
        iteration: i,
        cost: result.cost,
        efficiency: result.efficiency,
        lyapunovExponent: stats.lyapunovExponent,
        chaosLevel: stats.chaosLevel,
        convergenceTime: result.convergenceTime
      });
    }

    // Calculate simulation statistics
    const costs = simulationResults.map(r => r.cost);
    const efficiencies = simulationResults.map(r => r.efficiency);
    const lyapunovValues = simulationResults.map(r => r.lyapunovExponent);
    
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const avgLyapunov = lyapunovValues.reduce((a, b) => a + b, 0) / lyapunovValues.length;

    res.json({
      status: 'success',
      simulation: {
        iterations,
        source,
        target,
        enableChaos,
        results: simulationResults.slice(-20), // Last 20 iterations
        summary: {
          avgCost,
          avgEfficiency,
          avgLyapunov,
          chaosDetected: avgLyapunov > 0.0065,
          convergenceStability: lyapunovValues.filter(l => l < 0.001).length / iterations
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to run simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset slime mold network
 * POST /api/slime-mold/reset
 */
router.post('/reset', async (req, res) => {
  try {
    chaoticSlimeMoldOptimizer.reset();
    
    res.json({
      status: 'success',
      message: 'Slime mold network reset successfully'
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset network',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to get provider resource allocation
 */
function getProviderResources(provider: string): number {
  const resourceMap: { [key: string]: number } = {
    'openai': 100,      // High resource allocation
    'anthropic': 95,    // Very high quality
    'deepseek': 80,     // Cost-effective
    'myninja': 85,      // Specialized tasks
    'huggingface': 70,  // Open source models
    'perplexity': 75,   // Search-augmented
    'cohere': 80        // Language understanding
  };
  
  return resourceMap[provider] || 50; // Default allocation
}

export { router as chaoticSlimeMoldRouter };