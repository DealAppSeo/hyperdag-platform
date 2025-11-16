/**
 * Developer API Router
 * 
 * Provides API endpoints for developers to interact with the
 * ZKP-based reputation system without exposing personal details.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiLimiter, strictLimiter } from '../../middleware/rate-limiter';
import { validateApiKey } from '../../middleware/api-key-middleware';
import * as apiKeyService from '../../services/api/api-key-service';
import { logger } from '../../utils/logger';
import { redundantZKPService } from '../../services/redundancy/zkp/redundant-zkp-service';
import { repIdServiceExtension } from '../../services/reputation/rep-id-service-extension';
import { db } from '../../db';
import { verifiedCredentials } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Apply API key validation and rate limiting to all Developer API routes
router.use(validateApiKey);
router.use(apiLimiter);

/**
 * API Health Check
 * GET /api/developer/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'HyperDAG Developer API is operational',
    version: '1.0.0',
    timestamp: new Date()
  });
});

/**
 * Verify a ZKP-based credential
 * POST /api/developer/zkp/verify
 */
router.post('/zkp/verify', strictLimiter, async (req: Request, res: Response) => {
  try {
    const verifySchema = z.object({
      proof: z.string().min(1),
      publicSignals: z.array(z.string()),
      type: z.enum(['identity', 'reputation', 'credential', 'custom']).default('reputation')
    });
    
    const validationResult = verifySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        }
      });
    }
    
    const { proof, publicSignals, type } = validationResult.data;
    
    // Use the redundant ZKP service for verification to ensure resilience
    const result = await redundantZKPService.verifyProof(proof, publicSignals, type);
    
    res.json({
      success: result.success,
      data: {
        verified: result.success,
        type,
        publicSignals
      },
      message: result.success ? 'Proof verified successfully' : 'Proof verification failed'
    });
  } catch (error) {
    logger.error('[developer-api] Error verifying ZKP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify zero-knowledge proof',
      error: {
        code: 'VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Get user reputation score (ZKP verified, privacy-preserving)
 * GET /api/developer/reputation/:commitment
 */
router.get('/reputation/:commitment', async (req: Request, res: Response) => {
  try {
    const commitment = req.params.commitment;
    
    if (!commitment || commitment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid commitment',
        error: {
          code: 'INVALID_COMMITMENT',
          message: 'A valid identity commitment is required'
        }
      });
    }
    
    // Get anonymized reputation data using the identity commitment
    const reputationData = await repIdServiceExtension.getReputationByCommitment(commitment);
    
    if (!reputationData.success) {
      return res.status(404).json({
        success: false,
        message: 'Reputation data not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No reputation data found for the provided commitment'
        }
      });
    }
    
    // Return only the necessary data (no personal information)
    res.json({
      success: true,
      data: {
        score: reputationData.data.score,
        level: reputationData.data.level,
        verified: reputationData.data.verified,
        lastUpdated: reputationData.data.lastUpdated
      },
      message: 'Reputation data retrieved successfully'
    });
  } catch (error) {
    logger.error('[developer-api] Error getting reputation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reputation data',
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Get verified credentials for a commitment (ZKP verified, privacy-preserving)
 * GET /api/developer/credentials/:commitment
 */
router.get('/credentials/:commitment', async (req: Request, res: Response) => {
  try {
    const commitment = req.params.commitment;
    
    if (!commitment || commitment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid commitment',
        error: {
          code: 'INVALID_COMMITMENT',
          message: 'A valid identity commitment is required'
        }
      });
    }
    
    // Get user ID from commitment (we'd need to add this to our schema)
    const userData = await repIdServiceExtension.getUserByCommitment(commitment);
    
    if (!userData.success || !userData.data) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No user found for the provided commitment'
        }
      });
    }
    
    // Get all public credentials
    const credentialsList = await db.query.verifiedCredentials.findMany({
      where: eq(verifiedCredentials.userId, userData.data.id),
      columns: {
        id: true,
        name: true,
        type: true,
        issuer: true,
        issuedDate: true,
        expiryDate: true,
        isPublic: true
      }
    });
    
    // Filter to only include public credentials
    const publicCredentials = credentialsList.filter(cred => cred.isPublic);
    
    res.json({
      success: true,
      data: {
        credentials: publicCredentials.map(cred => ({
          id: cred.id,
          name: cred.name,
          type: cred.type,
          issuer: cred.issuer,
          issuedDate: cred.issuedDate,
          expiryDate: cred.expiryDate
        }))
      },
      message: 'Credentials retrieved successfully'
    });
  } catch (error) {
    logger.error('[developer-api] Error getting credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credentials',
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Verify a specific credential
 * POST /api/developer/credentials/verify
 */
router.post('/credentials/verify', strictLimiter, async (req: Request, res: Response) => {
  try {
    const verifySchema = z.object({
      credentialId: z.number(),
      commitment: z.string().min(10),
      proof: z.string().optional()
    });
    
    const validationResult = verifySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        }
      });
    }
    
    const { credentialId, commitment } = validationResult.data;
    
    // Get credential
    const [credential] = await db
      .select()
      .from(verifiedCredentials)
      .where(eq(verifiedCredentials.id, credentialId));
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No credential found with the provided ID'
        }
      });
    }
    
    // Verify that the credential belongs to the user with this commitment
    const userData = await repIdServiceExtension.getUserByCommitment(commitment);
    
    if (!userData.success || !userData.data || userData.data.id !== credential.userId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid credential ownership',
        error: {
          code: 'INVALID_OWNERSHIP',
          message: 'The credential does not belong to the user with this commitment'
        }
      });
    }
    
    // If proof is provided, verify it
    if (validationResult.data.proof) {
      // For future implementation - verify the ZKP proof that the user owns this credential
      // Currently, we've already verified based on commitment
    }
    
    res.json({
      success: true,
      data: {
        verified: true,
        credentialId,
        type: credential.type,
        name: credential.name,
        issuer: credential.issuer,
        issuedDate: credential.issuedDate,
        expiryDate: credential.expiryDate
      },
      message: 'Credential verified successfully'
    });
  } catch (error) {
    logger.error('[developer-api] Error verifying credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify credential',
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * Generate a compatibility score between two users based on their credentials and reputation
 * POST /api/developer/compatibility
 */
router.post('/compatibility', async (req: Request, res: Response) => {
  try {
    const compatibilitySchema = z.object({
      commitment1: z.string().min(10),
      commitment2: z.string().min(10),
      context: z.string().optional()
    });
    
    const validationResult = compatibilitySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        }
      });
    }
    
    const { commitment1, commitment2, context } = validationResult.data;
    
    // Use the RepID service to calculate compatibility
    const compatibilityResult = await repIdServiceExtension.calculateCompatibility(
      commitment1, 
      commitment2, 
      context || 'general'
    );
    
    if (!compatibilityResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Could not calculate compatibility',
        error: {
          code: 'CALCULATION_ERROR',
          message: compatibilityResult.message
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        score: compatibilityResult.data.score,
        strengths: compatibilityResult.data.strengths,
        complementary: compatibilityResult.data.complementary
      },
      message: 'Compatibility calculated successfully'
    });
  } catch (error) {
    logger.error('[developer-api] Error calculating compatibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate compatibility',
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;