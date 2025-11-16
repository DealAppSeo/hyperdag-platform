import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function inspectSchema() {
  console.log('Inspecting agent_status table schema...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Try to get any record to see the actual columns
  const { data, error } = await supabase
    .from('agent_status')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Found record. Columns are:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\nColumn names:', Object.keys(data[0]));
  } else {
    console.log('⚠️ Table exists but is empty. Trying to insert...');
    
    // Try minimal insert to discover required columns
    const { data: insertData, error: insertError } = await supabase
      .from('agent_status')
      .insert({})
      .select();
    
    console.log('Insert error (will reveal required columns):', insertError);
  }
}

inspectSchema();
