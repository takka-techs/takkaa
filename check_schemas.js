const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const ANON_KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`
  }
}).then(r => r.json()).then(res => {
  console.log("Keys:", Object.keys(res));
  if (res.definitions) {
    console.log("wallets definition:", Object.keys(res.definitions.wallets?.properties || {}));
    console.log("app_settings definition:", Object.keys(res.definitions.app_settings?.properties || {}));
  }
}).catch(console.error);
