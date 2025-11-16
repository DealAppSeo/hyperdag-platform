/**
 * Cloudflare Environment Configuration Script
 * 
 * This script helps set up the necessary environment variables for
 * integrating HyperDAG with Cloudflare and OAuth providers.
 * 
 * Usage:
 *   node configure-cloudflare-env.js <domain>
 * 
 * Example:
 *   node configure-cloudflare-env.js api.hyperdag.org
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { execSync } from 'child_process';

// Create readline interface for user input
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
async function isReplit() {
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
async function setReplitSecret(key, value) {
  try {
    execSync(`replit secrets set ${key} '${value}'`, { encoding: 'utf8' });
    return true;
  } catch (error) {
    console.error(`Failed to set Replit secret ${key}:`, error.message);
    return false;
  }
}

/**
 * Generate a .env file
 */
async function generateEnvFile(envVars) {
  let envContent = '# HyperDAG Environment Configuration\n';
  
  for (const [key, value] of Object.entries(envVars)) {
    envContent += `${key}=${value}\n`;
  }
  
  writeFileSync('./.env', envContent);
  console.log('✅ .env file created successfully!');
}

/**
 * Main configuration function
 */
async function configureEnvironment() {
  console.log('=================================================');
  console.log('🔧 HyperDAG Cloudflare Environment Configuration');
  console.log('=================================================');
  
  // Get the domain from command line arguments
  const args = process.argv.slice(2);
  let domain = args[0] || 'hyperdag.org';
  
  // Confirm domain or allow override
  domain = await question(`Domain to configure [${domain}]: `) || domain;
  
  // Collect required environment variables
  console.log('\n📝 Please provide the following information:');
  
  const envVars = {
    DOMAIN: domain,
    NODE_ENV: 'production',
    PORT: '3000'
  };
  
  // Ask about Cloudflare settings
  console.log('\n🛡️ Cloudflare Configuration:');
  const useCloudflare = (await question('Are you using Cloudflare? (y/n): ')).toLowerCase() === 'y';
  
  if (useCloudflare) {
    // Zone ID is required for API operations
    envVars.CLOUDFLARE_ZONE_ID = await question('Cloudflare Zone ID for your domain: ');
    
    // API token for Cloudflare API access
    envVars.CLOUDFLARE_API_TOKEN = await question('Cloudflare API Token (for API requests): ');
    
    // Ask about SSL setting
    const sslMode = await question('Cloudflare SSL/TLS mode (Full/Strict/Flexible/Off) [Full]: ') || 'Full';
    envVars.CLOUDFLARE_SSL_MODE = sslMode;
    
    // Ask about redirection preference
    console.log('\n🔀 Domain Redirection:');
    console.log('1. www to apex (www.hyperdag.org -> hyperdag.org)');
    console.log('2. apex to www (hyperdag.org -> www.hyperdag.org)');
    console.log('3. No redirection (Both work independently)');
    
    const redirectChoice = await question('Choose redirection strategy [2]: ') || '2';
    
    switch (redirectChoice) {
      case '1':
        envVars.DOMAIN_REDIRECT = 'www_to_apex';
        break;
      case '2':
        envVars.DOMAIN_REDIRECT = 'apex_to_www';
        break;
      default:
        envVars.DOMAIN_REDIRECT = 'none';
    }
    
    // Generate page rule configuration for Cloudflare
    let pageRuleConfig = '# Cloudflare Page Rules Configuration\n\n';
    
    if (envVars.DOMAIN_REDIRECT === 'www_to_apex') {
      pageRuleConfig += `# Redirect www to apex domain
URL Pattern: www.${domain}/*
Setting: Forwarding URL
Status: 301 - Permanent Redirect
Destination URL: https://${domain}/$1
`;
    } else if (envVars.DOMAIN_REDIRECT === 'apex_to_www') {
      pageRuleConfig += `# Redirect apex to www domain
URL Pattern: ${domain}/*
Setting: Forwarding URL
Status: 301 - Permanent Redirect
Destination URL: https://www.${domain}/$1
`;
    }
    
    pageRuleConfig += `
# Force HTTPS
URL Pattern: http://*${domain}/*
Setting: Always Use HTTPS
Value: On
`;
    
    writeFileSync('./cloudflare-page-rules.txt', pageRuleConfig);
    console.log('✅ Cloudflare page rules configuration saved to cloudflare-page-rules.txt');
  }
  
  // Save configuration either to .env or Replit secrets
  const isReplitEnv = await isReplit();
  
  if (isReplitEnv) {
    console.log('\n🔐 Setting Replit Secrets...');
    
    for (const [key, value] of Object.entries(envVars)) {
      await setReplitSecret(key, value);
    }
    
    console.log('✅ Replit secrets configured successfully!');
  } else {
    console.log('\n📄 Generating .env file...');
    await generateEnvFile(envVars);
  }
  
  // Generate DNS configuration instructions
  let dnsConfig = `
# DNS Configuration for ${domain}
# ===============================

# Apex domain (${domain}):
Type: A
Name: @
Content: <Replit IP address>
TTL: Auto
Proxy status: Proxied (Cloudflare orange cloud) ✅

# www subdomain (www.${domain}):
Type: CNAME
Name: www
Content: <Your Replit app URL>
TTL: Auto
Proxy status: Proxied (Cloudflare orange cloud) ✅

# Cloudflare SSL/TLS Settings:
- SSL/TLS mode: ${envVars.CLOUDFLARE_SSL_MODE || 'Full'}
- Edge Certificates: On
- Always Use HTTPS: On
- HTTP Strict Transport Security (HSTS): Optional, but recommended

# Redirect Configuration:
${envVars.DOMAIN_REDIRECT === 'www_to_apex' ? '- Redirecting www subdomain to apex domain' : 
  envVars.DOMAIN_REDIRECT === 'apex_to_www' ? '- Redirecting apex domain to www subdomain' : 
  '- No redirection configured'}
`;
  
  writeFileSync('./dns-configuration.txt', dnsConfig);
  console.log('✅ DNS configuration saved to dns-configuration.txt');
  
  console.log('\n✅ Configuration complete!');
  console.log('\nNext steps:');
  console.log('1. Configure your DNS settings according to dns-configuration.txt');
  console.log('2. Set up Cloudflare page rules according to cloudflare-page-rules.txt');
  console.log('3. Deploy your application to Replit');
  console.log('4. Run scripts/check-hyperdag-dns.js to verify your domain configuration');
  
  rl.close();
}

configureEnvironment().catch(console.error);