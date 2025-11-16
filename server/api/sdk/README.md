# HyperDAG Developer SDK

The HyperDAG Developer SDK provides a simple and intuitive way to interact with the HyperDAG platform. It includes functionality for creating projects, matching teams, and interacting with the blockchain.

## Installation

To install the SDK, use npm or yarn:

```bash
npm install hyperdag-sdk
# or
yarn add hyperdag-sdk
```

## Getting Started

### Node.js Environment

```javascript
const { HyperDAGSDK } = require('hyperdag-sdk');
// or using ES modules
import { HyperDAGSDK } from 'hyperdag-sdk';

// Initialize the SDK
const sdk = new HyperDAGSDK({
  baseUrl: 'https://api.hyperdag.com/v1',
  apiKey: 'YOUR_API_KEY', // Optional
  debug: true // Optional
});

// Connect to the platform
const connected = await sdk.connect();

if (connected) {
  console.log('Successfully connected to HyperDAG');
} else {
  console.error('Failed to connect to HyperDAG');
}
```

### Browser Environment

```javascript
import { HyperDAGSDK } from 'hyperdag-sdk';

// Initialize the SDK
const sdk = new HyperDAGSDK({
  debug: true // Optional
});

// Connect using MetaMask or other Web3 provider
const connectButton = document.getElementById('connect-button');
connectButton.addEventListener('click', async () => {
  const connected = await sdk.connect();
  if (connected) {
    console.log('Connected to Web3 wallet');
  } else {
    console.error('Failed to connect');
  }
});
```

## Core Functionality

### Creating a Project

```javascript
// Define project parameters
const projectParams = {
  title: 'My New Project',
  description: 'A decentralized application built on HyperDAG',
  type: 'rfp', // 'rfi' for Request for Information, 'rfp' for Request for Proposal
  categories: ['dapp', 'finance', 'web3'],
  teamRoles: ['developer', 'designer', 'marketer'], // Optional
  fundingGoal: 1000, // Optional
  durationDays: 30, // Optional
  stakeTokens: true // Optional
};

// Create the project
const projectId = await sdk.createProject(projectParams);
console.log(`Project created with ID: ${projectId}`);
```

### Matching Teams

```javascript
// Find teams for a project
const teams = await sdk.matchTeams(projectId);
console.log(`Found ${teams.length} potential teams`);

// Process teams
teams.forEach(team => {
  console.log(`Team with ${team.members.length} members`);
  console.log(`Match Score: ${team.matchScore}`);
  console.log(`Completed Roles: ${team.completedRoles.join(', ')}`);
  console.log(`Missing Roles: ${team.missingRoles.join(', ')}`);
});
```

### Getting Network Metrics

```javascript
// Get transaction metrics for the HyperDAG network
const metrics = await sdk.getNetworkMetrics();
console.log('Current TPS:', metrics.tps);
console.log('Average Latency:', metrics.averageLatency, 'ms');
console.log('Confirmed Transactions:', metrics.confirmedTxs);
```

### Managing Tokens

```javascript
// Get token balance
const balance = await sdk.getTokenBalance();
console.log(`Current token balance: ${balance} HDAG`);

// Submit a transaction
const txData = {
  // Transaction data...
};
const txHash = await sdk.submitTransaction(txData);
console.log(`Transaction submitted with hash: ${txHash}`);
```

## Error Handling

The SDK uses a consistent error handling pattern. All methods throw errors with descriptive messages when something goes wrong.

```javascript
try {
  const projectId = await sdk.createProject(projectParams);
  console.log(`Project created with ID: ${projectId}`);
} catch (error) {
  console.error('An error occurred:', error.message);
}
```

## Configuration Options

The SDK constructor accepts the following options:

- `baseUrl`: The base URL of the HyperDAG API. Defaults to 'http://localhost:5000/api'.
- `apiKey`: Your API key for authentication. Required for server-to-server communications.
- `network`: The network to connect to. Can be 'mainnet', 'testnet', or 'localhost'. Defaults to 'testnet'.
- `debug`: Whether to enable debug logging. Defaults to false.

## API Reference

For a complete API reference, see the [HyperDAG API Documentation](../README.md).

## Example Usage

For a complete example of using the SDK, see [example-usage.ts](./example-usage.ts).

## License

This SDK is licensed under the MIT License.
