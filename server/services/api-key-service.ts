/**
 * API Key Service
 * 
 * This service manages API keys for integration partners like Bolt
 */

import { db } from "../db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// Mock API key store for development
const apiKeys = new Map();

class ApiKeyService {
  /**
   * Verify an API key
   */
  async verifyApiKey(apiKey: string, source: string): Promise<boolean> {
    try {
      console.log(`[INFO][[api-key-service] Verifying API key for ${source}`);
      
      // For development and testing, accept 'bolt-test-key' as a valid key
      if (apiKey === 'bolt-test-key' && source === 'bolt') {
        return true;
      }
      
      // Check if the key exists in our mock store
      if (apiKeys.has(apiKey)) {
        const keyData = apiKeys.get(apiKey);
        
        // Verify that the key belongs to the correct source
        if (keyData.source === source) {
          return true;
        }
      }
      
      // In production, we would check the database
      // For demo, always return true for 'bolt' source to enable testing
      if (source === 'bolt') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[ERROR][[api-key-service] Error verifying API key:', error);
      return false;
    }
  }

  /**
   * Generate a new API key
   */
  async generateApiKey(userId: number, source: string, name: string, permissions: string[] = []): Promise<string> {
    try {
      console.log(`[INFO][[api-key-service] Generating API key for ${source}`);
      
      // Generate a secure random API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      
      // Store key data
      const keyData = {
        userId,
        source,
        name,
        permissions,
        createdAt: new Date().toISOString()
      };
      
      // Store in our mock store
      apiKeys.set(apiKey, keyData);
      
      return apiKey;
    } catch (error) {
      console.error('[ERROR][[api-key-service] Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Get all API keys for a user
   */
  async getApiKeysForUser(userId: number): Promise<any[]> {
    try {
      // For demo purposes, return the keys from our mock store
      const userKeys = [];
      
      for (const [key, data] of apiKeys.entries()) {
        if (data.userId === userId) {
          userKeys.push({
            key: key.substring(0, 8) + '...',
            name: data.name,
            source: data.source,
            permissions: data.permissions,
            createdAt: data.createdAt
          });
        }
      }
      
      return userKeys;
    } catch (error) {
      console.error('[ERROR][[api-key-service] Error getting API keys:', error);
      return [];
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKey: string): Promise<boolean> {
    try {
      // Remove from our mock store
      return apiKeys.delete(apiKey);
    } catch (error) {
      console.error('[ERROR][[api-key-service] Error revoking API key:', error);
      return false;
    }
  }
}

export const apiKeyService = new ApiKeyService();
export default apiKeyService;