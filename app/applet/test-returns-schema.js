const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function run() {
  const res = await fetch(`${baseUrl}/Sales_Returns?limit=1`, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } });
  console.log(await res.text());
}
run();
