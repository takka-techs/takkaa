async function test() {
  const rs = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=*&or=(name.ilike.*1*,sku.ilike.*1*)&limit=1', {
    headers: {
      apikey: 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
    }
  });

  console.log(rs.status);
  console.log(await rs.text());
}
test();
