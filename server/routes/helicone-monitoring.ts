/**
 * Helicone.ai Monitoring API Routes
 * 
 * Provides endpoints for Helicone observability data and ANFIS optimization metrics
 */

import { Router } from 'express';
import { heliconeService } from '../services/monitoring/helicone-service';

const router = Router();

/**
 * GET /api/helicone/analytics
 * Get comprehensive analytics for specified timeframe
 */
router.get('/analytics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as 'hour' | 'day' | 'week' | 'all' || 'day';
    const analytics = heliconeService.getAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Helicone API] Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * GET /api/helicone/dashboard
 * Get real-time dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = heliconeService.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Helicone API] Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data'
    });
  }
});

/**
 * GET /api/helicone/anfis-metrics
 * Get ANFIS-specific optimization metrics
 */
router.get('/anfis-metrics', async (req, res) => {
  try {
    const anfisMetrics = heliconeService.getANFISMetrics();
    
    res.json({
      success: true,
      data: {
        ...anfisMetrics,
        optimization_recommendations: generateOptimizationRecommendations(anfisMetrics)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Helicone API] ANFIS metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ANFIS metrics'
    });
  }
});

/**
 * GET /api/helicone/export
 * Export metrics data
 */
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format as 'json' | 'csv' || 'json';
    const exportData = heliconeService.exportMetrics(format);
    
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `helicone-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(exportData);
  } catch (error) {
    console.error('[Helicone API] Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics'
    });
  }
});

/**
 * POST /api/helicone/cleanup
 * Clean up old metrics
 */
router.post('/cleanup', async (req, res) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 30;
    const clearedCount = heliconeService.clearOldMetrics(daysToKeep);
    
    res.json({
      success: true,
      data: {
        clearedCount,
        daysKept: daysToKeep,
        message: `Cleared ${clearedCount} old metrics`
      }
    });
  } catch (error) {
    console.error('[Helicone API] Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup metrics'
    });
  }
});

/**
 * GET /api/helicone/health
 * Health check for Helicone monitoring
 */
router.get('/health', async (req, res) => {
  try {
    const dashboardData = heliconeService.getDashboardData();
    const analytics = heliconeService.getAnalytics('hour');
    
    const health = {
      status: dashboardData.currentStatus,
      monitoring_active: dashboardData.currentStatus === 'monitoring',
      recent_requests: dashboardData.recentRequests.length,
      hourly_requests: analytics.totalRequests,
      performance_alerts: dashboardData.performanceAlerts.length,
      anthropic_integration: !!process.env.ANTHROPIC_API_KEY
    };
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Helicone API] Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * Generate optimization recommendations based on ANFIS metrics
 */
function generateOptimizationRecommendations(anfisMetrics: any): string[] {
  const recommendations: string[] = [];
  
  // Check provider efficiency
  const topProvider = anfisMetrics.costEfficiencyRanking[0];
  if (topProvider) {
    recommendations.push(`Consider routing more traffic to ${topProvider.providerId} (highest efficiency: ${(topProvider.efficiency * 100).toFixed(1)}%)`);
  }
  
  // Check for performance issues
  Object.entries(anfisMetrics.providerPerformance).forEach(([provider, metrics]: [string, any]) => {
    if (metrics.avgResponseTime > 5000) {
      recommendations.push(`${provider} showing slow response times (${(metrics.avgResponseTime / 1000).toFixed(1)}s avg) - consider reducing load`);
    }
    
    if (metrics.successRate < 0.9) {
      recommendations.push(`${provider} has low success rate (${(metrics.successRate * 100).toFixed(1)}%) - investigate reliability issues`);
    }
    
    if (metrics.avgCost > 0.05) {
      recommendations.push(`${provider} has high average cost ($${metrics.avgCost.toFixed(4)}) - consider cost optimization`);
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal - no immediate recommendations');
  }
  
  return recommendations;
}

export default router;