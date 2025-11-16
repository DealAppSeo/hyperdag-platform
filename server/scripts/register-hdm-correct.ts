import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function registerHDM() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   REGISTERING HDM IN TRINITY SYMPHONY            ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('agent_status')
    .upsert({
      agent: 'HDM',
      status: 'active',
      last_heartbeat: new Date().toISOString(),
      metadata: {
        role: 'HyperDAG Manager',
        circuit_breaker: 'closed',
        consecutive_errors: 0,
        specialization: 'infrastructure_web3_zkp',
        platform: 'replit',
        website: 'hyperdag.org'
      },
      confidence: 1.0,
      orchestrator_role: false,
      performance_metrics: {}
    }, {
      onConflict: 'agent'
    })
    .select();

  if (error) {
    console.error('❌ Registration failed:', error.message);
    console.error('Details:', error);
    return;
  }

  console.log('✅ HDM SUCCESSFULLY REGISTERED!\n');
  console.log('Agent Details:');
  console.log('  Agent:', data?.[0]?.agent);
  console.log('  Status:', data?.[0]?.status);
  console.log('  Last Heartbeat:', data?.[0]?.last_heartbeat);
  console.log('  Role:', data?.[0]?.metadata?.role);
  console.log('  Circuit Breaker:', data?.[0]?.metadata?.circuit_breaker);
  console.log('  Platform:', data?.[0]?.metadata?.platform);
  console.log('  Specialization:', data?.[0]?.metadata?.specialization);
  console.log('\n✨ HDM is now visible to APM and MEL in Trinity Symphony!');
  
  // Verify visibility
  console.log('\n🔍 Verifying visibility...');
  const { data: allAgents, error: listError } = await supabase
    .from('agent_status')
    .select('agent, status, last_heartbeat');
  
  if (!listError && allAgents) {
    console.log(`\n📊 Trinity Symphony Agents (${allAgents.length} total):`);
    allAgents.forEach(a => {
      const icon = a.agent === 'HDM' ? '🆕' : a.agent === 'APM' ? '🧠' : a.agent === 'MEL' ? '🎨' : '⚙️';
      console.log(`   ${icon} ${a.agent}: ${a.status} (${a.last_heartbeat})`);
    });
  }
}

registerHDM();
