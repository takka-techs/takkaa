import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, { 
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'installment_contracts';
    `})
  });
  console.log(res.status, await res.text());
}
test();
