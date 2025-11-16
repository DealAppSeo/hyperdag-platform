/**
 * Grant Blockchain API Routes
 * 
 * These routes handle blockchain integration for grant matching,
 * including verification, escrow creation, and cross-chain interactions.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { grantBlockchainService } from '../../services/grant-blockchain-service';
import { requireAuth } from '../../middleware/auth-middleware';
import { storage } from '../../storage';

// Create a router
const router = Router();

// Schema for test blockchain integration request
const testBlockchainIntegrationSchema = z.object({
  rfpId: z.number()
});

/**
 * Test blockchain integration for grant matching
 * 
 * This endpoint simulates the blockchain verification process for grant matching,
 * demonstrating cross-chain functionality, zero-knowledge proofs, and funding escrow.
 */
router.post('/test-blockchain-integration', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request
    const validation = testBlockchainIntegrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
    }
    
    // Extract RFP ID
    const { rfpId } = validation.data;
    
    // Run blockchain integration test
    console.log(`Testing blockchain integration for RFP ID: ${rfpId}`);
    const result = await grantBlockchainService.testBlockchainIntegration(rfpId);
    
    // Return successful response
    return res.json({
      success: true,
      message: 'Blockchain integration test completed successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error in blockchain integration test:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during blockchain integration test'
    });
  }
});

/**
 * Verify grant match on blockchain
 * 
 * This endpoint creates a real blockchain transaction to verify a grant match
 * using actual blockchain testnet transactions.
 */
router.post('/verify-grant-match', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request (basic validation for now)
    const { grantMatchId } = req.body;
    if (!grantMatchId || typeof grantMatchId !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid grant match ID'
      });
    }
    
    // Get the grant match to provide more context in response
    const grantMatch = await storage.getGrantMatchById(grantMatchId);
    if (!grantMatch) {
      return res.status(404).json({
        success: false,
        message: 'Grant match not found'
      });
    }
    
    console.log(`Starting blockchain verification for grant match ID: ${grantMatchId}`);
    
    // Perform actual blockchain verification with testnet transaction
    const transaction = await grantBlockchainService.verifyGrantMatchOnChain(grantMatchId);
    
    // Update grant match status to reflect blockchain verification
    await storage.updateGrantMatch(grantMatchId, {
      blockchainVerified: true,
      blockchainTxHash: transaction.txHash,
      blockchainNetwork: transaction.network,
      verificationTimestamp: new Date()
    });
    
    // Return successful response with transaction details
    return res.json({
      success: true,
      message: `Grant match verified on ${transaction.network} blockchain`,
      data: { 
        transaction,
        grantMatch: {
          id: grantMatch.id,
          rfpId: grantMatch.rfpId,
          grantSourceId: grantMatch.grantSourceId,
          matchScore: grantMatch.matchScore,
          potentialFunding: grantMatch.potentialFunding
        }
      }
    });
  } catch (error: any) {
    console.error('Error verifying grant match on blockchain:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during blockchain verification'
    });
  }
});

export default router;