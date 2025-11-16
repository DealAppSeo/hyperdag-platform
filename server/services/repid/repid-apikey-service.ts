/**
 * RepID User API Key Service
 * 
 * Generates and manages dynamic API keys tied to user RepID for accountability
 * Rate limits scale with RepID scores
 */

import { db } from '../../db';
import { repidUserApiKeys, repidAggregatedScores, users } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export interface ApiKeyGenerationRequest {
  userId: number;
  walletAddress: string;
  keyName: string;
  permissions?: {
    repid?: string[];
    ratings?: string[];
    dao?: string[];
    zkp?: string[];
  };
  expiresInDays?: number; // null = no expiration
}

export interface ApiKeyCredentials {
  apiKey: string; // Public identifier
  apiSecret: string; // Secret - ONLY RETURNED ONCE!
  keyId: string;
  rateLimitTier: string;
  effectiveRateLimit: number; // Base * RepID multiplier
  permissions: any;
}

export class RepIDApiKeyService {
  private readonly DEFAULT_PERMISSIONS = {
    repid: ['read'],
    ratings: ['submit', 'view'],
    dao: [],
    zkp: []
  };
  
  /**
   * Generate a new API key for a user tied to their RepID
   */
  async generateUserApiKey(request: ApiKeyGenerationRequest): Promise<{
    success: boolean;
    credentials?: ApiKeyCredentials;
    error?: string;
  }> {
    try {
      // Get user's current RepID
      const repID = await this.getUserRepID(request.userId, request.walletAddress);
      
      // Determine rate limit tier based on RepID
      const tier = this.calculateRateLimitTier(repID);
      
      // Generate API key and secret
      const apiKey = this.generateApiKey(request.userId);
      const apiSecret = this.generateApiSecret();
      const apiSecretHash = this.hashSecret(apiSecret);
      
      // Calculate RepID multiplier (RepID/100 = multiplier)
      const repidMultiplier = Math.max(1.0, repID / 100);
      
      // Set base rate limit based on tier
      const baseRateLimit = this.getBaseRateLimit(tier);
      
      // Merge with default permissions
      const permissions = {
        repid: request.permissions?.repid || this.DEFAULT_PERMISSIONS.repid,
        ratings: request.permissions?.ratings || this.DEFAULT_PERMISSIONS.ratings,
        dao: request.permissions?.dao || this.DEFAULT_PERMISSIONS.dao,
        zkp: request.permissions?.zkp || this.DEFAULT_PERMISSIONS.zkp,
      };
      
      // Calculate expiration
      const expiresAt = request.expiresInDays 
        ? new Date(Date.now() + request.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      
      // Insert into database
      const [key] = await db.insert(repidUserApiKeys).values({
        userId: request.userId,
        walletAddress: request.walletAddress,
        apiKey,
        apiSecretHash,
        keyName: request.keyName,
        currentRepID: repID.toFixed(3),
        rateLimitTier: tier,
        baseRateLimit,
        repidMultiplier: repidMultiplier.toFixed(2),
        permissions,
        expiresAt,
      }).returning();
      
      // Return credentials (apiSecret is only shown once!)
      return {
        success: true,
        credentials: {
          apiKey,
          apiSecret, // IMPORTANT: Never stored in DB, only returned once
          keyId: key.keyId,
          rateLimitTier: tier,
          effectiveRateLimit: Math.floor(baseRateLimit * repidMultiplier),
          permissions,
        }
      };
    } catch (error: any) {
      console.error('[RepIDApiKey] Generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validate API key and secret
   */
  async validateApiKey(apiKey: string, apiSecret: string): Promise<{
    valid: boolean;
    keyData?: any;
    error?: string;
  }> {
    try {
      // Find key in database
      const [key] = await db.select().from(repidUserApiKeys)
        .where(eq(repidUserApiKeys.apiKey, apiKey))
        .limit(1);
      
      if (!key) {
        return { valid: false, error: 'API key not found' };
      }
      
      // Check if active
      if (!key.isActive) {
        return { valid: false, error: 'API key is inactive' };
      }
      
      // Check if suspended
      if (key.suspendedUntil && new Date(key.suspendedUntil) > new Date()) {
        return { 
          valid: false, 
          error: `API key suspended until ${key.suspendedUntil}` 
        };
      }
      
      // Check expiration
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        return { valid: false, error: 'API key expired' };
      }
      
      // Verify secret hash
      const secretHash = this.hashSecret(apiSecret);
      if (secretHash !== key.apiSecretHash) {
        // Increment abuse flag
        await db.update(repidUserApiKeys)
          .set({ abuseFlagCount: key.abuseFlagCount + 1 })
          .where(eq(repidUserApiKeys.id, key.id));
        
        return { valid: false, error: 'Invalid API secret' };
      }
      
      // Update last used timestamp
      await db.update(repidUserApiKeys)
        .set({ 
          lastUsed: new Date(),
          totalRequests: key.totalRequests + 1
        })
        .where(eq(repidUserApiKeys.id, key.id));
      
      return {
        valid: true,
        keyData: key
      };
    } catch (error: any) {
      console.error('[RepIDApiKey] Validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update API key's RepID and recalculate rate limits
   */
  async updateRepIDForKey(userId: number): Promise<void> {
    try {
      // Get user's current RepID
      const repID = await this.getUserRepID(userId);
      
      // Recalculate tier and multiplier
      const tier = this.calculateRateLimitTier(repID);
      const repidMultiplier = Math.max(1.0, repID / 100);
      const baseRateLimit = this.getBaseRateLimit(tier);
      
      // Update all active keys for this user
      await db.update(repidUserApiKeys)
        .set({
          currentRepID: repID.toFixed(3),
          rateLimitTier: tier,
          baseRateLimit,
          repidMultiplier: repidMultiplier.toFixed(2),
          updatedAt: new Date(),
        })
        .where(and(
          eq(repidUserApiKeys.userId, userId),
          eq(repidUserApiKeys.isActive, true)
        ));
      
      console.log(`[RepIDApiKey] Updated RepID for user ${userId}: ${repID} (tier: ${tier})`);
    } catch (error: any) {
      console.error('[RepIDApiKey] RepID update failed:', error);
    }
  }
  
  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKey: string, reason: string): Promise<boolean> {
    try {
      await db.update(repidUserApiKeys)
        .set({
          isActive: false,
          revocationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(repidUserApiKeys.apiKey, apiKey));
      
      return true;
    } catch (error: any) {
      console.error('[RepIDApiKey] Revocation failed:', error);
      return false;
    }
  }
  
  /**
   * Get effective rate limit for a key
   */
  async getEffectiveRateLimit(apiKey: string): Promise<number> {
    const [key] = await db.select().from(repidUserApiKeys)
      .where(eq(repidUserApiKeys.apiKey, apiKey))
      .limit(1);
    
    if (!key) return 0;
    
    const multiplier = parseFloat(key.repidMultiplier);
    return Math.floor(key.baseRateLimit * multiplier);
  }
  
  /**
   * Calculate rate limit tier based on RepID
   */
  private calculateRateLimitTier(repID: number): string {
    if (repID >= 200) return 'unlimited'; // High reputation
    if (repID >= 100) return 'premium'; // Good reputation
    if (repID >= 50) return 'standard'; // Moderate reputation
    return 'basic'; // New/low reputation
  }
  
  /**
   * Get base rate limit for tier
   */
  private getBaseRateLimit(tier: string): number {
    const limits = {
      basic: 100, // 100 req/hour
      standard: 250, // 250 req/hour
      premium: 500, // 500 req/hour
      unlimited: 1000 // 1000 req/hour (still limited for safety)
    };
    return limits[tier as keyof typeof limits] || 100;
  }
  
  /**
   * Get user's current RepID
   */
  private async getUserRepID(userId: number, walletAddress?: string): Promise<number> {
    // Try to get from aggregated scores first
    const [aggregated] = await db.select().from(repidAggregatedScores)
      .where(and(
        eq(repidAggregatedScores.entityType, 'user'),
        eq(repidAggregatedScores.entityId, userId)
      )).limit(1);
    
    if (aggregated) {
      return parseFloat(aggregated.compositeRepID);
    }
    
    // Fallback: Return neutral baseline for new users
    return 50.0; // Neutral RepID
  }
  
  /**
   * Generate unique API key
   */
  private generateApiKey(userId: number): string {
    const randomPart = randomBytes(16).toString('hex');
    return `purposehub_user_${userId}_${randomPart}`;
  }
  
  /**
   * Generate secure API secret
   */
  private generateApiSecret(): string {
    return randomBytes(32).toString('hex');
  }
  
  /**
   * Hash API secret for storage
   */
  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}

export const repidApiKeyService = new RepIDApiKeyService();
