/**
 * Example usage of the HyperDAG SDK
 * 
 * This file demonstrates how to use the HyperDAG SDK to interact with the platform.
 */

import HyperDAGSDK from './index';

async function main() {
  // Initialize the SDK with configuration options
  const sdk = new HyperDAGSDK({
    baseUrl: 'http://localhost:5000/api/v1',
    debug: true
  });
  
  console.log('Connecting to HyperDAG...');
  
  // Connect to the platform
  const connected = await sdk.connect();
  
  if (!connected) {
    console.error('Failed to connect to HyperDAG');
    return;
  }
  
  console.log('Successfully connected to HyperDAG');
  
  try {
    // Get network metrics
    console.log('Fetching network metrics...');
    const metrics = await sdk.getNetworkMetrics();
    console.log('Network metrics:', metrics);
    
    // Create a new project
    console.log('Creating a new project...');
    const projectParams = {
      title: 'Sample DApp Project',
      description: 'A decentralized application built on HyperDAG',
      type: 'rfp' as const,
      categories: ['dapp', 'finance', 'web3'],
      teamRoles: ['developer', 'designer', 'marketer'],
      fundingGoal: 1000,
      durationDays: 30,
      stakeTokens: true
    };
    
    const projectId = await sdk.createProject(projectParams);
    console.log(`Project created with ID: ${projectId}`);
    
    // Match teams for the project
    console.log('Finding teams for the project...');
    const teams = await sdk.matchTeams(projectId);
    console.log(`Found ${teams.length} potential teams:`);
    teams.forEach((team, index) => {
      console.log(`Team ${index + 1}: ${team.members.length} members, Match Score: ${team.matchScore}`);
      console.log(`  Completed Roles: ${team.completedRoles.join(', ')}`);
      console.log(`  Missing Roles: ${team.missingRoles.join(', ')}`);
    });
    
    // Get token balance
    console.log('Fetching token balance...');
    const balance = await sdk.getTokenBalance();
    console.log(`Current token balance: ${balance} HDAG`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Uncomment this line to run the example
// main().catch(console.error);

/**
 * Browser Implementation Example
 * 
 * This code demonstrates how to use the SDK in a browser environment.
 */
async function browserImplementation() {
  // Initialize the SDK
  const sdk = new HyperDAGSDK({
    debug: true
  });
  
  // Connect using MetaMask or other Web3 provider
  const connectButton = document.getElementById('connect-button');
  connectButton?.addEventListener('click', async () => {
    try {
      const connected = await sdk.connect();
      if (connected) {
        console.log('Connected to Web3 wallet');
        // Update UI to show connected state
        document.getElementById('connection-status')?.textContent = 'Connected';
      } else {
        console.error('Failed to connect');
        // Update UI to show error
        document.getElementById('connection-status')?.textContent = 'Connection Failed';
      }
    } catch (error) {
      console.error('Error connecting:', error);
    }
  });
  
  // Create project button handler
  const createProjectButton = document.getElementById('create-project-button');
  createProjectButton?.addEventListener('click', async () => {
    try {
      // Get values from form fields
      const title = (document.getElementById('project-title') as HTMLInputElement)?.value;
      const description = (document.getElementById('project-description') as HTMLTextAreaElement)?.value;
      const type = (document.querySelector('input[name="project-type"]:checked') as HTMLInputElement)?.value;
      const categoriesInput = (document.getElementById('project-categories') as HTMLInputElement)?.value;
      const categories = categoriesInput.split(',').map(c => c.trim());
      
      const projectId = await sdk.createProject({
        title,
        description,
        type: type as 'rfi' | 'rfp',
        categories
      });
      
      console.log(`Project created with ID: ${projectId}`);
      // Update UI to show success
      document.getElementById('project-status')?.textContent = `Project created with ID: ${projectId}`;
    } catch (error) {
      console.error('Error creating project:', error);
      // Update UI to show error
      document.getElementById('project-status')?.textContent = `Error: ${error.message}`;
    }
  });
}

// Export for documentation purposes
export { main, browserImplementation };
