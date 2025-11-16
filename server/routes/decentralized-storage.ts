/**
 * Decentralized Storage API Routes
 * Provides endpoints for distributed storage with persistent state and cost arbitrage
 */

import { Router } from 'express';
// import { decentralizedStorage } from '../services/decentralized-storage.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

/**
 * GET /api/decentralized-storage/status
 * Get comprehensive storage infrastructure status
 */
router.get('/status', async (req, res) => {
  try {
    const status = decentralizedStorage.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage status'
    });
  }
});

/**
 * GET /api/decentralized-storage/pricing
 * Get current pricing across all storage providers
 */
router.get('/pricing', async (req, res) => {
  try {
    const pricing = decentralizedStorage.getCurrentPricing();
    res.json({
      success: true,
      data: {
        pricing,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Pricing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing information'
    });
  }
});

/**
 * GET /api/decentralized-storage/arbitrage
 * Get arbitrage opportunities for cost optimization
 */
router.get('/arbitrage', async (req, res) => {
  try {
    const opportunities = decentralizedStorage.findArbitrageOpportunities();
    res.json({
      success: true,
      data: {
        opportunities,
        totalOpportunities: opportunities.length,
        potentialSavings: opportunities.reduce((sum, opp) => sum + opp.netSavings, 0),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Arbitrage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get arbitrage opportunities'
    });
  }
});

/**
 * POST /api/decentralized-storage/store
 * Store file with optimal provider selection
 */
router.post('/store', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }

    const {
      accessPattern = 'frequent',
      duration = '30d',
      replicas = '3',
      metadata = '{}'
    } = req.body;

    // Parse duration
    let durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days default
    if (duration.endsWith('d')) {
      durationMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    } else if (duration.endsWith('h')) {
      durationMs = parseInt(duration) * 60 * 60 * 1000;
    } else if (duration.endsWith('m')) {
      durationMs = parseInt(duration) * 60 * 1000;
    }

    const fileId = await decentralizedStorage.storeFile(
      req.file.originalname,
      req.file.buffer,
      {
        accessPattern: accessPattern as any,
        duration: durationMs,
        replicas: parseInt(replicas),
        metadata: JSON.parse(metadata),
        persistentState: {
          uploadedAt: new Date(),
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          uploadedBy: req.headers['user-agent'] || 'unknown'
        }
      }
    );

    res.json({
      success: true,
      data: {
        fileId,
        fileName: req.file.originalname,
        size: req.file.size,
        message: 'File stored successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Store error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to store file'
    });
  }
});

/**
 * POST /api/decentralized-storage/store-data
 * Store text/JSON data with optimal provider selection
 */
router.post('/store-data', async (req, res) => {
  try {
    const {
      fileName,
      data,
      accessPattern = 'frequent',
      duration = '30d',
      replicas = 3,
      metadata = {},
      persistentState = {}
    } = req.body;

    if (!fileName || !data) {
      return res.status(400).json({
        success: false,
        error: 'fileName and data are required'
      });
    }

    // Parse duration
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    if (duration.endsWith('d')) {
      durationMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    } else if (duration.endsWith('h')) {
      durationMs = parseInt(duration) * 60 * 60 * 1000;
    }

    const fileId = await decentralizedStorage.storeFile(
      fileName,
      typeof data === 'string' ? data : JSON.stringify(data),
      {
        accessPattern,
        duration: durationMs,
        replicas,
        metadata,
        persistentState: {
          ...persistentState,
          dataType: typeof data,
          storedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      data: {
        fileId,
        fileName,
        message: 'Data stored successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Store data error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to store data'
    });
  }
});

/**
 * GET /api/decentralized-storage/file/:fileId
 * Get file information and persistent state
 */
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = decentralizedStorage.getFileInfo(fileId);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file information'
    });
  }
});

/**
 * PUT /api/decentralized-storage/file/:fileId/state
 * Update persistent state for a file
 */
router.put('/file/:fileId/state', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'State data is required'
      });
    }

    decentralizedStorage.updatePersistentState(fileId, state);

    res.json({
      success: true,
      data: {
        message: 'Persistent state updated successfully',
        fileId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] Update state error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persistent state'
    });
  }
});

/**
 * POST /api/decentralized-storage/migrate/:fileId
 * Execute arbitrage migration for cost optimization
 */
router.post('/migrate/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { targetProvider } = req.body;

    if (!targetProvider) {
      return res.status(400).json({
        success: false,
        error: 'Target provider is required'
      });
    }

    const success = await decentralizedStorage.executeArbitrage(fileId, targetProvider);

    if (success) {
      res.json({
        success: true,
        data: {
          message: 'File migrated successfully',
          fileId,
          targetProvider,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Migration failed'
      });
    }
  } catch (error) {
    console.error('[DecentralizedStorage API] Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute migration'
    });
  }
});

/**
 * GET /api/decentralized-storage/files
 * List all stored files with pagination
 */
router.get('/files', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const status = decentralizedStorage.getStatus();
    
    // Since this is a demo, we'll return the basic status
    res.json({
      success: true,
      data: {
        files: status.totalFiles,
        totalSize: status.totalStorageSize,
        monthlyCost: status.monthlyStorageCost,
        providers: Object.keys(status.providers),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DecentralizedStorage API] List files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
});

export default router;