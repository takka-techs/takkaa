import fs from 'fs';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
  const query = "SELECT * FROM spare_parts WHERE name ILIKE '%test2%'";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  console.log(await res.text());
}
run();
