/**
 * HyperDAG DNS and SSL Checker
 * 
 * This script checks the DNS configuration and SSL certificate status for
 * hyperdag.org and its subdomains.
 * 
 * Usage: node scripts/check-hyperdag-dns.js
 */

import dns from 'dns';
import https from 'https';
import http from 'http';
import { promisify } from 'util';

// Convert DNS functions to promises
const resolveCname = promisify(dns.resolveCname);
const resolveA = promisify(dns.resolve4);
const resolveNs = promisify(dns.resolveNs);
const lookupAddress = promisify(dns.lookup);

// Domain to check
const apexDomain = 'hyperdag.org';
const wwwDomain = 'www.hyperdag.org';
const domains = [apexDomain, wwwDomain];

/**
 * Checks DNS records for a domain
 */
async function checkDns(domain) {
  console.log(`\n🔍 Checking DNS records for ${domain}...`);
  
  try {
    // Get IP address
    const ipResult = await lookupAddress(domain);
    console.log(`✅ IP Address: ${ipResult.address}`);
    
    // Try to get A records
    try {
      const aRecords = await resolveA(domain);
      console.log(`✅ A Records: ${aRecords.join(', ')}`);
    } catch (error) {
      console.log(`❌ No A records found: ${error.code}`);
    }
    
    // Try to get CNAME records (for www typically)
    try {
      const cnameRecords = await resolveCname(domain);
      console.log(`✅ CNAME Records: ${cnameRecords.join(', ')}`);
    } catch (error) {
      console.log(`ℹ️ No CNAME records found (this is normal for apex domains)`);
    }
    
    // Try to get NS records
    try {
      const nsRecords = await resolveNs(apexDomain); // NS records exist on apex domain
      console.log(`✅ NS Records: ${nsRecords.join(', ')}`);
      
      // Check if Cloudflare is being used
      const isCloudflare = nsRecords.some(record => record.includes('cloudflare.com'));
      if (isCloudflare) {
        console.log(`✅ Cloudflare is being used as DNS provider`);
      } else {
        console.log(`ℹ️ Cloudflare is not being used as DNS provider`);
      }
    } catch (error) {
      console.log(`❌ Could not retrieve NS records: ${error.code}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ DNS lookup failed: ${error.code || error.message}`);
    return false;
  }
}

/**
 * Check SSL certificate for a domain
 */
function checkSsl(hostname) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Checking SSL certificate for ${hostname}...`);
    
    const options = {
      hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000,
      rejectUnauthorized: true, // Validate certificate
    };
    
    const req = https.request(options, (res) => {
      const { socket } = res;
      const cert = socket.getPeerCertificate();
      
      console.log(`✅ SSL Status: Connected over HTTPS`);
      console.log(`✅ SSL Certificate: Valid`);
      
      if (cert && Object.keys(cert).length > 0) {
        console.log(`✅ Certificate Issuer: ${cert.issuer?.O || 'Unknown'}`);
        console.log(`✅ Expires: ${new Date(cert.valid_to).toLocaleString()}`);
        
        // Check for Subject Alternative Names (SAN)
        if (cert.subjectaltname) {
          const altNames = cert.subjectaltname.split(', ').map(name => name.replace('DNS:', ''));
          console.log(`✅ Certificate covers domains: ${altNames.join(', ')}`);
          
          // Check if both apex and www are covered
          const hasApex = altNames.includes(apexDomain);
          const hasWww = altNames.includes(wwwDomain);
          
          if (hasApex && hasWww) {
            console.log(`✅ Certificate covers both ${apexDomain} and ${wwwDomain}`);
          } else {
            console.log(`❌ Certificate does not cover all required domains`);
            if (!hasApex) console.log(`  Missing: ${apexDomain}`);
            if (!hasWww) console.log(`  Missing: ${wwwDomain}`);
          }
        }
      }
      
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log(`❌ SSL Error: ${error.message}`);
      if (error.code === 'CERT_HAS_EXPIRED') {
        console.log(`❌ SSL Certificate has expired`);
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        console.log(`❌ SSL Certificate validation failed: Unable to verify`);
      } else if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        console.log(`❌ SSL Certificate doesn't match domain (${hostname})`);
      }
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ Connection timed out`);
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Try to connect to the domain via HTTP/HTTPS
 */
function testConnection(hostname, protocol = 'https') {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing ${protocol.toUpperCase()} connection to ${hostname}...`);
    
    const request = protocol === 'https' ? https.request : http.request;
    const port = protocol === 'https' ? 443 : 80;
    
    const options = {
      hostname,
      port,
      path: '/',
      method: 'GET',
      timeout: 5000,
      rejectUnauthorized: false // Allow self-signed certs for testing
    };
    
    const req = request(options, (res) => {
      const { statusCode } = res;
      const { location } = res.headers;
      
      console.log(`✅ ${protocol.toUpperCase()} Status Code: ${statusCode}`);
      
      if (statusCode >= 300 && statusCode < 400 && location) {
        console.log(`✅ Redirects to: ${location}`);
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Just check if we got a valid response with some content
        if (data.length > 0) {
          console.log(`✅ Received response (${data.length} bytes)`);
        } else {
          console.log(`❌ Empty response`);
        }
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${protocol.toUpperCase()} Error: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ Connection timed out`);
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Provides recommendations based on findings
 */
function provideRecommendations(results) {
  console.log('\n=================================================');
  console.log('📋 RECOMMENDATIONS');
  console.log('=================================================');
  
  if (!results.apexDnsOk || !results.wwwDnsOk) {
    console.log('\n🛠️ DNS ISSUES:');
    console.log('1. Verify DNS records in your domain registrar or Cloudflare');
    console.log('2. For apex domain (hyperdag.org), set an A record pointing to your Replit IP');
    console.log('3. For www subdomain, set a CNAME record pointing to your Replit app domain');
    console.log('4. Wait for DNS propagation (can take up to 48 hours, but usually minutes or hours)');
  }
  
  if (!results.apexSslOk || !results.wwwSslOk) {
    console.log('\n🛠️ SSL ISSUES:');
    console.log('1. Make sure both domains are added to your Replit deployment configuration');
    console.log('2. If using Cloudflare, set SSL/TLS mode to "Full" or "Full (strict)"');
    console.log('3. Ensure SSL certificates are provisioned for both domains');
    console.log('4. Check that the SSL certificate includes both domains in Subject Alternative Names (SAN)');
    console.log('5. Consider running the update-hyperdag-ssl.js script to update configuration');
  }
  
  if (!results.apexHttpOk || !results.wwwHttpOk) {
    console.log('\n🛠️ CONNECTION ISSUES:');
    console.log('1. Check that your Replit app is deployed and running');
    console.log('2. Verify firewall settings and ensure ports 80/443 are accessible');
    console.log('3. If using Cloudflare, check that proxying is enabled (orange cloud)');
  }
  
  console.log('\n📚 NEXT STEPS:');
  console.log('1. Run scripts/update-hyperdag-ssl.js to ensure proper SSL configuration');
  console.log('2. Deploy your application on Replit with updated configuration');
  console.log('3. Update DNS records according to the guidance in cloudflare-domains.txt');
  console.log('4. Run this script again after changes to verify improvements');
}

async function main() {
  console.log('=================================================');
  console.log('🔍 HyperDAG Domain and SSL Checker');
  console.log('=================================================');
  
  const results = {
    apexDnsOk: false,
    wwwDnsOk: false,
    apexSslOk: false,
    wwwSslOk: false,
    apexHttpOk: false,
    wwwHttpOk: false
  };
  
  // Check DNS records
  results.apexDnsOk = await checkDns(apexDomain);
  results.wwwDnsOk = await checkDns(wwwDomain);
  
  // Check SSL certificates
  results.apexSslOk = await checkSsl(apexDomain);
  results.wwwSslOk = await checkSsl(wwwDomain);
  
  // Test HTTP connections
  results.apexHttpOk = await testConnection(apexDomain, 'http');
  results.wwwHttpOk = await testConnection(wwwDomain, 'http');
  
  // Test HTTPS connections
  await testConnection(apexDomain, 'https');
  await testConnection(wwwDomain, 'https');
  
  // Provide recommendations
  provideRecommendations(results);
}

main().catch(console.error);