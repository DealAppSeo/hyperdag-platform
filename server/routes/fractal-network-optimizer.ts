/**
 * Fractal Network Optimizer API Routes
 * Dendritic branching with golden ratio proportions for 20-50% computation reduction
 */

import { Router } from 'express';
import { FractalNetworkOptimizer } from '../services/ai/fractal-network-optimizer.js';

const router = Router();
const fractalOptimizer = new FractalNetworkOptimizer();

/**
 * Create and optimize fractal network
 */
router.post('/create-network', async (req, res) => {
  try {
    const { networkId, baseLayer, growthIterations, branchRatio } = req.body;
    
    if (!networkId || typeof baseLayer !== 'number') {
      return res.status(400).json({
        status: 'error',
        message: 'Required fields: networkId (string), baseLayer (number)'
      });
    }
    
    const network = fractalOptimizer.createFractalNetwork(
      networkId,
      baseLayer,
      growthIterations || 5,
      branchRatio || 1.618
    );
    
    res.json({
      status: 'success',
      network,
      message: `Fractal network '${networkId}' created successfully`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Create network error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create fractal network',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Optimize AI routing using fractal principles
 */
router.post('/optimize-routing', async (req, res) => {
  try {
    const { networkId, providers, requestComplexity } = req.body;
    
    if (!networkId || !Array.isArray(providers)) {
      return res.status(400).json({
        status: 'error',
        message: 'Required fields: networkId (string), providers (array)'
      });
    }
    
    const optimization = fractalOptimizer.optimizeAIRouting(
      networkId,
      providers,
      requestComplexity || 0.5
    );
    
    res.json({
      status: 'success',
      optimization,
      providersCount: providers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Optimize routing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to optimize AI routing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get network analytics and performance metrics
 */
router.get('/analytics/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    const analytics = fractalOptimizer.getNetworkAnalytics(networkId);
    
    if (!analytics.network) {
      return res.status(404).json({
        status: 'error',
        message: `Network not found: ${networkId}`,
        availableNetworks: fractalOptimizer.getAvailableNetworks()
      });
    }
    
    res.json({
      status: 'success',
      networkId,
      analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve network analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all available networks
 */
router.get('/networks', async (req, res) => {
  try {
    const networks = fractalOptimizer.getAvailableNetworks();
    const networkDetails = [];
    
    for (const networkId of networks) {
      const analytics = fractalOptimizer.getNetworkAnalytics(networkId);
      if (analytics.network) {
        networkDetails.push({
          id: networkId,
          totalNodes: analytics.network.totalNodes,
          computationReduction: analytics.network.computationReduction,
          branchRatio: analytics.network.branchRatio,
          growthIterations: analytics.network.growthIterations,
          averageReduction: analytics.currentMetrics.averageReduction,
          averageThroughput: analytics.currentMetrics.averageThroughput,
          stabilityScore: analytics.currentMetrics.stabilityScore
        });
      }
    }
    
    res.json({
      status: 'success',
      networks: networkDetails,
      totalNetworks: networks.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Networks list error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve networks list',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Recommend optimal network for request characteristics
 */
router.post('/recommend', async (req, res) => {
  try {
    const { complexity, multimodal, throughputPriority, qualityPriority } = req.body;
    
    const characteristics = {
      complexity: complexity || 0.5,
      multimodal: multimodal || false,
      throughputPriority: throughputPriority || false,
      qualityPriority: qualityPriority || false
    };
    
    const recommendedNetwork = fractalOptimizer.recommendNetwork(characteristics);
    const analytics = fractalOptimizer.getNetworkAnalytics(recommendedNetwork);
    
    res.json({
      status: 'success',
      recommendation: {
        networkId: recommendedNetwork,
        characteristics,
        networkDetails: analytics.network,
        expectedPerformance: analytics.currentMetrics
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Recommend error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to recommend network',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update network performance with actual results
 */
router.post('/update-performance', async (req, res) => {
  try {
    const { networkId, actualThroughput, actualLatency, successRate } = req.body;
    
    if (!networkId || typeof actualThroughput !== 'number') {
      return res.status(400).json({
        status: 'error',
        message: 'Required fields: networkId (string), actualThroughput (number)'
      });
    }
    
    fractalOptimizer.updateNetworkPerformance(
      networkId,
      actualThroughput,
      actualLatency || 50,
      successRate || 0.85
    );
    
    const updatedAnalytics = fractalOptimizer.getNetworkAnalytics(networkId);
    
    res.json({
      status: 'success',
      message: `Performance updated for network: ${networkId}`,
      updatedMetrics: updatedAnalytics.currentMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Update performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update network performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate fractal network visualization data
 */
router.get('/visualize/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    const visualizationData = fractalOptimizer.generateVisualizationData(networkId);
    
    res.json({
      status: 'success',
      networkId,
      visualization: visualizationData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Visualization error:', error);
    
    if (error instanceof Error && error.message.includes('Network not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        availableNetworks: fractalOptimizer.getAvailableNetworks()
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate visualization data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Benchmark fractal optimization performance
 */
router.post('/benchmark', async (req, res) => {
  try {
    const { testCases } = req.body;
    
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Provide an array of test cases for benchmarking'
      });
    }
    
    const results = [];
    let totalReduction = 0;
    let totalThroughputImprovement = 0;
    
    for (const testCase of testCases) {
      const { providers, complexity } = testCase;
      
      if (!Array.isArray(providers)) continue;
      
      const networkId = `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimization = fractalOptimizer.optimizeAIRouting(
        networkId,
        providers,
        complexity || 0.5
      );
      
      const reduction = optimization.reductionPercentage;
      const throughputImprovement = (optimization.performanceMetrics.throughput - 500) / 500 * 100;
      
      results.push({
        testCase,
        networkId,
        computationReduction: `${reduction.toFixed(1)}%`,
        throughputImprovement: `${throughputImprovement.toFixed(1)}%`,
        performanceMetrics: optimization.performanceMetrics
      });
      
      totalReduction += reduction;
      totalThroughputImprovement += throughputImprovement;
    }
    
    const avgReduction = totalReduction / testCases.length;
    const avgThroughputImprovement = totalThroughputImprovement / testCases.length;
    
    res.json({
      status: 'success',
      benchmark: {
        testCasesCount: testCases.length,
        averageComputationReduction: `${avgReduction.toFixed(1)}%`,
        averageThroughputImprovement: `${avgThroughputImprovement.toFixed(1)}%`,
        targetReduction: '20-50%',
        achievedTarget: avgReduction >= 20 && avgReduction <= 50,
        results
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Benchmark error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run benchmark',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get fractal optimization insights and recommendations
 */
router.get('/insights', async (req, res) => {
  try {
    const networks = fractalOptimizer.getAvailableNetworks();
    const insights = [];
    const performanceData = [];
    
    for (const networkId of networks) {
      const analytics = fractalOptimizer.getNetworkAnalytics(networkId);
      if (analytics.network) {
        performanceData.push({
          networkId,
          computationReduction: analytics.network.computationReduction,
          totalNodes: analytics.network.totalNodes,
          averageThroughput: analytics.currentMetrics.averageThroughput,
          stabilityScore: analytics.currentMetrics.stabilityScore
        });
      }
    }
    
    // Generate insights
    const bestPerformingNetwork = performanceData.reduce((best, current) => 
      current.computationReduction > best.computationReduction ? current : best
    );
    insights.push(`Best performing network: ${bestPerformingNetwork.networkId} with ${(bestPerformingNetwork.computationReduction * 100).toFixed(1)}% reduction`);
    
    const mostStableNetwork = performanceData.reduce((best, current) => 
      current.stabilityScore > best.stabilityScore ? current : best
    );
    insights.push(`Most stable network: ${mostStableNetwork.networkId} with ${(mostStableNetwork.stabilityScore * 100).toFixed(1)}% stability`);
    
    const highestThroughput = performanceData.reduce((best, current) => 
      current.averageThroughput > best.averageThroughput ? current : best
    );
    insights.push(`Highest throughput: ${highestThroughput.networkId} with ${highestThroughput.averageThroughput.toFixed(0)} req/s`);
    
    // Calculate overall system metrics
    const avgReduction = performanceData.reduce((sum, p) => sum + p.computationReduction, 0) / performanceData.length;
    const avgThroughput = performanceData.reduce((sum, p) => sum + p.averageThroughput, 0) / performanceData.length;
    const avgStability = performanceData.reduce((sum, p) => sum + p.stabilityScore, 0) / performanceData.length;
    
    res.json({
      status: 'success',
      insights: {
        keyFindings: insights,
        systemMetrics: {
          activeNetworks: networks.length,
          averageComputationReduction: `${(avgReduction * 100).toFixed(1)}%`,
          averageThroughput: `${avgThroughput.toFixed(0)} req/s`,
          averageStability: `${(avgStability * 100).toFixed(1)}%`,
          goldenRatioOptimization: 'Active',
          dendriticBranching: 'Enabled'
        },
        recommendations: [
          'Use fractal networks for complex AI routing optimization',
          'Monitor stability scores for consistent performance',
          'Apply golden ratio branching for optimal computation reduction',
          'Update performance metrics regularly for adaptive optimization',
          'Consider network characteristics when selecting routing strategy'
        ],
        performanceData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[FractalOptimizer] Insights error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;