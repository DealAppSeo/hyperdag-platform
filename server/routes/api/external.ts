import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for external API access
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each API key to 100 requests per windowMs
  message: {
    error: 'Too many requests from this API key',
    retryAfter: '15 minutes'
  },
  keyGenerator: (req) => req.headers['x-api-key'] as string || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// API Key validation middleware
async function validateApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Include X-API-Key header with your request'
    });
  }

  try {
    // Check if API key exists and is active
    const keyRecord = await storage.getApiKey(apiKey);
    if (!keyRecord || !keyRecord.isActive) {
      return res.status(401).json({
        error: 'Invalid or inactive API key'
      });
    }

    // Update last used timestamp
    await storage.updateApiKeyUsage(apiKey);
    
    req.apiKey = keyRecord;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply rate limiting and API key validation to all routes
router.use(apiRateLimit);
router.use(validateApiKey);

// Get user's reputation summary
router.get('/reputation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeDetails } = req.query;

    // Get user's reputation credentials
    const credentials = await storage.getUserSBTCredentials(userId);
    const reputationCreds = credentials.filter(cred => 
      cred.type === 'professional' || cred.type === 'identity'
    );

    // Calculate reputation score
    const reputationScore = reputationCreds.reduce((score, cred) => {
      let credValue = 10; // Base value
      if (cred.isMonetizable && cred.accessCount > 0) credValue += 5;
      if (!cred.isRevoked) credValue += 5;
      return score + credValue;
    }, 0);

    const response: any = {
      userId,
      reputationScore,
      credentialCount: reputationCreds.length,
      verifiedCredentials: reputationCreds.filter(c => !c.isRevoked).length,
      lastUpdated: new Date().toISOString()
    };

    if (includeDetails === 'true') {
      response.credentials = reputationCreds.map(cred => ({
        id: cred.id,
        type: cred.type,
        title: cred.title,
        issuer: cred.issuer,
        issuedAt: cred.issuedAt,
        isRevoked: cred.isRevoked,
        contractAddress: cred.contractAddress,
        chainId: cred.chainId
      }));
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reputation data',
      success: false 
    });
  }
});

// Verify specific credential
router.get('/credential/:credentialId/verify', async (req, res) => {
  try {
    const { credentialId } = req.params;
    
    const credential = await storage.getSBTCredential(parseInt(credentialId));
    if (!credential) {
      return res.status(404).json({
        error: 'Credential not found',
        success: false
      });
    }

    // Increment access count if credential is monetizable
    if (credential.isMonetizable) {
      await storage.incrementCredentialAccess(credential.id);
    }

    res.json({
      success: true,
      data: {
        id: credential.id,
        isValid: !credential.isRevoked,
        type: credential.type,
        title: credential.title,
        issuer: credential.issuer,
        issuedAt: credential.issuedAt,
        expiresAt: credential.expiresAt,
        contractAddress: credential.contractAddress,
        chainId: credential.chainId,
        verificationHash: crypto
          .createHash('sha256')
          .update(`${credential.id}-${credential.encryptedDataHash}-${Date.now()}`)
          .digest('hex')
      }
    });

  } catch (error) {
    console.error('Error verifying credential:', error);
    res.status(500).json({ 
      error: 'Failed to verify credential',
      success: false 
    });
  }
});

// Batch reputation check for multiple users
router.post('/reputation/batch', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'userIds array is required',
        success: false
      });
    }

    if (userIds.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 users per batch request',
        success: false
      });
    }

    const results = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const credentials = await storage.getUserSBTCredentials(userId);
          const reputationCreds = credentials.filter(cred => 
            cred.type === 'professional' || cred.type === 'identity'
          );

          const reputationScore = reputationCreds.reduce((score, cred) => {
            let credValue = 10;
            if (cred.isMonetizable && cred.accessCount > 0) credValue += 5;
            if (!cred.isRevoked) credValue += 5;
            return score + credValue;
          }, 0);

          return {
            userId,
            reputationScore,
            credentialCount: reputationCreds.length,
            verifiedCredentials: reputationCreds.filter(c => !c.isRevoked).length
          };
        } catch (error) {
          return {
            userId,
            error: 'Failed to fetch user data'
          };
        }
      })
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error in batch reputation check:', error);
    res.status(500).json({ 
      error: 'Failed to process batch request',
      success: false 
    });
  }
});

// Get API usage statistics
router.get('/stats', async (req, res) => {
  try {
    const apiKey = req.apiKey;
    const stats = await storage.getApiKeyStats(apiKey.key);

    res.json({
      success: true,
      data: {
        apiKey: apiKey.key.substring(0, 8) + '...',
        totalRequests: stats.totalRequests,
        requestsToday: stats.requestsToday,
        lastUsed: stats.lastUsed,
        rateLimit: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 100
        }
      }
    });

  } catch (error) {
    console.error('Error fetching API stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      success: false 
    });
  }
});

// Search credentials by type or issuer
router.get('/credentials/search', async (req, res) => {
  try {
    const { type, issuer, userId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'userId parameter is required',
        success: false
      });
    }

    const credentials = await storage.searchSBTCredentials({
      userId: userId as string,
      type: type as string,
      issuer: issuer as string,
      limit: Math.min(parseInt(limit as string), 50)
    });

    res.json({
      success: true,
      data: credentials.map(cred => ({
        id: cred.id,
        type: cred.type,
        title: cred.title,
        issuer: cred.issuer,
        issuedAt: cred.issuedAt,
        isRevoked: cred.isRevoked,
        isMonetizable: cred.isMonetizable,
        accessCount: cred.accessCount
      }))
    });

  } catch (error) {
    console.error('Error searching credentials:', error);
    res.status(500).json({ 
      error: 'Failed to search credentials',
      success: false 
    });
  }
});

export default router;