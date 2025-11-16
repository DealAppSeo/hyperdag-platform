import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { ipfsStorageService } from '../services/ipfs-storage';
import crypto from 'crypto';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Register new SBT with file uploads
router.post('/register', requireAuth, upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    const { type, title, description, evidence } = req.body;
    const userId = (req.user as any).id;
    const evidenceFiles = req.files as Express.Multer.File[];

    // Check authentication prerequisites
    const user = await storage.getUser(userId);
    if (!user?.twoFactorEnabled) {
      return res.status(403).json({ 
        success: false, 
        message: 'Two-factor authentication must be enabled to create SBT credentials' 
      });
    }

    if (!user?.walletAddress) {
      return res.status(403).json({ 
        success: false, 
        message: 'Web3 wallet must be connected to create SBT credentials' 
      });
    }

    if (!type || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credential type and title are required' 
      });
    }

    // Process uploaded evidence files
    const evidenceUrls: string[] = [];
    if (evidenceFiles && evidenceFiles.length > 0) {
      for (const file of evidenceFiles) {
        try {
          // Generate unique filename
          const fileId = crypto.randomUUID();
          const fileExtension = file.originalname.split('.').pop() || 'bin';
          const fileName = `sbt-evidence-${fileId}.${fileExtension}`;
          
          // Store file as base64 data URL for now (can be enhanced with IPFS later)
          const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          evidenceUrls.push(fileUrl);
          
          console.log(`Stored evidence file: ${fileName} (${file.size} bytes)`);
        } catch (fileError) {
          console.error('Error storing evidence file:', fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Create verification request in database
    const verificationRequest = await storage.createSBTCredential({
      userId,
      type,
      title,
      description,
      evidence: evidence || '',
      status: 'pending',
      metadata: {
        submittedAt: new Date().toISOString(),
        verificationLevel: 'basic',
        evidenceFiles: evidenceUrls,
        evidenceCount: evidenceUrls.length
      }
    });

    res.json({ 
      success: true, 
      data: verificationRequest,
      message: 'Verification request submitted successfully with evidence documentation' 
    });

  } catch (error) {
    console.error('Error creating verification request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit verification request' 
    });
  }
});

// Legacy route for backward compatibility
router.post('/request-verification', requireAuth, async (req, res) => {
  try {
    const { type, title, description, evidence } = req.body;
    const userId = (req.user as any).id;

    if (!type || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credential type and title are required' 
      });
    }

    // Create verification request (placeholder implementation)
    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        id: Date.now(),
        type,
        title,
        description,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating SBT verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification request'
    });
  }
});



enum CredentialType {
  IDENTITY = 'identity',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  DIGITAL = 'digital',
  PROFESSIONAL = 'professional',
  SOCIAL = 'social'
}

const mintCredentialSchema = z.object({
  type: z.nativeEnum(CredentialType),
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  expiresAt: z.string().optional(),
  isMonetizable: z.boolean(),
  pricePerAccess: z.string().optional(),
  maxAccesses: z.string().optional()
});

// Generate zero-knowledge proof for credential
async function generateZKProof(data: Buffer, userCommitment: string): Promise<string> {
  // Create a hash-based commitment for the credential
  const dataHash = crypto.createHash('sha256').update(data).digest('hex');
  const commitment = crypto.createHash('sha256')
    .update(dataHash + userCommitment)
    .digest('hex');
  
  // In production, this would use actual ZK-SNARK proof generation
  return commitment;
}

