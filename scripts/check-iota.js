/**
 * Simple IOTA Connection Check Script
 * 
 * This script tests connectivity to public IOTA nodes
 */

// Basic fetch request to test IOTA node
async function checkIotaConnection() {
  console.log('Testing IOTA node connections...');
  
  // Try multiple public IOTA nodes
  const nodeUrls = [
    'https://chrysalis-nodes.iota.org',
    'https://mainnet.tanglebay.com',
    'https://api.hornet-1.testnet.chrysalis2.com'
  ];
  
  let connectedToAny = false;
  
  for (const nodeUrl of nodeUrls) {
    try {
      console.log(`\nTrying to connect to ${nodeUrl}...`);
      
      // Simple API path that most nodes support
      const apiPath = '/api/v1/info';
      console.log(`Requesting ${nodeUrl}${apiPath}...`);
      
      const response = await fetch(`${nodeUrl}${apiPath}`);
      
      if (response.ok) {
        console.log('✓ Successfully connected to IOTA node!');
        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        try {
          const info = await response.json();
          console.log('✓ Node info retrieved:');
          console.log(JSON.stringify(info, null, 2));
          connectedToAny = true;
          break;
        } catch (parseError) {
          console.log(`  Note: Couldn't parse response as JSON: ${parseError.message}`);
        }
      } else {
        console.log(`✕ Failed to connect: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`✕ Connection failed: ${error.message}`);
    }
  }
  
  if (!connectedToAny) {
    console.log('\n✕ Could not connect to any public IOTA nodes.');
    console.log('This could be due to:');
    console.log('  - Network connectivity issues');
    console.log('  - The nodes being temporarily unavailable');
    console.log('  - API format changes');
    console.log('\nFor proper IOTA integration, we recommend:');
    console.log('  - Setting the IOTA_NODE_URL environment variable to a working node');
    console.log('  - Obtaining an API key if the node requires authentication');
  } else {
    console.log('\n✓ IOTA connectivity test passed!');
    console.log('You can now integrate IOTA into your blockchain redundancy strategy.');
  }
}

// Run the check
checkIotaConnection().catch(console.error);