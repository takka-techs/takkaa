import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

const supabase = createClient(SUPABASE_URL, KEY);

async function check() {
  const { data, error } = await supabase.from('employees').select('owner_id').limit(1);
  if (error && error.code === '42703') {
     console.log('owner_id missing');
  } else {
     console.log('owner_id exists', error);
  }

  const { data: d2, error: e2 } = await supabase.from('employees').select('tenant_id').limit(1);
  if (e2 && e2.code === '42703') {
     console.log('tenant_id missing');
  } else {
     console.log('tenant_id exists', e2);
  }
}
check();
