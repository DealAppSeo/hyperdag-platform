import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function runTests() {
  console.log('HDM CONNECTIVITY TEST');
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(50), '\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 1: agent_status
  try {
    const { data, error } = await supabase.from('agent_status').select('*');
    if (error) throw error;
    console.log('✅ Supabase agent_status:', data?.length, 'agents found');
    data?.forEach(a => console.log(`   - ${a.agent_name}: ${a.status}`));
  } catch (err: any) {
    console.log('❌ Supabase agent_status:', err.message);
  }

  // Test 2: trinity_tasks
  try {
    const { data, error, count } = await supabase.from('trinity_tasks').select('*', { count: 'exact' });
    if (error) throw error;
    const pending = data?.filter(t => t.status === 'not_started').length || 0;
    console.log('✅ Supabase trinity_tasks:', count || data?.length, 'total,', pending, 'pending');
  } catch (err: any) {
    console.log('❌ Supabase trinity_tasks:', err.message);
  }

  // Test 3: HDM status
  try {
    const { data, error } = await supabase.from('agent_status').select('*').eq('agent_name', 'HDM').single();
    if (error) throw error;
    console.log('✅ HDM Status:', data?.status);
    console.log('   Last heartbeat:', data?.last_heartbeat);
    console.log('   Circuit breaker:', data?.metadata?.circuit_breaker || 'UNKNOWN');
  } catch (err: any) {
    console.log('❌ HDM Status:', err.message);
  }

  console.log('\nEnvironment:');
  console.log('APM_REPLIT_URL:', process.env.APM_REPLIT_URL ? 'SET' : 'NOT SET');
  console.log('MEL_REPLIT_URL:', process.env.MEL_REPLIT_URL ? 'SET' : 'NOT SET');
}

runTests();
