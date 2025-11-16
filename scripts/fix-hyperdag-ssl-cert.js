/**
 * HyperDAG SSL Certificate Fix Script
 * 
 * This script configures proper SSL certificates for both hyperdag.org and www.hyperdag.org
 * by setting up the correct domain configuration in Replit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Define the domains we want to secure
const domains = ['hyperdag.org', 'www.hyperdag.org'];

// Configuration file path for Replit deployments
const configPath = '.replit';
const deployConfigPath = '.deployment/config.json';

function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function updateDeploymentConfig() {
  console.log('Updating deployment configuration for SSL certificates...');
  
  try {
    // Create deployment directory if it doesn't exist
    ensureDirectoryExists('.deployment');
    
    // Load existing config or create new one
    let deployConfig = {};
    if (fs.existsSync(deployConfigPath)) {
      const configContent = fs.readFileSync(deployConfigPath, 'utf8');
      try {
        deployConfig = JSON.parse(configContent);
      } catch (e) {
        console.warn('Invalid deployment config JSON, creating new one');
      }
    }
    
    // Update domain configuration
    deployConfig.domains = domains.map(domain => ({
      domain,
      type: domain.startsWith('www.') ? 'www' : 'primary'
    }));
    
    // Make sure to enable HTTPS
    deployConfig.https = true;
    
    // Save updated configuration
    fs.writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2));
    console.log('Deployment configuration updated successfully');
    
    // Update .replit configuration if it exists
    if (fs.existsSync(configPath)) {
      console.log('Updating .replit configuration...');
      
      let replitConfig = fs.readFileSync(configPath, 'utf8');
      
      // Add or update session secret for security
      const secretLine = `sessionSecret = "${generateSessionSecret()}"`;
      if (replitConfig.includes('sessionSecret =')) {
        replitConfig = replitConfig.replace(/sessionSecret =.*$/m, secretLine);
      } else {
        replitConfig += `\n${secretLine}\n`;
      }
      
      // Add deployment domain configuration if missing
      if (!replitConfig.includes('[deployment]')) {
        replitConfig += `\n[deployment]\nmode = "production"\n`;
      }
      
      // Add domains
      const domainLines = domains.map(d => `"${d}"`).join(', ');
      if (replitConfig.includes('deploymentDomains =')) {
        replitConfig = replitConfig.replace(/deploymentDomains =.*$/m, `deploymentDomains = [${domainLines}]`);
      } else {
        // Add to the deployment section
        replitConfig = replitConfig.replace('[deployment]', `[deployment]\ndeploymentDomains = [${domainLines}]`);
      }
      
      // Save updated .replit file
      fs.writeFileSync(configPath, replitConfig);
      console.log('.replit configuration updated successfully');
    } else {
      console.log('.replit file not found, skipping this step');
      console.log('Only the deployment configuration has been updated');
    }
    
    createDnsInstructions();
    
    return true;
  } catch (error) {
    console.error('Error updating deployment configuration:', error);
    return false;
  }
}

function createDnsInstructions() {
  console.log('\n==== DNS CONFIGURATION INSTRUCTIONS ====');
  console.log('To complete the SSL certificate setup, please configure your DNS records as follows:');
  console.log('\n1. For the apex domain (hyperdag.org):');
  console.log('   Type: A');
  console.log('   Name: @');
  console.log('   Value: 159.203.161.8');
  console.log('   TTL: Auto or 3600');
  
  console.log('\n2. For the www subdomain (www.hyperdag.org):');
  console.log('   Type: CNAME');
  console.log('   Name: www');
  console.log('   Value: hyperdag.org');
  console.log('   TTL: Auto or 3600');
  
  console.log('\nAfter updating these DNS records, it may take up to 24-48 hours for the changes to propagate.');
  console.log('You can check the status by redeploying your Replit application and visiting your domains.\n');
}

async function main() {
  console.log('Starting HyperDAG SSL Certificate Fix...');
  
  const success = await updateDeploymentConfig();
  
  if (success) {
    console.log('\n✅ SSL Certificate configuration has been updated successfully!');
    console.log('To apply these changes:');
    console.log('1. Deploy your application from the Replit interface');
    console.log('2. After deployment, Replit will automatically request SSL certificates');
    console.log('3. Verify by visiting https://hyperdag.org and https://www.hyperdag.org');
    console.log('\nIf you continue to see SSL errors after deployment:');
    console.log('- Check that your DNS settings match the instructions above');
    console.log('- Ensure your domain registrar is properly configured to use these DNS settings');
    console.log('- Wait 24-48 hours for DNS propagation and certificate issuance');
  } else {
    console.log('❌ Failed to update SSL Certificate configuration.');
    console.log('Please try running this script again or contact support for assistance.');
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});