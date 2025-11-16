import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function registerHDM() {
  console.log('Registering HDM in Supabase agent_status table...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('agent_status')
    .upsert({
      agent_name: 'HDM',
      status: 'active',
      last_heartbeat: new Date().toISOString(),
      metadata: {
        role: 'HyperDAG Manager',
        circuit_breaker: 'closed',
        consecutive_errors: 0,
        specialization: 'infrastructure_web3_zkp',
        platform: 'replit',
        website: 'hyperdag.org'
      }
    }, {
      onConflict: 'agent_name'
    })
    .select();

  if (error) {
    console.error('❌ Registration failed:', error.message);
    console.error('Details:', error);
    return;
  }

  console.log('✅ HDM successfully registered!');
  console.log('\nHDM Status:');
  console.log('  Agent Name:', data?.[0]?.agent_name);
  console.log('  Status:', data?.[0]?.status);
  console.log('  Last Heartbeat:', data?.[0]?.last_heartbeat);
  console.log('  Role:', data?.[0]?.metadata?.role);
  console.log('  Circuit Breaker:', data?.[0]?.metadata?.circuit_breaker);
  console.log('\n✨ HDM is now visible to APM and MEL!');
}

registerHDM();
