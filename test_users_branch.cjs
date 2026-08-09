async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?select=id,branch_id,branches(name)&limit=1';
  const res = await fetch(url, { headers: { 
    'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
    'Prefer': 'return=representation'
  }});
  console.log('Status', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data));
}
test();
