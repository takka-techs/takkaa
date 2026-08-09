const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions?limit=1`, { headers: hdrs });
  console.log(await res.json());
}
test();
