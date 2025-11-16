/**
 * Test Blockchain Status Script
 * 
 * This script directly imports the blockchain services and tests their status
 * without needing to go through the API endpoints.
 */

// Import services directly from their modules
import { polygonService } from '../server/services/polygon-service.js';
import { solanaService } from '../server/services/solana-service.js';
import { iotaService } from '../server/services/iota-service.js';
import { stellarService } from '../server/services/stellar-service.js';

async function checkBlockchainStatus() {
  console.log('\n=== HyperDAG Blockchain Status Check ===\n');
  
  // Check Polygon connection
  try {
    console.log('Testing Polygon connection...');
    const polygonStatus = await polygonService.getNetworkStatus();
    console.log(`✓ Polygon status: ${polygonStatus.status}`);
    console.log(`  Network: ${polygonStatus.networkName || 'Unknown'}`);
    console.log(`  Chain ID: ${polygonStatus.networkId || 'Unknown'}`);
    if (polygonStatus.blockNumber) {
      console.log(`  Block number: ${polygonStatus.blockNumber}`);
    }
  } catch (error) {
    console.error(`❌ Polygon connection error: ${error.message}`);
  }
  
  // Check Solana connection
  try {
    console.log('\nTesting Solana connection...');
    const solanaStatus = await solanaService.getNetworkStatus();
    console.log(`✓ Solana status: ${solanaStatus.status}`);
    console.log(`  Endpoint: ${solanaStatus.endpoint || 'Unknown'}`);
  } catch (error) {
    console.error(`❌ Solana connection error: ${error.message}`);
  }
  
  // Check IOTA connection
  try {
    console.log('\nTesting IOTA connection...');
    const iotaStatus = await iotaService.getNetworkStatus();
    console.log(`✓ IOTA status: ${iotaStatus.status}`);
    console.log(`  Endpoint: ${iotaStatus.endpoint || 'Unknown'}`);
    if (iotaStatus.networkId) {
      console.log(`  Network ID: ${iotaStatus.networkId}`);
    }
    if (iotaStatus.version) {
      console.log(`  Version: ${iotaStatus.version}`);
    }
  } catch (error) {
    console.error(`❌ IOTA connection error: ${error.message}`);
  }
  
  // Check Stellar connection
  try {
    console.log('\nTesting Stellar connection...');
    const stellarStatus = await stellarService.getNetworkStatus();
    console.log(`✓ Stellar status: ${stellarStatus.status}`);
    console.log(`  Endpoint: ${stellarStatus.endpoint || 'Unknown'}`);
  } catch (error) {
    console.error(`❌ Stellar connection error: ${error.message}`);
  }
  
  console.log('\n=== Status Check Complete ===\n');
}

// Run the check
checkBlockchainStatus().catch(console.error);