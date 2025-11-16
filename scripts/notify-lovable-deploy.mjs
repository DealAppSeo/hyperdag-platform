/**
 * Deployment Notification Script for Lovable Integration
 * 
 * This script sends a notification to Lovable.dev when a new HyperDAG
 * deployment is made, triggering an update on connected applications.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// Configuration
const LOVABLE_WEBHOOK_URL = process.env.LOVABLE_WEBHOOK_URL || 'https://api.lovable.dev/webhooks/deployment';
const WEBHOOK_SECRET = process.env.LOVABLE_WEBHOOK_SECRET || ''; // Should be set in environment

// Generate a signature for webhook authentication
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function notifyLovableOfDeployment() {
  try {
    console.log('Notifying Lovable of new HyperDAG deployment...');
    
    const deploymentData = {
      source: 'hyperdag',
      timestamp: new Date().toISOString(),
      deployedVersion: process.env.REPLIT_DEPLOYMENT_ID || 'latest',
      environment: process.env.NODE_ENV || 'production'
    };
    
    const signature = generateSignature(deploymentData, WEBHOOK_SECRET);
    
    const response = await fetch(LOVABLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Deployment-Signature': signature
      },
      body: JSON.stringify(deploymentData)
    });
    
    if (response.ok) {
      console.log('✅ Successfully notified Lovable of deployment');
      console.log('Lovable services should update shortly with the latest changes');
      return true;
    } else {
      const errorData = await response.text();
      console.error('Failed to notify Lovable:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Error notifying Lovable of deployment:', error.message);
    return false;
  }
}

// Run when script is executed directly
if (process.argv[1].endsWith('notify-lovable-deploy.mjs')) {
  notifyLovableOfDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default notifyLovableOfDeployment;