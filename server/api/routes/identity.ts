import { Router, Request, Response } from 'express';
import { identityService } from '../../services/identity-service';
import { z } from 'zod';

const router = Router();

// Schema for identity creation
const createIdentitySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().optional(),
  externalUrl: z.string().optional(),
  attributes: z.array(
    z.object({
      trait_type: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()])
    })
  ).optional()
});

// Schema for adding credential
const addCredentialSchema = z.object({
  tokenId: z.number().int().positive(),
  credentialType: z.string().min(1).max(50),
  credentialData: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
});

// Schema for creating proof
const createProofSchema = z.object({
  tokenId: z.number().int().positive(),
  credentialType: z.string().min(1).max(50),
  publicInput: z.record(z.any()),
  privateInput: z.record(z.any())
});

// Schema for verifying proof
const verifyProofSchema = z.object({
  tokenId: z.number().int().positive(),
  credentialType: z.string().min(1).max(50),
  proof: z.any()
});

// Authentication middleware - ensure user is logged in
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
}

// Get identity status
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const status = await identityService.getIdentityStatus(userId);
    res.json(status);
  } catch (error: any) {
    console.error('[api/identity] Error getting identity status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get identity status'
    });
  }
});

// Create identity
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = createIdentitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.format()
      });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const result = await identityService.createIdentity(userId, validation.data);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create identity'
      });
    }
    
    res.status(201).json({
      success: true,
      tokenId: result.tokenId
    });
  } catch (error: any) {
    console.error('[api/identity] Error creating identity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create identity'
    });
  }
});

// Add credential
router.post('/credentials/add', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = addCredentialSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.format()
      });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const result = await identityService.addCredential(userId, validation.data);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add credential'
      });
    }
    
    res.status(201).json({
      success: true
    });
  } catch (error: any) {
    console.error('[api/identity] Error adding credential:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add credential'
    });
  }
});

// Create proof
router.post('/proofs/create', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = createProofSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.format()
      });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const result = await identityService.createProof(userId, validation.data);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create proof'
      });
    }
    
    res.json({
      success: true,
      proof: result.proof
    });
  } catch (error: any) {
    console.error('[api/identity] Error creating proof:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create proof'
    });
  }
});

// Verify proof
router.post('/proofs/verify', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = verifyProofSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.format()
      });
    }
    
    const result = await identityService.verifyProof(validation.data);
    res.json({
      success: result.success,
      verified: result.verified
    });
  } catch (error: any) {
    console.error('[api/identity] Error verifying proof:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify proof'
    });
  }
});

export default router;