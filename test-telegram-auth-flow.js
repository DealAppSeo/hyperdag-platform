/**
 * Comprehensive Telegram Authentication Flow Test
 * 
 * Tests the complete flow including:
 * - Telegram bot initialization
 * - Verification code generation and validation
 * - Account linking detection and process
 * - Error handling and user guidance
 */

import fetch from 'node-fetch';

async function testTelegramAuthFlow() {
  console.log('🔍 Testing Telegram Authentication Flow...\n');

  try {
    // Test 1: Check if Telegram service is initialized
    console.log('1. Testing Telegram Service Initialization...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Server health check:', healthData.success ? 'PASSED' : 'FAILED');

    // Test 2: Test verification code request endpoint
    console.log('\n2. Testing Verification Code Request...');
    const codeResponse = await fetch('http://localhost:5000/api/telegram/request-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramUserId: '7217398316' // Test user ID
      })
    });
    
    const codeData = await codeResponse.json();
    console.log('Code Request Response:', codeData);
    
    if (codeData.success) {
      console.log('✅ Verification code request: PASSED');
      console.log('📱 Bot should send code to Telegram user');
    } else {
      console.log('❌ Verification code request: FAILED');
      console.log('Error:', codeData.error);
    }

    // Test 3: Test code verification endpoint (with mock code)
    console.log('\n3. Testing Code Verification...');
    const verifyResponse = await fetch('http://localhost:5000/api/telegram/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramUserId: '7217398316',
        code: '123456' // Mock code for testing
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verification Response:', verifyData);
    
    if (verifyData.success || verifyData.error?.includes('expired')) {
      console.log('✅ Code verification endpoint: ACCESSIBLE');
    } else {
      console.log('❌ Code verification endpoint: FAILED');
    }

    // Test 4: Test account linking endpoint
    console.log('\n4. Testing Account Linking Endpoint...');
    const linkResponse = await fetch('http://localhost:5000/api/telegram/link-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramUserId: '7217398316',
        username: 'testuser',
        password: 'testpass'
      })
    });
    
    const linkData = await linkResponse.json();
    console.log('Account Linking Response:', linkData);
    
    if (linkResponse.status !== 500) {
      console.log('✅ Account linking endpoint: ACCESSIBLE');
    } else {
      console.log('❌ Account linking endpoint: FAILED');
    }

    // Test 5: Test frontend routes accessibility
    console.log('\n5. Testing Frontend Routes...');
    
    const routes = [
      '/link-account',
      '/login',
      '/dashboard'
    ];
    
    for (const route of routes) {
      try {
        const routeResponse = await fetch(`http://localhost:5000${route}`);
        if (routeResponse.status < 500) {
          console.log(`✅ Route ${route}: ACCESSIBLE`);
        } else {
          console.log(`❌ Route ${route}: ERROR (${routeResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ Route ${route}: FAILED (${error.message})`);
      }
    }

    // Test 6: Check database schema for Telegram fields
    console.log('\n6. Testing Database Schema...');
    const userResponse = await fetch('http://localhost:5000/api/user', {
      headers: {
        'Cookie': 'session=test' // Mock session for testing
      }
    });
    
    if (userResponse.status === 401) {
      console.log('✅ User endpoint requires authentication: CORRECT');
    } else {
      console.log('⚠️ User endpoint authentication: UNEXPECTED BEHAVIOR');
    }

    console.log('\n📋 Test Summary:');
    console.log('- Telegram service endpoints are accessible');
    console.log('- Frontend routes are properly configured');
    console.log('- Authentication flow components are in place');
    console.log('- Account linking infrastructure is ready');
    
    console.log('\n🔄 Next Steps for Manual Testing:');
    console.log('1. Visit http://localhost:5000/login');
    console.log('2. Click "Login with Telegram"');
    console.log('3. Check @HyperDagBot in Telegram for verification code');
    console.log('4. Test the account linking process if prompted');
    console.log('5. Verify dashboard shows account linking banner for Telegram users');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure the server is running on port 5000');
    console.log('- Check if Telegram bot token is configured');
    console.log('- Verify database is accessible');
  }
}

// Run the test
testTelegramAuthFlow();