import fs from "fs";
async function run() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*&limit=1';
  const headers = { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' };
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(data[0]);
}
run();
