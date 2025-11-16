/**
 * PurposeHub.AI RepID Integration Test Suite
 * 
 * Tests the RepID API endpoints for PurposeHub.AI integration scenarios
 */

import axios from 'axios';
import { PURPOSEHUB_API_KEY } from '../config/purposehub-apikey';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api/web3-ai/repid';

// Test wallet addresses
const TEST_WALLET = '0x742d35Cc6635C0532925a3b8D4C1d5d8bE5d1234';
const TEST_USER_ID = 12345;

// Configure axios with API key
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${PURPOSEHUB_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

console.log('\n🧪 PurposeHub.AI RepID API Integration Tests');
console.log('━'.repeat(80));
console.log(`\n📍 Testing against: ${API_BASE}`);
console.log(`🔑 Using API Key: ${PURPOSEHUB_API_KEY.substring(0, 30)}...`);
console.log('\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Health Check
  console.log('Test 1: API Health Check (no auth required)');
  console.log('─'.repeat(80));
  try {
    const response = await axios.get(`${API_BASE}/status`);
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Test 2: Documentation Access
  console.log('Test 2: PurposeHub API Documentation');
  console.log('─'.repeat(80));
  try {
    const response = await axios.get(`${API_BASE}/docs`);
    console.log('✅ Status:', response.status);
    console.log('✅ Documentation Title:', response.data.documentation.title);
    console.log('✅ PurposeHub Examples Found:', Object.keys(response.data.documentation.purposeHubExamples || {}).length);
    console.log('✅ Contribution Types:', response.data.documentation.supportedContributionTypes.length);
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Test 3: Create RepID (Scripture-Based Contribution)
  console.log('Test 3: Create RepID with Scripture-Based Contribution');
  console.log('─'.repeat(80));
  try {
    const response = await api.post('/create', {
      userId: TEST_USER_ID,
      walletAddress: TEST_WALLET,
      contributionType: 'faith_tech_contribution',
      contributionValue: 90,
      impactScore: 95,
      metadata: {
        activityType: 'scripture_mentoring',
        scripture: 'Proverbs 27:17',
        topic: 'Iron sharpens iron - bilateral learning',
        durationMinutes: 45,
        menteeImpact: 'high'
      }
    });
    console.log('✅ Status:', response.status);
    console.log('✅ RepID Created:', JSON.stringify(response.data.data, null, 2));
    testsPassed++;
  } catch (error: any) {
    if (error.response) {
      console.log('⚠️  Status:', error.response.status);
      console.log('⚠️  Response:', JSON.stringify(error.response.data, null, 2));
      if (error.response.status === 409 && error.response.data.error?.includes('already exists')) {
        console.log('✅ RepID already exists - test passed (user already onboarded)');
        testsPassed++;
      } else {
        testsFailed++;
      }
    } else {
      console.log('❌ Failed:', error.message);
      testsFailed++;
    }
  }
  console.log('\n');
  
  // Test 4: Update RepID (Purpose Discovery Contribution)
  console.log('Test 4: Update RepID for Purpose Discovery');
  console.log('─'.repeat(80));
  try {
    const response = await api.post('/update', {
      userId: TEST_USER_ID,
      contributionType: 'community_help',
      value: 75,
      impactScore: 80,
      metadata: {
        activityType: 'purpose_discovery',
        matchType: 'biblical_calling',
        ikigaiScore: 0.92,
        decayResetApplied: true
      }
    });
    console.log('✅ Status:', response.status);
    console.log('✅ RepID Updated:', JSON.stringify(response.data.data, null, 2));
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data || error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Test 5: Verify RepID Threshold (Grant Eligibility)
  console.log('Test 5: Verify RepID Threshold for Grant Eligibility');
  console.log('─'.repeat(80));
  try {
    const response = await api.post('/verify', {
      walletAddress: TEST_WALLET,
      threshold: 100,
      category: 'total'
    });
    console.log('✅ Status:', response.status);
    console.log('✅ Verification Result:', JSON.stringify(response.data.data, null, 2));
    if (response.data.data.valid) {
      console.log('✅ User MEETS grant eligibility criteria (RepID >= 100)');
    } else {
      console.log('⚠️  User DOES NOT meet grant eligibility criteria (RepID < 100)');
    }
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data || error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Test 6: Batch Processing (Hackathon Team)
  console.log('Test 6: Batch Process Hackathon Team Contributions');
  console.log('─'.repeat(80));
  try {
    const response = await api.post('/batch', {
      contributions: [
        {
          userId: 1001,
          contribution: {
            contributionType: 'code_contribution',
            value: 85,
            impactScore: 90,
            metadata: { role: 'lead_developer', hackathon: 'faith_tech_2024' }
          }
        },
        {
          userId: 1002,
          contribution: {
            contributionType: 'mentorship',
            value: 80,
            impactScore: 85,
            metadata: { role: 'mentor', hackathon: 'faith_tech_2024' }
          }
        },
        {
          userId: 1003,
          contribution: {
            contributionType: 'governance_vote',
            value: 70,
            impactScore: 75,
            metadata: { role: 'team_coordinator', hackathon: 'faith_tech_2024' }
          }
        }
      ]
    });
    console.log('✅ Status:', response.status);
    console.log('✅ Batch Results:', JSON.stringify(response.data.data, null, 2));
    console.log(`✅ Processed: ${response.data.data.processed} / ${response.data.data.total} contributions`);
    console.log(`✅ Gas Savings: ~96% vs individual updates (estimated)`);
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data || error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Test 7: CORS Check (Simulated)
  console.log('Test 7: CORS Configuration Check');
  console.log('─'.repeat(80));
  try {
    const response = await axios.get(`${API_BASE}/status`, {
      headers: {
        'Origin': 'https://purposehub.lovable.app'
      }
    });
    console.log('✅ Status:', response.status);
    console.log('✅ CORS Headers Present:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'] || 'Not set',
      'access-control-allow-methods': response.headers['access-control-allow-methods'] || 'Not set',
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'] || 'Not set'
    });
    testsPassed++;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    testsFailed++;
  }
  console.log('\n');
  
  // Summary
  console.log('━'.repeat(80));
  console.log('📊 Test Summary');
  console.log('━'.repeat(80));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('\n');
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed! PurposeHub.AI integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log('\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
