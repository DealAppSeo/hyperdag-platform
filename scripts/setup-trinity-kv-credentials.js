#!/usr/bin/env node

/**
 * Trinity Symphony Cloudflare KV Credentials Setup
 * 
 * This script helps you set up the required Cloudflare KV credentials
 * for Trinity Symphony cross-manager synchronization.
 * 
 * Usage:
 *   node setup-trinity-kv-credentials.js
 */

import { createInterface } from 'readline';
import { execSync } from 'child_process';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Check if running in Replit environment
 */
function isReplit() {
  try {
    const envCheck = execSync('echo $REPL_ID', { encoding: 'utf8' }).trim();
    return !!envCheck;
  } catch (error) {
    return false;
  }
}

/**
 * Set Replit secret
 */
function setReplitSecret(key, value) {
  try {
    execSync(`replit secrets set ${key} '${value}'`, { encoding: 'utf8' });
    console.log(`✅ Set Replit secret: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set Replit secret ${key}:`, error.message);
    return false;
  }
}

/**
 * Validate Account ID format
 */
function validateAccountId(accountId) {
  // Cloudflare Account IDs are typically 32-character hex strings
  return /^[a-f0-9]{32}$/.test(accountId);
}

/**
 * Validate Namespace ID format  
 */
function validateNamespaceId(namespaceId) {
  // KV Namespace IDs are typically 32-character hex strings
  return /^[a-f0-9]{32}$/.test(namespaceId);
}

/**
 * Validate API Token format
 */
function validateApiToken(apiToken) {
  // Cloudflare API tokens start with specific prefixes and have specific lengths
  return apiToken.length >= 40 && (
    apiToken.startsWith('_') || 
    /^[A-Za-z0-9_-]{40,}$/.test(apiToken)
  );
}

/**
 * Test KV connection
 */