// Encrypt credential data
async function encryptCredentialData(data: Buffer, userKey: string): Promise<{ encryptedData: Buffer, dataHash: string }> {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(userKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  
  const dataHash = crypto.createHash('sha256').update(data).digest('hex');
  
  return {
    encryptedData: Buffer.concat([iv, encrypted]),
    dataHash
  };
}

// Register new SBT credential
router.post('/register', requireAuth, async (req: any, res) => {
  try {
    const { type, title, description, evidence } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!type || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credential type and title are required' 
      });
    }

    // Create the credential registration
    const credential = await storage.createSBTCredential({
      userId,
      type,
      title,
      description: description || '',
      evidence: evidence || '',
      status: 'pending',
      issuedAt: new Date(),
      expiresAt: null,
      zkProof: null,
      ipfsHash: null,
      encryptedData: null,
      dataHash: null,
      isRevoked: false,
      revokedAt: null,
      accessCount: 0,
      lastAccessedAt: null,
      isMonetizable: false,
      pricePerAccess: null,
      maxAccesses: null
    });

    res.json({
      success: true,
      message: 'SBT credential registered successfully',
      data: credential
    });
  } catch (error) {
    console.error('Error registering SBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register credential'
    });
  }
});

// Update privacy settings for a specific credential
router.patch('/:id/privacy', requireAuth, async (req: any, res) => {
  try {
    const credentialId = parseInt(req.params.id);
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify the credential belongs to the user
    const credential = await storage.getSBTCredential(credentialId);
    if (!credential || credential.userId !== userId) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Update the credential with new privacy settings
    const updatedCredential = await storage.updateSBTCredential(credentialId, updateData);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: updatedCredential
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
});

// Get user's credentials
router.get('/credentials', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const credentials = await storage.getUserSBTCredentials(userId);
    
    res.json({
      success: true,
      credentials: credentials.map(cred => ({
        ...cred,
        issuedAt: new Date(cred.issuedAt),
        expiresAt: cred.expiresAt ? new Date(cred.expiresAt) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// Mint new credential SBT
router.post('/credentials/mint', requireAuth, upload.single('file'), async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const validatedData = mintCredentialSchema.parse(req.body);
    
    // Generate user-specific encryption key
    const userKey = crypto.createHash('sha256')
      .update(userId.toString() + process.env.ENCRYPTION_SALT || 'default-salt')
      .digest('hex');

    // Encrypt credential data
    const { encryptedData, dataHash } = await encryptCredentialData(req.file.buffer, userKey);
    
    // Upload encrypted data to IPFS
    const ipfsResult = await ipfsStorageService.uploadEncryptedData(encryptedData, `credential-${userId}-${Date.now()}.enc`);

    // Generate ZK proof
    const zkpProof = await generateZKProof(req.file.buffer, userId.toString());

    // Create credential record
    const credential = await storage.createSBTCredential({
      userId,
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      evidence: req.file.originalname,
      encryptedDataHash: dataHash,
      zkpProof,
      ipfsHash: ipfsResult.ipfsHash,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      isMonetizable: validatedData.isMonetizable,
      pricePerAccess: validatedData.pricePerAccess ? parseFloat(validatedData.pricePerAccess) : null,
      maxAccesses: validatedData.maxAccesses ? parseInt(validatedData.maxAccesses) : null
    });

    res.json({
      success: true,
      credential: {
        ...credential,
        issuedAt: new Date(credential.issuedAt),
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null
      }
    });
  } catch (error) {
    console.error('Error minting credential:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to mint credential' });
  }
});

// Toggle credential monetization
router.patch('/credentials/:id/monetization', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const credentialId = parseInt(req.params.id);
    const { enable, pricePerAccess, maxAccesses } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify credential ownership
    const credential = await storage.getSBTCredential(credentialId);
    if (!credential || credential.userId !== userId) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Update monetization settings
    await storage.updateSBTCredentialMonetization(credentialId, {
      isMonetizable: enable,
      pricePerAccess: enable ? pricePerAccess : null,
      maxAccesses: enable ? maxAccesses : null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating monetization:', error);
    res.status(500).json({ error: 'Failed to update monetization settings' });
  }
});

// Access monetized credential
router.post('/credentials/:id/access', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const credentialId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const credential = await storage.getSBTCredential(credentialId);
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!credential.isMonetizable) {
      return res.status(400).json({ error: 'Credential is not monetizable' });
    }

    // Check access limits
    if (credential.accessCount >= credential.maxAccesses) {
      return res.status(429).json({ error: 'Access limit reached' });
    }

    // In a real implementation, this would handle payment processing
    // For now, we'll simulate successful payment
    
    // Increment access count
    await storage.incrementCredentialAccess(credentialId);
    
    // Log the access for revenue tracking
    await storage.logCredentialAccess({
      credentialId,
      accessorId: userId,
      paidAmount: credential.pricePerAccess,
      accessedAt: new Date()
    });

    res.json({
      success: true,
      credential: {
        ...credential,
        issuedAt: new Date(credential.issuedAt),
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null
      }
    });
  } catch (error) {
    console.error('Error accessing credential:', error);
    res.status(500).json({ error: 'Failed to access credential' });
  }
});

// Revoke credential
router.post('/credentials/:id/revoke', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const credentialId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify credential ownership
    const credential = await storage.getSBTCredential(credentialId);
    if (!credential || credential.userId !== userId) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Revoke credential
    await storage.revokeSBTCredential(credentialId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking credential:', error);
    res.status(500).json({ error: 'Failed to revoke credential' });
  }
});

