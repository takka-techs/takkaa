const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/store_inventories?id=eq.dc8c9fcf-db71-400c-8009-dc9f3c0d3e7f';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
  'Content-Type': 'application/json'
};

fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }) })
  .then(res => { console.log(res.status, res.statusText); return res.text(); })
  .then(txt => console.log('RESPONSE:', txt))
  .catch(err => console.error(err));
