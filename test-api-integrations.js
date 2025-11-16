/**
 * Test API Integrations - Verify what's actually working
 */

const API_BASE = 'http://localhost:5000';

// Test available API keys
console.log('🔑 Available API Keys:');
console.log('DEEPSEEK_AI_SYMPHONY:', process.env.DEEPSEEK_AI_SYMPHONY ? '✅ EXISTS' : '❌ MISSING');
console.log('MYNINJA_API_KEY:', process.env.MYNINJA_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('PROMPTLAYER_API_KEY:', process.env.PROMPTLAYER_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('LOVABLE_API_KEY:', process.env.LOVABLE_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('ZUPLO_API_KEY:', process.env.ZUPLO_API_KEY ? '✅ EXISTS' : '❌ MISSING');

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 Testing API Endpoints:');
  
  // Test health endpoint
  console.log('\n1. Health Check:');
  const health = await testAPI('/api/health');
  console.log('Health Status:', health.ok ? '✅ WORKING' : '❌ FAILED', health.status);
  
  // Test AI service status
  console.log('\n2. AI Service Status:');
  const aiStatus = await testAPI('/api/ai/status');
  console.log('AI Status:', aiStatus.ok ? '✅ WORKING' : '❌ FAILED', aiStatus.status);
  
  // Test ANFIS routing
  console.log('\n3. ANFIS Routing:');
  const anfis = await testAPI('/api/ai/anfis-routing', 'POST', {
    prompt: 'Test ANFIS routing system',
    service: 'auto'
  });
  console.log('ANFIS Routing:', anfis.ok ? '✅ WORKING' : '❌ FAILED', anfis.status);
  
  // Test Web3-AI endpoint
  console.log('\n4. Web3-AI Inference:');
  const web3ai = await testAPI('/api/web3-ai/ai-inference', 'POST', {
    prompt: 'Test AI inference',
    provider: 'deepseek'
  });
  console.log('Web3-AI:', web3ai.ok ? '✅ WORKING' : '❌ FAILED', web3ai.status);
  
  // Test authentication
  console.log('\n5. Authentication:');
  const auth = await testAPI('/api/auth/status');
  console.log('Auth Status:', auth.ok ? '✅ WORKING' : '❌ FAILED', auth.status);
  
  // Test 4FA system
  console.log('\n6. 4FA System:');
  const fourfa = await testAPI('/api/4fa/status');
  console.log('4FA Status:', fourfa.ok ? '✅ WORKING' : '❌ FAILED', fourfa.status);
  
  // Test ZKP system
  console.log('\n7. Zero-Knowledge Proofs:');
  const zkp = await testAPI('/api/zkp/status');
  console.log('ZKP Status:', zkp.ok ? '✅ WORKING' : '❌ FAILED', zkp.status);
  
  console.log('\n📊 Test Summary Complete');
}

// HuggingFace API Direct Test
async function testHuggingFace() {
  console.log('\n🤗 Testing HuggingFace Direct API:');
  
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log('❌ No HuggingFace API key found');
    return;
  }
  
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Test HuggingFace integration: ',
        parameters: { max_length: 50 }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ HuggingFace API Working');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ HuggingFace API Failed:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ HuggingFace API Error:', error.message);
  }
}

// OpenAI API Direct Test
async function testOpenAI() {
  console.log('\n🧠 Testing OpenAI Direct API:');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ No OpenAI API key found');
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test OpenAI integration' }],
        max_tokens: 50
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ OpenAI API Working');
      console.log('Response:', result.choices[0].message.content);
    } else {
      console.log('❌ OpenAI API Failed:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ OpenAI API Error:', error.message);
  }
}

// Run all tests
runTests()
  .then(() => testHuggingFace())
  .then(() => testOpenAI())
  .catch(console.error);