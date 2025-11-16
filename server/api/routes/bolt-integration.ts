/**
 * Bolt Integration API Routes
 * 
 * These routes provide the API endpoints needed by Bolt to interface with
 * HyperDAG's decentralized services and infrastructure.
 */

import express from 'express';
import { storage } from '../../storage';
import { apiKeyService } from '../../services/api-key-service';
import w3StorageService from '../../services/storage/w3-storage-service';
import ipfsStorageService from '../../services/storage/ipfs-storage-service';
import aiService from '../../services/ai/ai-service';
import zkpService from '../../services/privacy/zkp-service';
import tokenService from '../../services/token/token-service';

// Initialize router
const router = express.Router();

/**
 * API Key authentication middleware for Bolt requests
 */
const requireBoltApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-bolt-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false,
        error: 'API key is required' 
      });
    }
    
    // Verify API key
    const isValid = await apiKeyService.verifyApiKey(apiKey, 'bolt');
    
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // API key is valid, proceed
    next();
  } catch (error) {
    console.error('[ERROR][bolt-integration] API key verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'API key verification failed'
    });
  }
};

/**
 * GET /api/bolt/health
 * Check the health status of Bolt integration services
 */
router.get('/health', async (req, res) => {
  try {
    // Check health of all services
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        storage: {
          w3: await w3StorageService.checkHealth(),
          ipfs: await ipfsStorageService.checkHealth()
        },
        ai: await aiService.checkHealth(),
        zkp: await zkpService.checkHealth(),
        token: await tokenService.checkHealth()
      }
    };
    
    res.json(health);
  } catch (error) {
    console.error('[ERROR][bolt-integration] Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Health check failed'
    });
  }
});

/**
 * POST /api/bolt/apikey
 * Generate a new API key for Bolt integration
 * Requires authentication as a HyperDAG user
 */
router.post('/apikey', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name is required'
      });
    }
    
    // Generate new API key
    const userId = req.user.id;
    const apiKey = await apiKeyService.generateApiKey(userId, 'bolt', name, permissions || []);
    
    res.json({
      success: true,
      apiKey
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] API key generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

/**
 * GET /api/bolt/apikeys
 * List all API keys for the authenticated user
 * Requires authentication as a HyperDAG user
 */
router.get('/apikeys', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    const apiKeys = await apiKeyService.getApiKeysForUser(userId);
    
    res.json({
      success: true,
      apiKeys
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] API key listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

/**
 * DELETE /api/bolt/apikey/:key
 * Revoke an API key
 * Requires authentication as a HyperDAG user
 */
router.delete('/apikey/:key', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Revoke API key
    const success = await apiKeyService.revokeApiKey(key);
    
    res.json({
      success
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] API key revocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

/**
 * POST /api/bolt/storage/w3
 * Store data on Web3.Storage
 * Requires Bolt API key
 */
router.post('/storage/w3', requireBoltApiKey, async (req, res) => {
  try {
    const { data, path, options } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }
    
    // Store data
    const result = await w3StorageService.storeData(data, path, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] W3 storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store data on W3'
    });
  }
});

/**
 * GET /api/bolt/storage/w3/:cid
 * Retrieve data from Web3.Storage
 * Requires Bolt API key
 */
router.get('/storage/w3/:cid', requireBoltApiKey, async (req, res) => {
  try {
    const { cid } = req.params;
    const options = req.query;
    
    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required'
      });
    }
    
    // Retrieve data
    const result = await w3StorageService.retrieveData(cid, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] W3 retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data from W3'
    });
  }
});

/**
 * POST /api/bolt/storage/ipfs
 * Store data on IPFS
 * Requires Bolt API key
 */
router.post('/storage/ipfs', requireBoltApiKey, async (req, res) => {
  try {
    const { data, path, options } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }
    
    // Store data
    const result = await ipfsStorageService.storeData(data, path, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] IPFS storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store data on IPFS'
    });
  }
});

/**
 * GET /api/bolt/storage/ipfs/:cid
 * Retrieve data from IPFS
 * Requires Bolt API key
 */
router.get('/storage/ipfs/:cid', requireBoltApiKey, async (req, res) => {
  try {
    const { cid } = req.params;
    const options = req.query;
    
    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required'
      });
    }
    
    // Retrieve data
    const result = await ipfsStorageService.retrieveData(cid, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] IPFS retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data from IPFS'
    });
  }
});

/**
 * POST /api/bolt/ai/insights
 * Generate AI insights
 * Requires Bolt API key
 */
router.post('/ai/insights', requireBoltApiKey, async (req, res) => {
  try {
    const { data, type, options } = req.body;
    
    if (!data || !type) {
      return res.status(400).json({
        success: false,
        error: 'Data and type are required'
      });
    }
    
    // Generate insights
    const insights = await aiService.generateInsights(data, type, options);
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] AI insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    });
  }
});

/**
 * POST /api/bolt/zkp/verify
 * Verify a zero-knowledge proof
 * Requires Bolt API key
 */
router.post('/zkp/verify', requireBoltApiKey, async (req, res) => {
  try {
    const { proof, publicInputs } = req.body;
    
    if (!proof || !publicInputs) {
      return res.status(400).json({
        success: false,
        error: 'Proof and public inputs are required'
      });
    }
    
    // Verify proof
    const result = await zkpService.verifyProof(proof, publicInputs);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] ZKP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify proof'
    });
  }
});

/**
 * POST /api/bolt/zkp/generate
 * Generate a zero-knowledge proof
 * Requires Bolt API key
 */
router.post('/zkp/generate', requireBoltApiKey, async (req, res) => {
  try {
    const { privateInputs, publicInputs } = req.body;
    
    if (!privateInputs || !publicInputs) {
      return res.status(400).json({
        success: false,
        error: 'Private and public inputs are required'
      });
    }
    
    // Generate proof
    const proof = await zkpService.generateProof(privateInputs, publicInputs);
    
    res.json({
      success: true,
      proof
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] ZKP generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate proof'
    });
  }
});

/**
 * POST /api/bolt/token/mint
 * Mint a token (NFT or SBT)
 * Requires Bolt API key
 */
router.post('/token/mint', requireBoltApiKey, async (req, res) => {
  try {
    const { tokenType, recipient, metadata, options } = req.body;
    
    if (!tokenType || !recipient || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Token type, recipient, and metadata are required'
      });
    }
    
    // Validate token type
    if (tokenType !== 'nft' && tokenType !== 'sbt') {
      return res.status(400).json({
        success: false,
        error: 'Token type must be either "nft" or "sbt"'
      });
    }
    
    // Mint token
    const token = await tokenService.mintToken(tokenType, recipient, metadata, options);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] Token minting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint token'
    });
  }
});

/**
 * GET /api/bolt/token/:address
 * Get tokens for an address
 * Requires Bolt API key
 */
router.get('/token/:address', requireBoltApiKey, async (req, res) => {
  try {
    const { address } = req.params;
    const options = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    // Get tokens
    const tokens = await tokenService.getTokensForAddress(address, options);
    
    res.json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error('[ERROR][bolt-integration] Token retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tokens'
    });
  }
});

export default router;