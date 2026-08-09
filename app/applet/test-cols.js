import 'dotenv/config';

async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/';
  const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const res = await fetch(url + 'installment_contracts?limit=1', { 
    headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
  }
}
test();
