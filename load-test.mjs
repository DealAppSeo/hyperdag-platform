// Trinity Symphony Load Test - 10 Concurrent Users
// Tests demo-critical endpoints under load

import http from 'http';

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 5;

// Demo-critical endpoints to test
const ENDPOINTS = [
  { path: '/health', method: 'GET' },
  { path: '/api/trinity/managers', method: 'GET' },
  { path: '/api/system/status', method: 'GET' },
  { path: '/api/trinity/tasks', method: 'GET' }
];

// Make HTTP request
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(endpoint.path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Trinity-Load-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          endpoint: endpoint.path,
          statusCode: res.statusCode,
          responseTime: endTime - startTime,
          success: res.statusCode >= 200 && res.statusCode < 300,
          dataLength: data.length
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      resolve({
        endpoint: endpoint.path,
        statusCode: 0,
        responseTime: endTime - startTime,
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      const endTime = Date.now();
      resolve({
        endpoint: endpoint.path,
        statusCode: 0,
        responseTime: endTime - startTime,
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// Simulate single user session
async function simulateUser(userId) {
  const results = [];
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const result = await makeRequest(endpoint);
      results.push({ userId, requestNum: i + 1, ...result });
    } catch (error) {
      results.push({
        userId,
        requestNum: i + 1,
        endpoint: endpoint.path,
        success: false,
        error: error.message
      });
    }
    
    // Small delay between requests (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Run load test
async function runLoadTest() {
  console.log('🚀 Trinity Symphony Load Test - Starting...');
  console.log(`📊 Configuration: ${CONCURRENT_USERS} concurrent users, ${REQUESTS_PER_USER} requests each`);
  console.log(`🎯 Testing endpoints: ${ENDPOINTS.map(e => e.path).join(', ')}\n`);
  
  const startTime = Date.now();
  
  // Create concurrent user promises
  const userPromises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i + 1));
  }
  
  // Wait for all users to complete
  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate metrics
  const successfulRequests = flatResults.filter(r => r.success).length;
  const failedRequests = flatResults.filter(r => !r.success).length;
  const totalRequests = flatResults.length;
  const successRate = ((successfulRequests / totalRequests) * 100).toFixed(2);
  
  const responseTimes = flatResults.filter(r => r.responseTime).map(r => r.responseTime);
  const avgResponseTime = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  // Calculate p95 response time
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p95ResponseTime = sortedTimes[p95Index];
  
  // Results by endpoint
  const endpointStats = {};
  flatResults.forEach(r => {
    if (!endpointStats[r.endpoint]) {
      endpointStats[r.endpoint] = {
        total: 0,
        success: 0,
        failed: 0,
        responseTimes: []
      };
    }
    endpointStats[r.endpoint].total++;
    if (r.success) {
      endpointStats[r.endpoint].success++;
      endpointStats[r.endpoint].responseTimes.push(r.responseTime);
    } else {
      endpointStats[r.endpoint].failed++;
    }
  });
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Total Test Time: ${totalTime}ms`);
  console.log(`📈 Total Requests: ${totalRequests}`);
  console.log(`✅ Successful: ${successfulRequests} (${successRate}%)`);
  console.log(`❌ Failed: ${failedRequests}`);
  console.log(`\n⚡ Response Times:`);
  console.log(`   Average: ${avgResponseTime}ms`);
  console.log(`   Min: ${minResponseTime}ms`);
  console.log(`   Max: ${maxResponseTime}ms`);
  console.log(`   P95: ${p95ResponseTime}ms`);
  
  console.log(`\n🎯 Endpoint Performance:`);
  Object.entries(endpointStats).forEach(([endpoint, stats]) => {
    const avgTime = stats.responseTimes.length > 0
      ? (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length).toFixed(2)
      : 'N/A';
    const successRate = ((stats.success / stats.total) * 100).toFixed(2);
    console.log(`   ${endpoint}:`);
    console.log(`      Success Rate: ${successRate}% (${stats.success}/${stats.total})`);
    console.log(`      Avg Response: ${avgTime}ms`);
  });
  
  // Pass/Fail criteria
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ DEMO READINESS ASSESSMENT:');
  console.log('='.repeat(60));
  
  const demoReady = {
    successRate: successRate >= 95,
    avgResponseTime: avgResponseTime < 500,
    p95ResponseTime: p95ResponseTime < 1000,
    noTimeout: !flatResults.some(r => r.error && r.error.includes('timeout'))
  };
  
  console.log(`   Success Rate ≥95%: ${demoReady.successRate ? '✅ PASS' : '❌ FAIL'} (${successRate}%)`);
  console.log(`   Avg Response <500ms: ${demoReady.avgResponseTime ? '✅ PASS' : '❌ FAIL'} (${avgResponseTime}ms)`);
  console.log(`   P95 Response <1000ms: ${demoReady.p95ResponseTime ? '✅ PASS' : '❌ FAIL'} (${p95ResponseTime}ms)`);
  console.log(`   No Timeouts: ${demoReady.noTimeout ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallPass = Object.values(demoReady).every(v => v);
  console.log(`\n🎯 OVERALL: ${overallPass ? '✅ DEMO READY' : '⚠️ NEEDS ATTENTION'}`);
  console.log('='.repeat(60) + '\n');
  
  // Return results for programmatic use
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: parseFloat(successRate),
    avgResponseTime: parseFloat(avgResponseTime),
    minResponseTime,
    maxResponseTime,
    p95ResponseTime,
    totalTime,
    demoReady: overallPass,
    endpointStats
  };
}

// Run the test
runLoadTest()
  .then(results => {
    process.exit(results.demoReady ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
