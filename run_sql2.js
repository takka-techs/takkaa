import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://hoohxkrrndtfpwsrnpyr.supabase.co',
  'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
);

const sql = fs.readFileSync('fix_rpc_type.sql', 'utf8');

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
        // Fallback or run manually from the console? No, wait! We can't use exec_sql if it's not setup. 
        console.log("no exec_sql");
    } else {
        console.error(error);
    }
  } else {
    console.log("Success", data);
  }
}
run();
