#!/usr/bin/env node

/**
 * Blockchain Status Check Script
 * 
 * This script checks the blockchain testnet connections for Polygon, Solana, and IOTA.
 * It directly imports and uses the service modules to check connection status.
 */

import { polygonService } from '../server/services/polygon-service.js';
import { solanaService } from '../server/services/solana-service.js';
import { iotaService } from '../server/services/iota-service.js';

async function checkBlockchainStatus() {
  console.log('\n=== HyperDAG Blockchain Status Check ===\n');
  
  // Check Polygon connection
  try {
    console.log('Testing Polygon zkEVM Cardona Testnet connection...');
    const polygonStatus = await polygonService.getNetworkStatus();
    console.log(`✓ Polygon status: ${polygonStatus.status}`);
    console.log(`  Network ID: ${polygonStatus.networkId}`);
    if (polygonStatus.networkName) {
      console.log(`  Network Name: ${polygonStatus.networkName}`);
    }
  } catch (error) {
    console.error(`❌ Polygon connection error: ${error.message}`);
  }
  
  // Check Solana connection
  try {
    console.log('\nTesting Solana Testnet connection...');
    const solanaStatus = await solanaService.getNetworkStatus();
    console.log(`✓ Solana status: ${solanaStatus.status}`);
    console.log(`  Endpoint: ${solanaStatus.endpoint}`);
  } catch (error) {
    console.error(`❌ Solana connection error: ${error.message}`);
  }
  
  // Check IOTA connection
  try {
    console.log('\nTesting IOTA Testnet connection...');
    const iotaStatus = await iotaService.getNetworkStatus();
    console.log(`✓ IOTA status: ${iotaStatus.status}`);
    console.log(`  Endpoint: ${iotaStatus.endpoint}`);
  } catch (error) {
    console.error(`❌ IOTA connection error: ${error.message}`);
  }
  
  console.log('\n=== Status Check Complete ===\n');
}

checkBlockchainStatus().catch(console.error);