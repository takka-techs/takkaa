const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const tQ = `${baseUrl}/treasury_transactions?select=id,type,amount,description&category=eq.سداد دفعة للمورد&limit=5`;
  const tRes = await fetch(tQ, { headers: { apikey: apiKey } });
  console.log('Sample TR category:', await tRes.json());
}
test();
