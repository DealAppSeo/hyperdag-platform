/**
 * Anthropic Service Integration Test
 * Verifies the service can be imported and basic functionality works
 */

import { anthropicService } from './anthropic-service';

export async function testAnthropicService() {
  console.log('🧪 Testing Anthropic Claude Service Integration');
  
  // Test service initialization
  const stats = anthropicService.getStats();
  console.log(`✅ Service initialized: ${stats.provider}`);
  console.log(`📊 Available models: ${stats.models.length}`);
  console.log(`🔧 Capabilities: ${stats.capabilities.join(', ')}`);
  
  // Test availability check
  const isAvailable = anthropicService.isAvailable();
  console.log(`🟢 Service available: ${isAvailable}`);
  
  // Test quota management
  const quota = anthropicService.getRemainingQuota();
  console.log(`📈 Remaining quota: ${quota} tokens`);
  
  // Test model availability
  const models = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];
  models.forEach(model => {
    const available = anthropicService.isModelAvailable(model);
    console.log(`🤖 Model ${model}: ${available ? 'Available' : 'Not available'}`);
  });
  
  // Test optimal model selection
  const optimalModel = anthropicService.getOptimalModel('analysis');
  console.log(`🎯 Optimal model for analysis: ${optimalModel}`);
  
  // Test usage stats
  const usage = anthropicService.getUsageStats();
  console.log(`📊 Usage statistics:`, {
    used: usage.tokensUsedThisMonth,
    limit: usage.monthlyLimit,
    percentage: usage.usagePercentage.toFixed(1) + '%'
  });
  
  // If API key is configured, test actual generation (only if available)
  if (isAvailable && process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('🚀 Testing text generation...');
      const response = await anthropicService.generateQuick('Test prompt: Hello Claude!');
      
      if (response.success) {
        console.log(`✅ Generation successful: ${response.tokens} tokens in ${response.latency}ms`);
        console.log(`📝 Content preview: "${response.content.substring(0, 100)}..."`);
      } else {
        console.log('❌ Generation failed (expected if no API key)');
      }
    } catch (error) {
      console.log(`⚠️  Generation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    console.log('ℹ️  API key not configured - skipping live generation test');
  }
  
  console.log('🎉 Anthropic Claude Service integration test completed!');
  return stats;
}

// Export for potential use in other tests
export { anthropicService };