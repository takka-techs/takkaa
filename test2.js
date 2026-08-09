const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Sales_Invoices?limit=1';
const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(url, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
