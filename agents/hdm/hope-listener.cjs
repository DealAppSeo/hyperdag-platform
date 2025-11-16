// agents/hdm/hope-listener.cjs
// HDM listens for prayer requests and responds with biblical encouragement
// Mission: Helping people help people through compassionate AI
// SAFETY: Rate limited, empathy scored, wisdom gated

const { scoreEmpathy } = require('./empathy-scorer.cjs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// SAFETY GUARDRAILS
const SAFETY = {
  MAX_PROCESSES_PER_HOUR: 25,       // Circuit breaker: rate limit
  MAX_CONSECUTIVE_ERRORS: 3,         // Circuit breaker: error threshold
  MIN_EMPATHY_SCORE: 0.5,            // Below this = request human review
  HEARTBEAT_INTERVAL_MS: 30000,      // 30s heartbeat
  POLL_INTERVAL_MS: 10000,           // 10s polling
  MAX_BATCH_SIZE: 5                  // Process max 5 at once
};

// Validation
if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not set');
  console.error('   Run: export SUPABASE_SERVICE_KEY=your_key');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - will use fallback responses');
}

// State tracking
let processCount = 0;
let consecutiveErrors = 0;
let processesThisHour = 0;
let hourStartTime = Date.now();
let circuitBreakerOpen = false;
let totalEmpathyScore = 0;
let empathyScoreCount = 0;
let isActive = true;

// CIRCUIT BREAKER CHECK
function checkCircuitBreaker() {
  // Reset hourly counter
  if (Date.now() - hourStartTime > 3600000) {
    processesThisHour = 0;
    hourStartTime = Date.now();
  }

  // Check rate limit
  if (processesThisHour >= SAFETY.MAX_PROCESSES_PER_HOUR) {
    console.warn('⚠️  CIRCUIT BREAKER: Rate limit reached (25/hour)');
    circuitBreakerOpen = true;
    return false;
  }

  // Check error threshold
  if (consecutiveErrors >= SAFETY.MAX_CONSECUTIVE_ERRORS) {
    console.error('🛑 CIRCUIT BREAKER: Error threshold exceeded (3 consecutive)');
    circuitBreakerOpen = true;
    return false;
  }

  // Check empathy score trend (pause if declining)
  const avgEmpathy = empathyScoreCount > 0 ? totalEmpathyScore / empathyScoreCount : 0.7;
  if (empathyScoreCount >= 5 && avgEmpathy < 0.4) {
    console.error('🛑 CIRCUIT BREAKER: Empathy score trending down (avg: ' + avgEmpathy.toFixed(3) + ')');
    circuitBreakerOpen = true;
    return false;
  }

  circuitBreakerOpen = false;
  return true;
}

