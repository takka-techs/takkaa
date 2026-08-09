import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const token = process.env.VITE_TEST_TOKEN || SUPABASE_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?limit=1`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  
  const data = await res.json();
  console.log(data);
}

test();
