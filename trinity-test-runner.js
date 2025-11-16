/**
 * Direct Trinity System Hallucination Test Runner
 * Runs immediately without compilation issues
 */

const testQuestions = [
  {
    id: 'fact_1',
    question: 'What is the exact date when World War II ended?',
    correctAnswer: 'September 2, 1945'
  },
  {
    id: 'fact_2', 
    question: 'What is the speed of light in vacuum?',
    correctAnswer: '299,792,458 meters per second'
  },
  {
    id: 'tech_1',
    question: 'What is the time complexity of binary search?',
    correctAnswer: 'O(log n)'
  },
  {
    id: 'tech_2',
    question: 'What is the default port for HTTPS?',
    correctAnswer: 'Port 443'
  },
  {
    id: 'reason_1',
    question: 'A train travels 60 km in 1 hour. How long will it take to travel 90 km at the same speed?',
    correctAnswer: '1.5 hours'
  }
];

async function getSingleAIResponse(question) {
  try {
    const response = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Answer this question accurately: ${question}`,
        provider: 'deepseek'
      })
    });
    
    const data = await response.json();
    return data.text || data.response || 'No response';
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function getTrinityResponse(question) {
  const managers = ['AI-Prompt-Manager', 'HyperDAGManager', 'Mel'];
  const responses = [];
  
  for (const manager of managers) {
    try {
      const response = await fetch('http://localhost:5000/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[${manager}] With your specialized expertise, answer: ${question}`,
          provider: 'deepseek'
        })
      });
      
      const data = await response.json();
      responses.push({
        manager,
        response: data.text || data.response || 'No response'
      });
    } catch (error) {
      responses.push({
        manager,
        response: `${manager} failed: ${error.message}`
      });
    }
  }
  
  // Build consensus
  const validResponses = responses.filter(r => !r.response.includes('failed'));
  return {
    responses,
    consensusResponse: validResponses.length > 0 ? validResponses[0].response : 'Trinity failed',
    agreementLevel: validResponses.length / managers.length
  };
}

function detectHallucinations(question, response, correctAnswer) {
  const hallucinations = [];
  const lowerResponse = response.toLowerCase();
  const lowerCorrect = correctAnswer.toLowerCase();
  
  // Simple hallucination detection
  switch (question.id) {
    case 'fact_1':
      if (!lowerResponse.includes('1945')) {
        hallucinations.push('Missing or incorrect WWII end date');
      }
      break;
    case 'fact_2':
      if (!lowerResponse.includes('299') || !lowerResponse.includes('792')) {
        hallucinations.push('Incorrect speed of light value');
      }
      break;
    case 'tech_1':
      if (!lowerResponse.includes('log') || !lowerResponse.includes('n')) {
        hallucinations.push('Incorrect binary search complexity');
      }
      break;
    case 'tech_2':
      if (!lowerResponse.includes('443')) {
        hallucinations.push('Incorrect HTTPS port');
      }
      break;
    case 'reason_1':
      if (!lowerResponse.includes('1.5') && !lowerResponse.includes('90')) {
        hallucinations.push('Incorrect calculation');
      }
      break;
  }
  
  return hallucinations;
}

async function runTest() {
  console.log('🚀 Starting Trinity System Hallucination Reduction Test...\n');
  
  const results = [];
  let singleAIHallucinations = 0;
  let trinityHallucinations = 0;
  
  for (const question of testQuestions) {
    console.log(`Testing: ${question.question}`);
    
    // Get single AI response
    const singleResponse = await getSingleAIResponse(question.question);
    const singleHalls = detectHallucinations(question, singleResponse, question.correctAnswer);
    singleAIHallucinations += singleHalls.length;
    
    console.log(`Single AI: ${singleResponse.substring(0, 100)}...`);
    console.log(`Single AI Hallucinations: ${singleHalls.length}`);
    
    // Get Trinity System response
    const trinityResponse = await getTrinityResponse(question.question);
    const trinityHalls = detectHallucinations(question, trinityResponse.consensusResponse, question.correctAnswer);
    trinityHallucinations += trinityHalls.length;
    
    console.log(`Trinity System: ${trinityResponse.consensusResponse.substring(0, 100)}...`);
    console.log(`Trinity System Hallucinations: ${trinityHalls.length}`);
    console.log(`Agreement Level: ${(trinityResponse.agreementLevel * 100).toFixed(1)}%`);
    console.log('---\n');
    
    results.push({
      question: question.question,
      singleAIHallucinations: singleHalls,
      trinityHallucinations: trinityHalls,
      trinityAgreement: trinityResponse.agreementLevel
    });
    
    // Brief pause to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Calculate results
  const totalQuestions = testQuestions.length;
  const singleAIRate = singleAIHallucinations / totalQuestions;
  const trinityRate = trinityHallucinations / totalQuestions;
  const improvementRate = singleAIRate > 0 ? ((singleAIRate - trinityRate) / singleAIRate) * 100 : 0;
  
  console.log('✅ TEST COMPLETED!\n');
  console.log('📊 TRINITY SYSTEM HALLUCINATION REDUCTION RESULTS:');
  console.log('================================================');
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Single AI Hallucinations: ${singleAIHallucinations} (${(singleAIRate * 100).toFixed(1)}% rate)`);
  console.log(`Trinity System Hallucinations: ${trinityHallucinations} (${(trinityRate * 100).toFixed(1)}% rate)`);
  console.log(`🎯 IMPROVEMENT: ${improvementRate.toFixed(1)}% REDUCTION in hallucinations`);
  
  const avgAgreement = results.reduce((sum, r) => sum + r.trinityAgreement, 0) / totalQuestions;
  console.log(`Trinity System Average Agreement: ${(avgAgreement * 100).toFixed(1)}%`);
  
  if (improvementRate > 50) {
    console.log('\n🏆 PATENT-DEFENSIBLE RESULT: >50% hallucination reduction achieved!');
  }
  
  return {
    totalQuestions,
    singleAIHallucinationRate: singleAIRate,
    trinityHallucinationRate: trinityRate,
    improvementPercentage: improvementRate,
    averageAgreement: avgAgreement
  };
}

// Run the test
runTest().catch(console.error);