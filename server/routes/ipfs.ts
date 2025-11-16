import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { ipfsStorageService } from '../services/ipfs-storage';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * POST /api/ipfs/upload
 * Upload a file to IPFS via Pinata (public endpoint for testing)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const { originalname, buffer } = req.file;
    const { metadata } = req.body;

    console.log(`[IPFS API] Uploading file: ${originalname} (${buffer.length} bytes)`);

    const result = await ipfsStorageService.uploadEncryptedData(buffer, originalname);

    res.json({
      success: true,
      data: {
        ipfsHash: result.ipfsHash,
        size: result.size,
        gatewayUrl: result.gatewayUrl,
        filename: originalname,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IPFS API] Upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file to IPFS'
    });
  }
});

/**
 * POST /api/ipfs/upload-json
 * Upload JSON metadata to IPFS via Pinata (public endpoint for testing)
 */
router.post('/upload-json', async (req, res) => {
  try {
    const { data, name } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'No data provided'
      });
    }

    console.log(`[IPFS API] Uploading JSON data: ${name || 'unnamed'}`);

    const result = await ipfsStorageService.uploadMetadata(data);

    res.json({
      success: true,
      data: {
        ipfsHash: result.ipfsHash,
        size: result.size,
        gatewayUrl: result.gatewayUrl,
        name: name || 'metadata',
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IPFS API] JSON upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload JSON to IPFS'
    });
  }
});

/**
 * GET /api/ipfs/retrieve/:hash
 * Retrieve data from IPFS via gateway
 */
router.get('/retrieve/:hash', requireAuth, async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'IPFS hash required'
      });
    }

    console.log(`[IPFS API] Retrieving data: ${hash}`);

    const data = await ipfsStorageService.retrieveData(hash);

    res.json({
      success: true,
      data: {
        ipfsHash: hash,
        content: data,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IPFS API] Retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data from IPFS'
    });
  }
});

/**
 * GET /api/ipfs/status
 * Check IPFS service status and connection
 */
router.get('/status', async (req, res) => {
  try {
    const isConnected = await ipfsStorageService.checkConnection();
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        provider: 'Pinata',
        gateway: process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IPFS API] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check IPFS status'
    });
  }
});

/**
 * POST /api/ipfs/test
 * Test IPFS integration with sample data (public endpoint for testing)
 */
router.post('/test', async (req, res) => {
  try {
    const testData = {
      message: 'HyperDAG IPFS Test',
      timestamp: new Date().toISOString(),
      user: req.user?.username || 'anonymous',
      testId: Math.random().toString(36).substring(7)
    };

    console.log('[IPFS API] Running IPFS integration test');

    // Upload test metadata
    const uploadResult = await ipfsStorageService.uploadMetadata(testData);
    
    // Try to retrieve it back
    const retrievedData = await ipfsStorageService.retrieveData(uploadResult.ipfsHash);

    res.json({
      success: true,
      data: {
        test: 'passed',
        uploaded: {
          ipfsHash: uploadResult.ipfsHash,
          gatewayUrl: uploadResult.gatewayUrl,
          size: uploadResult.size
        },
        retrieved: retrievedData,
        roundTripTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IPFS API] Test failed:', error);
    res.status(500).json({
      success: false,
      error: 'IPFS integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;