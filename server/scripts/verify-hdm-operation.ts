import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function verifyOperation() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   HDM AUTONOMOUS OPERATION VERIFICATION         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Check HDM status
  const { data: hdm } = await supabase
    .from('agent_status')
    .select('*')
    .eq('agent', 'HDM')
    .single();

  console.log('🤖 HDM STATUS:');
  console.log('  Status:', hdm?.status);
  console.log('  Last Heartbeat:', hdm?.last_heartbeat);
  console.log('  Current Task:', hdm?.current_task || 'None');
  console.log('  Uptime:', hdm?.performance_metrics?.uptime_seconds, 'seconds');
  console.log('  Memory:', hdm?.performance_metrics?.memory_mb, 'MB\n');

  // Check task processing
  const { data: tasks, count } = await supabase
    .from('trinity_tasks')
    .select('*', { count: 'exact' })
    .eq('status', 'not_started');

  console.log('📋 TASK QUEUE:');
  console.log('  Pending tasks:', count || tasks?.length || 0);
  
  const { data: processing } = await supabase
    .from('trinity_tasks')
    .select('id', { count: 'exact' })
    .eq('status', 'processing');
  
  console.log('  Currently processing:', processing?.length || 0);

  const { data: completed } = await supabase
    .from('trinity_tasks')
    .select('id, assigned_agent', { count: 'exact' })
    .eq('assigned_agent', 'HDM')
    .eq('status', 'completed');

  console.log('  HDM completed:', completed?.length || 0, 'tasks\n');

  // Check autonomous logs
  const { data: logs } = await supabase
    .from('autonomous_logs')
    .select('*')
    .eq('agent', 'HDM')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('📜 RECENT AUTONOMOUS LOGS:');
  logs?.forEach(log => {
    const timestamp = new Date(log.created_at || log.timestamp).toLocaleTimeString();
    console.log(`  [${timestamp}] ${log.event}`);
  });

  console.log('\n' + '═'.repeat(50));
  
  if ((completed?.length || 0) > 0) {
    console.log('\n✅ HDM IS PROCESSING TASKS AUTONOMOUSLY!');
  } else if (hdm?.last_heartbeat) {
    console.log('\n⏳ HDM is alive but no tasks processed yet.');
    console.log('   (Consumer loop runs every 5 minutes)');
  } else {
    console.log('\n❌ HDM may not be running. Restart the server.');
  }
}

verifyOperation();
