const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/installment_dashboard_summary`, {
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`
  }
}).then(r => r.json().then(v => ({s: r.status, v}))).then(console.log).catch(console.error);
