import fetch from 'node-fetch';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(res => {
  console.log("Wallets:", Object.keys(res.definitions.wallets?.properties || {}));
  console.log("App Settings:", Object.keys(res.definitions.app_settings?.properties || {}));
}).catch(console.error);
