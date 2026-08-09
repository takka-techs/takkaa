import fetch from 'node-fetch';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/branches`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: "Test",
      invalid_col: "Test"
    })
  });
  console.log("Status:", res.status);
  console.log(await res.text());
}
main();
