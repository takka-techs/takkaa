import 'dotenv/config';

async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/installment_contracts?select=*&limit=1';
  const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

  const res = await fetch(url, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }});
  const text = await res.text();
  console.log('Status', res.status);
  console.log(text);
}

test();
