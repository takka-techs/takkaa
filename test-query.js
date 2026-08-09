import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sensitive_actions_report?limit=1`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  
  if (!res.ok) {
     console.log('Error', await res.text());
  } else {
     const data = await res.json();
     console.log('Data:', data);
  }
}

test();
