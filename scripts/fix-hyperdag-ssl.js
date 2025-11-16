/**
 * Fix HyperDAG SSL Configuration Script
 * 
 * This script updates the Replit deployment configuration to properly handle
 * both hyperdag.org and www.hyperdag.org with valid SSL certificates.
 * 
 * Usage: node scripts/fix-hyperdag-ssl.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomBytes } from 'crypto';

// Path to Replit deployment config
const deploymentPath = './.replit/deployment.json';
const replitConfigPath = './.replit';

// HyperDAG domain information
const apexDomain = 'hyperdag.org';
const wwwDomain = 'www.hyperdag.org';
const replitDomain = 'hyper-dag-manager-1-dealappseo.replit.app';

// Generate a secure session secret
function generateSessionSecret() {
  return randomBytes(32).toString('hex');
}

// Ensure deployment directory exists
function ensureDirectoryExists(path) {
  const directory = dirname(path);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

// Create or update deployment configuration
async function updateDeploymentConfig() {
  console.log('Updating Replit deployment configuration...');
  
  ensureDirectoryExists(deploymentPath);
  
  let deploymentConfig = {};
  
  // Try to read existing config
  if (existsSync(deploymentPath)) {
    try {
      const existingConfig = readFileSync(deploymentPath, 'utf8');
      deploymentConfig = JSON.parse(existingConfig);
      console.log('Found existing deployment configuration');
    } catch (error) {
      console.log('Could not parse existing deployment configuration, creating new one');
    }
  }
  
  // Update configuration with both domains
  deploymentConfig = {
    ...deploymentConfig,
    domains: [apexDomain, wwwDomain],
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    rootDirectory: './',
    sslConfig: {
      type: 'auto',
      domains: [apexDomain, wwwDomain],
      provider: 'lets-encrypt'
    },
    envVars: {
      ...(deploymentConfig.envVars || {}),
      SESSION_SECRET: {
        value: generateSessionSecret(),
        type: 'secret'
      },
      DOMAIN: {
        value: apexDomain,
        type: 'plain'
      }
    }
  };
  
  // Save updated configuration
  writeFileSync(deploymentPath, JSON.stringify(deploymentConfig, null, 2));
  console.log('✅ Deployment configuration updated successfully');
  
  // Create Replit configuration file if it doesn't exist
  if (!existsSync(replitConfigPath)) {
    const replitConfig = `
run = "npm run dev"
modules = ["nodejs-20:v8-20230920-bd784b9"]
hidden = [".config", "package-lock.json"]

[nix]
channel = "stable-22_11"

[unitTest]
language = "nodejs"

[deployment]
run = ["sh", "-c", "npm start"]
deploymentTarget = "cloudrun"
ignorePorts = false
`;
    writeFileSync(replitConfigPath, replitConfig);
    console.log('✅ Created .replit configuration file');
  }
}

// Create DNS instructions file
function createDnsInstructions() {
  const instructions = `
# DNS Configuration for HyperDAG.org
# =================================

# Since hyperdag.org is working but www.hyperdag.org is not, make sure
# your DNS settings include both of these records:

# For the apex domain (hyperdag.org):
Type: A or CNAME
Name: @ (or leave blank)
Value: If using Replit proxy, use Replit IP or your current configuration

# For the www subdomain (www.hyperdag.org):
Type: CNAME
Name: www
Value: ${replitDomain}
TTL: Auto or 3600

# Make sure both records are pointing to your Replit app!

# Cloudflare Settings (if using Cloudflare):
# -----------------------------------------
1. Make sure both records are "proxied" (orange cloud icon)
2. Set SSL/TLS mode to "Full" (not Flexible)
3. Create a page rule for HTTPS redirection:
   - URL pattern: http://*hyperdag.org/*
   - Setting: Always Use HTTPS
   - Toggle: ON

# If you want to redirect apex to www or vice versa, create another page rule:
# For apex to www redirection:
   - URL pattern: hyperdag.org/*
   - Setting: Forwarding URL
   - Status: 301 (Permanent Redirect)
   - Destination URL: https://www.hyperdag.org/$1

# After updating DNS settings:
1. Deploy your Replit app
2. Run: node scripts/check-hyperdag-dns.js to verify configuration
`;

  writeFileSync('./hyperdag-dns-instructions.txt', instructions);
  console.log('✅ DNS instructions saved to hyperdag-dns-instructions.txt');
}

// Main function
async function main() {
  console.log('=================================================');
  console.log('🔧 HyperDAG SSL Configuration Fix');
  console.log('=================================================');
  
  // Update deployment configuration
  await updateDeploymentConfig();
  
  // Create DNS instructions
  createDnsInstructions();
  
  console.log('\n✅ Configuration update complete!');
  console.log('\nNext steps:');
  console.log('1. Deploy your application using the updated configuration');
  console.log('2. Check your DNS settings according to hyperdag-dns-instructions.txt');
  console.log('3. Run scripts/check-hyperdag-dns.js to verify your configuration');
  console.log('\nNote: SSL certificate provisioning can take up to 15 minutes');
  console.log('after deployment. Both domains should work after certificates are issued.');
}

main().catch(console.error);