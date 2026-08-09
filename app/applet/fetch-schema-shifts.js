const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
  const getAppUsers = await fetch(`${SUPABASE_URL}/rest/v1/shifts?limit=5`, { headers });
  const data = await getAppUsers.json();
  console.log(data);
}
test();
