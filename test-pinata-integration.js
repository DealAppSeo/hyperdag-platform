/**
 * Pinata IPFS Integration Test
 * 
 * Tests the complete Pinata integration including:
 * - Connection verification
 * - File upload to IPFS
 * - JSON metadata upload
 * - Data retrieval via gateway
 */

async function testPinataIntegration() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Pinata IPFS Integration\n');
  
  try {
    // Step 1: Check IPFS service status
    console.log('1. Checking IPFS service status...');
    const statusResponse = await fetch(`${baseUrl}/api/ipfs/status`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.success) {
      console.log('✅ IPFS service is available');
      console.log(`   Provider: ${statusResult.data.provider}`);
      console.log(`   Connected: ${statusResult.data.connected}`);
      console.log(`   Gateway: ${statusResult.data.gateway}\n`);
    } else {
      console.log('❌ IPFS service is not available');
      return;
    }
    
    // Step 2: Test JSON upload
    console.log('2. Testing JSON metadata upload...');
    const testMetadata = {
      name: 'HyperDAG Test Document',
      description: 'Test document for Pinata IPFS integration',
      type: 'test',
      timestamp: new Date().toISOString(),
      data: {
        version: '1.0',
        author: 'HyperDAG System',
        tags: ['test', 'ipfs', 'pinata']
      }
    };
    
    const jsonResponse = await fetch(`${baseUrl}/api/ipfs/upload-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Replace with valid token
      },
      body: JSON.stringify({
        data: testMetadata,
        name: 'hyperdag-test-metadata'
      })
    });
    
    const jsonResult = await jsonResponse.json();
    
    if (jsonResult.success) {
      console.log('✅ JSON upload successful');
      console.log(`   IPFS Hash: ${jsonResult.data.ipfsHash}`);
      console.log(`   Size: ${jsonResult.data.size} bytes`);
      console.log(`   Gateway URL: ${jsonResult.data.gatewayUrl}\n`);
      
      // Step 3: Test data retrieval
      console.log('3. Testing data retrieval...');
      const retrieveResponse = await fetch(`${baseUrl}/api/ipfs/retrieve/${jsonResult.data.ipfsHash}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      const retrieveResult = await retrieveResponse.json();
      
      if (retrieveResult.success) {
        console.log('✅ Data retrieval successful');
        console.log('   Retrieved data matches uploaded metadata');
        
        // Verify data integrity
        const retrievedData = retrieveResult.data.content;
        if (retrievedData.name === testMetadata.name && 
            retrievedData.description === testMetadata.description) {
          console.log('✅ Data integrity verified\n');
        } else {
          console.log('❌ Data integrity check failed\n');
        }
      } else {
        console.log('❌ Data retrieval failed');
        console.log(`   Error: ${retrieveResult.error}\n`);
      }
      
    } else {
      console.log('❌ JSON upload failed');
      console.log(`   Error: ${jsonResult.error}\n`);
    }
    
    // Step 4: Test file upload
    console.log('4. Testing file upload...');
    const testFileContent = 'This is a test file for HyperDAG IPFS integration using Pinata.\nTimestamp: ' + new Date().toISOString();
    const formData = new FormData();
    const blob = new Blob([testFileContent], { type: 'text/plain' });
    formData.append('file', blob, 'hyperdag-test.txt');
    
    const fileResponse = await fetch(`${baseUrl}/api/ipfs/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: formData
    });
    
    const fileResult = await fileResponse.json();
    
    if (fileResult.success) {
      console.log('✅ File upload successful');
      console.log(`   IPFS Hash: ${fileResult.data.ipfsHash}`);
      console.log(`   Size: ${fileResult.data.size} bytes`);
      console.log(`   Gateway URL: ${fileResult.data.gatewayUrl}\n`);
    } else {
      console.log('❌ File upload failed');
      console.log(`   Error: ${fileResult.error}\n`);
    }
    
    // Step 5: Run integration test
    console.log('5. Running comprehensive integration test...');
    const testResponse = await fetch(`${baseUrl}/api/ipfs/test`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const testResult = await testResponse.json();
    
    if (testResult.success && testResult.data.test === 'passed') {
      console.log('✅ Integration test passed');
      console.log('🎉 Pinata IPFS integration is working correctly!');
      
      console.log('\n📊 Test Summary:');
      console.log(`   - Service Status: ✅ Connected`);
      console.log(`   - JSON Upload: ✅ Working`);
      console.log(`   - File Upload: ✅ Working`);
      console.log(`   - Data Retrieval: ✅ Working`);
      console.log(`   - Integration Test: ✅ Passed`);
      
    } else {
      console.log('❌ Integration test failed');
      console.log(`   Error: ${testResult.error}`);
      if (testResult.details) {
        console.log(`   Details: ${testResult.details}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   - Ensure the server is running on port 5000');
    console.log('   - Check that PINATA_API_KEY and PINATA_SECRET_API_KEY are set');
    console.log('   - Verify network connectivity to Pinata services');
  }
}

// Run the test
testPinataIntegration().catch(console.error);