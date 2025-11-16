/**
 * Fractal Analytics API Routes
 * Advanced chaos theory-based pattern analysis endpoints
 */

import { Router } from 'express';
import { FractalPatternMiner, RequestPattern, FractalAnalysis } from '../services/analytics/fractal-pattern-miner.js';

const router = Router();

// Global fractal miner instance
const fractalMiner = new FractalPatternMiner(0.0065);

/**
 * Add request pattern for analysis
 */
router.post('/track', async (req, res) => {
  try {
    const { timestamp, userId, endpoint, responseTime, cost, provider } = req.body;
    
    const requestPattern: RequestPattern = {
      timestamp: timestamp || Date.now(),
      userId,
      endpoint,
      responseTime,
      cost,
      provider
    };
    
    fractalMiner.addRequest(requestPattern);
    
    res.json({
      status: 'success',
      message: 'Request pattern tracked',
      statistics: fractalMiner.getStatistics()
    });
  } catch (error) {
    console.error('[FractalAnalytics] Track error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track request pattern',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get current fractal dimension
 */
router.get('/dimension', async (req, res) => {
  try {
    const fractalDimension = fractalMiner.analyzeRequestPatterns();
    
    res.json({
      status: 'success',
      fractalDimension,
      expectedRange: '1.4-1.6 for natural patterns',
      interpretation: fractalDimension >= 1.4 && fractalDimension <= 1.6 
        ? 'Natural human-like pattern' 
        : fractalDimension < 1.4 
          ? 'Overly regular (possible bot)' 
          : 'Highly chaotic (possible attack)'
    });
  } catch (error) {
    console.error('[FractalAnalytics] Dimension error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate fractal dimension',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Comprehensive fractal analysis
 */
router.get('/analyze', async (req, res) => {
  try {
    const analysis: FractalAnalysis = fractalMiner.performComprehensiveAnalysis();
    
    res.json({
      status: 'success',
      analysis,
      timestamp: new Date().toISOString(),
      statistics: fractalMiner.getStatistics()
    });
  } catch (error) {
    console.error('[FractalAnalytics] Analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform fractal analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze specific user patterns
 */
router.get('/analyze/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    // This would normally query from database
    // For now, filter from memory (in production, use proper database queries)
    const cutoffTime = Date.now() - (Number(days) * 24 * 60 * 60 * 1000);
    const userPatterns = fractalMiner['requestHistory'].filter(
      (req: RequestPattern) => req.userId === userId && req.timestamp >= cutoffTime
    );
    
    if (userPatterns.length < 50) {
      return res.json({
        status: 'insufficient_data',
        message: `User ${userId} has insufficient data for analysis (${userPatterns.length} requests, need 50+)`,
        requestCount: userPatterns.length
      });
    }
    
    const analysis: FractalAnalysis = fractalMiner.performComprehensiveAnalysis(userPatterns);
    
    res.json({
      status: 'success',
      userId,
      analysis,
      requestCount: userPatterns.length,
      analysisWindow: `${days} days`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FractalAnalytics] User analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze user patterns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get security alerts based on fractal analysis
 */
router.get('/security-alerts', async (req, res) => {
  try {
    const analysis: FractalAnalysis = fractalMiner.performComprehensiveAnalysis();
    
    const alerts = [];
    
    if (analysis.patternComplexity === 'suspicious') {
      alerts.push({
        level: 'high',
        type: 'suspicious_pattern',
        message: 'Suspicious behavioral pattern detected',
        fractalDimension: analysis.fractalDimension,
        recommendations: analysis.recommendations
      });
    }
    
    if (analysis.anomalyScore > 0.8) {
      alerts.push({
        level: 'medium',
        type: 'high_anomaly',
        message: `High anomaly score: ${(analysis.anomalyScore * 100).toFixed(1)}%`,
        anomalyScore: analysis.anomalyScore,
        recommendations: analysis.recommendations
      });
    }
    
    if (analysis.patternComplexity === 'chaotic') {
      alerts.push({
        level: 'medium',
        type: 'chaotic_behavior',
        message: 'Chaotic usage pattern detected',
        lyapunovExponent: analysis.lyapunovExponent,
        recommendations: analysis.recommendations
      });
    }
    
    res.json({
      status: 'success',
      alertCount: alerts.length,
      alerts,
      overallRisk: alerts.length > 0 ? 'elevated' : 'normal',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FractalAnalytics] Security alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate security alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get analytics dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const analysis: FractalAnalysis = fractalMiner.performComprehensiveAnalysis();
    const stats = fractalMiner.getStatistics();
    
    res.json({
      status: 'success',
      dashboard: {
        overview: {
          totalRequests: stats.totalRequests,
          fractalDimension: analysis.fractalDimension,
          patternComplexity: analysis.patternComplexity,
          anomalyScore: analysis.anomalyScore,
          predictability: analysis.predictability
        },
        security: {
          threatLevel: analysis.anomalyScore > 0.7 ? 'high' : 
                     analysis.anomalyScore > 0.4 ? 'medium' : 'low',
          patternType: analysis.patternComplexity,
          lyapunovExponent: analysis.lyapunovExponent
        },
        recommendations: analysis.recommendations,
        metrics: {
          expectedFractal: '1.4-1.6',
          actualFractal: analysis.fractalDimension.toFixed(3),
          chaosThreshold: 0.0065,
          actualChaos: analysis.lyapunovExponent.toFixed(6)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FractalAnalytics] Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset analysis state
 */
router.post('/reset', async (req, res) => {
  try {
    fractalMiner.reset();
    
    res.json({
      status: 'success',
      message: 'Fractal analysis state reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FractalAnalytics] Reset error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset analysis state',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;