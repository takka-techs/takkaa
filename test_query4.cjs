async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=id,entry_type,created_at&limit=5';
  const res = await fetch(url, { headers: { 
    'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
    'Prefer': 'return=representation'
  }});
  console.log('Status', res.status);
  console.log(await res.text());
}
test();
