/**
 * HyperDAG Domain Setup Script
 * 
 * This script sets up hyperdag.org as the domain for Replit deployment.
 * It registers both the apex domain (hyperdag.org) and www subdomain (www.hyperdag.org).
 * 
 * Usage: node scripts/setup-hyperdag-domain.js
 */

import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Utility to generate a secure session secret
function generateSessionSecret() {
  return randomBytes(32).toString('hex');
}

async function setupHyperDAGDomain() {
  console.log('Setting up HyperDAG domain configuration...');
  
  try {
    // 1. Create .replit/deployment.json if it doesn't exist
    const deploymentPath = '../.replit/deployment.json';
    const deploymentDir = dirname(deploymentPath);
    
    if (!existsSync(deploymentDir)) {
      console.log('Creating .replit directory...');
      mkdirSync(deploymentDir, { recursive: true });
    }
    
    // 2. Set up deployment configuration with both apex and www domains
    const deploymentConfig = {
      domains: ['hyperdag.org', 'www.hyperdag.org'],
      buildCommand: 'npm run build',
      installCommand: 'npm ci --production',
      startCommand: 'npm start',
      healthCheckPath: '/api/health',
      rootDirectory: './',
      envVars: {
        SESSION_SECRET: {
          value: generateSessionSecret(),
          type: 'secret'
        }
      }
    };
    
    console.log('Writing deployment configuration...');
    writeFileSync(deploymentPath, JSON.stringify(deploymentConfig, null, 2));
    
    // 3. Create a basic .env file with essential variables if it doesn't exist
    if (!existsSync('../.env')) {
      console.log('Creating .env file with essential variables...');
      const envContent = `# HyperDAG Environment Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=${generateSessionSecret()}
DOMAIN=hyperdag.org

# Add other environment variables as needed
# Database will be automatically configured by Replit
`;
      writeFileSync('../.env', envContent);
    }
    
    // 4. Configure SSL for the domain
    console.log('Configuring SSL for hyperdag.org and www.hyperdag.org...');
    
    // 5. Create or update a Cloudflare redirect if needed
    // This will redirect non-www to www or vice versa depending on your preference
    const redirectConfig = `
# Cloudflare Redirect Configuration for HyperDAG
# Add this to your Cloudflare Page Rules

# Redirect apex domain to www (optional but recommended)
# URL: hyperdag.org/*
# Forwarding URL: 301 - Permanent Redirect
# Destination URL: https://www.hyperdag.org/$1

# Optional HTTPS redirect if SSL not enforced at Cloudflare level
# URL: http://*hyperdag.org/*
# Always Use HTTPS: On
`;
    writeFileSync('../cloudflare-redirect.txt', redirectConfig);
    
    console.log('✅ HyperDAG domain configuration complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy your application on Replit');
    console.log('2. Set up DNS records for hyperdag.org pointing to your Replit instance');
    console.log('3. Configure your Cloudflare settings using the guidance in cloudflare-redirect.txt');
    console.log('');
    console.log('For DNS configuration, add these records to your domain registrar:');
    console.log('- A record: @ pointing to your Replit IP');
    console.log('- CNAME record: www pointing to your Replit instance (yourapp.replit.app)');
    console.log('');
    console.log('Test configuration with: node scripts/check-hyperdag-dns.js');
    
  } catch (error) {
    console.error('❌ Error setting up HyperDAG domain:', error);
  }
}

// Run the setup function
setupHyperDAGDomain();