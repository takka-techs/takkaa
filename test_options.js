const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
fetch(`${SUPABASE_URL}/rest/v1/app_settings`, { method: 'OPTIONS', headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.text()).then(console.log);
