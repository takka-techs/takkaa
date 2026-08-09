const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
    method: 'OPTIONS',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}).then(r => r.headers.get('allow')).then(console.log);

fetch(`${SUPABASE_URL}/rest/v1/app_settings?limit=1`, {
    method: 'GET',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log);
