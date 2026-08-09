const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function run() {
  try {
    const invRes = await fetch(`${baseUrl}/Sales_Invoices?select=*&limit=1`, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } });
    console.log("Invoices:", await invRes.text());
  } catch (e) {
    console.error(e);
  }
}
run();
