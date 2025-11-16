/**
 * Grant Discovery API Routes
 * 
 * Endpoints for managing automated grant discovery and web scraping
 */

import { Router } from 'express';
import { GrantDiscoveryService } from '../../services/grant-discovery/web-scraper';
import { requireAuth } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Get grant discovery status and statistics
 * GET /api/grant-discovery/status
 */
router.get('/status', async (req, res) => {
  try {
    const discoveryService = GrantDiscoveryService.getInstance();
    const stats = discoveryService.getDiscoveryStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        description: 'Automated grant discovery system status'
      }
    });
  } catch (error: any) {
    logger.error(`Grant discovery status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get discovery status',
      error: error.message
    });
  }
});

/**
 * Start automated grant discovery
 * POST /api/grant-discovery/start
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to start grant discovery'
      });
    }

    const discoveryService = GrantDiscoveryService.getInstance();
    await discoveryService.startDiscovery();
    
    res.json({
      success: true,
      message: 'Grant discovery service started',
      data: discoveryService.getDiscoveryStats()
    });
  } catch (error: any) {
    logger.error(`Grant discovery start error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to start grant discovery',
      error: error.message
    });
  }
});

/**
 * Force run grant discovery immediately
 * POST /api/grant-discovery/run
 */
router.post('/run', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to run grant discovery'
      });
    }

    const discoveryService = GrantDiscoveryService.getInstance();
    
    // Run discovery in background
    discoveryService.forceDiscovery().catch(error => {
      logger.error(`Background grant discovery failed: ${error.message}`);
    });
    
    res.json({
      success: true,
      message: 'Grant discovery initiated',
      data: {
        status: 'running',
        message: 'Discovery process started in background'
      }
    });
  } catch (error: any) {
    logger.error(`Grant discovery run error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to run grant discovery',
      error: error.message
    });
  }
});

/**
 * Get recently discovered grants
 * GET /api/grant-discovery/recent
 */
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const storage = (await import('../../storage')).storage;
    
    // Get recently added grant sources
    const allGrants = await storage.getGrantSources();
    const recentGrants = allGrants
      .filter(grant => grant.lastScraped && grant.lastScraped > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => (b.lastScraped?.getTime() || 0) - (a.lastScraped?.getTime() || 0))
      .slice(0, limit);
    
    res.json({
      success: true,
      data: {
        grants: recentGrants,
        total: recentGrants.length,
        timeframe: '7 days'
      }
    });
  } catch (error: any) {
    logger.error(`Recent grants fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent grants',
      error: error.message
    });
  }
});

/**
 * Get discovery configuration
 * GET /api/grant-discovery/config
 */
router.get('/config', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to view configuration'
      });
    }

    const config = {
      scrapeInterval: '6 hours',
      sources: [
        'GitHub API',
        'Web3 Foundation',
        'Protocol Labs',
        'AI-powered research'
      ],
      aiEnhancement: true,
      duplicateDetection: true,
      autoVerification: true
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error(`Discovery config error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get discovery configuration',
      error: error.message
    });
  }
});

export default router;