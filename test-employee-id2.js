const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts?id=eq.1';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ employee_id: 'Hello' }) })
  .then(res => { console.log(res.status); return res.text(); })
  .then(txt => console.log('RESPONSE:', txt))
  .catch(err => console.error(err));
