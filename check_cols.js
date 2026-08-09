const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/installment_contracts?limit=1`, { headers: { 'apikey': API_KEY } });
  const data = await res.json();
  console.log("contracts", JSON.stringify(data[0]));
}
run();
