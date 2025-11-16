import { Router } from 'express';
import { resourceArbitrageEngine } from '../services/resource-arbitrage-engine';

const router = Router();

// Get current arbitrage opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await resourceArbitrageEngine.scanForOpportunities();
    
    res.json({
      success: true,
      data: {
        opportunities,
        timestamp: new Date().toISOString(),
        totalOpportunities: opportunities.length,
        criticalOpportunities: opportunities.filter(o => o.immediateAction).length,
        sectors: [...new Set(opportunities.map(o => o.sector))]
      }
    });
  } catch (error) {
    console.error('[Resource Arbitrage] Opportunities scan failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan for arbitrage opportunities'
    });
  }
});

// Get free tier utilization status
router.get('/free-tier-status', async (req, res) => {
  try {
    const status = resourceArbitrageEngine.getFreeTierStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        recommendation: status.averageUtilization < 70 
          ? 'Increase free tier usage for maximum cost efficiency'
          : status.averageUtilization > 90
          ? 'Approaching free tier limits - prepare paid tier routing'
          : 'Optimal free tier utilization',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Resource Arbitrage] Free tier status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get free tier status'
    });
  }
});

// Coordinate optimal provider selection
router.post('/coordinate', async (req, res) => {
  try {
    const { request, prioritizeCost = true } = req.body;
    
    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Request data required for coordination'
      });
    }

    const coordination = await resourceArbitrageEngine.coordinateWithANFIS(request);
    
    res.json({
      success: true,
      data: {
        selectedProvider: coordination.provider,
        estimatedCost: coordination.cost,
        source: coordination.source,
        savings: coordination.source === 'free-tier' ? '100%' : 'optimized',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Resource Arbitrage] Coordination failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to coordinate provider selection'
    });
  }
});

// Reset monthly usage counters (admin endpoint)
router.post('/reset-usage', async (req, res) => {
  try {
    resourceArbitrageEngine.resetMonthlyUsage();
    
    res.json({
      success: true,
      message: 'Monthly usage counters reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Resource Arbitrage] Usage reset failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset usage counters'
    });
  }
});

// Get comprehensive system status
router.get('/status', async (req, res) => {
  try {
    const [opportunities, freeTierStatus] = await Promise.all([
      resourceArbitrageEngine.scanForOpportunities(),
      Promise.resolve(resourceArbitrageEngine.getFreeTierStatus())
    ]);

    const totalPotentialSavings = opportunities.reduce((sum, opp) => {
      const savings = parseFloat(opp.savings.replace('%', ''));
      return sum + savings;
    }, 0);

    res.json({
      success: true,
      data: {
        systemStatus: 'operational',
        opportunities: {
          total: opportunities.length,
          critical: opportunities.filter(o => o.immediateAction).length,
          avgSavings: opportunities.length > 0 ? (totalPotentialSavings / opportunities.length).toFixed(1) + '%' : '0%'
        },
        freeTier: {
          totalCapacity: freeTierStatus.totalCapacity,
          utilization: freeTierStatus.averageUtilization.toFixed(1) + '%',
          activeProviders: freeTierStatus.providers.filter(p => p.remaining > 0).length
        },
        integration: {
          hyperDagManager: 'connected',
          aiPromptManager: 'connected',
          anfisRouting: 'active'
        },
        performance: {
          costOptimization: 'maximized',
          freeTierPriority: 'active',
          arbitrageScanning: 'continuous'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Resource Arbitrage] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

export default router;