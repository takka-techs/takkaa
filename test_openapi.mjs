import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {headers: {apikey: API_KEY}});
  const openapi = await res.json();
  const tables = Object.keys(openapi.definitions);
  console.log('Tables:', tables);
  if (openapi.definitions['treasury_transactions']) {
     console.log('Columns:', Object.keys(openapi.definitions['treasury_transactions'].properties));
  }
}
test();
