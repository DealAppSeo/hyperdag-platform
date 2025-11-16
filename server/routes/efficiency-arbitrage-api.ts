/**
 * API Routes for Ultimate Efficiency Arbitrage System
 * Exposes our combined arbitrage strategies via REST API
 */

import { Router } from 'express';
import { ultimateEfficiencyOrchestrator } from '../services/ultimate-efficiency-orchestrator.js';

const router = Router();

/**
 * Process single query with maximum efficiency
 */
router.post('/process', async (req, res) => {
  try {
    const { query, urgency = 0.5, maxDelay = 24 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await ultimateEfficiencyOrchestrator.processWithMaximumEfficiency(
      query, urgency, maxDelay
    );
    
    res.json({
      success: true,
      data: result,
      meta: {
        original_cost: result.originalCost,
        final_cost: result.finalCost,
        savings_percentage: result.savingsPercentage,
        latency_ms: result.latency,
        strategy_stack: result.strategy
      }
    });
    
  } catch (error) {
    console.error('[API] Efficiency processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Batch process multiple queries
 */
router.post('/batch', async (req, res) => {
  try {
    const { queries, urgencyScores, maxDelay = 24 } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({ error: 'Queries array is required' });
    }
    
    const { results, batchStats } = await ultimateEfficiencyOrchestrator.batchProcessWithMaximumEfficiency(
      queries, urgencyScores, maxDelay
    );
    
    res.json({
      success: true,
      data: {
        results,
        batch_statistics: batchStats,
        total_queries: queries.length,
        average_savings: batchStats.averageSavings,
        speed_improvement: `${batchStats.speedImprovement.toFixed(1)}x`
      }
    });
    
  } catch (error) {
    console.error('[API] Batch processing error:', error);
    res.status(500).json({ 
      error: 'Batch processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get efficiency dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = ultimateEfficiencyOrchestrator.getEfficiencyDashboard();
    
    res.json({
      success: true,
      dashboard: {
        ...dashboard,
        description: 'Real-time efficiency monitoring',
        target_savings: '96.4%',
        target_speed: '19x improvement'
      }
    });
    
  } catch (error) {
    console.error('[API] Dashboard error:', error);
    res.status(500).json({ 
      error: 'Dashboard unavailable',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get optimization statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = ultimateEfficiencyOrchestrator.calculateOptimizationStats();
    
    res.json({
      success: true,
      statistics: stats,
      interpretation: {
        cache_hit_rate: `${stats.cacheHitRate.toFixed(1)}% of queries served from cache`,
        free_provider_rate: `${stats.freeProviderRate.toFixed(1)}% of queries processed free`,
        average_savings: `${stats.averageSavings.toFixed(1)}% cost reduction per query`,
        speed_improvement: `${stats.speedImprovement.toFixed(1)}x faster than baseline`
      }
    });
    
  } catch (error) {
    console.error('[API] Stats error:', error);
    res.status(500).json({ 
      error: 'Statistics unavailable',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;