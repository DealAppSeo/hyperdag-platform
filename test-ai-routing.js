#!/usr/bin/env node

/**
 * Test script to demonstrate HyperDAG's multi-provider AI routing system
 * This showcases how different question types are intelligently routed to optimal AI providers
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test scenarios demonstrating intelligent routing
const testScenarios = [
  {
    name: 'Real-time Market Data (Routes to Perplexity)',
    question: 'What is the current price of Ethereum and recent Web3 market trends?',
    expectedProvider: 'perplexity',
    category: 'Real-time Web3 & Market Data'
  },
  {
    name: 'Quick Technical Question (Routes to OpenAI)',
    question: 'What is a blockchain?',
    expectedProvider: 'openai', 
    category: 'Technical Help'
  },
  {
    name: 'Educational Content (Routes to Together AI)',
    question: 'How do I learn smart contract development?',
    expectedProvider: 'together',
    category: 'Educational & Open Source'
  },
  {
    name: 'Career Analysis (Routes to Cohere)',
    question: 'Analyze my career path in Web3 development',
    expectedProvider: 'cohere',
    category: 'Career Development & Analysis'
  },
  {
    name: 'Complex ZKP Explanation (Routes to OpenAI)',
    question: 'Explain how Zero Knowledge Proofs work in HyperDAG\'s SBT credentials',
    expectedProvider: 'openai',
    category: 'HyperDAG ZKP Credentials'
  },
  {
    name: 'Grant Research (Routes to Perplexity)',
    question: 'Find current Web3 grants for nonprofit organizations',
    expectedProvider: 'perplexity',
    category: 'Grant & Research Information'
  }
];

async function testAIRouting() {
  console.log('\n🧠 Testing HyperDAG Multi-Provider AI Routing System\n');
  console.log('='.repeat(60));
  
  for (const scenario of testScenarios) {
    console.log(`\n📝 Test: ${scenario.name}`);
    console.log(`Question: "${scenario.question}"`);
    console.log(`Expected Category: ${scenario.category}`);
    console.log(`Expected Provider: ${scenario.expectedProvider.toUpperCase()}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/qa/intelligent-answer`, {
        question: scenario.question,
        userContext: {
          currentPage: 'test',
          onboardingStage: 2,
          interests: ['web3', 'blockchain']
        }
      });
      
      if (response.data.success) {
        const { answer, agentUsed, category, reasoning } = response.data.data;
        
        console.log(`✅ Successfully routed to: ${agentUsed.toUpperCase()}`);
        console.log(`📂 Detected Category: ${category}`);
        console.log(`💡 Routing Reasoning: ${reasoning || 'Provider strength-based selection'}`);
        console.log(`📄 Answer Preview: ${answer.substring(0, 100)}...`);
        
        if (agentUsed === scenario.expectedProvider) {
          console.log(`🎯 ROUTING SUCCESS: Correctly routed to ${agentUsed.toUpperCase()}`);
        } else {
          console.log(`⚠️  ROUTING VARIANCE: Expected ${scenario.expectedProvider.toUpperCase()}, got ${agentUsed.toUpperCase()}`);
          console.log(`   This may be due to fallback logic or rate limiting`);
        }
      } else {
        console.log(`❌ Error: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`💥 Request failed: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Server response: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('-'.repeat(50));
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test system status
  console.log('\n📊 System Status Check');
  try {
    const statusResponse = await axios.get(`${BASE_URL}/api/ai/status`);
    if (statusResponse.data.success) {
      const { totalAgents, availableAgents, systemHealth, agentDetails } = statusResponse.data;
      
      console.log(`🔧 Total AI Providers: ${totalAgents}`);
      console.log(`✅ Available Providers: ${availableAgents}`);
      console.log(`💚 System Health: ${(systemHealth * 100).toFixed(1)}%`);
      
      console.log('\n🤖 Provider Details:');
      Object.entries(agentDetails).forEach(([provider, details]) => {
        console.log(`  ${provider.toUpperCase()}: ${details.available ? '✅' : '❌'} (${details.requestCount} requests)`);
        console.log(`    ${details.description}`);
      });
    }
  } catch (error) {
    console.log(`❌ Status check failed: ${error.message}`);
  }
  
  console.log('\n🎉 Multi-Provider AI Routing Test Complete!');
  console.log('='.repeat(60));
}

// Run the test
testAIRouting().catch(console.error);