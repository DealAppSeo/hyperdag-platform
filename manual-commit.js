/**
 * Manual GitHub Commit Script for HyperDAG
 * Creates a commit summary of changes without interactive prompts
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('=== HyperDAG Manual Commit Summary ===');

// Check git status
try {
  console.log('\n--- Git Status ---');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status) {
    console.log('Modified files:');
    console.log(status);
  } else {
    console.log('No changes detected.');
  }

  // Add all changes
  console.log('\n--- Adding Changes ---');
  execSync('git add .', { stdio: 'inherit' });

  // Create commit message
  const commitMessage = `HyperDAG Security Update: Fixed critical XSS vulnerabilities, added authentication guards, and resolved JSX syntax errors

Security Fixes:
- Removed dangerous dangerouslySetInnerHTML usage
- Fixed JSX syntax errors in documentation page  
- Implemented authentication middleware
- Added proper null checking for user authentication
- Applied security guards to all protected routes

Ready for production deployment with enterprise-grade security.`;

  console.log('\n--- Creating Commit ---');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  console.log('\n--- Commit Summary ---');
  execSync('git log --oneline -1', { stdio: 'inherit' });

  console.log('\n✅ Local commit completed successfully!');
  console.log('\nTo push to GitHub, you can:');
  console.log('1. Set up a GitHub token as GITHUB_TOKEN environment variable');
  console.log('2. Or manually push using: git push origin main');

} catch (error) {
  console.error('Error during commit:', error.message);
}