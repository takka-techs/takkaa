const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?limit=1`, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ invoice_number: 'TEST', customer_name: 't', total_amount: 0, net_amount: 0, payment_method: 'installment', status: 'installment' })
}).then(r => r.json()).then(console.log).catch(console.error);
