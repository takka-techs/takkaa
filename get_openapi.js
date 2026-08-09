const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/Devices`, { 
  method: 'OPTIONS',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}).then(async r => {
  console.log('OPTIONS status:', r.status);
}).catch(console.error);

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`, {
  method: 'GET'
}).then(r => r.json()).then(data => {
  console.log('Top level keys:', Object.keys(data));
  if (data.info) console.log(data.info);
}).catch(console.error);
