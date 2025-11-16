/**
 * Cloudflare Activation Helper Script
 * 
 * This script helps you activate Cloudflare proxy for hyperdag.org
 * and verifies the configuration is working correctly.
 */

import { createInterface } from 'readline';
import https from 'https';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkCloudflareStatus() {
  console.log('\n🔍 Checking current Cloudflare status...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/health/cloudflare');
    const data = await response.json();
    
    console.log('Current Status:', data.data.status);
    console.log('App URL:', data.data.appUrl);
    console.log('Cloudflare Proxied:', data.data.cloudflareProxied);
    
    if (data.data.cloudflareProxied) {
      console.log('✅ Cloudflare is already active!');
      return true;
    } else {
      console.log('⚠️  Cloudflare proxy is not active yet');
      console.log('\nRecommendations:');
      data.data.recommendations.forEach(rec => console.log(`  • ${rec}`));
      return false;
    }
  } catch (error) {
    console.error('Error checking Cloudflare status:', error.message);
    return false;
  }
}

async function provideDNSInstructions() {
  console.log('\n📋 DNS Configuration Instructions for Cloudflare\n');
  
  console.log('1. Log in to your Cloudflare dashboard at https://dash.cloudflare.com');
  console.log('2. Select your hyperdag.org domain');
  console.log('3. Go to DNS → Records');
  console.log('4. For each DNS record pointing to your Replit deployment:');
  console.log('   • Click the gray cloud icon to turn it orange (Proxied)');
  console.log('   • This enables Cloudflare\'s protection and performance features');
  console.log('\n5. Go to SSL/TLS → Overview');
  console.log('   • Set encryption mode to "Full (strict)"');
  console.log('   • Enable "Always Use HTTPS"');
  
  console.log('\n🎯 Expected DNS Records:');
  console.log('┌─────────────────┬─────────┬─────────────────────────────┬──────────┐');
  console.log('│ Name            │ Type    │ Target                      │ Status   │');
  console.log('├─────────────────┼─────────┼─────────────────────────────┼──────────┤');
  console.log('│ hyperdag.org    │ CNAME   │ [your-replit-url]          │ Proxied  │');
  console.log('│ api.hyperdag.org│ CNAME   │ [your-replit-url]          │ Proxied  │');
  console.log('│ www.hyperdag.org│ CNAME   │ [your-replit-url]          │ Proxied  │');
  console.log('└─────────────────┴─────────┴─────────────────────────────┴──────────┘');
}

async function testCloudflareFeatures() {
  console.log('\n🧪 Testing Cloudflare Features...\n');
  
  const tests = [
    { name: 'HTTPS Redirect', url: 'http://api.hyperdag.org' },
    { name: 'SSL Certificate', url: 'https://api.hyperdag.org' },
    { name: 'API Health Check', url: 'https://api.hyperdag.org/api/health' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.url, { 
        method: 'HEAD',
        timeout: 5000 
      });
      
      const cfRay = response.headers.get('cf-ray');
      const cfCache = response.headers.get('cf-cache-status');
      
      if (cfRay) {
        console.log(`  ✅ ${test.name} - Cloudflare Active (Ray: ${cfRay})`);
        if (cfCache) console.log(`     Cache Status: ${cfCache}`);
      } else {
        console.log(`  ⚠️  ${test.name} - No Cloudflare headers detected`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} - Error: ${error.message}`);
    }
  }
}

async function waitForActivation() {
  console.log('\n⏳ Waiting for DNS changes to propagate...');
  console.log('This can take 5-15 minutes. We\'ll check every 30 seconds.\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('https://api.hyperdag.org/api/health/cloudflare');
      const data = await response.json();
      
      if (data.data.cloudflareProxied) {
        console.log('\n🎉 Cloudflare is now active!');
        await testCloudflareFeatures();
        return true;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      attempts++;
      process.stdout.write('x');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏰ Timeout reached. DNS changes may need more time to propagate.');
  return false;
}

async function main() {
  console.log('🚀 HyperDAG Cloudflare Activation Helper\n');
  
  // Check current status
  const isActive = await checkCloudflareStatus();
  
  if (isActive) {
    console.log('\n✨ Cloudflare is already working perfectly!');
    await testCloudflareFeatures();
    rl.close();
    return;
  }
  
  // Provide instructions
  await provideDNSInstructions();
  
  const proceed = await question('\nHave you completed the DNS configuration in Cloudflare? (y/n): ');
  
  if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
    const success = await waitForActivation();
    
    if (success) {
      console.log('\n🎊 Cloudflare activation complete!');
      console.log('\nNext steps:');
      console.log('  • Your site now has DDoS protection');
      console.log('  • SSL certificates are managed automatically');
      console.log('  • Performance is optimized with global CDN');
      console.log('  • Ready for n8n.io integration setup');
    } else {
      console.log('\n📞 If you need help, the changes might still be propagating.');
      console.log('You can run this script again in a few minutes to check status.');
    }
  } else {
    console.log('\n📚 Take your time with the configuration.');
    console.log('Run this script again when you\'re ready to verify the setup.');
  }
  
  rl.close();
}

main().catch(console.error);