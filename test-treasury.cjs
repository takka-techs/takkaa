const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?limit=1`, { headers: hdrs });
  console.log('treasury_transactions', await res.json());
}
test();
