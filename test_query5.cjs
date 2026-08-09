async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?limit=1';
  const res = await fetch(url, { headers: { 
    'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
    'Prefer': 'return=representation'
  }});
  console.log('Status', res.status);
  const data = await res.json();
  if (data.length) console.log(Object.keys(data[0]));
  else console.log(data);
}
test();
