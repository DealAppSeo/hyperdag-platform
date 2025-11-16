/**
 * Complete Logout Test - Forces complete session cleanup
 * 
 * This script performs a comprehensive logout that clears all sessions,
 * cookies, and cached data to enable testing of new user flows.
 */

import axios from 'axios';

async function testCompleteLogout() {
  try {
    console.log('🔄 Testing complete logout functionality...\n');
    
    const baseURL = 'http://localhost:5000';
    
    // Create axios instance with session persistence
    const client = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000
    });
    
    // Step 1: Check current authentication status
    console.log('1. Checking current authentication status...');
    try {
      const userResponse = await client.get('/api/user');
      console.log(`   ✓ Currently logged in as: ${userResponse.data.username} (ID: ${userResponse.data.id})`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✓ No active session found - already logged out');
        return;
      }
      throw error;
    }
    
    // Step 2: Perform complete logout
    console.log('\n2. Performing complete logout...');
    try {
      const logoutResponse = await client.post('/api/logout');
      console.log(`   ✓ Logout request successful: ${logoutResponse.status}`);
      if (logoutResponse.data?.message) {
        console.log(`   ✓ Server response: ${logoutResponse.data.message}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Logout request failed: ${error.message}`);
      console.log('   → Proceeding with session verification...');
    }
    
    // Step 3: Verify session is completely cleared
    console.log('\n3. Verifying session cleanup...');
    try {
      const verifyResponse = await client.get('/api/user');
      console.log(`   ❌ ERROR: Still authenticated as ${verifyResponse.data.username}`);
      console.log('   → Session persistence issue detected');
      
      // Additional cleanup attempt
      console.log('\n4. Attempting additional cleanup...');
      try {
        // Clear cookies manually
        client.defaults.headers.Cookie = '';
        delete client.defaults.headers.Cookie;
        
        // Test again
        const finalCheck = await client.get('/api/user');
        console.log(`   ❌ CRITICAL: Authentication still active for ${finalCheck.data.username}`);
        console.log('   → Manual session cleanup required');
      } catch (finalError) {
        if (finalError.response?.status === 401) {
          console.log('   ✓ Session successfully cleared after additional cleanup');
        }
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✓ Session successfully cleared - user is logged out');
        console.log('   ✓ Authentication endpoints returning 401 as expected');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Step 4: Test new user flow accessibility
    console.log('\n4. Testing new user flow accessibility...');
    try {
      // Test accessing pages that should be available to non-authenticated users
      const authPageResponse = await client.get('/auth');
      console.log('   ✓ Auth page accessible');
      
      // Test that protected endpoints are properly blocked
      try {
        await client.get('/api/projects');
        console.log('   ❌ Protected endpoints still accessible');
      } catch (protectedError) {
        if (protectedError.response?.status === 401) {
          console.log('   ✓ Protected endpoints properly blocked');
        }
      }
      
    } catch (error) {
      console.log(`   ⚠️  Navigation test failed: ${error.message}`);
    }
    
    console.log('\n📋 TESTING INSTRUCTIONS:');
    console.log('1. Open your browser and navigate to the application');
    console.log('2. You should now see the authentication/welcome page');
    console.log('3. Try registering a new account to test the onboarding flow');
    console.log('4. If you still see the dashboard, clear your browser cache and cookies manually');
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('- If auto-login persists, clear browser data (Ctrl+Shift+Delete)');
    console.log('- Try using an incognito/private browsing window');
    console.log('- Check browser developer tools for persistent cookies');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteLogout();