/**
 * Test Zuplo Gateway Integration
 */

const ZUPLO_BASE = 'https://defuzzyai-main-0a6b719.d2.zuplo.dev';
const API_KEY = 'ai-symphony-master-key';

async function testZuploEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    };
    if (body) options.body = JSON.stringify(body);
    
    console.log(`\n🧪 Testing: ${method} ${endpoint}`);
    const response = await fetch(`${ZUPLO_BASE}${endpoint}`, options);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ SUCCESS');
      console.log('Response preview:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
    } else {
      console.log('❌ FAILED');
      const errorText = await response.text();
      console.log('Error:', errorText.substring(0, 200));
    }
    
    return { status: response.status, ok: response.ok };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { error: error.message };
  }
}

async function runZuploTests() {
  console.log('🚀 Testing Zuplo Gateway Integration');
  console.log('Gateway:', ZUPLO_BASE);
  console.log('API Key:', API_KEY);
  
  // Test status endpoint (no auth required)
  await testZuploEndpoint('/v1/status');
  
  // Test chat completions
  await testZuploEndpoint('/v1/chat/completions', 'POST', {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello from Zuplo!' }],
    max_tokens: 50
  });
  
  // Test direct AI inference
  await testZuploEndpoint('/v1/ai/inference', 'POST', {
    prompt: 'Test Zuplo to HyperDAG routing',
    provider: 'auto'
  });
  
  // Test HuggingFace proxy
  await testZuploEndpoint('/v1/huggingface/inference', 'POST', {
    model: 'gpt2',
    inputs: 'Test HuggingFace via Zuplo:'
  });
  
  // Test usage analytics
  await testZuploEndpoint('/v1/usage');
  
  console.log('\n📊 Zuplo Integration Test Complete');
}

// Also test direct backend for comparison
async function testDirectBackend() {
  console.log('\n🔄 Testing Direct Backend (for comparison)');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    console.log(`Direct Backend Health: ${response.status} ${response.ok ? '✅' : '❌'}`);
    
    const aiResponse = await fetch('http://localhost:5000/api/web3-ai/ai-inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Test direct backend',
        provider: 'deepseek'
      })
    });
    console.log(`Direct AI Inference: ${aiResponse.status} ${aiResponse.ok ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`Direct Backend Error: ${error.message}`);
  }
}

// Run tests
runZuploTests()
  .then(() => testDirectBackend())
  .catch(console.error);