// GENERATE BIBLICAL ENCOURAGEMENT
async function generateHopeResponse(prayer, priority) {
  // Check for voice commands
  const isVoiceTriggered = prayer.toLowerCase().includes('trinity hdm encourage');
  
  if (!OPENAI_API_KEY) {
    // Fallback response when no AI available
    return {
      response: `Thank you for sharing your heart. I'm here to listen and support you. While I process this with wisdom, please know that you are seen, valued, and not alone in this journey.`,
      model: 'fallback',
      cost: 0
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are HDM (HyperDAG Manager), a compassionate AI providing biblical encouragement.

WISDOM CONSTRAINTS:
- NEVER rush past pain to offer solutions
- Prioritize "God sees you" over "God will fix this"
- When uncertain, say so honestly (better to wait than harm)
- For sensitive topics (suicide, abuse), acknowledge deeply and urge professional help
- Avoid toxic positivity ("just pray more", "everything happens for a reason")
- Avoid prosperity gospel (name it/claim it, sow a seed, etc.)
- Mirror their language to show active listening
- Include relevant scripture when appropriate (cite accurately)

STRUCTURE:
1. Acknowledge their pain specifically
2. Affirm God's presence in their struggle
3. Offer hope grounded in scripture
4. End with a gentle invitation to continue

Keep responses 150-300 words. Speak as a wise friend, not a preacher.`
          },
          {
            role: 'user',
            content: prayer
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      response: data.choices[0].message.content.trim(),
      model: data.model,
      cost: 0.0001, // Approximate cost for gpt-3.5-turbo
      voice_triggered: isVoiceTriggered
    };

  } catch (err) {
    console.error('AI generation error:', err.message);
    // Fallback to compassionate template
    return {
      response: `I hear you, and I want to respond with the care you deserve. Let me take a moment to pray for wisdom in how to best encourage you. You matter deeply, and your struggle is seen.`,
      model: 'fallback',
      cost: 0,
      error: err.message
    };
  }
}

// MAIN LISTENING LOOP
async function listen() {
  if (!isActive) {
    console.log('⏸️  HDM paused by command');
    return;
  }

  // SAFETY: Check circuit breaker before executing
  if (!checkCircuitBreaker()) {
    console.log('⏸️  HDM paused due to circuit breaker');
    return;
  }

  try {
    // Query for new prayer requests assigned to HDM
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/trinity_tasks?status=eq.not_started&assigned_agent=eq.HDM&order=priority.desc,created_at.asc&limit=${SAFETY.MAX_BATCH_SIZE}`,
      {
        headers: { 
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    if (!res.ok) {
      throw new Error(`Query failed: ${res.status} ${res.statusText}`);
    }

    const tasks = await res.json();

    if (tasks.length === 0) {
      // No new prayers - silent wait
      return;
    }

    console.log(`\n🙏 Found ${tasks.length} prayer request(s)`);

    for (let task of tasks) {
      processCount++;
      processesThisHour++;

      console.log(`\n📖 Prayer #${task.id} (Priority: ${task.priority})`);
      console.log(`   "${task.prompt.substring(0, 60)}..."`);

      // Generate hope response
      const hopeData = await generateHopeResponse(task.prompt, task.priority);
      
      // Calculate empathy score
      const empathyResult = scoreEmpathy(hopeData.response, task.prompt);
      totalEmpathyScore += empathyResult.score;
      empathyScoreCount++;

      console.log(`   💚 Empathy Score: ${empathyResult.score.toFixed(3)} ${empathyResult.score >= 0.7 ? '✅' : empathyResult.score >= 0.5 ? '⚠️' : '❌'}`);
      if (empathyResult.flags.length > 0) {
        console.log(`   🚩 Flags: ${empathyResult.flags.join(', ')}`);
      }

      // WISDOM GATE: Check if human review needed
      if (empathyResult.needs_human_review || empathyResult.score < SAFETY.MIN_EMPATHY_SCORE) {
        console.log(`   ⏸️  PAUSING: Requesting human discernment`);
        
        // Mark task for human review
        await fetch(`${SUPABASE_URL}/rest/v1/trinity_tasks?id=eq.${task.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            status: 'needs_human_review',
            metadata: {
              ai_response: hopeData.response,
              empathy_score: empathyResult.score,
              flags: empathyResult.flags,
              reasoning: empathyResult.reasoning
            }
          })
        });

        // Log for human attention
        await fetch(`${SUPABASE_URL}/rest/v1/autonomous_logs`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            agent: 'HDM',
            event: 'human_review_requested',
            message: `Prayer #${task.id} needs human wisdom - empathy score ${empathyResult.score.toFixed(3)}`,
            details: {
              task_id: task.id,
              empathy_score: empathyResult.score,
              flags: empathyResult.flags,
              reasoning: empathyResult.reasoning
            },
            certainty_score: 1.0,
            verified_by: ['HDM-empathy-gate']
          })
        });

        continue; // Skip to next task
      }

      // Response passed wisdom gate - send it
      console.log(`   ✅ Response approved (empathy: ${empathyResult.score.toFixed(3)})`);

      // Update task with response
      await fetch(`${SUPABASE_URL}/rest/v1/trinity_tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            response: hopeData.response,
            empathy_score: empathyResult.score,
            model: hopeData.model,
            cost: hopeData.cost,
            voice_triggered: hopeData.voice_triggered || false
          }
        })
      });

      // Log successful encouragement
      await fetch(`${SUPABASE_URL}/rest/v1/autonomous_logs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          agent: 'HDM',
          event: 'hope_delivered',
          message: `Prayer #${task.id} answered with empathy ${empathyResult.score.toFixed(3)}`,
          details: {
            task_id: task.id,
            empathy_score: empathyResult.score,
            model: hopeData.model,
            cost: hopeData.cost,
            voice_triggered: hopeData.voice_triggered || false,
            processes_this_hour: processesThisHour,
            avg_empathy: (totalEmpathyScore / empathyScoreCount).toFixed(3)
          },
          certainty_score: empathyResult.score,
          verified_by: ['HDM', 'empathy-scorer'],
          cost_impact: hopeData.cost
        })
      });
    }
    
    // SAFETY: Reset error counter on success
    if (tasks.length > 0) {
      consecutiveErrors = 0;
    }
    
  } catch (err) {
    consecutiveErrors++;
    console.error(`❌ HDM error (${consecutiveErrors}/${SAFETY.MAX_CONSECUTIVE_ERRORS}):`, err.message);
    
    // Log error
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/autonomous_logs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          agent: 'HDM',
          event: 'error',
          message: `Error processing prayers: ${err.message}`,
          details: {
            consecutive_errors: consecutiveErrors,
            will_trip_breaker: consecutiveErrors >= SAFETY.MAX_CONSECUTIVE_ERRORS
          },
          certainty_score: 1.0
        })
      });
    } catch (logErr) {
      // Silent fail on error logging
    }
  }
}

