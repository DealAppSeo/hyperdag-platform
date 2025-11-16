import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

async function createTables() {
  console.log('[APM/HDM] Creating Supabase tables...');
  console.log('[APM/HDM] URL:', SUPABASE_URL);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Try to create trinity_tasks table
  console.log('\n[APM/HDM] Test 1: Creating trinity_tasks table via SQL...');
  
  const createTasksSQL = `
    CREATE TABLE IF NOT EXISTS trinity_tasks (
      id SERIAL PRIMARY KEY,
      task_number INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT,
      summary TEXT,
      priority_rank INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      assigned_manager VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Note: Supabase client library doesn't support raw SQL via anon key
  // We'll try using RPC or just test INSERT directly
  
  console.log('\n[APM/HDM] Test 2: Testing INSERT into trinity_tasks...');
  const { data: taskData, error: taskError } = await supabase
    .from('trinity_tasks')
    .insert([
      {
        task_number: 1,
        title: 'URL test',
        prompt: 'URL test',
        summary: 'Testing Supabase connection',
        priority_rank: 1,
        assigned_manager: 'APM/HDM'
      }
    ])
    .select();

  if (taskError) {
    console.error('[APM/HDM] ❌ INSERT failed:', taskError.message);
    console.log('[APM/HDM] Code:', taskError.code);
    
    if (taskError.code === '42P01') {
      console.log('[APM/HDM] Table does not exist. Please create tables via Supabase Dashboard SQL Editor.');
      console.log('[APM/HDM] Navigate to: https://qnnpjhlxljtqyigedwkb.supabase.co/project/_/sql');
    }
  } else {
    console.log('[APM/HDM] ✅ INSERT successful!');
    console.log('[APM/HDM] Task created:', taskData);
  }

  // Test 3: Log to autonomous_logs
  console.log('\n[APM/HDM] Test 3: Logging to autonomous_logs...');
  const { data: logData, error: logError } = await supabase
    .from('autonomous_logs')
    .insert([
      {
        agent: 'APM/HDM',
        event: 'supabase_connected',
        details: {
          message: 'Connected to qnnpjhlxljtqyigedwkb',
          url: SUPABASE_URL,
          timestamp: new Date().toISOString()
        },
        repid_tag: 'VERIFIED:SupabaseConnected'
      }
    ])
    .select();

  if (logError) {
    console.error('[APM/HDM] ❌ Log INSERT failed:', logError.message);
    console.log('[APM/HDM] Code:', logError.code);
  } else {
    console.log('[APM/HDM] ✅ Log INSERT successful!');
    console.log('[APM/HDM] Log created:', logData);
  }

  return {
    success: !taskError && !logError,
    task_insert: !taskError,
    log_insert: !logError
  };
}

createTables()
  .then((result) => {
    console.log('\n[APM/HDM] Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('[APM/HDM] Error:', error);
    process.exit(1);
  });
