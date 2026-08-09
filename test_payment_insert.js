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
       fetch(`${SUPABASE_URL}/rest/v1/installment_payments`, {
         method: 'POST',
         headers: {
           'apikey': KEY,
           'Authorization': `Bearer ${res.access_token}`,
           'Content-Type': 'application/json',
           'Prefer': 'return=representation'
         },
         body: JSON.stringify({ 
             due_amount: 100,
             due_date: '2024-01-01',
             installment_no: 1,
             status: 'pending'
             // contract_id missing deliberately to see if it violates non-null
         })
       }).then(r=>r.json()).then(console.log);
   } else console.log(res);
}).catch(console.error);
