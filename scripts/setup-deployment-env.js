#!/usr/bin/env node

/**
 * HyperDAG Deployment Environment Setup Script
 * 
 * This script helps set up environment variables for your Replit deployment.
 * Run this before deploying to ensure all necessary variables are set.
 */

import readline from 'readline';
import crypto from 'crypto';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Function to generate a secure random string for SESSION_SECRET
function generateSessionSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function setupEnvironment() {
  console.log('\n=== HyperDAG Deployment Environment Setup ===\n');
  
  // Generate and check domain
  console.log('Setting up your domain configuration...\n');
  
  const domainName = await question('What is your domain name? (e.g., hyperdag.org): ');
  
  if (!domainName) {
    console.log('\n❌ Error: Domain name is required.');
    return;
  }
  
  // Generate APP_URL
  const appUrl = `https://api.${domainName}`;
  console.log(`\n✓ Using APP_URL: ${appUrl}`);
  
  try {
    execSync(`replit env set APP_URL "${appUrl}"`);
    console.log('✓ APP_URL environment variable set successfully.');
  } catch (error) {
    console.log('\n❌ Error setting APP_URL environment variable. You may need to set this manually in the Replit Secrets tab.');
  }
  
  // Generate SESSION_SECRET
  const sessionSecret = generateSessionSecret();
  console.log('\n✓ Generated secure SESSION_SECRET');
  
  try {
    execSync(`replit env set SESSION_SECRET "${sessionSecret}"`);
    console.log('✓ SESSION_SECRET environment variable set successfully.');
  } catch (error) {
    console.log('\n❌ Error setting SESSION_SECRET environment variable. You may need to set this manually in the Replit Secrets tab.');
    console.log(`Value to set: ${sessionSecret}`);
  }
  
  // OAuth Providers
  console.log('\n=== OAuth Provider Configuration ===');
  console.log('You can skip any provider you don\'t want to use yet.\n');
  
  // Array of providers to set up
  const providers = [
    { name: 'Twitter', prefix: 'TWITTER' },
    { name: 'Google', prefix: 'GOOGLE' },
    { name: 'GitHub', prefix: 'GITHUB' },
    { name: 'Discord', prefix: 'DISCORD' },
    { name: 'LinkedIn', prefix: 'LINKEDIN' },
    { name: 'YouTube', prefix: 'YOUTUBE' }
  ];
  
  for (const provider of providers) {
    console.log(`\n--- ${provider.name} OAuth Configuration ---`);
    
    const clientId = await question(`${provider.name} Client ID (press Enter to skip): `);
    
    if (clientId) {
      const clientSecret = await question(`${provider.name} Client Secret: `);
      
      if (clientSecret) {
        try {
          execSync(`replit env set ${provider.prefix}_CLIENT_ID "${clientId}"`);
          execSync(`replit env set ${provider.prefix}_CLIENT_SECRET "${clientSecret}"`);
          console.log(`✓ ${provider.name} OAuth credentials set successfully.`);
        } catch (error) {
          console.log(`\n❌ Error setting ${provider.name} OAuth environment variables. You may need to set these manually.`);
        }
      } else {
        console.log(`⚠️ Skipping ${provider.name} OAuth setup - Client Secret is required.`);
      }
    } else {
      console.log(`⚠️ Skipping ${provider.name} OAuth setup.`);
    }
  }
  
  console.log('\n=== Environment Setup Complete ===');
  console.log(`
To complete your deployment:

1. Make sure your domain DNS is configured:
   - Add a CNAME record for api.${domainName} pointing to your Replit deployment
   - Add a CNAME record for ${domainName} pointing to your Replit deployment

2. Run the OAuth verification script after deployment:
   node scripts/verify-cloudflare-setup.js ${domainName}

3. Set up your OAuth provider redirects to point to:
   ${appUrl}/api/social/callback/[provider]
  `);
  
  rl.close();
}

// Execute the setup
setupEnvironment().catch(err => console.error(err));