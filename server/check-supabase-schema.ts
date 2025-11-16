import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function checkSchema() {
  const supabase = createClient(
    'https://qnnpjhlxljtqyigedwkb.supabase.co',
    process.env.SUPABASE_SERVICE_KEY!
  );

  console.log('🔍 Checking Supabase Schema...\n');

  // Check what tables exist
  const tables = ['trinity_tasks', 'agent_status', 'routing_events', 'orchestrator_state'];
  
  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    console.log('─'.repeat(60));
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('✅ Table exists. Sample columns:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('\nSample data:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️  Table exists but is empty');
        // Try to insert and see what columns are expected
        console.log('Attempting test insert to discover schema...');
      }
    } catch (e: any) {
      console.error(`❌ Exception: ${e.message}`);
    }
  }
}

checkSchema().catch(console.error);
