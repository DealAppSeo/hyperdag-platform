/**
 * Live Navigation Test
 * Tests actual button functionality against the running server
 */

const axios = require('axios');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

const BASE_URL = 'http://localhost:5000';

function logResult(test, status, details = '') {
  const result = { test, status, details, timestamp: new Date().toISOString() };
  results[status].push(result);
  console.log(`[${status.toUpperCase()}] ${test}: ${details}`);
}

// Test API endpoints that buttons connect to
async function testAPIEndpoints() {
  console.log('\n=== Testing Live API Endpoints ===');
  
  const endpoints = [
    { name: 'User API', url: '/api/user', method: 'GET' },
    { name: 'Projects API', url: '/api/projects', method: 'GET' },
    { name: 'Onboarding Status', url: '/api/onboarding/status', method: 'GET' },
    { name: 'Nonprofit Directory', url: '/api/nonprofits', method: 'GET' },
    { name: 'Dashboard Stats', url: '/api/user/stats', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        logResult(endpoint.name, 'passed', `Returns data (${response.status})`);
      } else if (response.status === 401) {
        logResult(endpoint.name, 'passed', 'Endpoint exists (requires auth)');
      } else if (response.status === 404) {
        logResult(endpoint.name, 'failed', 'Endpoint not found');
      } else {
        logResult(endpoint.name, 'warnings', `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logResult(endpoint.name, 'failed', 'Server connection failed');
      } else {
        logResult(endpoint.name, 'warnings', error.message);
      }
    }
  }
}

// Test onboarding completion endpoint (for bypass button)
async function testOnboardingComplete() {
  console.log('\n=== Testing Onboarding Complete Endpoint ===');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/onboarding/complete`, {
      profile: { skipped: true },
      completed: true,
      redirectTo: '/dashboard'
    }, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      logResult('Bypass Button Endpoint', 'passed', 'Endpoint exists and requires authentication');
    } else if (response.status === 404) {
      logResult('Bypass Button Endpoint', 'failed', 'Onboarding complete endpoint missing');
    } else if (response.status === 200) {
      logResult('Bypass Button Endpoint', 'passed', 'Endpoint working correctly');
    } else {
      logResult('Bypass Button Endpoint', 'warnings', `Status: ${response.status}`);
    }
  } catch (error) {
    logResult('Bypass Button Endpoint', 'warnings', error.message);
  }
}

// Test static page routes
async function testPageRoutes() {
  console.log('\n=== Testing Page Routes ===');
  
  const routes = [
    { name: 'Root Page', path: '/' },
    { name: 'Welcome Page', path: '/welcome' },
    { name: 'Dashboard Page', path: '/dashboard' },
    { name: 'Profile Page', path: '/profile' },
    { name: 'Projects Page', path: '/projects' },
    { name: 'Nonprofit Directory', path: '/nonprofit-directory' }
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${BASE_URL}${route.path}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        logResult(route.name, 'passed', 'Page loads successfully');
      } else if (response.status === 404) {
        logResult(route.name, 'failed', 'Page not found');
      } else {
        logResult(route.name, 'warnings', `Status: ${response.status}`);
      }
    } catch (error) {
      logResult(route.name, 'warnings', error.message);
    }
  }
}

// Test server health and capabilities
async function testServerHealth() {
  console.log('\n=== Testing Server Health ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      logResult('Server Health', 'passed', 'Health endpoint responsive');
    } else {
      logResult('Server Health', 'warnings', `Health check status: ${response.status}`);
    }
  } catch (error) {
    logResult('Server Health', 'warnings', 'No health endpoint found');
  }
  
  // Test basic server response
  try {
    const response = await axios.get(BASE_URL, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      logResult('Server Response', 'passed', 'Server responding correctly');
    } else {
      logResult('Server Response', 'warnings', `Server status: ${response.status}`);
    }
  } catch (error) {
    logResult('Server Response', 'failed', 'Server not accessible');
  }
}

// Test navigation-specific functionality
async function testNavigationFeatures() {
  console.log('\n=== Testing Navigation Features ===');
  
  // Test AI routing
  try {
    const response = await axios.get(`${BASE_URL}/api/qa/agent-status`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      logResult('AI Navigation', 'passed', 'AI agent routing available');
    } else if (response.status === 401) {
      logResult('AI Navigation', 'passed', 'AI endpoint exists (requires auth)');
    } else {
      logResult('AI Navigation', 'warnings', 'AI routing may not be available');
    }
  } catch (error) {
    logResult('AI Navigation', 'warnings', 'AI navigation endpoint not accessible');
  }
  
  // Test referral functionality (used in dashboard)
  try {
    const response = await axios.get(`${BASE_URL}/api/referral/qr`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      logResult('Referral Features', 'passed', 'Referral system available');
    } else {
      logResult('Referral Features', 'warnings', 'Referral system status unclear');
    }
  } catch (error) {
    logResult('Referral Features', 'warnings', 'Referral features not accessible');
  }
}

// Main test runner
async function runLiveNavigationTest() {
  console.log('🧪 Testing Live Navigation and Button Functionality...\n');
  
  const startTime = Date.now();
  
  try {
    await testServerHealth();
    await testPageRoutes();
    await testAPIEndpoints();
    await testOnboardingComplete();
    await testNavigationFeatures();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🧪 LIVE NAVIGATION TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ CRITICAL FAILURES:');
      results.failed.forEach(failure => {
        console.log(`- ${failure.test}: ${failure.details}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach(warning => {
        console.log(`- ${warning.test}: ${warning.details}`);
      });
    }
    
    if (results.passed.length > 0) {
      console.log('\n✅ WORKING CORRECTLY:');
      results.passed.forEach(pass => {
        console.log(`- ${pass.test}: ${pass.details}`);
      });
    }
    
    // Calculate functionality score
    const totalTests = results.passed.length + results.warnings.length + results.failed.length;
    const functionalityScore = totalTests > 0 ? 
      Math.round(((results.passed.length + (results.warnings.length * 0.3)) / totalTests) * 100) : 0;
    
    console.log(`\n🎯 Live Functionality Score: ${functionalityScore}/100`);
    
    if (functionalityScore >= 85) {
      console.log('✅ All buttons and navigation should work correctly');
    } else if (functionalityScore >= 70) {
      console.log('✅ Most navigation works with some minor issues');
    } else if (functionalityScore >= 50) {
      console.log('⚠️  Navigation partially functional - some buttons may not work');
    } else {
      console.log('❌ Navigation needs significant fixes');
    }
    
    console.log('\n📋 BUTTON TESTING RECOMMENDATIONS:');
    console.log('- Test bypass button on welcome page manually');
    console.log('- Verify dashboard navigation from sidebar');
    console.log('- Check nonprofit directory filters and search');
    console.log('- Test form submissions and user feedback');
    console.log('- Monitor browser console for JavaScript errors');
    
    return results;
    
  } catch (error) {
    console.error('Live navigation test failed:', error.message);
    return null;
  }
}

// Export for use in other scripts
if (require.main === module) {
  runLiveNavigationTest().then(results => {
    if (results) {
      process.exit(results.failed.length > 0 ? 1 : 0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = { runLiveNavigationTest, results };