const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/employees?limit=1`, { 
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
}).then(r => r.json()).then(r => console.dir(r, {depth: null})).catch(console.error);