// Get credential access analytics
router.get('/credentials/:id/analytics', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const credentialId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify credential ownership
    const credential = await storage.getSBTCredential(credentialId);
    if (!credential || credential.userId !== userId) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const analytics = await storage.getCredentialAnalytics(credentialId);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Grant temporary access to credential
router.post('/credentials/:id/grant-access', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const credentialId = parseInt(req.params.id);
    const { accessorAddress, duration, purpose } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify credential ownership
    const credential = await storage.getSBTCredential(credentialId);
    if (!credential || credential.userId !== userId) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Create access permission
    const permission = await storage.createCredentialPermission({
      credentialId,
      accessorAddress,
      expiresAt: new Date(Date.now() + duration * 1000),
      purpose,
      grantedBy: userId
    });

    res.json({ success: true, permission });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// Test endpoint to create sample credentials for demonstration
router.post('/test/create-sample', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Create sample credentials for testing
    const sampleCredentials = [
      {
        type: 'identity',
        title: 'Driver\'s License',
        description: 'Valid driver\'s license with personal identification',
        issuer: 'Department of Motor Vehicles',
        isMonetizable: false
      },
      {
        type: 'professional',
        title: 'Software Developer Certificate',
        description: 'Certified full-stack developer with 5+ years experience',
        issuer: 'Tech Certification Board',
        isMonetizable: true,
        pricePerAccess: 0.01
      },
      {
        type: 'financial',
        title: 'Credit Score Verification',
        description: 'Current credit score and financial standing',
        issuer: 'Credit Bureau',
        isMonetizable: true,
        pricePerAccess: 0.005
      }
    ];

    const createdCredentials = [];

    for (const credData of sampleCredentials) {
      // Generate mock IPFS hash and encrypted data hash
      const mockData = JSON.stringify({
        type: credData.type,
        title: credData.title,
        timestamp: Date.now(),
        userId: userId
      });
      
      const encryptedDataHash = crypto.createHash('sha256').update(mockData).digest('hex');
      const ipfsHash = `Qm${crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 44)}`;
      
      // Generate a mock ZKP proof for testing
      const mockZkpProof = {
        proof: crypto.randomBytes(32).toString('hex'),
        publicInputs: [userId.toString(), credData.type, Date.now().toString()],
        verificationKey: crypto.randomBytes(16).toString('hex')
      };

      const credential = await storage.createSBTCredential({
        userId,
        type: credData.type as any,
        title: credData.title,
        description: credData.description,
        encryptedDataHash,
        ipfsHash,
        issuer: credData.issuer,
        isMonetizable: credData.isMonetizable,
        pricePerAccess: credData.pricePerAccess || null,
        maxAccesses: null,
        contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        chainId: 1,
        zkpProof: JSON.stringify(mockZkpProof)
      });

      createdCredentials.push(credential);
    }

    res.json({
      success: true,
      message: `Created ${createdCredentials.length} sample credentials`,
      credentials: createdCredentials
    });
  } catch (error) {
    console.error('Error creating sample credentials:', error);
    res.status(500).json({ error: 'Failed to create sample credentials' });
  }
});

export default router;