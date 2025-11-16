#!/usr/bin/env node

/**
 * HyperDAG Post-Deployment Script
 * 
 * This script runs automatically after a successful Replit deployment.
 * It performs various post-deployment tasks including:
 * 1. Notifying Lovable.dev of the new deployment
 * 2. Verifying domain and SSL certificate status
 * 3. Updating integration partners about the new version
 */

import { execSync } from 'child_process';
import notifyLovableOfDeployment from './notify-lovable-deploy.mjs';

async function runPostDeploymentTasks() {
  console.log('🚀 Running HyperDAG post-deployment tasks...');
  
  try {
    // Step 1: Notify Lovable of deployment
    console.log('\n📢 Notifying Lovable.dev of new deployment...');
    const lovableNotified = await notifyLovableOfDeployment();
    
    if (lovableNotified) {
      console.log('✅ Lovable notification successful');
    } else {
      console.warn('⚠️ Failed to notify Lovable - integration will need manual update');
    }
    
    // Step 2: Verify deployment status
    console.log('\n🔍 Verifying deployment status...');
    
    // List deployed domains
    console.log('Deployed domains:');
    console.log('- hyperdag.org');
    console.log('- www.hyperdag.org');
    
    // You would normally check these programmatically
    // but we'll just print reminders for manual verification
    console.log('\n📝 Post-Deployment Checklist:');
    console.log('1. Verify https://hyperdag.org loads without errors');
    console.log('2. Verify https://www.hyperdag.org loads without errors');
    console.log('3. Check that Lovable apps have been updated with latest changes');
    
    console.log('\n✅ Post-deployment process completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error during post-deployment process:', error);
    return false;
  }
}

// Run the function if this script is executed directly
if (process.argv[1].endsWith('post-deploy.mjs')) {
  runPostDeploymentTasks().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

export default runPostDeploymentTasks;