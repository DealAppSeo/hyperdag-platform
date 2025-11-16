/**
 * HyperDAG SSL Configuration Update Script
 * 
 * This script updates the Replit configuration to include SSL certificates
 * for both hyperdag.org and www.hyperdag.org
 * 
 * Usage: node scripts/update-hyperdag-ssl.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __dirname = dirname(fileURLToPath(import.meta.url));

async function updateSslConfiguration() {
  console.log('Updating SSL configuration for HyperDAG domain and subdomain...');
  
  try {
    // 1. Check for existing deployment.json
    const deploymentPath = '../.replit/deployment.json';
    if (!existsSync(deploymentPath)) {
      console.error('❌ Deployment configuration not found. Please run setup-hyperdag-domain.js first.');
      return;
    }
    
    // 2. Read existing configuration
    let deploymentConfig;
    try {
      const configContents = readFileSync(deploymentPath, 'utf8');
      deploymentConfig = JSON.parse(configContents);
    } catch (error) {
      console.error('❌ Failed to parse deployment configuration:', error);
      return;
    }
    
    // 3. Ensure both domains are included in the configuration
    if (!deploymentConfig.domains || !Array.isArray(deploymentConfig.domains)) {
      deploymentConfig.domains = ['hyperdag.org', 'www.hyperdag.org'];
    } else {
      // Make sure both hyperdag.org and www.hyperdag.org are included
      const domains = new Set(deploymentConfig.domains);
      domains.add('hyperdag.org');
      domains.add('www.hyperdag.org');
      deploymentConfig.domains = Array.from(domains);
    }
    
    // 4. Add SSL configuration if it doesn't exist
    if (!deploymentConfig.sslConfig) {
      deploymentConfig.sslConfig = {
        // Configure automatic SSL certificate management
        type: 'auto',
        // Include both domains in the certificate
        domains: ['hyperdag.org', 'www.hyperdag.org'],
        // Use Let's Encrypt as the certificate authority
        provider: 'lets-encrypt'
      };
    } else {
      // Update existing SSL configuration
      deploymentConfig.sslConfig.type = 'auto';
      deploymentConfig.sslConfig.provider = 'lets-encrypt';
      
      // Make sure both domains are covered by the certificate
      if (!deploymentConfig.sslConfig.domains || !Array.isArray(deploymentConfig.sslConfig.domains)) {
        deploymentConfig.sslConfig.domains = ['hyperdag.org', 'www.hyperdag.org'];
      } else {
        const sslDomains = new Set(deploymentConfig.sslConfig.domains);
        sslDomains.add('hyperdag.org');
        sslDomains.add('www.hyperdag.org');
        deploymentConfig.sslConfig.domains = Array.from(sslDomains);
      }
    }
    
    // 5. Save updated configuration
    console.log('Writing updated SSL configuration...');
    writeFileSync(deploymentPath, JSON.stringify(deploymentConfig, null, 2));
    
    // 6. Create a cloudflare-domains.txt file with the DNS configuration instructions
    const cloudflareInstructions = `
# Cloudflare DNS Configuration for HyperDAG
# ------------------------------------------

# For the apex domain (hyperdag.org):
Type: A
Name: @
Content: Enter your Replit deployment IP address here
TTL: Auto
Proxy status: Proxied ✅

# For the www subdomain (www.hyperdag.org):
Type: CNAME
Name: www
Content: yourapplication.replit.app (replace with your actual Replit app domain)
TTL: Auto
Proxy status: Proxied ✅

# SSL/TLS Settings:
- Set SSL/TLS encryption mode to "Full" or "Full (strict)"
- Enable Always Use HTTPS
- Enable HSTS (if possible)

# Page Rule for Redirecting (If you want apex to www or vice versa):
URL pattern: hyperdag.org/*
Setting: Forwarding URL
Status: 301 - Permanent Redirect
Destination URL: https://www.hyperdag.org/$1
`;
    writeFileSync('../cloudflare-domains.txt', cloudflareInstructions);
    
    console.log('✅ SSL configuration updated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy the updated configuration');
    console.log('2. Configure your Cloudflare DNS settings according to cloudflare-domains.txt');
    console.log('3. Wait for SSL certificates to be provisioned (can take a few minutes)');
    console.log('4. Test both hyperdag.org and www.hyperdag.org');
    
  } catch (error) {
    console.error('❌ Error updating SSL configuration:', error);
  }
}

// Run the update function
updateSslConfiguration();