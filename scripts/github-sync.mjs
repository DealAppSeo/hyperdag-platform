/**
 * HyperDAG GitHub Sync Script
 * 
 * This script automatically syncs changes to GitHub when a deployment occurs
 * It creates commits with meaningful messages based on the changes made
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const GITHUB_USER = 'dealappseo';
const GITHUB_REPO = 'hyperdag';  // Update this with your actual repository name
const GITHUB_BRANCH = 'main';    // Or your preferred branch name

// Function to set up Git if not already configured
async function setupGit() {
  try {
    // Check if git is already initialized
    if (!fs.existsSync('.git')) {
      console.log('Initializing Git repository...');
      execSync('git init');
    }

    // Check if remote is already set
    try {
      const remoteOutput = execSync('git remote -v').toString();
      if (!remoteOutput.includes('origin')) {
        console.log('Setting up GitHub remote...');
        execSync(`git remote add origin https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git`);
      }
    } catch (error) {
      console.log('Setting up GitHub remote...');
      execSync(`git remote add origin https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git`);
    }

    // Configure Git user
    execSync('git config user.name "HyperDAG Deployment"');
    execSync('git config user.email "deploy@hyperdag.org"');

    return true;
  } catch (error) {
    console.error('Error setting up Git:', error.message);
    return false;
  }
}

// Function to generate a meaningful commit message
function generateCommitMessage() {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0];
  
  // Try to get meaningful info about what changed
  let commitPrefix = 'Update';
  
  try {
    // Get file changes
    const changes = execSync('git diff --name-only --cached').toString().trim();
    const changedFiles = changes.split('\n').filter(Boolean);
    
    // Analyze changes to create a more meaningful message
    if (changedFiles.some(file => file.includes('ssl'))) {
      commitPrefix = 'Fix SSL configuration';
    } else if (changedFiles.some(file => file.includes('integration'))) {
      commitPrefix = 'Update integrations';
    } else if (changedFiles.some(file => file.includes('deploy'))) {
      commitPrefix = 'Improve deployment process';
    } else if (changedFiles.some(file => file.startsWith('client/'))) {
      commitPrefix = 'Update frontend';
    } else if (changedFiles.some(file => file.startsWith('server/'))) {
      commitPrefix = 'Update backend';
    }
  } catch (error) {
    // If we can't analyze changes, use a generic message
    console.log('Could not analyze changes, using generic commit message');
  }
  
  return `${commitPrefix}: deployment update ${date} ${time}`;
}

// Main sync function
async function syncToGitHub() {
  console.log('Starting GitHub sync process...');
  
  try {
    // Set up Git if needed
    const setupSuccess = await setupGit();
    if (!setupSuccess) {
      throw new Error('Failed to set up Git');
    }
    
    // Pull latest changes to avoid conflicts
    try {
      console.log('Pulling latest changes...');
      execSync(`git pull origin ${GITHUB_BRANCH}`);
    } catch (error) {
      console.warn('Warning: Could not pull latest changes:', error.message);
      console.log('Continuing with sync process...');
    }
    
    // Add all changes
    console.log('Adding changes...');
    execSync('git add .');
    
    // Create commit with meaningful message
    const commitMessage = generateCommitMessage();
    console.log(`Creating commit: "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`);
    
    // Push to GitHub
    console.log('Pushing to GitHub...');
    
    // Note: For this to work automatically, you'll need to set up:
    // 1. GitHub Personal Access Token in GITHUB_TOKEN environment variable, or
    // 2. SSH key authentication for GitHub
    
    const pushCommand = process.env.GITHUB_TOKEN 
      ? `git push https://${GITHUB_USER}:${process.env.GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git ${GITHUB_BRANCH}`
      : `git push origin ${GITHUB_BRANCH}`;
    
    execSync(pushCommand);
    
    console.log('✅ Successfully synced changes to GitHub!');
    return true;
  } catch (error) {
    console.error('❌ Error syncing to GitHub:', error.message);
    console.log('Please check if:');
    console.log('1. You have the correct GitHub access (token or SSH key)');
    console.log('2. The repository exists and you have push access');
    console.log('3. There are no merge conflicts');
    return false;
  }
}

// Run the function if this script is executed directly
if (process.argv[1].endsWith('github-sync.mjs')) {
  syncToGitHub().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default syncToGitHub;