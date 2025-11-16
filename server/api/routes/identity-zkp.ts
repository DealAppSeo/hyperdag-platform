import { Router } from 'express';
import { Request, Response } from 'express';
import { apiResponse } from '../index';
import * as zkpService from '../../services/zkp/zkp-service';
import crypto from 'crypto';

const router = Router();

// Get ZKP identity status for the current user
router.get('/status', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      // For unauthenticated users, just return false (no identity)
      return res.json(apiResponse(true, {
        hasIdentity: false,
        identityDetails: null
      }));
    }

    // Check if the user has a ZKP identity commitment
    const identityCommitment = zkpService.findIdentityCommitmentByUserId(req.user.id);
    
    if (!identityCommitment) {
      return res.json(apiResponse(true, {
        hasIdentity: false,
        identityDetails: null
      }));
    }

    // Return the identity details (only public parts)
    return res.json(apiResponse(true, {
      hasIdentity: true,
      identityDetails: {
        id: identityCommitment.userId.toString(),
        commitment: identityCommitment.commitment.substring(0, 16) + '...',
        publicKey: crypto.createHash('sha256').update(identityCommitment.commitment).digest('hex').substring(0, 16) + '...',
        created: identityCommitment.created
      }
    }));
  } catch (error) {
    console.error('Error getting ZKP identity status:', error);
    return res.status(500).json(apiResponse(
      false, null, 'Failed to get ZKP identity status', 
      { code: 'SERVER_ERROR', message: 'An error occurred while retrieving ZKP identity status' }
    ));
  }
});

// Create a new ZKP identity for the current user
router.post('/create', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json(apiResponse(
        false, null, null, { code: 'UNAUTHORIZED', message: 'Authentication required' }
      ));
    }

    // Check if the user already has an identity commitment
    const existingIdentity = zkpService.findIdentityCommitmentByUserId(req.user.id);
    if (existingIdentity) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'IDENTITY_EXISTS', message: 'User already has a ZKP identity' }
      ));
    }

    // Generate a secret for the identity commitment
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Create the identity commitment
    const identityCommitment = zkpService.createIdentityCommitment(req.user.id, secret);

    // Return success message and commitment (hiding most of it for privacy)
    return res.json(apiResponse(true, {
      message: 'ZKP identity created successfully',
      commitment: identityCommitment.commitment.substring(0, 16) + '...'
    }));
  } catch (error) {
    console.error('Error creating ZKP identity:', error);
    return res.status(500).json(apiResponse(
      false, null, null, 
      { code: 'SERVER_ERROR', message: 'An error occurred while creating ZKP identity' }
    ));
  }
});

// Add a credential to the user's ZKP identity
router.post('/add-credential', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json(apiResponse(
        false, null, null, { code: 'UNAUTHORIZED', message: 'Authentication required' }
      ));
    }

    const { credentialType, credentialData } = req.body;

    // Validate request body
    if (!credentialType || !credentialData) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'INVALID_REQUEST', message: 'Credential type and data are required' }
      ));
    }

    // Check if the user has a ZKP identity
    const identityCommitment = zkpService.findIdentityCommitmentByUserId(req.user.id);
    if (!identityCommitment) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'NO_IDENTITY', message: 'User does not have a ZKP identity' }
      ));
    }

    // Add the credential
    const credential = zkpService.addCredential(req.user.id, credentialType, credentialData);

    // Return success message
    return res.json(apiResponse(true, {
      message: 'Credential added successfully',
      credentialId: credential.id
    }));
  } catch (error) {
    console.error('Error adding credential:', error);
    return res.status(500).json(apiResponse(
      false, null, null, 
      { code: 'SERVER_ERROR', message: 'An error occurred while adding credential' }
    ));
  }
});

// Generate a proof for a credential
router.post('/generate-proof', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json(apiResponse(
        false, null, null, { code: 'UNAUTHORIZED', message: 'Authentication required' }
      ));
    }

    const { credentialType, publicInput, privateInput } = req.body;

    // Validate request body
    if (!credentialType || !publicInput || !privateInput) {
      return res.status(400).json(apiResponse(
        false, null, null, 
        { code: 'INVALID_REQUEST', message: 'Credential type, public input, and private input are required' }
      ));
    }

    // Generate the proof
    const proof = zkpService.generateCredentialProof(req.user.id, credentialType, privateInput, publicInput);

    // Return the proof ID (not the proof itself for security reasons)
    return res.json(apiResponse(true, {
      message: 'Proof generated successfully',
      proofId: proof.id
    }));
  } catch (error) {
    console.error('Error generating proof:', error);
    return res.status(500).json(apiResponse(
      false, null, null, 
      { code: 'SERVER_ERROR', message: 'An error occurred while generating proof' }
    ));
  }
});

// Verify a proof
router.post('/verify-proof', (req: Request, res: Response) => {
  try {
    const { proofId } = req.body;

    // Validate request body
    if (!proofId) {
      return res.status(400).json(apiResponse(
        false, null, null, { code: 'INVALID_REQUEST', message: 'Proof ID is required' }
      ));
    }

    // Verify the proof
    const verificationResult = zkpService.verifyProof(proofId);

    // Return the verification result
    return res.json(apiResponse(true, verificationResult));
  } catch (error) {
    console.error('Error verifying proof:', error);
    return res.status(500).json(apiResponse(
      false, null, null, 
      { code: 'SERVER_ERROR', message: 'An error occurred while verifying proof' }
    ));
  }
});

export default router;