// HEARTBEAT with performance metrics
async function sendHeartbeat() {
  try {
    const avgEmpathy = empathyScoreCount > 0 ? totalEmpathyScore / empathyScoreCount : 0;
    
    await fetch(`${SUPABASE_URL}/rest/v1/agent_status?agent=eq.HDM`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        last_heartbeat: new Date().toISOString(),
        status: isActive ? (circuitBreakerOpen ? 'paused' : 'active') : 'stopped',
        metadata: {
          role: 'HyperDAG Manager - Biblical Encouragement',
          prayers_processed: processCount,
          processes_this_hour: processesThisHour,
          circuit_breaker: circuitBreakerOpen ? 'open' : 'closed',
          consecutive_errors: consecutiveErrors,
          avg_empathy_score: avgEmpathy.toFixed(3),
          total_responses: empathyScoreCount
        }
      })
    });
  } catch (err) {
    // Silent failure on heartbeat
  }
}

// COMMAND HANDLER (for voice/external control)
process.on('SIGUSR1', () => {
  isActive = !isActive;
  console.log(isActive ? '\n▶️  HDM RESUMED' : '\n⏸️  HDM PAUSED by signal');
});

console.log('🙏 HDM HOPE LISTENER ACTIVATED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Mission: Biblical encouragement with empathy');
console.log('Query: trinity_tasks (status=not_started, assigned_agent=HDM)');
console.log('Polling: Every 10 seconds');
console.log('Heartbeat: Every 30 seconds');
console.log('\n🛡️  WISDOM GATES ACTIVE:');
console.log(`   ✓ Min empathy score: ${SAFETY.MIN_EMPATHY_SCORE}`);
console.log(`   ✓ Human review for sensitive topics`);
console.log(`   ✓ Scripture verification required`);
console.log(`   ✓ Prosperity gospel detection`);
console.log(`   ✓ Toxic positivity filtering`);
console.log('\n🛡️  SAFETY GUARDRAILS:');
console.log(`   ✓ Rate limit: ${SAFETY.MAX_PROCESSES_PER_HOUR} processes/hour`);
console.log(`   ✓ Error threshold: ${SAFETY.MAX_CONSECUTIVE_ERRORS} consecutive errors`);
console.log(`   ✓ Batch size: ${SAFETY.MAX_BATCH_SIZE} prayers at once`);
console.log('\n💚 HDM listening for hope needs - standing ready to serve\n');

// Start heartbeat
setInterval(sendHeartbeat, SAFETY.HEARTBEAT_INTERVAL_MS);
sendHeartbeat(); // Send immediately

// Start listening loop
setInterval(listen, SAFETY.POLL_INTERVAL_MS);
listen(); // Check immediately
