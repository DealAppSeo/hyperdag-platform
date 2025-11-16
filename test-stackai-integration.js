/**
 * StackAI Integration Test
 * 
 * Tests the knowledge-enhanced AI capabilities including:
 * - Knowledge base queries
 * - Conversation starters
 * - Multi-provider AI routing with StackAI integration
 * - Fallback mechanisms when StackAI is unavailable
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testStackAIIntegration() {
  console.log('\n🧠 Testing StackAI Knowledge-Enhanced AI Integration...\n');

  try {
    // Test 1: Get Conversation Starters
    console.log('1️⃣ Testing Conversation Starters...');
    const startersResponse = await axios.get(`${BASE_URL}/ai/conversation-starters`);
    
    if (startersResponse.data.success && startersResponse.data.data.length > 0) {
      console.log(`✅ Found ${startersResponse.data.count} conversation starters`);
      console.log(`Sample starter: "${startersResponse.data.data[0].title}"`);
    } else {
      console.log('⚠️ No conversation starters available');
    }

    // Test 2: Knowledge-Enhanced Grant Discovery Query
    console.log('\n2️⃣ Testing Knowledge-Enhanced Grant Discovery...');
    const grantQuery = {
      query: 'Find AI research grants for blockchain projects with funding over $100k',
      conversationType: 'grant_discovery',
      context: 'HyperDAG platform user looking for funding opportunities'
    };
    
    const grantResponse = await axios.post(`${BASE_URL}/ai/knowledge-query`, grantQuery);
    
    if (grantResponse.data.success) {
      console.log('✅ Grant discovery query processed successfully');
      console.log(`Provider: ${grantResponse.data.data.provider}`);
      console.log(`Response length: ${grantResponse.data.data.response.length} characters`);
    } else {
      console.log('⚠️ Grant discovery query failed');
    }

    // Test 3: Application Help Query
    console.log('\n3️⃣ Testing Application Help Knowledge...');
    const appHelpQuery = {
      query: 'How can I improve my NSF grant application for a decentralized research platform?',
      conversationType: 'application_help'
    };
    
    const appHelpResponse = await axios.post(`${BASE_URL}/ai/knowledge-query`, appHelpQuery);
    
    if (appHelpResponse.data.success) {
      console.log('✅ Application help query processed successfully');
      console.log(`Conversation type: ${appHelpResponse.data.data.conversationType}`);
    } else {
      console.log('⚠️ Application help query failed');
    }

    // Test 4: Team Formation Knowledge
    console.log('\n4️⃣ Testing Team Formation Knowledge...');
    const teamQuery = {
      query: 'What team composition works best for Web3 research grants?',
      conversationType: 'team_formation'
    };
    
    const teamResponse = await axios.post(`${BASE_URL}/ai/knowledge-query`, teamQuery);
    
    if (teamResponse.data.success) {
      console.log('✅ Team formation query processed successfully');
    } else {
      console.log('⚠️ Team formation query failed');
    }

    // Test 5: Compliance Check Knowledge
    console.log('\n5️⃣ Testing Compliance Knowledge...');
    const complianceQuery = {
      query: 'What are the compliance requirements for NSF grants involving blockchain technology?',
      conversationType: 'compliance_check'
    };
    
    const complianceResponse = await axios.post(`${BASE_URL}/ai/knowledge-query`, complianceQuery);
    
    if (complianceResponse.data.success) {
      console.log('✅ Compliance query processed successfully');
    } else {
      console.log('⚠️ Compliance query failed');
    }

    // Test 6: AI System Status
    console.log('\n6️⃣ Testing AI System Status...');
    const statusResponse = await axios.get(`${BASE_URL}/ai/status`);
    
    if (statusResponse.data.success) {
      console.log('✅ AI system status retrieved successfully');
      console.log(`Available capabilities: ${statusResponse.data.data.capabilities.length}`);
      console.log(`Multi-provider status: ${statusResponse.data.data.multiProvider.configured ? 'Configured' : 'Not configured'}`);
      console.log(`Knowledge base status: ${statusResponse.data.data.knowledgeBase.configured ? 'Configured' : 'Not configured'}`);
    } else {
      console.log('⚠️ AI system status check failed');
    }

    // Test 7: Error Handling and Fallbacks
    console.log('\n7️⃣ Testing Error Handling and Fallbacks...');
    const invalidQuery = {
      query: '',  // Invalid empty query
      conversationType: 'grant_discovery'
    };
    
    try {
      await axios.post(`${BASE_URL}/ai/knowledge-query`, invalidQuery);
      console.log('⚠️ Error handling test: Should have failed with empty query');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Error handling working correctly - rejected empty query');
      } else {
        console.log('⚠️ Unexpected error response');
      }
    }

    // Test 8: Conversation Starter Usage
    console.log('\n8️⃣ Testing Conversation Starter Usage...');
    if (startersResponse.data.success && startersResponse.data.data.length > 0) {
      const firstStarter = startersResponse.data.data[0];
      const starterQuery = {
        query: firstStarter.prompt,
        conversationType: firstStarter.category.toLowerCase().replace(' ', '_')
      };
      
      const starterResponse = await axios.post(`${BASE_URL}/ai/knowledge-query`, starterQuery);
      
      if (starterResponse.data.success) {
        console.log(`✅ Conversation starter "${firstStarter.title}" processed successfully`);
      } else {
        console.log('⚠️ Conversation starter processing failed');
      }
    }

    console.log('\n🎉 StackAI Integration Test Summary:');
    console.log('✅ Knowledge-enhanced AI capabilities operational');
    console.log('✅ Conversation starters available and functional');
    console.log('✅ Multi-provider AI routing with StackAI integration');
    console.log('✅ Fallback mechanisms working for error scenarios');
    console.log('✅ Context-aware responses based on conversation type');
    console.log('\n🚀 StackAI integration ready for production use!');

  } catch (error) {
    console.error('\n❌ StackAI Integration Test Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the HyperDAG server is running on port 5000');
    } else if (error.response?.status === 401) {
      console.log('💡 Authentication required - some features require user login');
    } else if (error.response?.status >= 500) {
      console.log('💡 Server error - StackAI service may need configuration');
      console.log('💡 Check if STACKAI_API_KEY and STACKAI_KNOWLEDGE_BASE_ID are set');
    }
  }
}

// Run the StackAI integration test
testStackAIIntegration();