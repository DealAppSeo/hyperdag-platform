/**
 * Trinity System Hallucination Reduction A/B Test
 * Tests single AI vs Trinity System with real-time verification
 */

interface TestQuestion {
  id: string;
  category: 'factual' | 'technical' | 'reasoning' | 'creative';
  question: string;
  correctAnswer: string;
  verificationCriteria: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface HallucinationMetrics {
  factualErrors: number;
  inconsistencies: number; 
  unsupportedClaims: number;
  confidenceMisalignment: number;
  totalStatements: number;
  hallucinationRate: number;
}

interface TestResult {
  questionId: string;
  category: string;
  
  singleAI: {
    response: string;
    confidence: number;
    processingTime: number;
    cost: number;
  };
  
  trinitySystem: {
    managerResponses: any[];
    consensusResponse: string;
    verificationLevel: string;
    confidence: number;
    processingTime: number;
    cost: number;
    errorFlags: string[];
    crossValidationScore: number;
  };
  
  verification: {
    singleAIHallucinations: string[];
    trinityHallucinations: string[];
    singleAIAccuracy: number;
    trinityAccuracy: number;
    improvementRate: number;
  };
}

export class TrinityHallucinationTester {
  private testQuestions: TestQuestion[] = [
    // FACTUAL QUESTIONS (verifiable facts)
    {
      id: 'fact_1',
      category: 'factual',
      question: 'What is the exact date when World War II ended?',
      correctAnswer: 'September 2, 1945 (formal surrender ceremony)',
      verificationCriteria: ['Must include specific date', 'Should mention formal surrender', 'No conflicting dates'],
      difficulty: 'easy'
    },
    {
      id: 'fact_2', 
      category: 'factual',
      question: 'What is the speed of light in vacuum?',
      correctAnswer: '299,792,458 meters per second (exactly)',
      verificationCriteria: ['Exact numerical value', 'Correct units', 'No approximations as exact'],
      difficulty: 'easy'
    },
    {
      id: 'fact_3',
      category: 'factual', 
      question: 'Who wrote the novel "1984" and when was it published?',
      correctAnswer: 'George Orwell, published in 1949',
      verificationCriteria: ['Correct author name', 'Correct publication year', 'No confusion with other works'],
      difficulty: 'easy'
    },
    
    // TECHNICAL QUESTIONS (specific domain knowledge)
    {
      id: 'tech_1',
      category: 'technical',
      question: 'What is the time complexity of binary search?',
      correctAnswer: 'O(log n) - logarithmic time complexity',
      verificationCriteria: ['Correct Big O notation', 'Logarithmic explanation', 'No confusion with other algorithms'],
      difficulty: 'medium'
    },
    {
      id: 'tech_2',
      category: 'technical', 
      question: 'In React, what is the difference between useEffect and useLayoutEffect?',
      correctAnswer: 'useEffect runs after DOM mutations, useLayoutEffect runs synchronously before browser paint',
      verificationCriteria: ['Timing difference explained', 'DOM/paint cycle understanding', 'Practical use cases'],
      difficulty: 'medium'
    },
    {
      id: 'tech_3',
      category: 'technical',
      question: 'What is the default port for HTTPS?',
      correctAnswer: 'Port 443',
      verificationCriteria: ['Correct port number', 'HTTPS specification', 'No confusion with HTTP port 80'],
      difficulty: 'easy'
    },
    
    // REASONING QUESTIONS (logical deduction)
    {
      id: 'reason_1',
      category: 'reasoning',
      question: 'If all roses are flowers, and some flowers are red, can we conclude that some roses are red?',
      correctAnswer: 'No - this conclusion is not logically valid. We cannot determine rose color from the given premises.',
      verificationCriteria: ['Logical validity understanding', 'Syllogism analysis', 'Clear reasoning explanation'],
      difficulty: 'medium'
    },
    {
      id: 'reason_2',
      category: 'reasoning',
      question: 'A train travels 60 km in 1 hour. How long will it take to travel 90 km at the same speed?',
      correctAnswer: '1.5 hours (90 minutes)',
      verificationCriteria: ['Correct calculation', 'Proportional reasoning', 'Proper units'],
      difficulty: 'easy'
    },
    
    // CREATIVE QUESTIONS (for baseline comparison)
    {
      id: 'creative_1',
      category: 'creative',
      question: 'Write a haiku about artificial intelligence.',
      correctAnswer: 'Any valid haiku structure (5-7-5 syllables) about AI',
      verificationCriteria: ['Correct syllable count', 'AI theme', 'Coherent meaning'],
      difficulty: 'medium'
    }
  ];

  private results: TestResult[] = [];

  constructor() {
    console.log('[Trinity Hallucination Test] Initialized with', this.testQuestions.length, 'test questions');
  }

