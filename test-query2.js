import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const idToFind = 'cf01cd51-735d-4cfc-8ab8-9427fa4e8e1a';

  let res = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${idToFind}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log('app_users:', await res.json());

  res = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${idToFind}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log('employees:', await res.json());

  res = await fetch(`${SUPABASE_URL}/rest/v1/app_users?user_id=eq.${idToFind}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log('app_users (by user_id):', await res.json());

}

test();
