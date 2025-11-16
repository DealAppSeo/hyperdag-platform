import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function finalStatus() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   🎯 HDM FINAL EXECUTION STATUS 🎯                ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Priority tasks waiting
  const { data: priorityTasks } = await supabase
    .from('trinity_tasks')
    .select('*')
    .eq('status', 'not_started')
    .is('assigned_agent', null)
    .gte('priority', 9)
    .order('priority', { ascending: false });

  console.log(`🔥 HIGH PRIORITY TASKS (P9-P10): ${priorityTasks?.length || 0}\n`);
  
  if (priorityTasks && priorityTasks.length > 0) {
    priorityTasks.slice(0, 5).forEach((task, idx) => {
      console.log(`${idx + 1}. [P${task.priority}] ${task.title || task.prompt?.substring(0, 50)}`);
    });
    if (priorityTasks.length > 5) {
      console.log(`   ... and ${priorityTasks.length - 5} more high priority tasks\n`);
    }
  }

  // Overall stats
  const { data: stats } = await supabase
    .from('trinity_tasks')
    .select('status, task_type, assigned_agent');

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const devTasks = { notStarted: 0, completed: 0, inProgress: 0 };

  stats?.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byType[t.task_type] = (byType[t.task_type] || 0) + 1;
    
    if (t.task_type !== 'prayer') {
      if (t.status === 'not_started') devTasks.notStarted++;
      if (t.status === 'completed') devTasks.completed++;
      if (t.status === 'in_progress') devTasks.inProgress++;
    }
  });

  console.log('\n📊 OVERALL TASK STATUS:');
  console.log(`  ✅ Completed: ${byStatus['completed'] || 0}`);
  console.log(`  ⏳ Not Started: ${byStatus['not_started'] || 0}`);
  console.log(`  🔄 In Progress: ${byStatus['in_progress'] || 0}`);
  console.log(`  ❌ Failed: ${byStatus['failed'] || 0}`);

  console.log('\n🎯 DEVELOPMENT TASKS (Non-Prayer):');
  console.log(`  ✅ Completed: ${devTasks.completed}`);
  console.log(`  ⏳ Not Started: ${devTasks.notStarted}`);
  console.log(`  🔄 In Progress: ${devTasks.inProgress}`);

  // HDM agent status
  const { data: hdm } = await supabase
    .from('agent_status')
    .select('*')
    .eq('agent', 'HDM')
    .single();

  console.log('\n🤖 HDM AGENT STATUS:');
  console.log(`  Status: ${hdm?.status || 'unknown'}`);
  console.log(`  Circuit Breaker: ${hdm?.metadata?.circuit_breaker || 'unknown'}`);
  console.log(`  Last Heartbeat: ${hdm?.last_heartbeat || 'unknown'}`);

  console.log('\n' + '='.repeat(60));
  console.log('🚀 HDM will process next batch within 5 minutes');
  console.log('⚡ High priority tasks will be processed first');
  console.log('💪 Consumer loop is autonomous - no human intervention needed');
  console.log('='.repeat(60));
}

finalStatus();
