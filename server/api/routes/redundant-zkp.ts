/**
 * Redundant Zero-Knowledge Proof API Routes
 * 
 * This file defines the redundant ZKP-related API routes for the HyperDAG platform.
 * It integrates multiple ZKP providers: Mina zk-SNARKs, Polygon Plonky3, and Circom/SnarkJS
 * with automatic fallback to ensure high availability.
 */

import { Router } from 'express';
import * as redundantZkpService from '../../services/redundancy/zkp/redundant-zkp-service';
import { log } from '../../vite';

const router = Router();

/**
 * @route GET /api/redundant-zkp/status
 * @description Get the current status of the redundant ZKP service
 * @access Public
 */
router.get('/status', (req, res) => {
  try {
    const status = redundantZkpService.getStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    log(`Error getting redundant ZKP status: ${(error as Error).message}`, 'redundant-zkp-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to get ZKP service status',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/redundant-zkp/identity/commitment
 * @description Create an identity commitment for a user using the most appropriate ZKP provider
 * @access Private
 */
router.post('/identity/commitment', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required'
    });
  }
  
  try {
    const { secret } = req.body;
    
    if (!secret) {
      return res.status(400).json({
        success: false,
        message: 'Secret is required'
      });
    }
    
    // Use the redundant service which will select the appropriate provider
    redundantZkpService.createIdentityCommitment(
      req.user.id,
      secret
    ).then(commitment => {
      return res.status(201).json({ 
        success: true, 
        data: {
          commitment: commitment.commitment,
          nullifier: commitment.nullifier
        }
      });
    }).catch(error => {
      log(`Error creating identity commitment: ${error.message}`, 'redundant-zkp-api');
      return res.status(500).json({
        success: false,
        message: 'Failed to create identity commitment',
        error: error.message
      });
    });
  } catch (error) {
    log(`Error creating identity commitment: ${(error as Error).message}`, 'redundant-zkp-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to create identity commitment',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/redundant-zkp/identity/verify
 * @description Verify an identity using zero-knowledge proof
 * @access Public
 */
router.post('/identity/verify', (req, res) => {
  try {
    const { commitment, nullifier, proof } = req.body;
    
    if (!commitment || !nullifier || !proof) {
      return res.status(400).json({
        success: false,
        message: 'Commitment, nullifier, and proof are required'
      });
    }
    
    redundantZkpService.verifyIdentity(commitment, nullifier, proof)
      .then(result => {
        return res.json({ success: true, data: result });
      })
      .catch(error => {
        log(`Error verifying identity: ${error.message}`, 'redundant-zkp-api');
        return res.status(500).json({
          success: false,
          message: 'Failed to verify identity',
          error: error.message
        });
      });
  } catch (error) {
    log(`Error verifying identity: ${(error as Error).message}`, 'redundant-zkp-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to verify identity',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/redundant-zkp/proofs/:circuitIdOrName
 * @description Generate a proof for a specific circuit using the most appropriate provider
 * @access Private
 */
router.post('/proofs/:circuitIdOrName', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required'
    });
  }
  
  try {
    const { circuitIdOrName } = req.params;
    const { privateInputs, publicInputs } = req.body;
    
    if (!privateInputs || !publicInputs) {
      return res.status(400).json({
        success: false,
        message: 'Private inputs and public inputs are required'
      });
    }
    
    redundantZkpService.generateProof(
      circuitIdOrName,
      privateInputs,
      publicInputs
    ).then(proof => {
      return res.status(201).json({ success: true, data: proof });
    }).catch(error => {
      log(`Error generating proof: ${error.message}`, 'redundant-zkp-api');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate proof',
        error: error.message
      });
    });
  } catch (error) {
    log(`Error generating proof: ${(error as Error).message}`, 'redundant-zkp-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to generate proof',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/redundant-zkp/proofs/:proofId/verify
 * @description Verify a zero-knowledge proof
 * @access Public
 */
router.get('/proofs/:proofId/verify', (req, res) => {
  try {
    const { proofId } = req.params;
    
    redundantZkpService.verifyProof(proofId)
      .then(result => {
        return res.json({ success: true, data: result });
      })
      .catch(error => {
        log(`Error verifying proof: ${error.message}`, 'redundant-zkp-api');
        return res.status(500).json({
          success: false,
          message: 'Failed to verify proof',
          error: error.message
        });
      });
  } catch (error) {
    log(`Error verifying proof: ${(error as Error).message}`, 'redundant-zkp-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to verify proof',
      error: (error as Error).message
    });
  }
});

export default router;