  /**
   * Run complete A/B test comparing Single AI vs Trinity System
   */
  async runFullTest(): Promise<{
    summary: {
      totalQuestions: number;
      singleAIHallucinationRate: number;
      trinityHallucinationRate: number;
      improvementPercentage: number;
      statisticalSignificance: boolean;
      confidenceInterval: [number, number];
    };
    detailedResults: TestResult[];
    analysis: any;
  }> {
    console.log('[Trinity Test] 🚀 Starting full hallucination reduction A/B test...');
    const startTime = Date.now();
    
    // Test each question with both systems
    for (const question of this.testQuestions) {
      console.log(`[Trinity Test] Testing question: ${question.id} (${question.category})`);
      
      const result = await this.testSingleQuestion(question);
      this.results.push(result);
      
      // Brief pause to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`[Trinity Test] ✅ Completed ${this.testQuestions.length} questions in ${totalTime}s`);
    
    // Calculate results
    const analysis = this.analyzeResults();
    
    return {
      summary: {
        totalQuestions: this.testQuestions.length,
        singleAIHallucinationRate: analysis.singleAIHallucinationRate,
        trinityHallucinationRate: analysis.trinityHallucinationRate,
        improvementPercentage: analysis.improvementPercentage,
        statisticalSignificance: analysis.pValue < 0.05,
        confidenceInterval: analysis.confidenceInterval
      },
      detailedResults: this.results,
      analysis
    };
  }

  /**
   * Test single question with both systems
   */
  private async testSingleQuestion(question: TestQuestion): Promise<TestResult> {
    const startTime = Date.now();
    
    // Test 1: Single AI Response
    const singleAIResult = await this.getSingleAIResponse(question.question);
    
    // Test 2: Trinity System Response  
    const trinityResult = await this.getTrinitySystemResponse(question.question);
    
    // Verify both responses
    const verification = this.verifyResponses(question, singleAIResult.response, trinityResult.consensusResponse);
    
    const endTime = Date.now();
    
    return {
      questionId: question.id,
      category: question.category,
      singleAI: singleAIResult,
      trinitySystem: trinityResult,
      verification
    };
  }

  /**
   * Get response from single AI provider
   */
  private async getSingleAIResponse(question: string): Promise<{
    response: string;
    confidence: number;
    processingTime: number;
    cost: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Use DeepSeek as our single AI baseline (cost-effective and reliable)
      const response = await fetch('http://localhost:5000/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Answer this question accurately and concisely: ${question}`,
          provider: 'deepseek',
          model: 'deepseek-chat'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      return {
        response: data.text || data.response || 'No response received',
        confidence: data.confidence || 0.8, // Default confidence
        processingTime,
        cost: 0.001 // Estimated cost per request
      };
      
    } catch (error) {
      console.error('[Single AI Test] Error:', error);
      return {
        response: 'Error: Could not get response from single AI',
        confidence: 0,
        processingTime: Date.now() - startTime,
        cost: 0
      };
    }
  }

  /**
   * Get response from Trinity System with cross-validation
   */
  private async getTrinitySystemResponse(question: string): Promise<{
    managerResponses: any[];
    consensusResponse: string;
    verificationLevel: string;
    confidence: number;
    processingTime: number;
    cost: number;
    errorFlags: string[];
    crossValidationScore: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get responses from all three Trinity managers
      const managers = ['AI-Prompt-Manager', 'HyperDAGManager', 'Mel'];
      const responses = [];
      
      for (const manager of managers) {
        try {
          const response = await fetch('http://localhost:5000/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `[${manager}] Answer this question with your specialized expertise: ${question}`,
              provider: 'deepseek', // Use same provider for fair comparison
              model: 'deepseek-chat'
            })
          });
          
          const data = await response.json();
          responses.push({
            manager,
            response: data.text || data.response || `${manager} error`,
            confidence: data.confidence || 0.8
          });
          
        } catch (error: any) {
          responses.push({
            manager,
            response: `${manager} failed: ${error?.message || 'Unknown error'}`,
            confidence: 0
          });
        }
      }
      
      // Cross-validate responses and build consensus
      const consensus = this.buildConsensusResponse(responses);
      const processingTime = Date.now() - startTime;
      
