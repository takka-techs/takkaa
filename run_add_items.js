import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
import fs from 'fs';
async function test() {
  const sql = fs.readFileSync('add_items_to_contract.sql', 'utf8');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, { 
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  console.log(res.status, await res.text());
}
test();
