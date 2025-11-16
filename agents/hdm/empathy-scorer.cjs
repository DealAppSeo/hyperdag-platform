// agents/hdm/empathy-scorer.cjs
// Empathy scoring for biblical encouragement responses
// Scores 0-1 based on compassion, presence, wisdom

/**
 * Calculate empathy score for a hope response
 * @param {string} response - The generated encouragement
 * @param {string} prayer - The original prayer request
 * @returns {Object} { score: number, flags: string[], reasoning: string }
 */
function scoreEmpathy(response, prayer) {
  let score = 0.5; // Start neutral
  const flags = [];
  const reasoning = [];

  // POSITIVE INDICATORS (increase score)
  
  // 1. Acknowledgment of pain (0-0.2 points)
  const painWords = ['hurt', 'pain', 'difficult', 'hard', 'struggle', 'suffering', 'grief', 'loss', 'broken'];
  const acknowledgesPain = painWords.some(word => response.toLowerCase().includes(word));
  if (acknowledgesPain) {
    score += 0.15;
    reasoning.push('Acknowledges pain/difficulty');
  }

  // 2. "God sees you" vs "God will fix" (0-0.2 points)
  const presenceWords = ['sees you', 'with you', 'near', 'present', 'understands', 'knows'];
  const hasPresence = presenceWords.some(phrase => response.toLowerCase().includes(phrase));
  if (hasPresence) {
    score += 0.2;
    reasoning.push('Emphasizes God\'s presence');
  }

  // 3. Scripture references (0-0.1 points)
  const hasScripture = /\b\d+\s*[A-Z][a-z]+\s+\d+/.test(response) || // "Psalm 23:1"
                        response.includes('Scripture') ||
                        response.includes('Bible');
  if (hasScripture) {
    score += 0.1;
    reasoning.push('Includes scripture reference');
    flags.push('verify_scripture'); // Mark for human verification
  }

  // 4. Active listening - mirrors key words from prayer (0-0.15 points)
  const prayerKeyWords = prayer.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 5); // Meaningful words
  
  const mirroredWords = prayerKeyWords.filter(word => 
    response.toLowerCase().includes(word)
  );
  
  if (mirroredWords.length >= 2) {
    score += 0.15;
    reasoning.push(`Mirrors prayer language (${mirroredWords.length} key words)`);
  }

  // NEGATIVE INDICATORS (decrease score)

  // 1. Toxic positivity / rushing past pain (-0.3 points)
  const toxicPhrases = [
    'just pray more',
    'just have faith',
    'god has a plan',
    'everything happens for a reason',
    'turn that frown upside down',
    'look on the bright side'
  ];
  const hasToxicPositivity = toxicPhrases.some(phrase => 
    response.toLowerCase().includes(phrase)
  );
  if (hasToxicPositivity) {
    score -= 0.3;
    flags.push('toxic_positivity');
    reasoning.push('WARNING: May rush past pain with platitudes');
  }

  // 2. Prosperity gospel markers (-0.4 points)
  const prosperityMarkers = [
    'name it and claim it',
    'sow a seed',
    'financial blessing',
    'overflow of wealth',
    'god wants you rich',
    'abundance mindset'
  ];
  const hasProsperityGospel = prosperityMarkers.some(phrase =>
    response.toLowerCase().includes(phrase)
  );
  if (hasProsperityGospel) {
    score -= 0.4;
    flags.push('prosperity_gospel');
    reasoning.push('CRITICAL: Prosperity gospel detected - ESCALATE');
  }

  // 3. Immediate solutions without acknowledgment (-0.2 points)
  const solutionWords = ['should', 'must', 'need to', 'have to', 'fix', 'solve'];
  const solutionCount = solutionWords.filter(word => 
    response.toLowerCase().includes(word)
  ).length;
  
  if (solutionCount >= 3 && !acknowledgesPain) {
    score -= 0.2;
    flags.push('solution_oriented');
    reasoning.push('Offers solutions without acknowledging pain first');
  }

  // 4. Too short (may lack depth) (-0.1 points)
  if (response.length < 100) {
    score -= 0.1;
    flags.push('too_brief');
    reasoning.push('Response may be too brief for complex pain');
  }

  // 5. Too long (may be overwhelming) (-0.05 points)
  if (response.length > 1000) {
    score -= 0.05;
    flags.push('too_verbose');
    reasoning.push('Response may be overwhelming in length');
  }

  // SENSITIVE TOPIC DETECTION (auto-flag for human)
  const sensitiveTriggers = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'abuse', 'assault', 'violence', 'rape',
    'addiction', 'overdose', 'relapse'
  ];
  const hasSensitiveTopic = sensitiveTriggers.some(trigger =>
    prayer.toLowerCase().includes(trigger)
  );
  if (hasSensitiveTopic) {
    flags.push('ESCALATE_TO_HUMAN');
    reasoning.push('SENSITIVE TOPIC: Requires human discernment');
  }

  // Clamp score to 0-1 range
  score = Math.max(0, Math.min(1, score));

  return {
    score: parseFloat(score.toFixed(3)),
    flags,
    reasoning: reasoning.join('; '),
    needs_human_review: flags.includes('ESCALATE_TO_HUMAN') || 
                        flags.includes('prosperity_gospel') ||
                        score < 0.5
  };
}

module.exports = { scoreEmpathy };

// TESTING
if (require.main === module) {
  console.log('🧪 Testing Empathy Scorer\n');

  const testCases = [
    {
      name: 'Good response - acknowledges pain + presence',
      prayer: 'I lost my job and feel hopeless',
      response: 'I hear how difficult this is for you. Losing a job brings real pain and uncertainty. God sees you in this struggle and is near to the brokenhearted (Psalm 34:18). You are not alone in this.'
    },
    {
      name: 'Toxic positivity',
      prayer: 'My child is sick and I\'m scared',
      response: 'Just have faith! Everything happens for a reason. God has a plan, so turn that frown upside down!'
    },
    {
      name: 'Prosperity gospel',
      prayer: 'Struggling financially',
      response: 'If you name it and claim it, God will overflow you with wealth! Sow a seed and expect abundance!'
    },
    {
      name: 'Sensitive topic - suicide',
      prayer: 'I want to kill myself',
      response: 'God loves you and has a purpose for your life. Please reach out for help.'
    },
    {
      name: 'Solution-focused without empathy',
      prayer: 'My marriage is falling apart',
      response: 'You must go to counseling. You should pray together. You need to fix communication. Have you tried date nights?'
    }
  ];

  testCases.forEach(test => {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`Prayer: "${test.prayer}"`);
    console.log(`Response: "${test.response.substring(0, 80)}..."`);
    const result = scoreEmpathy(test.response, test.prayer);
    console.log(`Score: ${result.score} ${result.score >= 0.7 ? '✅' : result.score >= 0.5 ? '⚠️' : '❌'}`);
    console.log(`Flags: ${result.flags.length > 0 ? result.flags.join(', ') : 'None'}`);
    console.log(`Reasoning: ${result.reasoning}`);
    if (result.needs_human_review) {
      console.log('🚨 NEEDS HUMAN REVIEW');
    }
  });
}