      return {
        managerResponses: responses,
        consensusResponse: consensus.response,
        verificationLevel: consensus.verificationLevel,
        confidence: consensus.confidence,
        processingTime,
        cost: 0.003, // 3x cost for 3 managers
        errorFlags: consensus.errorFlags,
        crossValidationScore: consensus.crossValidationScore
      };
      
    } catch (error) {
      console.error('[Trinity System Test] Error:', error);
      return {
        managerResponses: [],
        consensusResponse: 'Error: Trinity System failed',
        verificationLevel: 'error',
        confidence: 0,
        processingTime: Date.now() - startTime,
        cost: 0,
        errorFlags: ['system_error'],
        crossValidationScore: 0
      };
    }
  }

  /**
   * Build consensus from multiple manager responses
   */
  private buildConsensusResponse(responses: any[]): {
    response: string;
    verificationLevel: string;
    confidence: number;
    errorFlags: string[];
    crossValidationScore: number;
  } {
    const validResponses = responses.filter(r => r.confidence > 0);
    
    if (validResponses.length === 0) {
      return {
        response: 'No valid responses from Trinity managers',
        verificationLevel: 'error',
        confidence: 0,
        errorFlags: ['no_valid_responses'],
        crossValidationScore: 0
      };
    }
    
    // Check agreement level
    const responseTexts = validResponses.map(r => r.response.toLowerCase());
    const agreementScore = this.calculateAgreementScore(responseTexts);
    
    let verificationLevel: string;
    let errorFlags: string[] = [];
    
    if (agreementScore > 0.8) {
      verificationLevel = 'high';
    } else if (agreementScore > 0.5) {
      verificationLevel = 'medium';
      errorFlags.push('partial_disagreement');
    } else {
      verificationLevel = 'low';
      errorFlags.push('major_disagreement');
    }
    
    // Use highest confidence response as consensus
    const bestResponse = validResponses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    // Adjust confidence based on agreement
    const adjustedConfidence = bestResponse.confidence * agreementScore;
    
    return {
      response: bestResponse.response,
      verificationLevel,
      confidence: adjustedConfidence,
      errorFlags,
      crossValidationScore: agreementScore
    };
  }

  /**
   * Calculate agreement score between responses
   */
  private calculateAgreementScore(responses: string[]): number {
    if (responses.length < 2) return 1.0;
    
    // Simple word overlap calculation
    const words = responses.map(r => new Set(r.split(/\s+/).map(w => w.toLowerCase())));
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const wordArray1 = Array.from(words[i]);
        const wordArray2 = Array.from(words[j]);
        const intersection = new Set(wordArray1.filter(w => words[j].has(w)));
        const union = new Set([...wordArray1, ...wordArray2]);
        const similarity = intersection.size / union.size;
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Verify responses against correct answers and detect hallucinations
   */
  private verifyResponses(question: TestQuestion, singleAIResponse: string, trinityResponse: string): {
    singleAIHallucinations: string[];
    trinityHallucinations: string[];
    singleAIAccuracy: number;
    trinityAccuracy: number;
    improvementRate: number;
  } {
    const singleAIHallucinations = this.detectHallucinations(question, singleAIResponse);
    const trinityHallucinations = this.detectHallucinations(question, trinityResponse);
    
    const singleAIAccuracy = this.calculateAccuracy(question, singleAIResponse);
    const trinityAccuracy = this.calculateAccuracy(question, trinityResponse);
    
    const improvementRate = trinityAccuracy > singleAIAccuracy ? 
      ((trinityAccuracy - singleAIAccuracy) / singleAIAccuracy) * 100 : 0;
    
    return {
      singleAIHallucinations,
      trinityHallucinations,
      singleAIAccuracy,
      trinityAccuracy,
      improvementRate
    };
  }

  /**
   * Detect hallucinations in response
   */
  private detectHallucinations(question: TestQuestion, response: string): string[] {
    const hallucinations: string[] = [];
    const lowerResponse = response.toLowerCase();
    const correctAnswer = question.correctAnswer.toLowerCase();
    
    // Check against verification criteria
    for (const criterion of question.verificationCriteria) {
      const criterionCheck = this.checkCriterion(criterion, response, question.correctAnswer);
      if (!criterionCheck.passed) {
        hallucinations.push(`Failed: ${criterion} - ${criterionCheck.reason}`);
      }
    }
    
    // Domain-specific hallucination checks
    switch (question.category) {
      case 'factual':
        if (question.id === 'fact_1' && !lowerResponse.includes('1945')) {
          hallucinations.push('Incorrect WWII end date');
        }
        if (question.id === 'fact_2' && !lowerResponse.includes('299,792,458')) {
          hallucinations.push('Incorrect speed of light value');
        }
        break;
        
      case 'technical':
        if (question.id === 'tech_1' && !lowerResponse.includes('log n')) {
          hallucinations.push('Incorrect time complexity for binary search');
        }
        if (question.id === 'tech_3' && !lowerResponse.includes('443')) {
          hallucinations.push('Incorrect HTTPS port');
        }
        break;
    }
    
    return hallucinations;
  }

  /**
   * Check specific verification criterion
   */
  private checkCriterion(criterion: string, response: string, correctAnswer: string): {
    passed: boolean;
    reason: string;
  } {
    const lowerResponse = response.toLowerCase();
    const lowerCriterion = criterion.toLowerCase();
    const lowerCorrect = correctAnswer.toLowerCase();
    
    if (lowerCriterion.includes('exact') || lowerCriterion.includes('specific')) {
      // Check for exact values/dates
      const numbers = correctAnswer.match(/\d+/g) || [];
      for (const num of numbers) {
        if (!lowerResponse.includes(num)) {
          return { passed: false, reason: `Missing exact value: ${num}` };
        }
      }
    }
    
    if (lowerCriterion.includes('no confusion') || lowerCriterion.includes('no conflicting')) {
      // Look for contradictory information
      if (lowerResponse.includes('however') || lowerResponse.includes('but also') || lowerResponse.includes('alternatively')) {
        return { passed: false, reason: 'Contains contradictory information' };
      }
    }
    
    return { passed: true, reason: 'Criterion met' };
  }

  /**
   * Calculate accuracy score for response
   */
  private calculateAccuracy(question: TestQuestion, response: string): number {
    let accuracy = 0;
    const criteriaCount = question.verificationCriteria.length;
    
    for (const criterion of question.verificationCriteria) {
      const check = this.checkCriterion(criterion, response, question.correctAnswer);
      if (check.passed) {
        accuracy += 1 / criteriaCount;
      }
    }
    
    return Math.min(1.0, accuracy);
  }

  /**
   * Analyze all test results and calculate statistics
   */
  private analyzeResults(): {
    singleAIHallucinationRate: number;
    trinityHallucinationRate: number;
    improvementPercentage: number;
    pValue: number;
    confidenceInterval: [number, number];
    categoryBreakdown: any;
  } {
    if (this.results.length === 0) {
      return {
        singleAIHallucinationRate: 0,
        trinityHallucinationRate: 0,
        improvementPercentage: 0,
        pValue: 1,
        confidenceInterval: [0, 0],
        categoryBreakdown: {}
      };
    }
    
    // Calculate hallucination rates
    const singleAIHallucinations = this.results.reduce((sum, r) => sum + r.verification.singleAIHallucinations.length, 0);
    const trinityHallucinations = this.results.reduce((sum, r) => sum + r.verification.trinityHallucinations.length, 0);
    
    const totalQuestions = this.results.length;
    const singleAIHallucinationRate = singleAIHallucinations / totalQuestions;
    const trinityHallucinationRate = trinityHallucinations / totalQuestions;
    
    const improvementPercentage = singleAIHallucinationRate > 0 ? 
      ((singleAIHallucinationRate - trinityHallucinationRate) / singleAIHallucinationRate) * 100 : 0;
    
    // Simple statistical test (chi-square approximation)
    const pValue = this.calculatePValue(singleAIHallucinations, trinityHallucinations, totalQuestions);
    
    // Confidence interval for improvement
    const confidenceInterval = this.calculateConfidenceInterval(
      singleAIHallucinationRate, 
      trinityHallucinationRate, 
      totalQuestions
    );
    
    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown();
    
    return {
      singleAIHallucinationRate,
      trinityHallucinationRate,
      improvementPercentage,
      pValue,
      confidenceInterval,
      categoryBreakdown
    };
  }

  private calculatePValue(single: number, trinity: number, total: number): number {
    // Simplified p-value calculation for demonstration
    const diff = single - trinity;
    const pooled = (single + trinity) / (2 * total);
    const se = Math.sqrt(2 * pooled * (1 - pooled) / total);
    const z = Math.abs(diff / total) / se;
    
    // Rough p-value approximation
    return z > 1.96 ? 0.05 : z > 1.645 ? 0.1 : 0.2;
  }

  private calculateConfidenceInterval(single: number, trinity: number, total: number): [number, number] {
    const diff = single - trinity;
    const se = Math.sqrt((single * (1 - single) + trinity * (1 - trinity)) / total);
    const margin = 1.96 * se; // 95% confidence interval
    
    return [(diff - margin) * 100, (diff + margin) * 100];
  }

  private calculateCategoryBreakdown(): any {
    const categories = ['factual', 'technical', 'reasoning', 'creative'];
    const breakdown: any = {};
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;
      
      const singleAIHallucinations = categoryResults.reduce((sum, r) => sum + r.verification.singleAIHallucinations.length, 0);
      const trinityHallucinations = categoryResults.reduce((sum, r) => sum + r.verification.trinityHallucinations.length, 0);
      
      breakdown[category] = {
        questions: categoryResults.length,
        singleAIHallucinationRate: singleAIHallucinations / categoryResults.length,
        trinityHallucinationRate: trinityHallucinations / categoryResults.length,
        improvement: singleAIHallucinations > 0 ? 
          ((singleAIHallucinations - trinityHallucinations) / singleAIHallucinations) * 100 : 0
      };
    }
    
    return breakdown;
  }
}