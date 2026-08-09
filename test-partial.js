import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
  };
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/installment_partial_payments?limit=1`, { headers });
  console.log(res.status, await res.text());
}
test();
