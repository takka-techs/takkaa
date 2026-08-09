import fs from "fs";
async function run() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)';
  const headers = { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' };
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(`Total Wallets: ${data.length}`);
  data.forEach((w) => console.log(`${w.id} | ${w.name} | Branch: ${w.branch_id} (${w.branches?.name}) | Type: ${w.type}`));
}
run();