async function testKVConnection(accountId, apiToken, namespaceId) {
  console.log('\n🔍 Testing KV connection...');
  
  try {
    const testUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=1`;
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      console.log('✅ KV connection test successful!');
      return true;
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ KV connection test failed: ${testResponse.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ KV connection test error: ${error.message}`);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupCredentials() {
  console.log('🎼 TRINITY SYMPHONY CLOUDFLARE KV CREDENTIALS SETUP');
  console.log('=' * 60);
  console.log();
  
  console.log('This script will help you configure Trinity Symphony with Cloudflare KV');
  console.log('for cross-manager verification synchronization.\n');
  
  console.log('📋 REQUIRED INFORMATION:');
  console.log('1. Cloudflare Account ID (32-character hex string)');
  console.log('2. KV Namespace ID (32-character hex string)');  
  console.log('3. API Token (with Workers KV Storage → Edit permission)\n');
  
  // Step 1: Get Account ID
  console.log('🔍 STEP 1: CLOUDFLARE ACCOUNT ID');
  console.log('   Location: Cloudflare Dashboard → Right sidebar');
  console.log('   Format: 32-character hexadecimal string');
  console.log('   Example: a1b2c3d4e5f6789012345678901234ab\n');
  
  let accountId;
  while (true) {
    accountId = await question('Enter your Cloudflare Account ID: ');
    
    if (!accountId) {
      console.log('❌ Account ID is required');
      continue;
    }
    
    if (!validateAccountId(accountId)) {
      console.log('❌ Invalid Account ID format. Should be 32-character hex string.');
      continue;
    }
    
    console.log('✅ Account ID format is valid\n');
    break;
  }
  
  // Step 2: Get Namespace ID
  console.log('🗃️  STEP 2: KV NAMESPACE ID');
  console.log('   Location: Cloudflare Dashboard → Workers & Pages → KV');
  console.log('   Action: Click on "trinity_symphony" namespace');
  console.log('   Look for: "Namespace ID" in the overview\n');
  
  let namespaceId;
  while (true) {
    namespaceId = await question('Enter your KV Namespace ID: ');
    
    if (!namespaceId) {
      console.log('❌ Namespace ID is required');
      continue;
    }
    
    if (!validateNamespaceId(namespaceId)) {
      console.log('❌ Invalid Namespace ID format. Should be 32-character hex string.');
      continue;
    }
    
    console.log('✅ Namespace ID format is valid\n');
    break;
  }
  
  // Step 3: Get API Token
  console.log('🔑 STEP 3: CLOUDFLARE API TOKEN');
  console.log('   Location: Cloudflare Dashboard → My Profile → API Tokens');
  console.log('   Action: Create Token → Custom token');
  console.log('   Required Permission: Workers KV Storage → Edit');
  console.log('   Account Resources: Include → Your account');
  console.log('   Zone Resources: All zones (or specific domain)\n');
  
  let apiToken;
  while (true) {
    apiToken = await question('Enter your Cloudflare API Token: ');
    
    if (!apiToken) {
      console.log('❌ API Token is required');
      continue;
    }
    
    if (!validateApiToken(apiToken)) {
      console.log('❌ Invalid API Token format. Tokens should be 40+ characters.');
      continue;
    }
    
    console.log('✅ API Token format appears valid\n');
    break;
  }
  
  // Step 4: Test connection
  const connectionSuccess = await testKVConnection(accountId, apiToken, namespaceId);
  
  if (!connectionSuccess) {
    console.log('\n❌ Connection test failed. Please check your credentials and try again.');
    console.log('\nCommon issues:');
    console.log('   • API token permissions insufficient (need Workers KV Storage → Edit)');
    console.log('   • Account ID or Namespace ID incorrect');  
    console.log('   • Token not associated with the correct account');
    rl.close();
    return;
  }
  
  // Step 5: Save credentials
  console.log('\n💾 SAVING CREDENTIALS...');
  
  const isReplitEnv = isReplit();
  
  if (isReplitEnv) {
    console.log('🔐 Saving to Replit Secrets...');
    
    const secrets = [
      ['CLOUDFLARE_ACCOUNT_ID', accountId],
      ['CLOUDFLARE_API_TOKEN', apiToken],
      ['CLOUDFLARE_KV_NAMESPACE_ID', namespaceId]
    ];
    
    let allSuccess = true;
    for (const [key, value] of secrets) {
      const success = setReplitSecret(key, value);
      if (!success) allSuccess = false;
    }
    
    if (allSuccess) {
      console.log('\n✅ All credentials saved successfully!');
    } else {
      console.log('\n⚠️  Some credentials failed to save. Please set them manually.');
    }
    
  } else {
    console.log('📄 For local development, add these to your .env file:');
    console.log();
    console.log(`CLOUDFLARE_ACCOUNT_ID=${accountId}`);
    console.log(`CLOUDFLARE_API_TOKEN=${apiToken}`);
    console.log(`CLOUDFLARE_KV_NAMESPACE_ID=${namespaceId}`);
    console.log();
  }
  
  // Step 6: Verify setup
  console.log('🔍 VERIFYING TRINITY SYMPHONY KV INTEGRATION...');
  
  try {
    // Test with Python script if available
    const testCommand = 'python trinity_symphony_kv_integration.py';
    console.log('\nRunning integration test...');
    
    const testOutput = execSync(testCommand, { encoding: 'utf8', timeout: 30000 });
    console.log(testOutput);
    
    console.log('✅ Trinity Symphony KV integration test completed successfully!');
    
  } catch (error) {
    console.log('⚠️  Could not run automatic integration test.');
    console.log('   You can manually test by running: python trinity_symphony_kv_integration.py');
  }
  
  // Final summary
  console.log('\n🏆 SETUP COMPLETE!');
  console.log('=' * 40);
  console.log('✅ Cloudflare KV credentials configured');
  console.log('✅ Connection to KV namespace verified');
  console.log('✅ Trinity Symphony cross-manager sync ready');
  console.log();
  console.log('🎼 Trinity Symphony managers can now:');
  console.log('   • Sync RepID scores across all instances');
  console.log('   • Share verification certificates');
  console.log('   • Coordinate cascade protocol activation');
  console.log('   • Maintain distributed audit trails');
  console.log();
  console.log('🚀 Next Steps:');
  console.log('   • Restart your application to load new credentials');
  console.log('   • Test the /api/trinity-kv/health endpoint');
  console.log('   • Run a Trinity Symphony session with verification');
  console.log();
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the setup
setupCredentials().catch(error => {
  console.error('\n❌ Setup failed with error:', error.message);
  rl.close();
  process.exit(1);
});