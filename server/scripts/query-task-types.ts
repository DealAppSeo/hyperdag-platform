import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function queryTaskTypes() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('📊 TRINITY TASKS ANALYSIS\n');
  console.log('='.repeat(60));

  // Total tasks
  const { data: allTasks, count: totalCount } = await supabase
    .from('trinity_tasks')
    .select('*', { count: 'exact' })
    .eq('status', 'not_started');

  console.log(`Total pending tasks: ${totalCount || allTasks?.length || 0}\n`);

  // Group by task_type
  const taskTypes: Record<string, number> = {};
  allTasks?.forEach(task => {
    const type = task.task_type || 'unknown';
    taskTypes[type] = (taskTypes[type] || 0) + 1;
  });

  console.log('Task Types Distribution:');
  console.log('-'.repeat(60));
  Object.entries(taskTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)} : ${count} tasks`);
    });

  console.log('\n' + '='.repeat(60));
  
  // Sample tasks
  console.log('\n📝 Sample Tasks (first 5):');
  console.log('-'.repeat(60));
  allTasks?.slice(0, 5).forEach(task => {
    console.log(`  [${task.task_type}] ${task.title || task.description?.substring(0, 50) || 'No title'}`);
  });
}

queryTaskTypes();
