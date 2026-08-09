const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const tQ = `${baseUrl}/treasury_transactions?select=id,type,amount,description&limit=10`;
  const tRes = await fetch(tQ, { headers: { apikey: apiKey } });
  console.log('Any TR:', await tRes.json());
}
test();
