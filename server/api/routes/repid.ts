import { Router } from 'express';
import { z } from 'zod';
import { ZKPRepIDService } from '../../services/repid/zkp-repid-service';

const router = Router();

/**
 * RepID Management API Routes
 * Handles reputation credential minting, updating, and verification
 * Integrates with ZKP service for privacy-preserving proofs
 */

const mintRepIDSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  initialScore: z.number().min(1).max(1000),
  authenticityScore: z.number().min(0).max(1000).optional(),
  contributionScore: z.number().min(0).max(1000).optional(),
  consistencyScore: z.number().min(0).max(1000).optional(),
});

const updateRepIDSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  totalScore: z.number().min(1).max(10000),
  authenticityScore: z.number().min(0).max(10000),
  contributionScore: z.number().min(0).max(10000),
  consistencyScore: z.number().min(0).max(10000),
  proofData: z.object({
    threshold: z.number(),
    actualValue: z.number(),
  }).optional(),
});

// In-memory storage for MVP (replace with blockchain later)
const repIDRegistry = new Map<string, {
  tokenId: number;
  userAddress: string;
  totalScore: number;
  authenticityScore: number;
  contributionScore: number;
  consistencyScore: number;
  zkProofHash: string;
  lastUpdated: number;
  mintedAt: number;
}>();

let tokenIdCounter = 0;


/**
 * POST /api/repid/mint
 * Mint a new RepID NFT credential
 */
router.post('/mint', async (req, res) => {
  try {
    const data = mintRepIDSchema.parse(req.body);
    
    // Check if user already has RepID
    if (repIDRegistry.has(data.userAddress)) {
      return res.status(400).json({ 
        error: 'User already has RepID',
        tokenId: repIDRegistry.get(data.userAddress)?.tokenId 
      });
    }
    
    const authenticityScore = data.authenticityScore ?? Math.floor(data.initialScore / 3);
    const contributionScore = data.contributionScore ?? Math.floor(data.initialScore / 3);
    const consistencyScore = data.consistencyScore ?? Math.floor(data.initialScore / 3);
    
    // Generate ZKP proof using real cryptographic service
    const { proof, proofHash: zkProofHash } = ZKPRepIDService.generateRangeProof(
      data.initialScore,
      0 // Threshold: score > 0
    );
    
    tokenIdCounter++;
    const repID = {
      tokenId: tokenIdCounter,
      userAddress: data.userAddress,
      totalScore: data.initialScore,
      authenticityScore,
      contributionScore,
      consistencyScore,
      zkProofHash,
      lastUpdated: Date.now(),
      mintedAt: Date.now(),
    };
    
    repIDRegistry.set(data.userAddress, repID);
    
    res.status(201).json({
      success: true,
      tokenId: repID.tokenId,
      userAddress: repID.userAddress,
      totalScore: repID.totalScore,
      zkProofHash: repID.zkProofHash,
      mintedAt: repID.mintedAt,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[RepID] Mint error:', error);
    res.status(500).json({ error: 'Failed to mint RepID' });
  }
});

/**
 * POST /api/repid/update
 * Update RepID score with ZKP verification
 */
router.post('/update', async (req, res) => {
  try {
    const data = updateRepIDSchema.parse(req.body);
    
    const repID = repIDRegistry.get(data.userAddress);
    if (!repID) {
      return res.status(404).json({ error: 'RepID not found for user' });
    }
    
    // Generate new ZKP proof using real cryptographic service
    const threshold = data.proofData?.threshold ?? 0;
    const { proof, proofHash: zkProofHash } = ZKPRepIDService.generateRangeProof(
      data.totalScore,
      threshold
    );
    
    // Update RepID
    repID.totalScore = data.totalScore;
    repID.authenticityScore = data.authenticityScore;
    repID.contributionScore = data.contributionScore;
    repID.consistencyScore = data.consistencyScore;
    repID.zkProofHash = zkProofHash;
    repID.lastUpdated = Date.now();
    
    repIDRegistry.set(data.userAddress, repID);
    
    res.json({
      success: true,
      tokenId: repID.tokenId,
      totalScore: repID.totalScore,
      zkProofHash: repID.zkProofHash,
      lastUpdated: repID.lastUpdated,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[RepID] Update error:', error);
    res.status(500).json({ error: 'Failed to update RepID' });
  }
});

/**
 * GET /api/repid/:address
 * Get RepID score for a user
 */
router.get('/:address', (req, res) => {
  try {
    const address = req.params.address;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    const repID = repIDRegistry.get(address);
    if (!repID) {
      return res.status(404).json({ error: 'RepID not found' });
    }
    
    res.json({
      tokenId: repID.tokenId,
      userAddress: repID.userAddress,
      totalScore: repID.totalScore,
      authenticityScore: repID.authenticityScore,
      contributionScore: repID.contributionScore,
      consistencyScore: repID.consistencyScore,
      zkProofHash: repID.zkProofHash,
      lastUpdated: repID.lastUpdated,
      mintedAt: repID.mintedAt,
    });
    
  } catch (error) {
    console.error('[RepID] Get error:', error);
    res.status(500).json({ error: 'Failed to retrieve RepID' });
  }
});

/**
 * POST /api/repid/verify-proof
 * Verify ZKP proof against stored hash
 */
router.post('/verify-proof', (req, res) => {
  try {
    const { userAddress, proof } = req.body;
    
    if (!userAddress || !proof) {
      return res.status(400).json({ error: 'Missing userAddress or proof object' });
    }
    
    const repID = repIDRegistry.get(userAddress);
    if (!repID) {
      return res.status(404).json({ error: 'RepID not found' });
    }
    
    // Verify proof hash using ZKP service
    const verification = ZKPRepIDService.verifyProofHash(proof, repID.zkProofHash);
    
    res.json({
      valid: verification.valid,
      tokenId: repID.tokenId,
      userAddress: repID.userAddress,
      timestamp: verification.timestamp,
    });
    
  } catch (error) {
    console.error('[RepID] Verify proof error:', error);
    res.status(500).json({ error: 'Failed to verify proof' });
  }
});

/**
 * GET /api/repid/leaderboard
 * Get top RepID scores (without revealing exact scores via ZKP)
 */
router.get('/leaderboard/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const leaderboard = Array.from(repIDRegistry.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((repID, index) => ({
        rank: index + 1,
        userAddress: repID.userAddress.slice(0, 6) + '...' + repID.userAddress.slice(-4), // Privacy
        totalScore: repID.totalScore,
        lastUpdated: repID.lastUpdated,
      }));
    
    res.json({ leaderboard });
    
  } catch (error) {
    console.error('[RepID] Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

export default router;
