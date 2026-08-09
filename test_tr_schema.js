const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const token = ""; // Not available but let's try reading columns from schema via openapi
  
  const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/`, { headers: { apikey: apiKey } });
  const openapi = await res.json();
  const tb = openapi.definitions.treasury_transactions;
  console.log('Columns:', Object.keys(tb.properties));
}
test();
