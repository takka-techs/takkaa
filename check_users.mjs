import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
  const { data, error } = await supabase.from('app_users').select('*');
  console.log("Users:", data?.length, error);
}
check();
