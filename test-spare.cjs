const fetch = require('node-fetch');
async function test() {
  const rs = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=*&limit=1', {
    headers: {
      apikey: 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
    }
  });

  console.log(await rs.text());
}
test();
