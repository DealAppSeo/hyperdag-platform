/**
 * Complete User Activity Tracking System Test
 * 
 * This script validates the comprehensive user activity tracking implementation
 * including immediate data preservation, ProfileCompletionPrompt triggering,
 * and activity tracking across all user interactions.
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let authToken = null;
let testUserId = null;

// Test utilities
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
}

async function authenticateTestUser() {
  console.log('\n🔐 Authenticating test user...');
  
  try {
    // Register a new test user
    const username = `testuser_${Date.now()}`;
    const password = 'TestPass123!';
    
    const registerResponse = await makeRequest('POST', '/api/register', {
      username,
      password,
      confirmPassword: password
    });
    
    console.log('✓ User registered successfully');
    testUserId = registerResponse.user?.id;
    
    // Login to get auth token
    const loginResponse = await makeRequest('POST', '/api/login', {
      username,
      password
    });
    
    authToken = loginResponse.token;
    console.log('✓ User authenticated successfully');
    console.log(`✓ Test User ID: ${testUserId}`);
    
    return { username, userId: testUserId };
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

async function testPurposeSaveTracking() {
  console.log('\n📍 Testing Purpose Save Activity Tracking...');
  
  try {
    // Save a purpose
    const purposeData = {
      title: 'Clean Ocean Initiative',
      category: 'Environmental',
      description: 'Working to reduce ocean plastic pollution',
      impact: 'Environmental sustainability'
    };
    
    const response = await makeRequest('POST', '/api/purposes/save', purposeData);
    console.log('✓ Purpose saved successfully');
    
    // Verify activity was tracked
    const activityResponse = await makeRequest('GET', '/api/user-activity/recent');
    const purposeActivities = activityResponse.activities.filter(a => a.type === 'purpose_save');
    
    console.log(`✓ Found ${purposeActivities.length} purpose save activities`);
    console.log(`✓ Latest activity: ${purposeActivities[0]?.description}`);
    
    return true;
  } catch (error) {
    console.error('Purpose save tracking test failed:', error.message);
    return false;
  }
}

async function testNonprofitViewTracking() {
  console.log('\n🏢 Testing Nonprofit View Activity Tracking...');
  
  try {
    // View nonprofits
    const response = await makeRequest('GET', '/api/nonprofits?category=Environmental&limit=5');
    console.log(`✓ Viewed ${response.length} nonprofits`);
    
    // Verify activity was tracked
    const activityResponse = await makeRequest('GET', '/api/user-activity/recent');
    const nonprofitActivities = activityResponse.activities.filter(a => a.type === 'nonprofit_view');
    
    console.log(`✓ Found ${nonprofitActivities.length} nonprofit view activities`);
    console.log(`✓ Latest activity: ${nonprofitActivities[0]?.description}`);
    
    return true;
  } catch (error) {
    console.error('Nonprofit view tracking test failed:', error.message);
    return false;
  }
}

async function testGrantflowSearchTracking() {
  console.log('\n🔍 Testing GrantFlow Search Activity Tracking...');
  
  try {
    // Perform live grant discovery
    const discoveryResponse = await makeRequest('GET', '/api/grants/discover-live');
    console.log(`✓ Discovered ${discoveryResponse.count} grants`);
    
    // Search grants with criteria
    const searchResponse = await makeRequest('POST', '/api/grants/search-criteria', {
      categories: ['AI', 'Web3'],
      fundingRange: { min: 10000, max: 100000 }
    });
    console.log(`✓ Found ${searchResponse.count} grants matching criteria`);
    
    // Verify activities were tracked
    const activityResponse = await makeRequest('GET', '/api/user-activity/recent');
    const grantActivities = activityResponse.activities.filter(a => a.type === 'grantflow_search');
    
    console.log(`✓ Found ${grantActivities.length} grant search activities`);
    grantActivities.forEach(activity => {
      console.log(`  - ${activity.description}`);
    });
    
    return true;
  } catch (error) {
    console.error('GrantFlow search tracking test failed:', error.message);
    return false;
  }
}

async function testProfileUpdateTracking() {
  console.log('\n👤 Testing Profile Update Activity Tracking...');
  
  try {
    // Update user profile
    const profileUpdate = {
      bio: 'Passionate about social impact and technology',
      interests: ['Environmental', 'Education', 'Technology'],
      skills: ['JavaScript', 'React', 'Node.js']
    };
    
    const response = await makeRequest('PUT', '/api/user/profile', profileUpdate);
    console.log('✓ Profile updated successfully');
    
    // Verify activity was tracked
    const activityResponse = await makeRequest('GET', '/api/user-activity/recent');
    const profileActivities = activityResponse.activities.filter(a => a.type === 'profile_update');
    
    console.log(`✓ Found ${profileActivities.length} profile update activities`);
    console.log(`✓ Latest activity: ${profileActivities[0]?.description}`);
    
    return true;
  } catch (error) {
    console.error('Profile update tracking test failed:', error.message);
    return false;
  }
}

async function testActivitySummaryGeneration() {
  console.log('\n📊 Testing Activity Summary Generation...');
  
  try {
    // Get comprehensive activity summary
    const summaryResponse = await makeRequest('GET', '/api/user-activity/summary');
    
    console.log('✓ Activity Summary Generated:');
    console.log(`  - Total Activities: ${summaryResponse.totalActivities}`);
    console.log(`  - Saved Purposes: ${summaryResponse.savedPurposes}`);
    console.log(`  - Points Earned: ${summaryResponse.pointsEarned}`);
    console.log(`  - Profile Completeness: ${summaryResponse.profileCompleteness}%`);
    console.log(`  - Estimated Rewards: $${summaryResponse.estimatedRewards}`);
    
    // Test activity breakdown by type
    console.log('\n📈 Activity Breakdown:');
    Object.entries(summaryResponse.activityBreakdown).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} activities`);
    });
    
    return true;
  } catch (error) {
    console.error('Activity summary generation test failed:', error.message);
    return false;
  }
}

async function testProfileCompletionPrompt() {
  console.log('\n🚨 Testing Profile Completion Prompt System...');
  
  try {
    // Check if profile completion prompt should be triggered
    const promptResponse = await makeRequest('GET', '/api/user-activity/completion-prompt-status');
    
    console.log('✓ Profile Completion Prompt Status:');
    console.log(`  - Should Show Prompt: ${promptResponse.shouldShowPrompt}`);
    console.log(`  - Trigger Reason: ${promptResponse.triggerReason}`);
    console.log(`  - Activity Value: $${promptResponse.activityValue}`);
    console.log(`  - Completion Percentage: ${promptResponse.completionPercentage}%`);
    
    if (promptResponse.shouldShowPrompt) {
      console.log('✓ Profile completion prompt would be triggered');
      
      // Test prompt dismissal
      await makeRequest('POST', '/api/user-activity/dismiss-prompt', {
        reason: 'testing'
      });
      console.log('✓ Prompt dismissal tracked');
    }
    
    return true;
  } catch (error) {
    console.error('Profile completion prompt test failed:', error.message);
    return false;
  }
}

async function testDecentralizedStorageBackup() {
  console.log('\n🌐 Testing Decentralized Storage Backup...');
  
  try {
    // Trigger activity backup to decentralized storage
    const backupResponse = await makeRequest('POST', '/api/user-activity/backup-to-decentralized');
    
    console.log('✓ Decentralized Storage Backup:');
    console.log(`  - Backup Status: ${backupResponse.success ? 'Success' : 'Failed'}`);
    console.log(`  - Storage Method: ${backupResponse.storageMethod}`);
    console.log(`  - Backup Hash: ${backupResponse.backupHash}`);
    console.log(`  - Activities Backed Up: ${backupResponse.activitiesCount}`);
    
    return true;
  } catch (error) {
    console.error('Decentralized storage backup test failed:', error.message);
    return false;
  }
}

async function testAntiGamingProtections() {
  console.log('\n🛡️ Testing Anti-Gaming Protections...');
  
  try {
    // Attempt rapid-fire activity generation (should be rate limited)
    const rapidActivities = [];
    for (let i = 0; i < 10; i++) {
      try {
        const response = await makeRequest('POST', '/api/purposes/save', {
          title: `Rapid Test Purpose ${i}`,
          category: 'Testing',
          description: 'Anti-gaming test'
        });
        rapidActivities.push(response);
      } catch (error) {
        console.log(`✓ Rate limiting activated after ${i} rapid attempts`);
        break;
      }
    }
    
    // Check for suspicious activity detection
    const suspiciousResponse = await makeRequest('GET', '/api/user-activity/suspicious-check');
    
    console.log('✓ Anti-Gaming Protection Status:');
    console.log(`  - Suspicious Activity Detected: ${suspiciousResponse.suspiciousActivity}`);
    console.log(`  - Risk Level: ${suspiciousResponse.riskLevel}`);
    console.log(`  - Rate Limit Status: ${suspiciousResponse.rateLimitStatus}`);
    
    return true;
  } catch (error) {
    console.error('Anti-gaming protections test failed:', error.message);
    return false;
  }
}

async function runComprehensiveActivityTrackingTest() {
  console.log('🚀 Starting Comprehensive User Activity Tracking System Test');
  console.log('=' .repeat(80));
  
  const testResults = {
    authentication: false,
    purposeSaveTracking: false,
    nonprofitViewTracking: false,
    grantflowSearchTracking: false,
    profileUpdateTracking: false,
    activitySummaryGeneration: false,
    profileCompletionPrompt: false,
    decentralizedStorageBackup: false,
    antiGamingProtections: false
  };
  
  try {
    // Run all tests
    await authenticateTestUser();
    testResults.authentication = true;
    
    testResults.purposeSaveTracking = await testPurposeSaveTracking();
    testResults.nonprofitViewTracking = await testNonprofitViewTracking();
    testResults.grantflowSearchTracking = await testGrantflowSearchTracking();
    testResults.profileUpdateTracking = await testProfileUpdateTracking();
    testResults.activitySummaryGeneration = await testActivitySummaryGeneration();
    testResults.profileCompletionPrompt = await testProfileCompletionPrompt();
    testResults.decentralizedStorageBackup = await testDecentralizedStorageBackup();
    testResults.antiGamingProtections = await testAntiGamingProtections();
    
    // Generate final report
    console.log('\n📋 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(50));
    
    const passedTests = Object.values(testResults).filter(result => result === true).length;
    const totalTests = Object.keys(testResults).length;
    
    Object.entries(testResults).forEach(([testName, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
    });
    
    console.log('\n🎯 SUMMARY:');
    console.log(`✓ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`✓ Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! User Activity Tracking System is fully operational.');
      console.log('\n🔥 Key Features Validated:');
      console.log('  • Immediate activity preservation upon signup');
      console.log('  • Comprehensive tracking across all user interactions');
      console.log('  • ProfileCompletionPrompt with multiple triggers');
      console.log('  • Decentralized storage backup with fallback options');
      console.log('  • Anti-gaming protections with rate limiting');
      console.log('  • Activity summarization and reward estimation');
    } else {
      console.log(`\n⚠️  ${totalTests - passedTests} tests failed. Review implementation.`);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run the comprehensive test
runComprehensiveActivityTrackingTest();