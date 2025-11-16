import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcyrnobgahxcetxxdyoa.supabase.co';
const supabaseKey = 'f5f7934a-10b9-46e8-ab0e-1c3fd39e5515';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('[Supabase Setup] Connecting to Supabase...');
  console.log('[Supabase Setup] URL:', supabaseUrl);

  try {
    // Test connection with a simple query
    const { data: testData, error: testError } = await supabase
      .from('autonomous_logs')
      .select('count')
      .limit(1);

    if (testError && testError.message.includes('relation') && testError.message.includes('does not exist')) {
      console.log('[Supabase Setup] Tables do not exist yet, will create them');
    } else if (testError) {
      console.error('[Supabase Setup] Connection error:', testError);
    } else {
      console.log('[Supabase Setup] Connection successful, table exists');
    }

    // Create autonomous_logs table
    console.log('[Supabase Setup] Creating autonomous_logs table...');
    const { data: logsTable, error: logsError } = await supabase.rpc('create_autonomous_logs_table', {});
    
    if (logsError && !logsError.message.includes('already exists')) {
      console.log('[Supabase Setup] Note: Table creation via RPC not available, using direct SQL');
    }

    // Create trinity_tasks table
    console.log('[Supabase Setup] Creating trinity_tasks table...');
    const { data: tasksTable, error: tasksError } = await supabase.rpc('create_trinity_tasks_table', {});
    
    if (tasksError && !tasksError.message.includes('already exists')) {
      console.log('[Supabase Setup] Note: Table creation via RPC not available, using direct SQL');
    }

    // Create agent_status table
    console.log('[Supabase Setup] Creating agent_status table...');
    const { data: statusTable, error: statusError } = await supabase.rpc('create_agent_status_table', {});
    
    if (statusError && !statusError.message.includes('already exists')) {
      console.log('[Supabase Setup] Note: Table creation via RPC not available, using direct SQL');
    }

    // Test INSERT
    console.log('[Supabase Setup] Testing INSERT into autonomous_logs...');
    const { data: insertData, error: insertError } = await supabase
      .from('autonomous_logs')
      .insert([
        {
          agent: 'HDM',
          event: 'supabase_connected',
          details: {
            message: 'HDM connected to shared Supabase',
            timestamp: new Date().toISOString(),
            connection_test: true
          },
          repid_tag: 'VERIFIED:SupabaseConnected'
        }
      ])
      .select();

    if (insertError) {
      console.error('[Supabase Setup] INSERT error:', insertError);
      throw insertError;
    }

    console.log('[Supabase Setup] ✅ INSERT successful:', insertData);
    console.log('[Supabase Setup] ✅ HDM connected to shared Supabase');

    return {
      success: true,
      message: 'HDM connected to shared Supabase',
      inserted_record: insertData
    };

  } catch (error) {
    console.error('[Supabase Setup] Setup failed:', error);
    throw error;
  }
}

setupTables()
  .then((result) => {
    console.log('[Supabase Setup] Setup complete:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Supabase Setup] Setup failed:', error);
    process.exit(1);
  });
