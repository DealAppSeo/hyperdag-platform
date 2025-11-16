/**
 * PurposeHub.AI API Key Service
 * 
 * Dedicated API key management for external PurposeHub.AI integration
 * Handles RepID API access with purpose-focused scopes
 */

import { randomBytes, createHash } from 'crypto';
import { db } from '../../db';
import { developerApiKeys } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const API_KEY_PREFIX = 'purposehub';

export interface ApiKeyData {
  key: string;
  appName: string;
  permissions: string[];
  createdAt: Date;
}

/**
 * Generate API key for PurposeHub.AI
 */
export async function generatePurposeHubApiKey(): Promise<ApiKeyData> {
  try {
    // Generate cryptographically secure random key
    const randomKey = randomBytes(32).toString('hex');
    const apiKey = `${API_KEY_PREFIX}_live_${randomKey}`;
    
    // Hash for secure storage
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    // PurposeHub-specific permissions
    const permissions = [
      'repid:create',
      'repid:update', 
      'repid:verify',
      'repid:read',
      'repid:batch',
      'purpose:discovery',
      'faith_tech:contribution'
    ];
    
    // Store in database
    await db.insert(developerApiKeys).values({
      userId: 'purposehub-ai-app',
      keyName: 'PurposeHub.AI RepID Integration',
      apiKey: hashedKey,
      permissions: permissions,
      isActive: true,
      usageCount: 0,
      createdAt: new Date(),
      lastUsed: null,
      expiresAt: null // No expiration for production key
    });
    
    console.log('[PurposeHub API] API key generated successfully');
    
    return {
      key: apiKey,
      appName: 'PurposeHub.AI',
      permissions,
      createdAt: new Date()
    };
  } catch (error: any) {
    console.error('[PurposeHub API] Key generation failed:', error);
    throw new Error('Failed to generate PurposeHub API key');
  }
}

/**
 * Validate PurposeHub API key
 */
export async function validatePurposeHubApiKey(
  apiKey: string,
  requiredPermission?: string
): Promise<boolean> {
  try {
    if (!apiKey || !apiKey.startsWith(`${API_KEY_PREFIX}_`)) {
      return false;
    }
    
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    const [keyData] = await db
      .select()
      .from(developerApiKeys)
      .where(and(
        eq(developerApiKeys.apiKey, hashedKey),
        eq(developerApiKeys.isActive, true)
      ));
    
    if (!keyData) {
      return false;
    }
    
    // Check permission if required
    if (requiredPermission && !keyData.permissions.includes(requiredPermission)) {
      console.warn(`[PurposeHub API] Missing permission: ${requiredPermission}`);
      return false;
    }
    
    // Update usage stats (async, don't wait)
    db.update(developerApiKeys)
      .set({ 
        lastUsed: new Date(),
        usageCount: keyData.usageCount + 1
      })
      .where(eq(developerApiKeys.id, keyData.id))
      .catch(err => console.error('[PurposeHub API] Usage update failed:', err));
    
    return true;
  } catch (error: any) {
    console.error('[PurposeHub API] Validation failed:', error);
    return false;
  }
}

/**
 * Get API key statistics
 */
export async function getPurposeHubKeyStats(): Promise<any> {
  try {
    const [stats] = await db
      .select()
      .from(developerApiKeys)
      .where(eq(developerApiKeys.userId, 'purposehub-ai-app'));
    
    return stats || null;
  } catch (error: any) {
    console.error('[PurposeHub API] Stats retrieval failed:', error);
    return null;
  }
}
