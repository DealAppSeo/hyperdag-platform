import Anthropic from '@anthropic-ai/sdk';

// Direct test of Anthropic + Helicone integration
async function testAnthropicHelicone() {
  console.log('🧪 Testing Anthropic + Helicone Integration...\n');

  try {
    // Check if keys are available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ ANTHROPIC_API_KEY not found');
      return;
    }
    
    if (!process.env.HELICONE_API_KEY) {
      console.log('❌ HELICONE_API_KEY not found');
      return;
    }

    console.log('✅ Both API keys are available');
    console.log('🔄 Creating Anthropic client with Helicone...');

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://anthropic.helicone.ai",
      defaultHeaders: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
      }
    });

    console.log('✅ Client created, making test request...');

    const message = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 50,
      messages: [{
        role: "user", 
        content: "Say hello and confirm Helicone monitoring is working"
      }]
    });

    console.log('✅ Request successful!');
    console.log('Response:', message.content[0].text);
    console.log('\n🎉 Helicone integration should now be active!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAnthropicHelicone();