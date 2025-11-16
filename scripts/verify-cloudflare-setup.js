#!/usr/bin/env node

/**
 * Cloudflare OAuth Setup Verification Script
 * 
 * This script verifies that your Cloudflare domain is correctly configured
 * for OAuth callbacks with HyperDAG.
 * 
 * Usage:
 *   node verify-cloudflare-setup.js <domain>
 * 
 * Example:
 *   node verify-cloudflare-setup.js api.hyperdag.org
 */

import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolveA = promisify(dns.resolve4);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m',
};

// Get the domain from command line arguments
const domain = process.argv[2];

if (!domain) {
  console.error(`${colors.red}Error: Please provide a domain to check.${colors.reset}`);
  console.error(`Usage: node ${process.argv[1]} <domain>`);
  console.error(`Example: node ${process.argv[1]} api.hyperdag.org`);
  process.exit(1);
}

// List of OAuth providers to check
const providers = [
  'twitter',
  'google',
  'linkedin',
  'youtube',
  'discord',
  'github'
];

/**
 * Perform an HTTPS request and return the response
 */
async function httpsRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Check if a domain has DNS records pointing to Cloudflare
 */
async function checkDnsRecords(domain) {
  console.log(`\n${colors.cyan}Checking DNS records for ${colors.bright}${domain}${colors.reset}\n`);
  
  try {
    // Try CNAME record first
    try {
      const cnameRecords = await resolveCname(domain);
      console.log(`${colors.green}✓ CNAME record found: ${cnameRecords[0]}${colors.reset}`);
      
      if (cnameRecords[0].includes('replit.app')) {
        console.log(`${colors.yellow}⚠ Warning: Your CNAME points directly to Replit.${colors.reset}`);
        console.log(`${colors.yellow}   This may work, but it's better to point to a Cloudflare-managed domain.${colors.reset}`);
      }
      
      return true;
    } catch (e) {
      // If no CNAME, try A record
      try {
        const aRecords = await resolveA(domain);
        console.log(`${colors.green}✓ A record found: ${aRecords.join(', ')}${colors.reset}`);
        return true;
      } catch (err) {
        console.log(`${colors.red}✗ No DNS records found for ${domain}${colors.reset}`);
        console.log(`${colors.yellow}Please add either a CNAME or A record in your Cloudflare dashboard.${colors.reset}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error checking DNS: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Check if HTTPS is properly configured
 */
async function checkHttps(domain) {
  console.log(`\n${colors.cyan}Checking HTTPS for ${colors.bright}${domain}${colors.reset}\n`);
  
  try {
    const response = await httpsRequest(`https://${domain}`);
    console.log(`${colors.green}✓ HTTPS is working (Status: ${response.statusCode})${colors.reset}`);
    
    // Check if Cloudflare is being used
    const cfRay = response.headers['cf-ray'];
    if (cfRay) {
      console.log(`${colors.green}✓ Cloudflare is properly configured (CF-Ray: ${cfRay})${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Warning: Cloudflare does not appear to be proxying this domain.${colors.reset}`);
      console.log(`${colors.yellow}   Make sure the "Proxied" option is enabled in your Cloudflare DNS settings.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ HTTPS is not properly configured: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your SSL/TLS settings in Cloudflare.${colors.reset}`);
    return false;
  }
}

/**
 * Check OAuth callback endpoints
 */
async function checkOAuthEndpoints(domain) {
  console.log(`\n${colors.cyan}Checking OAuth callback endpoints for ${colors.bright}${domain}${colors.reset}\n`);
  
  let allValid = true;
  
  for (const provider of providers) {
    const callbackUrl = `https://${domain}/api/social/callback/${provider}`;
    
    try {
      const response = await httpsRequest(callbackUrl);
      
      // Usually OAuth callbacks should return 4xx without proper parameters
      if (response.statusCode >= 400 && response.statusCode < 500) {
        console.log(`${colors.green}✓ ${provider} endpoint is responding (Status: ${response.statusCode})${colors.reset}`);
      } else if (response.statusCode >= 500) {
        console.log(`${colors.yellow}⚠ ${provider} endpoint returned server error (Status: ${response.statusCode})${colors.reset}`);
        allValid = false;
      } else {
        console.log(`${colors.yellow}⚠ ${provider} endpoint returned unexpected status (${response.statusCode})${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ ${provider} endpoint error: ${error.message}${colors.reset}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Check health endpoint
 */
async function checkHealth(domain) {
  console.log(`\n${colors.cyan}Checking health endpoints for ${colors.bright}${domain}${colors.reset}\n`);
  
  try {
    const healthUrl = `https://${domain}/api/health`;
    const response = await httpsRequest(healthUrl);
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Health endpoint is working (Status: ${response.statusCode})${colors.reset}`);
      
      try {
        // Try to parse the health check JSON
        const healthData = JSON.parse(response.data);
        if (healthData.success === true) {
          console.log(`${colors.green}✓ Health check reports success${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ Health check reports issues${colors.reset}`);
        }
      } catch (e) {
        console.log(`${colors.yellow}⚠ Health endpoint returned invalid JSON${colors.reset}`);
      }
      
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Health endpoint returned unexpected status (${response.statusCode})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Health endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verify() {
  console.log(`\n${colors.bright}${colors.magenta}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  HyperDAG Cloudflare Setup Verification  ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================${colors.reset}\n`);
  
  console.log(`Verifying setup for: ${colors.bright}${domain}${colors.reset}\n`);
  
  const dnsValid = await checkDnsRecords(domain);
  const httpsValid = await checkHttps(domain);
  const oauthValid = await checkOAuthEndpoints(domain);
  const healthValid = await checkHealth(domain);
  
  console.log(`\n${colors.bright}${colors.magenta}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}              Summary                    ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================${colors.reset}\n`);
  
  console.log(`DNS Records:      ${dnsValid ? colors.green + '✓ Valid' : colors.red + '✗ Issues detected'}${colors.reset}`);
  console.log(`HTTPS Setup:      ${httpsValid ? colors.green + '✓ Valid' : colors.red + '✗ Issues detected'}${colors.reset}`);
  console.log(`OAuth Endpoints:  ${oauthValid ? colors.green + '✓ Valid' : colors.yellow + '⚠ Some issues detected'}${colors.reset}`);
  console.log(`Health Endpoint:  ${healthValid ? colors.green + '✓ Valid' : colors.yellow + '⚠ Issues detected'}${colors.reset}`);
  
  const overallStatus = dnsValid && httpsValid && oauthValid && healthValid;
  
  console.log(`\nOverall Status:   ${overallStatus ? 
    colors.green + '✓ Your Cloudflare setup looks good!' : 
    colors.yellow + '⚠ Your setup has some issues that need attention'}${colors.reset}`);
  
  if (!overallStatus) {
    console.log(`\n${colors.yellow}Review the warnings and errors above and fix them in your Cloudflare dashboard.${colors.reset}`);
    console.log(`${colors.yellow}See docs/cloudflare-oauth-setup.md for detailed setup instructions.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}Your HyperDAG OAuth integration with Cloudflare is correctly configured.${colors.reset}`);
    console.log(`${colors.green}You can now update your OAuth provider applications with the callback URLs shown in the documentation.${colors.reset}`);
  }
}

// Run the verification
verify().catch(error => {
  console.error(`${colors.red}Unexpected error during verification: ${error.message}${colors.reset}`);
  process.exit(1);
});