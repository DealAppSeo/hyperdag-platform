/**
 * API Key Service
 * 
 * Handles generation, validation, and management of API keys
 * for third-party developers integrating with HyperDAG's API.
 */

import { randomBytes, createHash } from 'crypto';
import { db } from '../../db';
import { apiKeys } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const API_KEY_PREFIX = 'hdag';

/**
 * Generate a new API key for a user
 * 
 * @param userId The user's ID
 * @param name Optional name for the API key
 * @param scopes Optional array of permission scopes
 * @returns The generated API key
 */
export async function generateApiKey(
  userId: number, 
  name: string = 'Default API Key',
  scopes: string[] = ['zkp:verify', 'reputation:read']
): Promise<string> {
  try {
    // Generate random bytes and convert to hex string
    const randomKey = randomBytes(24).toString('hex');
    
    // Create API key with prefix
    const apiKey = `${API_KEY_PREFIX}_${randomKey}`;
    
    // Hash the API key for storage
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    // Store in database
    await db.insert(apiKeys).values({
      name,
      key: hashedKey,
      userId: userId,
      scopes: scopes,
      active: true,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0
    });
    
    logger.info(`API key generated for user ${userId}`);
    
    // Return the unhashed key to the user (they won't see it again)
    return apiKey;
  } catch (error) {
    logger.error('Error generating API key:', error);
    throw new Error('Failed to generate API key');
  }
}

/**
 * Validate an API key
 * 
 * @param apiKey The API key to validate
 * @param requiredScope Optional scope required for the operation
 * @returns User ID associated with the key if valid, null otherwise
 */
export async function validateApiKey(
  apiKey: string,
  requiredScope?: string
): Promise<number | null> {
  try {
    if (!apiKey || !apiKey.startsWith(`${API_KEY_PREFIX}_`)) {
      return null;
    }
    
    // Hash the API key for comparison
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    // Find the key in database
    const [keyData] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.key, hashedKey),
        eq(apiKeys.active, true)
      ));
    
    if (!keyData) {
      return null;
    }
    
    // Check scope if required
    if (requiredScope && !keyData.scopes.includes(requiredScope)) {
      logger.warn(`API key missing required scope: ${requiredScope}`);
      return null;
    }
    
    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, keyData.id));
    
    return keyData.userId;
  } catch (error) {
    logger.error('Error validating API key:', error);
    return null;
  }
}

/**
 * List all API keys for a user
 * 
 * @param userId The user's ID
 * @returns Array of API key data (without the actual keys)
 */
export async function listApiKeys(userId: number): Promise<any[]> {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        createdAt: apiKeys.createdAt,
        lastUsed: apiKeys.lastUsed,
        active: apiKeys.active
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));
    
    return keys;
  } catch (error) {
    logger.error('Error listing API keys:', error);
    return [];
  }
}

/**
 * Revoke an API key
 * 
 * @param keyId The API key ID
 * @param userId The user's ID (for authorization)
 * @returns True if successful, false otherwise
 */
export async function revokeApiKey(keyId: number, userId: number): Promise<boolean> {
  try {
    // Verify the key belongs to this user
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId)
      ));
    
    if (!key) {
      return false;
    }
    
    // Deactivate the key
    await db
      .update(apiKeys)
      .set({ active: false })
      .where(eq(apiKeys.id, keyId));
    
    return true;
  } catch (error) {
    logger.error('Error revoking API key:', error);
    return false;
  }
}