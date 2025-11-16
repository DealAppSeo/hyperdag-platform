import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function executeNow() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   HDM TASK VERIFICATION & EXECUTION               ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Query exactly as instructed
  const { data: availableTasks, error } = await supabase
    .from('trinity_tasks')
    .select('*')
    .eq('status', 'not_started')
    .is('assigned_agent', null)
    .order('priority', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error querying tasks:', error);
    return;
  }

  console.log(`📊 TASKS READY FOR HDM: ${availableTasks?.length || 0}\n`);

  if (availableTasks && availableTasks.length > 0) {
    console.log('🎯 TOP 10 PRIORITY TASKS:\n');
    availableTasks.forEach((task, idx) => {
      console.log(`${idx + 1}. [P${task.priority}] ${task.title || task.prompt?.substring(0, 50)}`);
      console.log(`   Type: ${task.task_type} | ID: ${task.id}`);
      console.log(`   Status: ${task.status} | Assigned: ${task.assigned_agent || 'NONE'}\n`);
    });

    // Show distribution by priority
    const byPriority: Record<number, number> = {};
    const byType: Record<string, number> = {};
    
    availableTasks.forEach(t => {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byType[t.task_type] = (byType[t.task_type] || 0) + 1;
    });

    console.log('📊 TASK DISTRIBUTION:\n');
    console.log('By Priority:');
    Object.entries(byPriority)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .forEach(([p, count]) => {
        console.log(`  Priority ${p}: ${count} tasks`);
      });

    console.log('\nBy Type:');
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(20)}: ${count} tasks`);
      });
  }

  // Check HDM status
  const { data: hdmStatus } = await supabase
    .from('agent_status')
    .select('*')
    .eq('agent', 'HDM')
    .single();

  console.log('\n🤖 HDM STATUS:');
  console.log(`  Agent: ${hdmStatus?.agent}`);
  console.log(`  Status: ${hdmStatus?.status}`);
  console.log(`  Circuit Breaker: ${hdmStatus?.metadata?.circuit_breaker || 'UNKNOWN'}`);
  console.log(`  Last Heartbeat: ${hdmStatus?.last_heartbeat}`);

  console.log('\n🚀 HDM READY TO EXECUTE!');
  console.log('   Consumer loop will process these tasks automatically.');
  console.log('   Next cycle: Within 5 minutes');
}

executeNow();
