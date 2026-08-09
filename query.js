const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_my_branch_id`, { 
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}).then(r => r.text()).then(res => {
  console.log('fn_my_branch_id:', res);
}).catch(console.error);

fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_is_super_admin`, { 
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}).then(r => r.text()).then(res => {
  console.log('fn_is_super_admin:', res);
}).catch(console.error);
