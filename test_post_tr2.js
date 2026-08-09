const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const tQ = `${baseUrl}/treasury_transactions`;
  const tRes = await fetch(tQ, { 
    method: 'POST',
    headers: { 'apikey': apiKey, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({
      wallet_id: 1,
      type: 'out',
      amount: 100,
      category: 'test',
      description: 'test'
    })
  });
  console.log('Post TR:', await tRes.text());
}
test();
