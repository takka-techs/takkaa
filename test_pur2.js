const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const tQ = `${baseUrl}/Devices?select=entry_type&limit=5`;
  const tRes = await fetch(tQ, { headers: { apikey: apiKey } });
  console.log('Sample TR:', await tRes.json());
}
test();
