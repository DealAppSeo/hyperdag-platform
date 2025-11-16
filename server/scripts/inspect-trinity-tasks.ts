import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function inspectSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data } = await supabase
    .from('trinity_tasks')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    console.log('trinity_tasks columns:');
    console.log(Object.keys(data[0]));
    console.log('\nSample record:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

inspectSchema();
