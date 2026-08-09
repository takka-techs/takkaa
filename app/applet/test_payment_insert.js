const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: "admin@admin.com", password: "password" })
}).then(r => r.json()).then(res => {
   if (res.access_token) {
       console.log("Got token");
       const auth_id = res.user.id;
       fetch(`${SUPABASE_URL}/rest/v1/Warehouses`, {
         method: 'POST',
         headers: {
           'apikey': KEY,
           'Authorization': `Bearer ${res.access_token}`,
           'Content-Type': 'application/json',
           'Prefer': 'return=representation'
         },
         body: JSON.stringify({ 
             name: 'test',
             type: 'devices',
             is_default: false,
             color: 'blue',
             icon: 'box',
             tenant_id: auth_id,
             user_id: auth_id
         })
       }).then(r=>r.text()).then(console.log);
   } else console.log(res);
}).catch(console.error);
