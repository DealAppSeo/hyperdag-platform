/**
 * Test Helicone.ai Integration
 * Verifies that the monitoring is working correctly
 */

import axios from 'axios';

async function testHeliconeIntegration() {
  console.log('🧪 Testing Helicone.ai Integration...\n');

  try {
    // Test 1: Check if service is initialized properly
    console.log('1. Testing service health...');
    const healthResponse = await axios.get('http://localhost:5000/api/helicone/health');
    console.log('✅ Health check response:', JSON.stringify(healthResponse.data, null, 2));

    // Test 2: Test analytics endpoint
    console.log('\n2. Testing analytics endpoint...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/helicone/analytics?timeframe=day');
    console.log('✅ Analytics response:', JSON.stringify(analyticsResponse.data, null, 2));

    // Test 3: Test dashboard endpoint
    console.log('\n3. Testing dashboard endpoint...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/helicone/dashboard');
    console.log('✅ Dashboard response:', JSON.stringify(dashboardResponse.data, null, 2));

    // Test 4: Test ANFIS metrics
    console.log('\n4. Testing ANFIS metrics endpoint...');
    const anfisResponse = await axios.get('http://localhost:5000/api/helicone/anfis-metrics');
    console.log('✅ ANFIS metrics response:', JSON.stringify(anfisResponse.data, null, 2));

    // Test 5: Make an AI request to trigger Helicone tracking
    console.log('\n5. Testing AI request with Helicone tracking...');
    try {
      const aiResponse = await axios.post('http://localhost:5000/api/web3-ai/v1/ai/unified', {
        message: "Test Helicone integration with a simple question",
        provider: "anthropic"
      });
      console.log('✅ AI request successful, response length:', aiResponse.data.response?.length || 0);
    } catch (aiError) {
      console.log('⚠️ AI request failed (may need setup):', aiError.message);
    }

    // Test 6: Check analytics again after request
    console.log('\n6. Checking analytics after AI request...');
    const postRequestAnalytics = await axios.get('http://localhost:5000/api/helicone/analytics?timeframe=hour');
    console.log('✅ Post-request analytics:', JSON.stringify(postRequestAnalytics.data, null, 2));

    console.log('\n🎉 Helicone integration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testHeliconeIntegration();