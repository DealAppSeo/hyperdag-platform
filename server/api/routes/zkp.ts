import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { redundantZKPService, CircuitType, ZKPProvider } from '../../services/redundancy/zkp/redundant-zkp-service';
import { requireAuth, requireAdmin } from '../../middleware/auth-middleware';

// Create router
const router = Router();

// Input validation schemas
const circuitTypeSchema = z.enum(['identity', 'reputation', 'credentials', 'generic']);
const providerSchema = z.enum(['mina', 'polygon', 'circom']).optional();

/**
 * @route GET /api/zkp/status
 * @desc Get ZKP service status
 * @access Public
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = redundantZKPService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        lastUpdated: status.lastUpdated.toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error getting ZKP service status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting ZKP service status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/refresh
 * @desc Refresh ZKP provider status
 * @access Admin
 */
router.post('/refresh', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await redundantZKPService.refreshProviderStatus();
    
    const status = redundantZKPService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        lastUpdated: status.lastUpdated.toISOString()
      },
      message: 'ZKP provider status refreshed successfully'
    });
  } catch (error: any) {
    logger.error('Error refreshing ZKP provider status:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing ZKP provider status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/generate-proof
 * @desc Generate a zero-knowledge proof
 * @access Private
 */
router.post('/generate-proof', requireAuth, async (req: Request, res: Response) => {
  try {
    const { circuitType, privateInput, publicInput } = req.body;
    
    // Validate circuit type
    const validationResult = circuitTypeSchema.safeParse(circuitType);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid circuit type',
        error: 'Circuit type must be one of: identity, reputation, credentials, generic'
      });
    }
    
    // Generate proof
    const result = await redundantZKPService.generateProof(
      circuitType as CircuitType,
      privateInput,
      publicInput
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate proof',
        error: result.error,
        provider: result.provider
      });
    }
    
    res.json({
      success: true,
      data: {
        proof: result.proof,
        provider: result.provider
      },
      message: 'Proof generated successfully'
    });
  } catch (error: any) {
    logger.error('Error generating ZKP proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating ZKP proof',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/verify-proof
 * @desc Verify a zero-knowledge proof
 * @access Private
 */
router.post('/verify-proof', requireAuth, async (req: Request, res: Response) => {
  try {
    const { circuitType, proof, publicInput } = req.body;
    
    // Validate circuit type
    const validationResult = circuitTypeSchema.safeParse(circuitType);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid circuit type',
        error: 'Circuit type must be one of: identity, reputation, credentials, generic'
      });
    }
    
    // Verify proof
    const result = await redundantZKPService.verifyProof(
      circuitType as CircuitType,
      proof,
      publicInput
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify proof',
        error: result.error,
        provider: result.provider
      });
    }
    
    res.json({
      success: true,
      data: {
        isValid: result.isValid,
        provider: result.provider
      },
      message: result.isValid ? 'Proof verified successfully' : 'Proof verification failed'
    });
  } catch (error: any) {
    logger.error('Error verifying ZKP proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying ZKP proof',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/identity/generate
 * @desc Generate a zero-knowledge proof for identity verification
 * @access Private
 */
router.post('/identity/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { privateInput, publicInput } = req.body;
    
    // Generate proof
    const result = await redundantZKPService.generateProof(
      'identity',
      privateInput,
      publicInput
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate identity proof',
        error: result.error,
        provider: result.provider
      });
    }
    
    res.json({
      success: true,
      data: {
        proof: result.proof,
        provider: result.provider
      },
      message: 'Identity proof generated successfully'
    });
  } catch (error: any) {
    logger.error('Error generating identity ZKP proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating identity ZKP proof',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/reputation/generate
 * @desc Generate a zero-knowledge proof for reputation verification
 * @access Private
 */
router.post('/reputation/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { privateInput, publicInput } = req.body;
    
    // Generate proof
    const result = await redundantZKPService.generateProof(
      'reputation',
      privateInput,
      publicInput
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate reputation proof',
        error: result.error,
        provider: result.provider
      });
    }
    
    res.json({
      success: true,
      data: {
        proof: result.proof,
        provider: result.provider
      },
      message: 'Reputation proof generated successfully'
    });
  } catch (error: any) {
    logger.error('Error generating reputation ZKP proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reputation ZKP proof',
      error: error.message
    });
  }
});

/**
 * @route POST /api/zkp/credentials/generate
 * @desc Generate a zero-knowledge proof for credential verification
 * @access Private
 */
router.post('/credentials/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { privateInput, publicInput } = req.body;
    
    // Generate proof
    const result = await redundantZKPService.generateProof(
      'credentials',
      privateInput,
      publicInput
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate credentials proof',
        error: result.error,
        provider: result.provider
      });
    }
    
    res.json({
      success: true,
      data: {
        proof: result.proof,
        provider: result.provider
      },
      message: 'Credentials proof generated successfully'
    });
  } catch (error: any) {
    logger.error('Error generating credentials ZKP proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating credentials ZKP proof',
      error: error.message
    });
  }
});

export default router;