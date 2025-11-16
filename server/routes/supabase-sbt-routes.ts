import { Router } from 'express';
import { getSupabaseSBTService } from '../services/supabase-sbt-service.js';
import { requireAuth } from '../middleware/auth-guard.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
router.get('/api/supabase/health', async (req, res) => {
  try {
    const supabaseService = getSupabaseSBTService();
    const healthStatus = await supabaseService.healthCheck();
    
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Supabase service unavailable'
    });
  }
});

// Check user authentication requirements for SBT creation
router.get('/api/sbt/auth-requirements', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const supabaseService = getSupabaseSBTService();
    const authValidation = await supabaseService.validateUserAuthRequirements(userId);
    
    res.json({
      success: true,
      data: authValidation
    });
  } catch (error) {
    console.error('Failed to check auth requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate authentication requirements'
    });
  }
});

// Get user's SBT credentials
router.get('/api/sbt/credentials', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabaseService = getSupabaseSBTService();
    const credentials = await supabaseService.getUserCredentials(userId);

    res.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credentials'
    });
  }
});

// Get user's reputation score
router.get('/api/reputation/score', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabaseService = getSupabaseSBTService();
    const reputationData = await supabaseService.getUserReputationScore(userId);

    res.json({
      success: true,
      score: reputationData
    });
  } catch (error) {
    console.error('Failed to fetch reputation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reputation'
    });
  }
});

// Create new SBT credential with real-time sync
router.post('/api/sbt/realtime/register', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { type, title, description, evidence } = req.body;

    const supabaseService = getSupabaseSBTService();
    const credential = await supabaseService.createSBTCredential(userId, {
      type,
      title,
      description,
      evidence
    });

    res.json({
      success: true,
      data: credential
    });
  } catch (error) {
    console.error('Failed to create credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create credential'
    });
  }
});

// Upload evidence file for credential
router.post('/api/sbt/realtime/upload-evidence', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const file = req.file;
    const { type, title, description } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const supabaseService = getSupabaseSBTService();
    const result = await supabaseService.uploadCredentialEvidence(
      file.buffer,
      file.originalname,
      userId,
      { type, title, description }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to upload evidence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload evidence'
    });
  }
});

// Update credential status with real-time sync
router.patch('/api/sbt/realtime/:credentialId/status', requireAuth, async (req, res) => {
  try {
    const credentialId = parseInt(req.params.credentialId);
    const { status, verificationNotes } = req.body;

    const supabaseService = getSupabaseSBTService();
    await supabaseService.updateCredentialStatus(credentialId, status, verificationNotes);

    res.json({
      success: true,
      data: { message: 'Credential status updated' }
    });
  } catch (error) {
    console.error('Failed to update credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update credential'
    });
  }
});

// Update reputation with real-time sync
router.post('/api/reputation/realtime/update', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { activity, points, description, metadata } = req.body;

    const supabaseService = getSupabaseSBTService();
    const result = await supabaseService.updateReputation(userId, {
      type: activity,
      points,
      description,
      metadata
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to update reputation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reputation'
    });
  }
});

export { router as supabaseSBTRoutes };