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
       fetch(`${SUPABASE_URL}/rest/v1/installment_contracts`, {
         method: 'POST',
         headers: {
           'apikey': KEY,
           'Authorization': `Bearer ${res.access_token}`,
           'Content-Type': 'application/json',
           'Prefer': 'return=representation'
         },
         body: JSON.stringify({ 
             client_id: null,
             invoice_id: null,
             wallet_id: null,
             total_price: 1000,
             down_payment: 0,
             installment_count: 5,
             installment_amount: 200,
             status: 'active',
             created_by: res.user.id
         })
       }).then(r=>r.json()).then(console.log);
   } else console.log(res);
}).catch(console.error);
