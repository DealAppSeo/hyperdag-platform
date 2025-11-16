/**
 * Validation Metrics API
 * Exposes REAL production data to validate white paper claims
 * 
 * This API provides transparency about actual performance vs. claimed performance
 */

import { Router } from 'express';
import { metricsTracker } from '../services/monitoring/production-metrics-tracker';

const router = Router();

/**
 * GET /api/validation/summary
 * Get real-time validation report comparing claims vs reality
 */
router.get('/summary', (req, res) => {
  try {
    const report = metricsTracker.getValidationReport();
    
    res.json({
      success: true,
      report,
      disclaimer: report.status === 'insufficient_data' 
        ? 'Insufficient data collected. Metrics shown are targets, not validated results.'
        : report.status === 'validating'
        ? 'Data collection in progress. Results are preliminary.'
        : 'Metrics validated with production data.',
      transparency: {
        minimumRequestsForValidation: 10000,
        currentRequests: report.requestVolume,
        percentToValidation: report.requestVolume > 0 
          ? Math.min(100, (report.requestVolume / 10000) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch validation metrics'
    });
  }
});

/**
 * GET /api/validation/savings
 * Get detailed cost savings comparison
 */
router.get('/savings', (req, res) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const savings = metricsTracker.getActualSavings(period);
    
    res.json({
      success: true,
      period,
      ...savings,
      comparisonNote: 'Baseline calculated against GPT-4 single-provider cost of $0.002/request'
    });
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch savings data'
    });
  }
});

/**
 * GET /api/validation/providers
 * Get per-provider performance metrics
 */
router.get('/providers', (req, res) => {
  try {
    const providerName = req.query.provider as string | undefined;
    
    if (providerName) {
      const performance = metricsTracker.getProviderPerformance(providerName);
      
      if (!performance) {
        return res.status(404).json({
          success: false,
          error: `No data found for provider: ${providerName}`
        });
      }
      
      res.json({
        success: true,
        provider: providerName,
        ...performance
      });
    } else {
      // Get all providers (lowercase to match recorded keys)
      const providers = ['huggingface', 'groq', 'deepseek', 'openai', 'anthropic', 'myninja', 'gemini-free', 'cohere-free'];
      const allPerformance = providers.map(p => {
        const performance = metricsTracker.getProviderPerformance(p);
        if (!performance) return null;
        return {
          provider: p,
          ...performance
        };
      }).filter(p => p !== null && p.requestCount && p.requestCount > 0);
      
      res.json({
        success: true,
        providers: allPerformance
      });
    }
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider metrics'
    });
  }
});

/**
 * GET /api/validation/routing-accuracy
 * Get routing decision accuracy metrics
 */
router.get('/routing-accuracy', (req, res) => {
  try {
    const accuracy = metricsTracker.getRoutingAccuracy();
    
    res.json({
      success: true,
      claimedAccuracy: 91.7,
      actualAccuracy: accuracy,
      note: 'Routing accuracy calculated as percentage of successful task completions'
    });
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routing accuracy'
    });
  }
});

/**
 * GET /api/validation/latency
 * Get average latency metrics
 */
router.get('/latency', (req, res) => {
  try {
    const avgLatency = metricsTracker.getAverageLatency();
    
    res.json({
      success: true,
      claimedLatency: 200,
      actualLatency: avgLatency,
      unit: 'milliseconds',
      note: 'Latency measured from routing decision to provider response'
    });
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latency metrics'
    });
  }
});

/**
 * GET /api/validation/export
 * Export all metrics for analysis (admin only)
 */
router.get('/export', (req, res) => {
  try {
    const exported = metricsTracker.exportMetrics();
    
    // Convert Map to object for JSON serialization
    const providersObj: Record<string, any> = {};
    for (const [key, value] of exported.providers) {
      providersObj[key] = value;
    }
    
    res.json({
      success: true,
      data: {
        providers: providersObj,
        routing: exported.routing,
        summary: exported.summary
      },
      exportedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Validation API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics'
    });
  }
});

export default router;
