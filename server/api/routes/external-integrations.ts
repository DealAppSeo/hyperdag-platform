/**
 * External Integrations API Routes
 * 
 * These routes provide the backend functionality for the HyperDAG Integration SDK,
 * allowing external developers to integrate with our ZKP SBT verification system.
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import { apiKeys } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth-middleware';
import { verifyProof } from '../../services/zkp/reputation-zkp-service';
import { sbtService } from '../../services/sbt-service';

const router = express.Router();

/**
 * Generate a new API key for external integration
 * 
 * @route POST /api/external/generate-api-key
 * @access Authenticated users only
 */
router.post('/generate-api-key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, description } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Generate a unique API key with uuid
    const apiKey = `hyperdag_${uuidv4().replace(/-/g, '')}`;
    
    // Store the API key in the database
    const [createdKey] = await db.insert(apiKeys).values({
      key: apiKey,
      userId: userId,
      description: description || 'HyperDAG Integration',
      createdAt: new Date(),
      lastUsed: null,
      isActive: true,
      permissions: ['zkp:verify', 'zkp:generate', 'forum:read', 'forum:write']
    }).returning();
    
    // Return the API key to the client
    res.status(201).json({
      success: true,
      apiKey: apiKey
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

/**
 * Verify an API key
 * 
 * @route GET /api/external/verify-key
 * @access Public with API key
 */
router.get('/verify-key', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || 
                  (req.headers['authorization'] || '').replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Check if the API key exists and is active
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey));
    
    if (!key || !key.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive API key'
      });
    }
    
    // Update the last used timestamp
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.key, apiKey));
    
    // Return success
    res.status(200).json({
      success: true,
      data: {
        permissions: key.permissions,
        userId: key.userId
      }
    });
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify API key'
    });
  }
});

/**
 * Check API status
 * 
 * @route GET /api/external/status
 * @access Public with API key
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || 
                  (req.headers['authorization'] || '').replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Check if the API key exists and is active
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey));
    
    if (!key || !key.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive API key'
      });
    }
    
    // Return API status
    res.status(200).json({
      success: true,
      data: {
        status: 'operational',
        version: '1.0.0',
        features: {
          zkp: true,
          sbt: true,
          forum: true
        }
      }
    });
  } catch (error) {
    console.error('Error checking API status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check API status'
    });
  }
});

/**
 * List user's API keys
 * 
 * @route GET /api/external/api-keys
 * @access Authenticated users only
 */
router.get('/api-keys', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Get all API keys for the user
    const keys = await db.select({
      id: apiKeys.id,
      key: apiKeys.key,
      description: apiKeys.description,
      createdAt: apiKeys.createdAt,
      lastUsed: apiKeys.lastUsed,
      isActive: apiKeys.isActive,
      permissions: apiKeys.permissions
    }).from(apiKeys).where(eq(apiKeys.userId, req.user.id));
    
    // Mask the API keys for security
    const maskedKeys = keys.map(key => ({
      ...key,
      key: key.key.substring(0, 10) + '...' + key.key.substring(key.key.length - 4)
    }));
    
    res.status(200).json({
      success: true,
      data: maskedKeys
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

/**
 * Revoke an API key
 * 
 * @route POST /api/external/revoke-key
 * @access Authenticated users only
 */
router.post('/revoke-key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.body;
    
    if (!keyId) {
      return res.status(400).json({
        success: false,
        error: 'API key ID is required'
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Verify the key belongs to the user
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId));
    
    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    if (key.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to revoke this API key'
      });
    }
    
    // Revoke the key by setting isActive to false
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId));
    
    res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

/**
 * Middleware to verify API key for external integration endpoints
 */
export const verifyApiKey = async (req: Request, res: Response, next: any) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || 
                  (req.headers['authorization'] || '').replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Check if the API key exists and is active
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey));
    
    if (!key || !key.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive API key'
      });
    }
    
    // Add the API key to the request for use in route handlers
    req.apiKey = key;
    
    // Continue to the route handler
    next();
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify API key'
    });
  }
};

/**
 * Get forum posts (for external integrations)
 * 
 * @route GET /api/external/forum/posts
 * @access Public with API key
 */
