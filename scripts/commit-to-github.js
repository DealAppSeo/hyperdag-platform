/**
 * GitHub Integration Script for HyperDAG
 * 
 * This script automates the process of committing code to the @Dealappseo GitHub account.
 * It handles creating a new repository if needed, setting up remote origin, and pushing changes.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration (modify as needed)
const CONFIG = {
  githubUsername: 'Dealappseo',
  defaultCommitMessage: 'Update HyperDAG platform with latest features and fixes',
  repoName: 'hyperdag-platform',
  branchName: 'main'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompts the user for input with the given question
 */
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Executes a shell command and returns the output
 */
function executeCommand(command, options = {}) {
  try {
    console.log(`Executing: ${command}`);
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      console.warn(`Command failed, but continuing: ${command}`);
      console.warn(error.message);
      return '';
    }
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Checks if git is configured with user credentials
 */
function checkGitConfig() {
  try {
    const name = execSync('git config --global user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const email = execSync('git config --global user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
    
    return { configured: name && email, name, email };
  } catch (error) {
    return { configured: false };
  }
}

/**
 * Configure git with user credentials
 */
async function configureGit() {
  const config = checkGitConfig();
  
  if (!config.configured) {
    console.log('Git is not configured with user credentials.');
    const name = await question('Enter your name for Git commits: ');
    const email = await question('Enter your email for Git commits: ');
    
    executeCommand(`git config --global user.name "${name}"`);
    executeCommand(`git config --global user.email "${email}"`);
    console.log('Git configured successfully.');
  } else {
    console.log(`Git already configured for: ${config.name} <${config.email}>`);
  }
}

/**
 * Check if the directory is a git repository
 */
function isGitRepo() {
  try {
    return fs.existsSync(path.join(process.cwd(), '.git'));
  } catch (error) {
    return false;
  }
}

/**
 * Initialize a new git repository
 */
function initGitRepo() {
  if (!isGitRepo()) {
    console.log('Initializing new git repository...');
    executeCommand('git init');
  } else {
    console.log('Git repository already initialized.');
  }
}

/**
 * Create .gitignore file if it doesn't exist
 */
function createGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('Creating .gitignore file...');
    const gitignoreContent = `
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# HyperDAG specific
keypairs/
temp_w3cli/
circuits/artifacts/
circuits/cache/
circuits/test/
`;
    fs.writeFileSync(gitignorePath, gitignoreContent.trim());
    console.log('.gitignore file created.');
  } else {
    console.log('.gitignore file already exists.');
  }
}

/**
 * Check if GitHub authentication is set up
 */
async function checkGitHubAuth() {
  try {
    // Try to list repos (will fail if not authenticated)
    executeCommand('gh auth status', { silent: true });
    return true;
  } catch (error) {
    console.log('GitHub CLI authentication needed.');
    console.log('Please follow the authentication process...');
    try {
      executeCommand('gh auth login');
      return true;
    } catch (error) {
      console.error('Failed to authenticate with GitHub:', error.message);
      return false;
    }
  }
}

/**
 * Check if repository exists on GitHub
 */
async function repoExists(repoName) {
  try {
    const output = executeCommand(`gh repo view ${CONFIG.githubUsername}/${repoName}`, { 
      silent: true, 
      ignoreError: true 
    });
    return !output.includes('Not Found');
  } catch (error) {
    return false;
  }
}

/**
 * Create a new repository on GitHub
 */
async function createRepository(repoName) {
  if (await repoExists(repoName)) {
    console.log(`Repository ${CONFIG.githubUsername}/${repoName} already exists.`);
    return true;
  }
  
  const description = 'HyperDAG platform: Web3 collaborative ecosystem with hybrid DAG/blockchain architecture';
  
  try {
    console.log(`Creating new repository: ${repoName}...`);
    executeCommand(`gh repo create ${CONFIG.githubUsername}/${repoName} --public --description "${description}"`);
    return true;
  } catch (error) {
    console.error('Failed to create repository:', error.message);
    return false;
  }
}

/**
 * Configure git remote 
 */
async function configureRemote(repoName) {
  try {
    // Check if remote exists
    const remotes = executeCommand('git remote -v', { silent: true, ignoreError: true });
    
    if (!remotes.includes('origin')) {
      console.log('Setting up git remote...');
      executeCommand(`git remote add origin https://github.com/${CONFIG.githubUsername}/${repoName}.git`);
    } else if (!remotes.includes(`${CONFIG.githubUsername}/${repoName}`)) {
      console.log('Updating git remote...');
      executeCommand('git remote remove origin');
      executeCommand(`git remote add origin https://github.com/${CONFIG.githubUsername}/${repoName}.git`);
    } else {
      console.log('Git remote already configured correctly.');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to configure remote:', error.message);
    return false;
  }
}

/**
 * Commit and push changes to GitHub
 */
async function commitAndPush() {
  try {
    // Get commit message
    let commitMessage = await question(`Enter commit message (press Enter for default: "${CONFIG.defaultCommitMessage}"): `);
    if (!commitMessage.trim()) {
      commitMessage = CONFIG.defaultCommitMessage;
    }
    
    // Commit changes
    console.log('Adding all changes...');
    executeCommand('git add .');
    
    console.log('Committing changes...');
    executeCommand(`git commit -m "${commitMessage}"`);
    
    // Push to GitHub
    console.log('Pushing to GitHub...');
    executeCommand(`git push -u origin ${CONFIG.branchName}`);
    
    console.log('Successfully pushed changes to GitHub!');
    console.log(`Repository: https://github.com/${CONFIG.githubUsername}/${CONFIG.repoName}`);
    
    return true;
  } catch (error) {
    console.error('Failed to commit and push changes:', error.message);
    return false;
  }
}

/**
 * Main function to run the GitHub integration
 */
async function main() {
  try {
    console.log('=== HyperDAG GitHub Integration ===');
    
    // Ensure git is configured
    await configureGit();
    
    // Initialize git repo if needed
    initGitRepo();
    
    // Create gitignore if needed
    createGitignore();
    
    // Check GitHub CLI authentication
    const authenticated = await checkGitHubAuth();
    if (!authenticated) {
      console.error('GitHub authentication failed. Please try again.');
      process.exit(1);
    }
    
    // Get repo name
    let repoName = await question(`Enter repository name (press Enter for default: "${CONFIG.repoName}"): `);
    if (!repoName.trim()) {
      repoName = CONFIG.repoName;
    }
    
    // Create repository if needed
    const repoCreated = await createRepository(repoName);
    if (!repoCreated) {
      console.error('Repository creation failed. Please try again.');
      process.exit(1);
    }
    
    // Configure remote
    const remoteConfigured = await configureRemote(repoName);
    if (!remoteConfigured) {
      console.error('Remote configuration failed. Please try again.');
      process.exit(1);
    }
    
    // Commit and push changes
    const pushed = await commitAndPush();
    if (!pushed) {
      console.error('Failed to push changes. Please try again.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
main();