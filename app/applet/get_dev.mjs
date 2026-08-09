import fetch from 'node-fetch';
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: KEY } })
  .then(r => r.json())
  .then(d => {
    console.log(Object.keys(d.definitions).filter(x => x.toLowerCase().includes('device') || x.toLowerCase().includes('inventor')));
    console.log("Devices properties:", Object.keys(d.definitions?.Devices?.properties || {}));
  })
  .catch(console.error);
