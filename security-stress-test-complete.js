/**
 * Comprehensive Security Stress Test and Mobile Performance Validation
 * Tests all security implementations and mobile optimizations
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:5000';
const MAX_REQUESTS = 50;
const CONCURRENT_REQUESTS = 10;

console.log('🔒 Starting Comprehensive Security and Performance Stress Test');
console.log('=' .repeat(70));

// Security test results
const securityResults = {
  rateLimit: { passed: false, details: '' },
  inputValidation: { passed: false, details: '' },
  authProtection: { passed: false, details: '' },
  headerSecurity: { passed: false, details: '' },
  csrfProtection: { passed: false, details: '' },
  sqlInjection: { passed: false, details: '' },
  xssProtection: { passed: false, details: '' }
};

// Performance test results
const performanceResults = {
  responseTime: { average: 0, max: 0, min: Infinity },
  compression: { enabled: false, ratio: 0 },
  mobileOptimization: { score: 0 },
  caching: { enabled: false, effectiveness: 0 }
};

// Test 1: Rate Limiting Validation
async function testRateLimit() {
  console.log('\n📊 Testing Rate Limiting...');
  
  const promises = [];
  const startTime = performance.now();
  
  for (let i = 0; i < MAX_REQUESTS; i++) {
    promises.push(
      axios.get(`${BASE_URL}/api/user`, { timeout: 5000 })
        .catch(error => ({ status: error.response?.status, error: true }))
    );
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r.status === 429);
  const endTime = performance.now();
  
  securityResults.rateLimit.passed = rateLimited.length > 0;
  securityResults.rateLimit.details = `${rateLimited.length}/${MAX_REQUESTS} requests rate limited`;
  
  console.log(`   Rate Limit Test: ${securityResults.rateLimit.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Details: ${securityResults.rateLimit.details}`);
  console.log(`   Test Duration: ${(endTime - startTime).toFixed(2)}ms`);
}

// Test 2: Input Validation and Sanitization
async function testInputValidation() {
  console.log('\n🛡️  Testing Input Validation...');
  
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    "'; DROP TABLE users; --",
    '../../../etc/passwd',
    '{{7*7}}',
    '${process.env.SECRET}',
    '<img src=x onerror=alert(1)>'
  ];
  
  let passed = 0;
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/api/simple-grant-search`, {
        query: input,
        rfpId: input
      }, { timeout: 3000 });
      
      // Check if input was sanitized
      const responseString = JSON.stringify(response.data);
      if (!responseString.includes('<script>') && 
          !responseString.includes('DROP TABLE') &&
          !responseString.includes('onerror=')) {
        passed++;
      }
    } catch (error) {
      // Rejected malicious input is a good sign
      if (error.response?.status === 400) {
        passed++;
      }
    }
  }
  
  securityResults.inputValidation.passed = passed >= maliciousInputs.length * 0.8;
  securityResults.inputValidation.details = `${passed}/${maliciousInputs.length} malicious inputs properly handled`;
  
  console.log(`   Input Validation: ${securityResults.inputValidation.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Details: ${securityResults.inputValidation.details}`);
}

// Test 3: Authentication Protection
async function testAuthProtection() {
  console.log('\n🔐 Testing Authentication Protection...');
  
  try {
    // Test accessing protected endpoint without auth
    const response = await axios.get(`${BASE_URL}/api/user/stats`, { timeout: 3000 });
    
    securityResults.authProtection.passed = response.status === 401;
    securityResults.authProtection.details = `Unauthenticated request returned status: ${response.status}`;
  } catch (error) {
    securityResults.authProtection.passed = error.response?.status === 401;
    securityResults.authProtection.details = `Properly rejected with status: ${error.response?.status}`;
  }
  
  console.log(`   Auth Protection: ${securityResults.authProtection.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Details: ${securityResults.authProtection.details}`);
}

// Test 4: Security Headers
async function testSecurityHeaders() {
  console.log('\n🛡️  Testing Security Headers...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/csrf-token`, { timeout: 3000 });
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    const presentHeaders = requiredHeaders.filter(header => headers[header]);
    
    securityResults.headerSecurity.passed = presentHeaders.length >= 3;
    securityResults.headerSecurity.details = `${presentHeaders.length}/${requiredHeaders.length} security headers present`;
    
    console.log(`   Security Headers: ${securityResults.headerSecurity.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Details: ${securityResults.headerSecurity.details}`);
    console.log(`   Present: ${presentHeaders.join(', ')}`);
  } catch (error) {
    securityResults.headerSecurity.passed = false;
    securityResults.headerSecurity.details = `Error testing headers: ${error.message}`;
    console.log(`   Security Headers: ❌ FAIL - ${error.message}`);
  }
}

// Test 5: CSRF Protection
async function testCSRFProtection() {
  console.log('\n🎯 Testing CSRF Protection...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/csrf-token`, { timeout: 3000 });
    
    securityResults.csrfProtection.passed = response.data?.csrfToken ? true : false;
    securityResults.csrfProtection.details = `CSRF token ${response.data?.csrfToken ? 'provided' : 'missing'}`;
    
    console.log(`   CSRF Protection: ${securityResults.csrfProtection.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Details: ${securityResults.csrfProtection.details}`);
  } catch (error) {
    securityResults.csrfProtection.passed = false;
    securityResults.csrfProtection.details = `CSRF endpoint error: ${error.message}`;
    console.log(`   CSRF Protection: ❌ FAIL - ${error.message}`);
  }
}

// Test 6: Performance and Compression
async function testPerformance() {
  console.log('\n⚡ Testing Performance and Compression...');
  
  const times = [];
  const compressionTests = [];
  
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/simple-grant-search`, {
        method: 'POST',
        data: { rfpId: 1 },
        headers: { 'Accept-Encoding': 'gzip, deflate' },
        timeout: 3000
      });
      
      const end = performance.now();
      times.push(end - start);
      
      // Check compression
      if (response.headers['content-encoding']) {
        compressionTests.push(true);
      }
    } catch (error) {
      const end = performance.now();
      times.push(end - start);
    }
  }
  
  performanceResults.responseTime.average = times.reduce((a, b) => a + b, 0) / times.length;
  performanceResults.responseTime.max = Math.max(...times);
  performanceResults.responseTime.min = Math.min(...times);
  performanceResults.compression.enabled = compressionTests.length > 0;
  
  console.log(`   Average Response Time: ${performanceResults.responseTime.average.toFixed(2)}ms`);
  console.log(`   Min/Max Response Time: ${performanceResults.responseTime.min.toFixed(2)}ms / ${performanceResults.responseTime.max.toFixed(2)}ms`);
  console.log(`   Compression: ${performanceResults.compression.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
}

// Test 7: Mobile Optimization Check
async function testMobileOptimization() {
  console.log('\n📱 Testing Mobile Optimization...');
  
  try {
    const response = await axios.get(`${BASE_URL}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 5000
    });
    
    const contentLength = response.headers['content-length'] || 0;
    const hasViewport = response.data.includes('viewport');
    const hasCompression = response.headers['content-encoding'] ? true : false;
    
    let score = 0;
    if (contentLength < 500000) score += 3; // Small payload
    if (hasViewport) score += 2; // Mobile viewport
    if (hasCompression) score += 2; // Compression
    if (performanceResults.responseTime.average < 1000) score += 3; // Fast response
    
    performanceResults.mobileOptimization.score = score;
    
    console.log(`   Mobile Score: ${score}/10`);
    console.log(`   Content Size: ${(contentLength / 1024).toFixed(2)}KB`);
    console.log(`   Viewport Meta: ${hasViewport ? '✅' : '❌'}`);
    console.log(`   Compression: ${hasCompression ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   Mobile Test: ❌ FAIL - ${error.message}`);
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📋 COMPREHENSIVE SECURITY & PERFORMANCE REPORT');
  console.log('=' .repeat(70));
  
  console.log('\n🔒 SECURITY TEST RESULTS:');
  Object.entries(securityResults).forEach(([test, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${test.padEnd(20)}: ${status} - ${result.details}`);
  });
  
  const securityScore = Object.values(securityResults).filter(r => r.passed).length;
  const totalSecurityTests = Object.keys(securityResults).length;
  
  console.log(`\n🛡️  OVERALL SECURITY SCORE: ${securityScore}/${totalSecurityTests} (${((securityScore/totalSecurityTests)*100).toFixed(1)}%)`);
  
  console.log('\n⚡ PERFORMANCE TEST RESULTS:');
  console.log(`   Average Response Time: ${performanceResults.responseTime.average.toFixed(2)}ms`);
  console.log(`   Mobile Optimization Score: ${performanceResults.mobileOptimization.score}/10`);
  console.log(`   Compression Enabled: ${performanceResults.compression.enabled ? 'Yes' : 'No'}`);
  
  // Security recommendations
  console.log('\n💡 SECURITY RECOMMENDATIONS:');
  if (!securityResults.rateLimit.passed) {
    console.log('   - Implement stricter rate limiting');
  }
  if (!securityResults.inputValidation.passed) {
    console.log('   - Enhance input validation and sanitization');
  }
  if (!securityResults.headerSecurity.passed) {
    console.log('   - Add missing security headers');
  }
  if (!securityResults.csrfProtection.passed) {
    console.log('   - Implement proper CSRF protection');
  }
  
  // Performance recommendations
  console.log('\n🚀 PERFORMANCE RECOMMENDATIONS:');
  if (performanceResults.responseTime.average > 500) {
    console.log('   - Optimize response times (current average too high)');
  }
  if (!performanceResults.compression.enabled) {
    console.log('   - Enable response compression');
  }
  if (performanceResults.mobileOptimization.score < 7) {
    console.log('   - Improve mobile optimization');
  }
  
  console.log('\n✅ Security stress test completed successfully!');
}

// Main execution
async function runComprehensiveTest() {
  try {
    await testRateLimit();
    await testInputValidation();
    await testAuthProtection();
    await testSecurityHeaders();
    await testCSRFProtection();
    await testPerformance();
    await testMobileOptimization();
    
    generateReport();
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Wait for server to be ready, then run tests
setTimeout(runComprehensiveTest, 5000);