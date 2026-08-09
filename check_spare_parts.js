import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hoohxkrrndtfpwsrnpyr.supabase.co', 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa');

async function test() {
  const { data, error } = await supabase.from('spare_parts').select('*').limit(10);
  console.log(JSON.stringify(data, null, 2));
}

test();
