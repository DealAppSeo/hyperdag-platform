/**
 * PurposeHub.AI Static API Key Configuration
 * 
 * Generated API key for PurposeHub.AI integration
 * Store this securely in environment variables for production use
 */

import { randomBytes, createHash } from 'crypto';

// Generate a secure API key for PurposeHub.AI
const generateSecureKey = () => {
  const randomKey = randomBytes(32).toString('hex');
  return `purposehub_live_${randomKey}`;
};

// PRODUCTION: Get from environment variable
// DEVELOPMENT: Use pre-generated key for testing
export const PURPOSEHUB_API_KEY = process.env.PURPOSEHUB_API_KEY || 
  'purposehub_live_test_7f3e2a1b8c9d4e5f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f';

// Hash the key for validation (we store hash, not actual key)
export const PURPOSEHUB_API_KEY_HASH = createHash('sha256')
  .update(PURPOSEHUB_API_KEY)
  .digest('hex');

/**
 * Validate PurposeHub API key
 */
export function validatePurposeHubKey(providedKey: string): boolean {
  const providedHash = createHash('sha256').update(providedKey).digest('hex');
  return providedHash === PURPOSEHUB_API_KEY_HASH;
}

/**
 * Generate a new API key (for admin use only)
 */
export function generateNewPurposeHubKey(): string {
  const newKey = generateSecureKey();
  console.log('\n🔑 New PurposeHub.AI API Key Generated:');
  console.log('━'.repeat(80));
  console.log(`\n${newKey}\n`);
  console.log('⚠️  SAVE THIS KEY SECURELY - You will not see it again!');
  console.log('\n📝 Add to environment variables:');
  console.log(`PURPOSEHUB_API_KEY=${newKey}`);
  console.log('\n━'.repeat(80));
  return newKey;
}

// Export for documentation
export const PURPOSEHUB_INTEGRATION_INFO = {
  appName: 'PurposeHub.AI',
  apiKeyPrefix: 'purposehub_live_',
  permissions: [
    'repid:create',
    'repid:update',
    'repid:verify',
    'repid:read',
    'repid:batch',
    'purpose:discovery',
    'faith_tech:contribution'
  ],
  allowedOrigins: [
    'https://purposehub.ai',
    'https://*.lovable.app',
    'https://*.lovableproject.com',
    'http://localhost:*'
  ],
  rateLimits: {
    create: '5/minute',
    update: '100/hour',
    verify: '100/minute',
    batch: '10/hour'
  }
};
