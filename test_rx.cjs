const fs = require('fs');

async function run() {
  const res = await fetch("https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions?select=id,category,branch_id,created_at,amount&order=created_at.desc&limit=10", {
    headers: { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' }
  });
  const data = await res.json();
  console.log(data);
}
run();
