async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=id,entry_type,created_at&or=(entry_type.eq.purchase,entry_type.eq.import)&limit=10';
  const res = await fetch(url, { headers: { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' } });
  console.log(await res.text());
}
test();
