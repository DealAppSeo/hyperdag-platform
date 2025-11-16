/**
 * Developer Zero-Knowledge Proof API
 * 
 * These endpoints provide a secure way for third-party developers to verify
 * ZKP SBT reputation credentials without compromising user privacy.
 */

import { Router, Request, Response } from 'express';
import { validateApiKey } from '../../middleware/api-key-middleware';
import { requireAuth } from '../../middleware/auth-middleware';
import * as apiKeyService from '../../services/api/api-key-service';
import * as reputationZKPService from '../../services/zkp/reputation-zkp-service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Generate a new API key for ZKP reputation verification
 * This endpoint is for authenticated users only
 */
router.post('/generate-api-key', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, scopes } = req.body;
    
    // Generate API key with default scopes if none provided
    const apiKey = await apiKeyService.generateApiKey(
      userId,
      name || 'ZKP Verification API Key',
      scopes || ['zkp:verify', 'reputation:read']
    );
    
    res.json({
      success: true,
      apiKey,
      message: 'API key generated successfully. Save this key as it will not be shown again.'
    });
  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

/**
 * List all API keys for the current user
 */
router.get('/api-keys', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const keys = await apiKeyService.listApiKeys(userId);
    
    res.json({
      success: true,
      keys
    });
  } catch (error) {
    logger.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

/**
 * Revoke an API key
 */
router.post('/revoke-api-key/:keyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const keyId = parseInt(req.params.keyId);
    
    if (isNaN(keyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key ID'
      });
    }
    
    const success = await apiKeyService.revokeApiKey(keyId, userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'API key revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API key not found or already revoked'
      });
    }
  } catch (error) {
    logger.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

/**
 * Verify a ZKP SBT credential
 * This endpoint is for third-party developers with a valid API key
 */
router.post('/verify-credential', validateApiKey('zkp:verify'), async (req: Request, res: Response) => {
  try {
    const { proof, publicInputs, type } = req.body;
    
    if (!proof || !publicInputs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: proof and publicInputs'
      });
    }
    
    // Verify the credential using the ZKP service
    const verification = await reputationZKPService.verifyProof(proof, publicInputs, type || 'reputation');
    
    if (verification.success) {
      // Return only minimal public information from the verification
      res.json({
        success: true,
        verified: true,
        type: verification.data.type,
        data: {
          // Only return non-PII data
          scoreRange: verification.data.scoreRange,
          verifiedAt: verification.data.verifiedAt,
          category: verification.data.category
        }
      });
    } else {
      res.json({
        success: true,
        verified: false,
        message: verification.message || 'Verification failed'
      });
    }
  } catch (error) {
    logger.error('Error verifying ZKP credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify credential'
    });
  }
});

/**
 * Get supported reputation credential types
 * Public endpoint - no authentication required
 */
router.get('/credential-types', async (_req: Request, res: Response) => {
  try {
    // Return the supported credential types
    res.json({
      success: true,
      types: [
        {
          id: 'reputation',
          name: 'Reputation Score',
          description: 'Verifies a user\'s overall reputation score on HyperDAG'
        },
        {
          id: 'developer',
          name: 'Developer Credential',
          description: 'Verifies a user\'s developer experience and contributions'
        },
        {
          id: 'achievement',
          name: 'Achievement',
          description: 'Verifies a specific achievement or badge earned by the user'
        },
        {
          id: 'identity',
          name: 'Identity Verification',
          description: 'Verifies user\'s identity without revealing personal details'
        }
      ]
    });
  } catch (error) {
    logger.error('Error fetching credential types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential types'
    });
  }
});

/**
 * Health check endpoint
 * Public endpoint - no authentication required
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'up',
    version: '1.0.0'
  });
});

export default router;