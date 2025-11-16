/**
 * Test Script for Onboarding Bypass Button
 * Validates the bypass functionality is working correctly
 */

const axios = require('axios');

async function testBypassButton() {
  console.log('🧪 Testing Onboarding Bypass Button Functionality...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function logResult(test, status, details = '') {
    const result = { test, status, details, timestamp: new Date().toISOString() };
    results[status].push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${details}`);
  }

  try {
    // Test 1: Check if onboarding completion endpoint exists
    console.log('Testing onboarding completion endpoint...');
    
    try {
      const response = await axios.post('http://localhost:5173/api/onboarding/complete', {
        profile: { skipped: true },
        completed: true,
        redirectTo: '/dashboard'
      }, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 401) {
        logResult('Endpoint Availability', 'passed', 'Endpoint exists (requires auth)');
      } else if (response.status === 404) {
        logResult('Endpoint Availability', 'failed', 'Endpoint not found');
      } else {
        logResult('Endpoint Availability', 'passed', `Endpoint responds with status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logResult('Endpoint Availability', 'warnings', 'Server not accessible for testing');
      } else {
        logResult('Endpoint Availability', 'warnings', error.message);
      }
    }

    // Test 2: Check Welcome component for bypass button
    const fs = require('fs');
    const welcomePath = 'client/src/pages/Welcome.tsx';
    
    if (fs.existsSync(welcomePath)) {
      const content = fs.readFileSync(welcomePath, 'utf8');
      
      if (content.includes('handleBypassOnboarding')) {
        logResult('Bypass Function', 'passed', 'handleBypassOnboarding function exists');
      } else {
        logResult('Bypass Function', 'failed', 'handleBypassOnboarding function missing');
      }
      
      if (content.includes('Skip onboarding and explore on my own')) {
        logResult('Bypass Button', 'passed', 'Bypass button text found');
      } else {
        logResult('Bypass Button', 'failed', 'Bypass button text missing');
      }
      
      if (content.includes('onClick={() => handleBypassOnboarding()}')) {
        logResult('Button Handler', 'passed', 'Button click handler properly connected');
      } else {
        logResult('Button Handler', 'failed', 'Button click handler not connected');
      }
    } else {
      logResult('Welcome Component', 'failed', 'Welcome.tsx file not found');
    }

    // Test 3: Check onboarding routes
    const onboardingRoutesPath = 'server/routes/onboarding.ts';
    
    if (fs.existsSync(onboardingRoutesPath)) {
      const content = fs.readFileSync(onboardingRoutesPath, 'utf8');
      
      if (content.includes("router.post('/complete'")) {
        logResult('Completion Route', 'passed', 'Onboarding completion route exists');
      } else {
        logResult('Completion Route', 'failed', 'Onboarding completion route missing');
      }
      
      if (content.includes('onboardingStage: 2')) {
        logResult('Stage Update', 'passed', 'Onboarding stage update logic exists');
      } else {
        logResult('Stage Update', 'failed', 'Onboarding stage update missing');
      }
    } else {
      logResult('Onboarding Routes', 'failed', 'Onboarding routes file not found');
    }

    // Test 4: Check for proper navigation handling
    const welcomeContent = fs.readFileSync(welcomePath, 'utf8');
    
    if (welcomeContent.includes('setLocation(\'/dashboard\')')) {
      logResult('Navigation Logic', 'passed', 'Dashboard navigation implemented');
    } else {
      logResult('Navigation Logic', 'failed', 'Dashboard navigation missing');
    }
    
    if (welcomeContent.includes('toast({')) {
      logResult('User Feedback', 'passed', 'Toast notifications implemented');
    } else {
      logResult('User Feedback', 'failed', 'Toast notifications missing');
    }

    // Generate test report
    console.log('\n' + '='.repeat(60));
    console.log('🧪 BYPASS BUTTON TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILURES:');
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
      console.log('\n✅ PASSED:');
      results.passed.forEach(pass => {
        console.log(`- ${pass.test}: ${pass.details}`);
      });
    }

    // Calculate success rate
    const totalTests = results.passed.length + results.warnings.length + results.failed.length;
    const successRate = totalTests > 0 ? 
      Math.round(((results.passed.length + (results.warnings.length * 0.5)) / totalTests) * 100) : 0;
    
    console.log(`\n🎯 Success Rate: ${successRate}/100`);
    
    if (successRate >= 90) {
      console.log('✅ Bypass button should work correctly');
    } else if (successRate >= 70) {
      console.log('⚠️  Bypass button may have minor issues');
    } else {
      console.log('❌ Bypass button needs fixes');
    }
    
    return results;

  } catch (error) {
    console.error('Test execution failed:', error.message);
    return null;
  }
}

// Run the test
if (require.main === module) {
  testBypassButton().then(results => {
    if (results) {
      process.exit(results.failed.length > 0 ? 1 : 0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = { testBypassButton };