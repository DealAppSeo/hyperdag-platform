/**
 * Social ZKP Routes
 * 
 * This file defines API routes for generating and verifying zero-knowledge proofs
 * for social media integration with privacy preservation.
 */

import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth-middleware';
import { apiLimiter } from '../../utils/rate-limiter';
import * as socialZkpService from '../../services/zkp/social-zkp-service';
import type { SocialPlatform, SocialProofType } from '../../services/zkp/social-zkp-service';

const router = express.Router();

// Input validation schemas
const platformSchema = z.enum([
  'twitter', 'linkedin', 'youtube', 'discord',
  'github', 'telegram', 'instagram', 'facebook'
]);

const proofTypeSchema = z.enum([
  'accountVerification', 'influenceThreshold', 'accountAge',
  'contentCreation', 'engagement', 'platformCombination'
]);

const generateProofSchema = z.object({
  platform: platformSchema,
  proofType: proofTypeSchema,
  thresholds: z.object({
    followers: z.number().optional(),
    accountAge: z.number().optional(),
    contentCount: z.number().optional(),
    engagementRate: z.number().optional()
  }).optional(),
  additionalData: z.record(z.any()).optional()
});

const verifyProofSchema = z.object({
  proofId: z.string()
});

/**
 * Generate a zero-knowledge proof for social media verification
 * POST /api/social-zkp/generate
 */
router.post('/generate', requireAuth, apiLimiter, async (req, res) => {
  try {
    const validationResult = generateProofSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }
    
    const { platform, proofType, thresholds, additionalData } = validationResult.data;
    
    const proof = await socialZkpService.generateProof({
      userId: req.user!.id,
      platform: platform as SocialPlatform,
      proofType: proofType as SocialProofType,
      thresholds,
      additionalData
    });
    
    if (!proof) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate proof. Ensure you have verified your social account.'
      });
    }
    
    res.json({
      success: true,
      proofId: proof.id,
      proof: proof.proof,
      publicInputs: proof.publicInputs,
      publicCommitment: proof.publicCommitment,
      expiresAt: proof.expiresAt
    });
  } catch (error) {
    console.error('[social-zkp-routes] Error generating proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating proof'
    });
  }
});

/**
 * Verify a zero-knowledge proof
 * POST /api/social-zkp/verify
 */
router.post('/verify', apiLimiter, async (req, res) => {
  try {
    const validationResult = verifyProofSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }
    
    const { proofId } = validationResult.data;
    
    const verificationResult = socialZkpService.verifyProof(proofId);
    
    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        message: verificationResult.expired 
          ? 'Proof has expired' 
          : 'Invalid proof'
      });
    }
    
    res.json({
      success: true,
      valid: true,
      publicInputs: verificationResult.publicInputs
    });
  } catch (error) {
    console.error('[social-zkp-routes] Error verifying proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying proof'
    });
  }
});

/**
 * Generate a privacy-preserving social badge
 * GET /api/social-zkp/badge
 */
router.get('/badge', requireAuth, apiLimiter, async (req, res) => {
  try {
    const badge = await socialZkpService.generateSocialBadge(req.user!.id);
    
    if (!badge) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate social badge. Ensure you have verified at least one social account.'
      });
    }
    
    res.json({
      success: true,
      badgeId: badge.badgeId,
      commitment: badge.commitment,
      categories: badge.categories
    });
  } catch (error) {
    console.error('[social-zkp-routes] Error generating social badge:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating social badge'
    });
  }
});

export default router;