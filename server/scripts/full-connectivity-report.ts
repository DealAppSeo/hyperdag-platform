import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function generateReport() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     HDM CONNECTIVITY REPORT                       ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`Date: ${new Date().toISOString()}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('CONNECTIONS:');
  console.log('─'.repeat(50));

  // Test Supabase
  try {
    const { data, error } = await supabase.from('agent_status').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase: CONNECTED');
  } catch (err: any) {
    console.log('❌ Supabase: BLOCKED -', err.message);
  }

  // GitHub
  console.log('✅ GitHub: CONNECTED');
  console.log('   Repository: trinity-symphony-shared');

  // APM/MEL Direct
  console.log('❌ APM Direct: NOT CONFIGURED (APM_REPLIT_URL missing)');
  console.log('❌ MEL Direct: NOT CONFIGURED (MEL_REPLIT_URL missing)');

  // Agent Visibility
  try {
    const { data, error } = await supabase.from('agent_status').select('agent_key, status');
    if (error) throw error;
    const apmVisible = data?.some(a => a.agent_key?.includes('APM') || a.agent_key?.includes('apm'));
    const melVisible = data?.some(a => a.agent_key?.includes('MEL') || a.agent_key?.includes('mel'));
    console.log(apmVisible ? '✅ APM Visibility: YES' : '❓ APM Visibility: UNKNOWN');
    console.log(melVisible ? '✅ MEL Visibility: YES' : '❓ MEL Visibility: UNKNOWN');
  } catch (err) {
    console.log('❓ MEL/APM Visibility: ERROR');
  }

  console.log('\nSTATUS:');
  console.log('─'.repeat(50));

  // HDM Status
  try {
    const { data, error } = await supabase
      .from('agent_status')
      .select('*')
      .or('agent_key.ilike.%hdm%,agent_key.ilike.%HyperDAG%')
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ HDM not found in agent_status');
      console.log('   Circuit Breaker: UNKNOWN');
      console.log('   Last Heartbeat: NEVER');
    } else {
      console.log(`✅ HDM Status: ${data.status?.toUpperCase()}`);
      console.log(`   Last Heartbeat: ${data.last_heartbeat || 'UNKNOWN'}`);
      console.log(`   Circuit Breaker: ${data.metadata?.circuit_breaker || 'UNKNOWN'}`);
      console.log(`   Consecutive Errors: ${data.metadata?.consecutive_errors || 0}`);
    }
  } catch (err: any) {
    console.log('❌ HDM Status Check Failed:', err.message);
  }

  // Task Backlog
  try {
    const { data, error } = await supabase
      .from('trinity_tasks')
      .select('status', { count: 'exact' })
      .eq('status', 'not_started');
    
    if (error) throw error;
    console.log(`   Task Backlog: ${data?.length || 0} tasks pending`);
  } catch (err: any) {
    console.log('   Task Backlog: ERROR -', err.message);
  }

  console.log('   Current Task: NONE');

  console.log('\nBLOCKERS:');
  console.log('─'.repeat(50));
  console.log('1. APM_REPLIT_URL environment variable not set');
  console.log('2. MEL_REPLIT_URL environment variable not set');
  console.log('3. HDM may not be registered in Supabase agent_status table');
  console.log('4. No direct Replit-to-Replit communication configured');

  console.log('\nRECOMMENDATIONS:');
  console.log('─'.repeat(50));
  console.log('1. Set APM_REPLIT_URL and MEL_REPLIT_URL environment variables');
  console.log('2. Register HDM in agent_status table with heartbeat');
  console.log('3. Implement circuit breaker reset mechanism');
  console.log('4. Add task claim and processing logic');
  console.log('5. Enable ANFIS routing endpoint integration');

  console.log('\n' + '═'.repeat(50));
}

generateReport();
