/**
 * HyperDAG Forum Subdomain Setup Script
 * 
 * This script creates DNS configuration instructions for setting up
 * forum.hyperdag.org as a subdomain pointing to Lovable.dev's servers.
 * 
 * Usage: node scripts/setup-forum-subdomain.js
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for user input
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupForumSubdomain() {
  console.log('=================================================');
  console.log('🔧 HyperDAG Forum Subdomain Setup');
  console.log('=================================================');
  console.log('This script will help you set up forum.hyperdag.org to point to Lovable.dev servers.');
  console.log('');

  try {
    let lovableServerIP = await question('Please enter the Lovable.dev server IP address: ');
    
    if (!lovableServerIP) {
      console.log('⚠️ No IP address provided. Using placeholder for instructions.');
      lovableServerIP = '123.456.789.012'; // Placeholder IP
    }

    // Generate DNS configuration instructions
    const dnsInstructions = `
# DNS Configuration for forum.hyperdag.org

To set up the forum.hyperdag.org subdomain to point to Lovable.dev's server,
add the following DNS records in your domain registrar or DNS provider (e.g., Cloudflare):

## Option 1: A Record (Direct IP)
Type: A
Host: forum
Value: ${lovableServerIP}
TTL: Auto

## Option 2: CNAME Record (If Lovable provides a hostname instead of IP)
Type: CNAME
Host: forum
Value: [Lovable's hostname, e.g. lovable-forum-hyperdag.lovable.app]
TTL: Auto

## Important Notes:
1. If using Cloudflare, you may want to set the proxy status to "Proxied" (orange cloud)
   to benefit from Cloudflare's security and caching features.
2. DNS changes can take up to 24-48 hours to propagate globally, but often complete within 1 hour.
3. After setup, verify the configuration by visiting forum.hyperdag.org
4. Share the forum.hyperdag.org domain with Lovable.dev team so they can configure their server.

## Testing the DNS Configuration
After adding the DNS records, you can test if they've propagated using:
$ dig forum.hyperdag.org
or
$ nslookup forum.hyperdag.org
`;

    // Save instructions to a file
    await fs.writeFile('forum-subdomain-setup.txt', dnsInstructions);
    
    console.log('\n✅ DNS configuration instructions generated successfully!');
    console.log('📄 Instructions saved to forum-subdomain-setup.txt');
    console.log('\nFollow these instructions to configure your DNS provider:');
    console.log(dnsInstructions);
    
    // Provide additional information about CNAME configuration
    console.log('\n🔍 Next steps:');
    console.log('1. Contact Lovable.dev to confirm their server IP or hostname');
    console.log('2. Add the DNS records in your domain provider\'s dashboard');
    console.log('3. Share forum.hyperdag.org with Lovable.dev team for their configuration');
    console.log('4. After DNS propagates, test the integration between both platforms');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
setupForumSubdomain();