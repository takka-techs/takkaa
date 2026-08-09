const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Sales_Invoices?limit=1';
const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(url, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}`, 'Prefer': 'return=representation' }, method: 'POST', body: JSON.stringify({ invoice_number: 'TEST', customer_name: 't', total_amount: 0, net_amount: 0, payment_method: 'cash', status: 'paid' })})
  .then(r => r.text())
  .then(data => console.log(data))
  .catch(console.error);
