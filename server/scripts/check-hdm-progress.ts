import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function checkProgress() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n🔍 CHECKING HDM PROGRESS (Last 60 seconds)...\n');

  // Check for recently updated tasks
  const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();

  const { data: recentUpdates } = await supabase
    .from('trinity_tasks')
    .select('*')
    .gte('updated_at', sixtySecondsAgo)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (recentUpdates && recentUpdates.length > 0) {
    console.log(`✅ ${recentUpdates.length} tasks updated in last 60 seconds:\n`);
    recentUpdates.forEach(task => {
      console.log(`  [${task.status}] ${task.title || task.prompt?.substring(0, 40)}`);
      console.log(`    ID: ${task.id} | Agent: ${task.assigned_agent || 'NONE'}`);
      console.log(`    Updated: ${task.updated_at}\n`);
    });
  } else {
    console.log('⏳ No tasks updated in last 60 seconds');
    console.log('   (HDM consumer loop runs 5 seconds after startup)\n');
  }

  // Check current status distribution
  const { data: allTasks } = await supabase
    .from('trinity_tasks')
    .select('status, assigned_agent');

  const statusCount: Record<string, number> = {};
  const agentCount: Record<string, number> = {};

  allTasks?.forEach(t => {
    statusCount[t.status] = (statusCount[t.status] || 0) + 1;
    if (t.assigned_agent) {
      agentCount[t.assigned_agent] = (agentCount[t.assigned_agent] || 0) + 1;
    }
  });

  console.log('📊 OVERALL STATUS:');
  Object.entries(statusCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  ${status.padEnd(15)}: ${count}`);
    });

  console.log('\n🤖 TASK ASSIGNMENTS:');
  Object.entries(agentCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([agent, count]) => {
      console.log(`  ${agent.padEnd(15)}: ${count} tasks`);
    });

  // Check autonomous logs
  const { data: recentLogs } = await supabase
    .from('autonomous_logs')
    .select('*')
    .eq('agent', 'HDM')
    .gte('timestamp', sixtySecondsAgo)
    .order('timestamp', { ascending: false })
    .limit(5);

  if (recentLogs && recentLogs.length > 0) {
    console.log('\n📝 RECENT HDM LOGS:');
    recentLogs.forEach(log => {
      console.log(`  [${log.event}] ${log.timestamp}`);
      if (log.details) {
        console.log(`    ${JSON.stringify(log.details).substring(0, 80)}`);
      }
    });
  }
}

checkProgress();
