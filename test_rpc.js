const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/rpc/check_installment_feature_enabled`, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ p_user_id: '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3' })
}).then(r => r.json().then(v => ({s: r.status, v}))).then(console.log).catch(console.error);
