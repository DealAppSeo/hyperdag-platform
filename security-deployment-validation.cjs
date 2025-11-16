/**
 * Security Deployment Validation for HyperDAG
 * Complete validation of all security implementations before deployment
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:5000';

console.log('🔒 HyperDAG Security Deployment Validation');
console.log('======================================================');

let securityScore = 0;
const maxScore = 10;

async function validateRateLimit() {
  console.log('\n1. 📊 Validating Rate Limiting...');
  
  try {
    const promises = [];
    for (let i = 0; i < 60; i++) {
      promises.push(
        axios.get(`${BASE_URL}/api/user`, { timeout: 3000 })
          .catch(error => ({ status: error.response?.status, blocked: error.response?.status === 429 }))
      );
    }
    
    const results = await Promise.all(promises);
    const blocked = results.filter(r => r.blocked).length;
    
    if (blocked > 0) {
      console.log(`   ✅ Rate limiting working: ${blocked}/60 requests blocked`);
      securityScore += 2;
    } else {
      console.log(`   ❌ Rate limiting failed: 0/60 requests blocked`);
    }
  } catch (error) {
    console.log(`   ❌ Rate limiting test failed: ${error.message}`);
  }
}

async function validateCSRFProtection() {
  console.log('\n2. 🎯 Validating CSRF Protection...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/csrf-token`, { timeout: 3000 });
    
    if (response.data.success && response.data.csrfToken) {
      console.log(`   ✅ CSRF token generation working`);
      securityScore += 2;
    } else {
      console.log(`   ❌ CSRF token generation failed`);
    }
  } catch (error) {
    console.log(`   ❌ CSRF endpoint failed: ${error.response?.status || error.message}`);
  }
}

async function validateSecurityHeaders() {
  console.log('\n3. 🛡️  Validating Security Headers...');
  
  try {
    const response = await axios.get(`${BASE_URL}`, { timeout: 3000 });
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];
    
    const present = requiredHeaders.filter(h => headers[h]).length;
    
    if (present >= 3) {
      console.log(`   ✅ Security headers present: ${present}/${requiredHeaders.length}`);
      securityScore += 1;
    } else {
      console.log(`   ❌ Missing security headers: ${present}/${requiredHeaders.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Security headers test failed: ${error.message}`);
  }
}

async function validateInputSanitization() {
  console.log('\n4. 🧹 Validating Input Sanitization...');
  
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    "'; DROP TABLE users; --",
    '../../../etc/passwd'
  ];
  
  let sanitized = 0;
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/api/simple-grant-search`, {
        query: input
      }, { timeout: 3000 });
      
      const responseText = JSON.stringify(response.data);
      if (!responseText.includes('<script>') && !responseText.includes('DROP TABLE')) {
        sanitized++;
      }
    } catch (error) {
      if (error.response?.status === 400) {
        sanitized++; // Rejected input is good
      }
    }
  }
  
  if (sanitized === maliciousInputs.length) {
    console.log(`   ✅ Input sanitization working: ${sanitized}/${maliciousInputs.length} handled`);
    securityScore += 2;
  } else {
    console.log(`   ❌ Input sanitization incomplete: ${sanitized}/${maliciousInputs.length} handled`);
  }
}

async function validateAuthentication() {
  console.log('\n5. 🔐 Validating Authentication Protection...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/user/stats`, { timeout: 3000 });
    console.log(`   ❌ Authentication bypass detected: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`   ✅ Authentication protection working`);
      securityScore += 1;
    } else {
      console.log(`   ❌ Unexpected authentication error: ${error.response?.status}`);
    }
  }
}

async function validateCompression() {
  console.log('\n6. ⚡ Validating Response Compression...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/simple-grant-search`, {
      method: 'POST',
      data: { query: 'test' },
      headers: { 'Accept-Encoding': 'gzip, deflate' },
      timeout: 3000
    });
    
    if (response.headers['content-encoding']) {
      console.log(`   ✅ Response compression enabled: ${response.headers['content-encoding']}`);
      securityScore += 1;
    } else {
      console.log(`   ❌ Response compression disabled`);
    }
  } catch (error) {
    console.log(`   ❌ Compression test failed: ${error.message}`);
  }
}

async function validatePerformance() {
  console.log('\n7. 🚀 Validating Performance...');
  
  const times = [];
  
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      await axios.post(`${BASE_URL}/api/simple-grant-search`, {
        query: 'test'
      }, { timeout: 3000 });
      times.push(performance.now() - start);
    } catch (error) {
      times.push(performance.now() - start);
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  if (avgTime < 200) {
    console.log(`   ✅ Performance excellent: ${avgTime.toFixed(2)}ms average`);
    securityScore += 1;
  } else if (avgTime < 500) {
    console.log(`   ⚠️  Performance acceptable: ${avgTime.toFixed(2)}ms average`);
  } else {
    console.log(`   ❌ Performance needs improvement: ${avgTime.toFixed(2)}ms average`);
  }
}

function generateDeploymentReport() {
  console.log('\n📋 DEPLOYMENT READINESS REPORT');
  console.log('======================================================');
  
  const percentage = (securityScore / maxScore) * 100;
  
  console.log(`\n🛡️  SECURITY SCORE: ${securityScore}/${maxScore} (${percentage.toFixed(1)}%)`);
  
  if (percentage >= 90) {
    console.log('\n🎉 DEPLOYMENT READY - Excellent security implementation');
    console.log('   All critical security measures are properly implemented');
  } else if (percentage >= 70) {
    console.log('\n⚠️  DEPLOYMENT CAUTION - Good security with minor issues');
    console.log('   Most security measures implemented, some improvements needed');
  } else if (percentage >= 50) {
    console.log('\n🚨 DEPLOYMENT RISK - Moderate security vulnerabilities');
    console.log('   Significant security improvements required before deployment');
  } else {
    console.log('\n🛑 DEPLOYMENT BLOCKED - Critical security vulnerabilities');
    console.log('   Major security issues must be resolved before deployment');
  }
  
  console.log('\n📊 DEPLOYMENT RECOMMENDATIONS:');
  
  if (securityScore < 4) {
    console.log('   🔴 HIGH PRIORITY: Fix rate limiting and CSRF protection');
  }
  if (securityScore < 6) {
    console.log('   🟡 MEDIUM PRIORITY: Enhance security headers and compression');
  }
  if (securityScore < 8) {
    console.log('   🟢 LOW PRIORITY: Optimize performance and monitoring');
  }
  
  console.log('\n🔒 Security validation completed');
  console.log(`📈 Current readiness level: ${percentage.toFixed(1)}%`);
}

async function runValidation() {
  try {
    await validateRateLimit();
    await validateCSRFProtection();
    await validateSecurityHeaders();
    await validateInputSanitization();
    await validateAuthentication();
    await validateCompression();
    await validatePerformance();
    
    generateDeploymentReport();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

// Run validation after server startup
setTimeout(runValidation, 3000);