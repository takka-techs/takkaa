const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY, 'Authorization': `Bearer ${process.env.TEST_TOKEN || ''}` };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)`, { headers: hdrs });
  console.log('Wallets Status:', res.status);
  console.log(await res.json());
}
test();
