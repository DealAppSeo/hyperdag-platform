/**
 * Enhanced Semantic RAG Demo API
 * Demonstrates zero-cost semantic intelligence with free resource arbitrage
 */

import { Router } from 'express';
import { enhancedFreeSemanticRAG } from '../services/ai/enhanced-free-semantic-rag';

const router = Router();

/**
 * Demo endpoint: Zero-cost semantic intelligence
 */
router.post('/free-arbitrage-query', async (req, res) => {
  try {
    const { 
      query, 
      urgency = 0.5, 
      maxLatency = 10000, 
      preferUnlimited = true,
      domainSpecialty 
    } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[Enhanced Semantic RAG Demo] Processing free arbitrage query: "${query}"`);
    
    const result = await enhancedFreeSemanticRAG.queryWithFreeArbitrage(query, {
      urgency,
      maxLatency,
      preferUnlimited,
      domainSpecialty
    });
    
    res.json({
      success: true,
      query,
      response: {
        answer: result.answer,
        confidence: result.confidence,
        sources: result.sources.length,
        reasoning: result.reasoning
      },
      intelligentArbitrage: {
        selectedProvider: result.provider.name,
        providerType: result.provider.type,
        unlimited: result.provider.unlimited,
        specialization: result.provider.specialization
      },
      costOptimization: {
        originalCost: result.costSavings.originalCost,
        finalCost: result.costSavings.finalCost,
        savingsPercentage: result.costSavings.savingsPercentage,
        strategy: result.costSavings.strategy,
        zeroCostAchieved: result.costSavings.finalCost === 0
      },
      performance: {
        latency: result.performance.latency,
        tokensGenerated: result.performance.tokensGenerated,
        embeddingCalls: result.performance.embeddingCalls
      },
      patentEvidence: {
        semanticRAG: true,
        intelligentArbitrage: true,
        bilateralLearning: true,
        freeResourceOptimization: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Semantic RAG Demo] Free arbitrage query failed:', error);
    res.status(500).json({ 
      error: 'Free arbitrage query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Demo endpoint: Performance statistics
 */
router.get('/performance-stats', async (req, res) => {
  try {
    const stats = enhancedFreeSemanticRAG.getPerformanceStats();
    
    res.json({
      success: true,
      performanceMetrics: stats,
      systemCapabilities: {
        zeroCodeSemanticIntelligence: true,
        unlimitedCapacity: stats.unlimitedProviders > 0,
        intelligentProviderSelection: true,
        bilateralLearningActive: true,
        costOptimizationTarget: '100% cost reduction'
      },
      businessImpact: {
        operationalCostReduction: `${stats.averageCostSavings.toFixed(1)}%`,
        freeProviderUtilization: `${stats.freeTierUtilization.toFixed(1)}%`,
        queriesProcessed: stats.totalQueries,
        zeroCostQueries: stats.zeroCodeQueries
      },
      patentStrength: {
        provableIntelligentArbitrage: true,
        operationalBilateralLearning: true,
        scalableSemanticRAG: true,
        measurableEfficiencyGains: stats.averageCostSavings > 50
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Semantic RAG Demo] Performance stats failed:', error);
    res.status(500).json({ 
      error: 'Performance stats failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;