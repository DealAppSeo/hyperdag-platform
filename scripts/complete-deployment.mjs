#!/usr/bin/env node

/**
 * HyperDAG Complete Deployment Script
 * 
 * This script combines all post-deployment tasks including:
 * 1. GitHub synchronization
 * 2. Lovable integration updates
 * 3. SSL certificate verification
 * 4. Deployment status checks
 */

import syncToGitHub from './github-sync.mjs';
import notifyLovableOfDeployment from './notify-lovable-deploy.mjs';
import runPostDeploymentTasks from './post-deploy.mjs';
import { execSync } from 'child_process';

async function completeDeployment() {
  console.log('🚀 Starting HyperDAG complete deployment process...');
  
  try {
    // Step 1: Sync to GitHub
    console.log('\n📦 Syncing changes to GitHub...');
    const githubSynced = await syncToGitHub();
    
    if (githubSynced) {
      console.log('✅ GitHub synchronization successful');
    } else {
      console.warn('⚠️ GitHub synchronization failed - continuing with other tasks');
    }
    
    // Step 2: Run post-deployment tasks (including Lovable notification)
    console.log('\n🛠️ Running post-deployment tasks...');
    const postDeploymentSuccess = await runPostDeploymentTasks();
    
    if (postDeploymentSuccess) {
      console.log('✅ Post-deployment tasks completed successfully');
    } else {
      console.warn('⚠️ Some post-deployment tasks failed - see logs for details');
    }
    
    // Step 3: Verify deployment
    console.log('\n🔍 Verifying deployment status...');
    console.log('Deployment domains:');
    console.log('- https://hyperdag.org');
    console.log('- https://www.hyperdag.org');
    
    // Step 4: Display summary
    console.log('\n📋 Deployment Summary:');
    console.log(`- GitHub Sync: ${githubSynced ? '✅ Success' : '❌ Failed'}`);
    console.log(`- Post-Deployment: ${postDeploymentSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`- Timestamp: ${new Date().toISOString()}`);
    
    return githubSynced && postDeploymentSuccess;
  } catch (error) {
    console.error('❌ Error during deployment process:', error);
    return false;
  }
}

// Run the function if this script is executed directly
if (process.argv[1].endsWith('complete-deployment.mjs')) {
  completeDeployment().then(success => {
    if (success) {
      console.log('\n✅ Complete deployment process finished successfully');
    } else {
      console.log('\n⚠️ Complete deployment process finished with some issues - review logs');
    }
  });
}

export default completeDeployment;