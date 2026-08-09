import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/installment_payments?select=deleted_at&limit=1`, { headers: { 'apikey': API_KEY }});
  console.log(res.status, await res.text());
}
test();
