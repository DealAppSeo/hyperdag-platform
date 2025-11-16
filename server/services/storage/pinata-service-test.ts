/**
 * Simple test file for Pinata Service
 * Tests service initialization and basic functionality
 */

import { pinataService } from './pinata-service';

async function testPinataService() {
  console.log('=== Testing Pinata Service ===');
  
  // Test service initialization
  console.log('Service stats:', JSON.stringify(pinataService.getStats(), null, 2));
  
  // Test availability
  console.log('Service available:', pinataService.isAvailable());
  
  // Test quota info
  const quota = pinataService.getRemainingQuota();
  if (quota) {
    console.log('Quota info:', JSON.stringify(quota, null, 2));
  } else {
    console.log('Quota info not available (service may not be initialized)');
  }
  
  // Test gateway URL generation
  const testHash = 'QmTest123456789';
  console.log('Gateway URL:', pinataService.getGatewayUrl(testHash));
  console.log('Shareable URL:', pinataService.generateShareableUrl(testHash, { 
    filename: 'test.json',
    download: true 
  }));
  
  // Test authentication (if credentials are available)
  try {
    const isAuthenticated = await pinataService.testAuthentication();
    console.log('Authentication test:', isAuthenticated ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.log('Authentication test: ERROR -', error);
  }
  
  console.log('=== Test Complete ===');
}

// Test can be run independently when needed
// testPinataService().catch(console.error);

export { testPinataService };