const fetch = require('node-fetch');

async function main() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const res = await fetch(url);
  const data = await res.json();
  const salesItems = data.definitions.Sales_Items.properties;
  console.log(Object.keys(salesItems));
}

main();
