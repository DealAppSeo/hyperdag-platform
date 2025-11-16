/**
 * Reputation ZKP API Routes
 * 
 * These routes provide endpoints for the zero-knowledge proof functionality
 * specifically for the reputation system.
 */

import { Request, Response, Router } from 'express';
import * as reputationZKPService from '../../services/zkp/reputation-zkp-service';
import { log } from '../../vite';

const router = Router();

/**
 * Create a commitment for a user's RepID
 */
router.post('/commitment', async (req: Request, res: Response) => {
  try {
    const { userId, secret } = req.body;

    if (!userId || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: userId and secret'
      });
    }

    // User ID should be the current authenticated user's ID
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only create reputation commitments for your own account'
      });
    }

    const commitment = await reputationZKPService.createRepIdCommitment(userId, secret);
    
    if (!commitment) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create RepID commitment'
      });
    }

    return res.status(201).json({
      success: true,
      data: { commitment },
      message: 'RepID commitment created successfully'
    });
  } catch (error) {
    log(`Error in reputation-zkp/commitment: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error creating RepID commitment',
      error: (error as Error).message
    });
  }
});

/**
 * Create a range proof for a user's reputation score
 */
router.post('/range-proof', createRangeProof);

/**
 * Create a range proof for a user's reputation score (alternate name for compatibility)
 */
router.post('/reputation-proof', createRangeProof);

// Shared implementation for both range-proof and reputation-proof endpoints
async function createRangeProof(req: Request, res: Response) {
  try {
    const { userId, minScore, maxScore } = req.body;

    if (!userId || minScore === undefined || maxScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: userId, minScore, and maxScore'
      });
    }

    // User ID should be the current authenticated user's ID
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only create reputation proofs for your own account'
      });
    }

    const proof = await reputationZKPService.createReputationRangeProof(
      userId,
      minScore,
      maxScore
    );
    
    if (!proof) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create reputation range proof'
      });
    }

    return res.status(201).json({
      success: true,
      data: proof,
      message: 'Reputation range proof created successfully'
    });
  } catch (error) {
    log(`Error in reputation-zkp/range-proof: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error creating reputation range proof',
      error: (error as Error).message
    });
  }
}

/**
 * Create a selective disclosure proof for a credential
 */
router.post('/credential-proof', async (req: Request, res: Response) => {
  try {
    const { userId, credentialId, attributesToDisclose } = req.body;

    if (!userId || !credentialId || !attributesToDisclose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: userId, credentialId, and attributesToDisclose'
      });
    }

    // User ID should be the current authenticated user's ID
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only create credential proofs for your own account'
      });
    }

    const proof = await reputationZKPService.createCredentialProof(
      userId,
      credentialId,
      attributesToDisclose
    );
    
    if (!proof) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create credential proof'
      });
    }

    return res.status(201).json({
      success: true,
      data: proof,
      message: 'Credential proof created successfully'
    });
  } catch (error) {
    log(`Error in reputation-zkp/credential-proof: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error creating credential proof',
      error: (error as Error).message
    });
  }
});

/**
 * Verify a reputation range proof
 */
router.post('/verify/range-proof', async (req: Request, res: Response) => {
  try {
    const { proofId } = req.body;

    if (!proofId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: proofId'
      });
    }

    const result = reputationZKPService.verifyReputationProof(proofId);

    return res.status(200).json({
      success: true,
      data: result,
      message: result.valid ? 'Proof verification successful' : 'Proof verification failed'
    });
  } catch (error) {
    log(`Error in reputation-zkp/verify/range-proof: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error verifying reputation proof',
      error: (error as Error).message
    });
  }
});

/**
 * Verify a credential proof
 */
router.post('/verify/credential-proof', async (req: Request, res: Response) => {
  try {
    const { proofId } = req.body;

    if (!proofId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: proofId'
      });
    }

    const result = reputationZKPService.verifyCredentialProof(proofId);

    return res.status(200).json({
      success: true,
      data: result,
      message: result.valid ? 'Proof verification successful' : 'Proof verification failed'
    });
  } catch (error) {
    log(`Error in reputation-zkp/verify/credential-proof: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error verifying credential proof',
      error: (error as Error).message
    });
  }
});

/**
 * Generate a reputation credential
 */
router.post('/credential', async (req: Request, res: Response) => {
  try {
    const { userId, type, name, attributes } = req.body;

    if (!userId || !type || !name || !attributes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: userId, type, name, and attributes'
      });
    }

    // Only admins can create reputation credentials for other users
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only create reputation credentials for your own account'
      });
    }

    const credential = await reputationZKPService.generateReputationCredential(
      userId,
      type,
      name,
      attributes
    );
    
    if (!credential) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate reputation credential'
      });
    }

    return res.status(201).json({
      success: true,
      data: credential,
      message: 'Reputation credential generated successfully'
    });
  } catch (error) {
    log(`Error in reputation-zkp/credential: ${(error as Error).message}`, 'express');
    return res.status(500).json({
      success: false,
      message: 'Error generating reputation credential',
      error: (error as Error).message
    });
  }
});

export default router;
