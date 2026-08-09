const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(data => {
  console.log('Devices properties:', Object.keys(data.definitions.Devices.properties));
  console.log('Warehouses properties:', Object.keys(data.definitions.Warehouses.properties));
}).catch(console.error);
