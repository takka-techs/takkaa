const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${API_KEY}`);
  const data = await res.json();
  console.log("installment_contracts:", Object.keys(data.definitions.installment_contracts.properties).join(', '));
  console.log("installment_payments:", Object.keys(data.definitions.installment_payments.properties).join(', '));
}
run();