router.get('/forum/posts', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    
    // TODO: Implement actual forum post retrieval
    // For now, just return sample data
    const posts = [
      {
        id: 1,
        title: 'Welcome to HyperDAG Forum',
        content: 'This is a sample forum post for integration testing',
        author: 'anonymous',
        category: 'general',
        createdAt: new Date().toISOString(),
        verified: true
      },
      {
        id: 2,
        title: 'ZKP Verification Guide',
        content: 'Learn how to use Zero-Knowledge Proofs for reputation verification',
        author: 'hyperdag_team',
        category: 'guides',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        verified: true
      }
    ];
    
    // Filter by category if provided
    const filteredPosts = category
      ? posts.filter(post => post.category === category)
      : posts;
    
    // Apply limit
    const limitedPosts = filteredPosts.slice(0, limit);
    
    res.status(200).json({
      success: true,
      data: limitedPosts
    });
  } catch (error) {
    console.error('Error retrieving forum posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve forum posts'
    });
  }
});

/**
 * Create a forum post (for external integrations)
 * 
 * @route POST /api/external/forum/posts
 * @access Public with API key
 */
router.post('/forum/posts', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { content, anonymous = false, reputationProof, category = 'general' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Post content is required'
      });
    }
    
    // If a reputation proof is provided, verify it
    let verified = false;
    if (reputationProof) {
      try {
        const verificationResult = await verifyProof(reputationProof, { minScore: 10 });
        verified = verificationResult.success;
      } catch (verifyError) {
        console.error('Error verifying reputation proof:', verifyError);
        // Continue without verification
      }
    }
    
    // TODO: Implement actual forum post creation
    // For now, just return a success response
    
    res.status(201).json({
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000) + 10,
        content,
        author: anonymous ? 'anonymous' : `user_${req.apiKey.userId}`,
        category,
        createdAt: new Date().toISOString(),
        verified
      }
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create forum post'
    });
  }
});

/**
 * Get SBT metadata (for external integrations)
 * 
 * @route GET /api/external/sbt/metadata/:tokenId
 * @access Public with API key
 */
router.get('/sbt/metadata/:tokenId', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      return res.status(400).json({
        success: false,
        error: 'Token ID is required'
      });
    }
    
    // Get SBT metadata from our service
    try {
      // Get token metadata using our SBT service
      const metadata = await sbtService.getSBTMetadata(tokenId);
      
      if (!metadata) {
        return res.status(404).json({
          success: false,
          error: 'Token not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: metadata
      });
    } catch (metadataError) {
      console.error('Error fetching SBT metadata:', metadataError);
      
      // During development, return fallback metadata if service fails
      res.status(200).json({
        success: true,
        data: {
          tokenId,
          name: `HyperDAG SBT #${tokenId}`,
          description: 'A Soulbound Token representing verified credentials and reputation on the HyperDAG platform',
          image: `https://api.hyperdag.org/sbt/image/${tokenId}`,
          attributes: [
            {
              trait_type: 'Reputation Score',
              value: 'Verified',
              display_type: 'zkp'
            },
            {
              trait_type: 'Type',
              value: 'Community Member'
            },
            {
              trait_type: 'Issued Date',
              value: new Date().toISOString().split('T')[0],
              display_type: 'date'
            }
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error retrieving SBT metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SBT metadata'
    });
  }
});

/**
 * Verify SBT ownership (for external integrations)
 * 
 * @route POST /api/external/sbt/verify-ownership
 * @access Public with API key
 */
router.post('/sbt/verify-ownership', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({
        success: false,
        error: 'Proof is required'
      });
    }
    
    // Use our SBT service to verify token ownership
    const tokenId = req.body.tokenId;
    
    if (!tokenId) {
      return res.status(400).json({
        success: false,
        error: 'Token ID is required for verification'
      });
    }
    
    try {
      const isValid = await sbtService.verifySBT(tokenId, proof);
      
      const verificationResult = {
        success: true,
        data: {
          verified: isValid,
          tokenType: 'SBT',
          verificationTime: new Date().toISOString()
        }
      };
      
      res.status(200).json(verificationResult);
    } catch (verifyError) {
      console.error('Error in SBT verification:', verifyError);
      
      res.status(200).json({
        success: false,
        error: 'Verification service encountered an error',
        data: {
          verified: false,
          tokenType: 'SBT',
          verificationTime: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error verifying SBT ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify SBT ownership'
    });
  }
});

export default router;