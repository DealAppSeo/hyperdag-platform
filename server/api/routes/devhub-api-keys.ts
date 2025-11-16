import express from 'express';
import crypto from 'crypto';
import { storage } from '../../storage';
import { z } from 'zod';

const router = express.Router();

// Schema for creating API key
const createApiKeySchema = z.object({
  keyName: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(['read']),
});

// List all API keys for current user
router.get('/keys', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const userId = req.user.id;
    const keys = await storage.getApiKeysByUserId(userId);
    
    // Hide the full API key secret, only show first 8 chars
    const sanitizedKeys = keys.map(key => ({
      id: key.id,
      keyName: key.keyName,
      keyPreview: `${key.apiKey.substring(0, 12)}...`,
      permissions: key.permissions,
      isActive: key.isActive,
      usageCount: key.usageCount,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
    }));

    res.json({ success: true, keys: sanitizedKeys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
  }
});

// Create a new API key
router.post('/keys', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const validatedData = createApiKeySchema.parse(req.body);
    const userId = req.user.id;

    // Generate a secure API key
    const apiKey = `hdag_${crypto.randomBytes(32).toString('hex')}`;

    // Create the API key
    const newKey = await storage.createApiKey({
      userId: userId.toString(),
      keyName: validatedData.keyName,
      apiKey,
      permissions: validatedData.permissions,
      isActive: true,
      usageCount: 0,
    });

    // Return the full key only on creation (user must save it)
    res.status(201).json({
      success: true,
      message: 'API key created successfully. Save it now - you won\'t see it again!',
      key: {
        id: newKey.id,
        keyName: newKey.keyName,
        apiKey: apiKey, // Full key shown only once
        permissions: newKey.permissions,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Error creating API key:', error);
    res.status(500).json({ success: false, message: 'Failed to create API key' });
  }
});

// Delete an API key
router.delete('/keys/:keyId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const keyId = parseInt(req.params.keyId);
    const userId = req.user.id;

    // Verify the key belongs to the user
    const keys = await storage.getApiKeysByUserId(userId);
    const keyToDelete = keys.find(k => k.id === keyId);

    if (!keyToDelete) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    await storage.deleteApiKey(keyId);

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ success: false, message: 'Failed to delete API key' });
  }
});

export default router;
