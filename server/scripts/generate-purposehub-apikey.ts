/**
 * Generate API Key for PurposeHub.AI Integration
 * 
 * Run with: tsx server/scripts/generate-purposehub-apikey.ts
 */

import { generatePurposeHubApiKey, getPurposeHubKeyStats } from '../services/api/purposehub-api-key-service';

async function main() {
  console.log('');
  console.log('🔑 Generating PurposeHub.AI API Key...');
  console.log('━'.repeat(60));
  
  try {
    // Check if key already exists
    const existingStats = await getPurposeHubKeyStats();
    
    if (existingStats) {
      console.log('⚠️  API key already exists for PurposeHub.AI');
      console.log('');
      console.log('📊 Existing Key Stats:');
      console.log(`   Name: ${existingStats.keyName}`);
      console.log(`   Created: ${existingStats.createdAt}`);
      console.log(`   Status: ${existingStats.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Usage Count: ${existingStats.usageCount}`);
      console.log(`   Last Used: ${existingStats.lastUsed || 'Never'}`);
      console.log('');
      console.log('⚠️  To regenerate, manually delete the existing key from database first.');
      console.log('');
      process.exit(0);
    }
    
    // Generate new key
    const keyData = await generatePurposeHubApiKey();
    
    console.log('✅ API Key Generated Successfully!');
    console.log('');
    console.log('📋 Integration Details:');
    console.log('━'.repeat(60));
    console.log('');
    console.log('🔐 API Key (SAVE THIS - You won\'t see it again):');
    console.log(`   ${keyData.key}`);
    console.log('');
    console.log('📱 Application:');
    console.log(`   ${keyData.appName}`);
    console.log('');
    console.log('🔒 Permissions:');
    keyData.permissions.forEach(perm => {
      console.log(`   ✓ ${perm}`);
    });
    console.log('');
    console.log('🌐 Usage Instructions:');
    console.log('━'.repeat(60));
    console.log('');
    console.log('1. Add to PurposeHub.AI application environment variables:');
    console.log('   HYPERDAG_REPID_API_KEY=' + keyData.key);
    console.log('');
    console.log('2. Include in API requests:');
    console.log('   Authorization: Bearer ' + keyData.key);
    console.log('   OR');
    console.log('   X-API-Key: ' + keyData.key);
    console.log('');
    console.log('3. API Base URL:');
    console.log('   https://your-hyperdag-domain.replit.app/api/web3-ai/repid');
    console.log('');
    console.log('4. View Documentation:');
    console.log('   GET /api/web3-ai/repid/docs');
    console.log('');
    console.log('📊 Rate Limits:');
    console.log('   - Create RepID: 5/minute');
    console.log('   - Update RepID: 100/hour');
    console.log('   - Verify RepID: 100/minute');
    console.log('   - Batch Operations: 10/hour');
    console.log('');
    console.log('💾 Key has been saved to database and is ready to use!');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Failed to generate API key:', error.message);
    process.exit(1);
  }
}

main();
