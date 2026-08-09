import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/installment_audit_logs?limit=1`, {
    headers: {
      apikey: SUPABASE_KEY || 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
      Authorization: `Bearer ${SUPABASE_KEY || 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'}`
    }
  });
  
  const data = await res.json();
  console.log(data);
}

test();
