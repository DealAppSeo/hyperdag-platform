/**
 * Trinity Symphony MotherDuck Analytics API Routes
 * Enterprise-grade analytical capabilities for AI orchestration
 */

import express from 'express';
import trinityMotherDuck from '../../trinity-motherduck-integration.js';

const router = express.Router();

/**
 * Initialize MotherDuck Analytics
 */
router.post('/initialize', async (req, res) => {
    try {
        console.log('🦆 Initializing MotherDuck analytics...');
        
        const success = await trinityMotherDuck.initialize();
        
        if (success) {
            res.json({
                success: true,
                message: 'MotherDuck analytics initialized successfully',
                connection: trinityMotherDuck.getConnectionStatus()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to initialize MotherDuck analytics',
                connection: trinityMotherDuck.getConnectionStatus()
            });
        }
    } catch (error) {
        console.error('❌ MotherDuck initialization error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Real-time Analytics Dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const analytics = await trinityMotherDuck.getRealtimeAnalytics();
        
        res.json({
            success: true,
            analytics,
            connection: trinityMotherDuck.getConnectionStatus(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Analytics dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Log Trinity Request with Arbitrage Analysis
 */
router.post('/log/request', async (req, res) => {
    try {
        const requestData = req.body;
        
        const opportunities = await trinityMotherDuck.logTrinityRequest(requestData);
        
        res.json({
            success: true,
            message: 'Trinity request logged successfully',
            arbitrage_opportunities: opportunities
        });
    } catch (error) {
        console.error('❌ Failed to log Trinity request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Optimal Provider Recommendation
 */
router.post('/optimal-provider', async (req, res) => {
    try {
        const queryData = req.body;
        
        const recommendation = await trinityMotherDuck.selectOptimalProvider(queryData);
        
        res.json({
            success: true,
            recommendation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to get optimal provider:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Find Current Arbitrage Opportunities
 */
router.get('/arbitrage', async (req, res) => {
    try {
        const opportunities = await trinityMotherDuck.findArbitrageOpportunities();
        
        res.json({
            success: true,
            opportunities,
            total_opportunities: opportunities.length,
            potential_savings: opportunities.reduce((sum, opp) => sum + opp.estimated_savings_usd, 0)
        });
    } catch (error) {
        console.error('❌ Failed to find arbitrage opportunities:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Log Cache Performance Metric
 */
router.post('/log/cache', async (req, res) => {
    try {
        const { cacheType, operation, keyPattern, latencyMs, dataSizeBytes, ttlSeconds } = req.body;
        
        await trinityMotherDuck.logCacheMetric(
            cacheType, 
            operation, 
            keyPattern, 
            latencyMs, 
            dataSizeBytes, 
            ttlSeconds
        );
        
        res.json({
            success: true,
            message: 'Cache metric logged successfully'
        });
    } catch (error) {
        console.error('❌ Failed to log cache metric:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Connection Status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        motherduck_status: trinityMotherDuck.getConnectionStatus(),
        capabilities: [
            'Real-time Performance Analytics',
            'Cache Efficiency Monitoring', 
            'ANFIS Routing Intelligence',
            'Cost Optimization Tracking',
            'Enterprise Dashboard',
            'Historical Trend Analysis'
        ]
    });
});

/**
 * Health Check for MotherDuck Integration
 */
router.get('/health', async (req, res) => {
    try {
        const status = trinityMotherDuck.getConnectionStatus();
        
        res.json({
            success: true,
            healthy: status.connected,
            motherduck_analytics: status.connected ? 'operational' : 'disconnected',
            uptime_seconds: status.uptime_seconds,
            queries_executed: status.queries_executed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            healthy: false,
            error: error.message
        });
    }
});

export default router;