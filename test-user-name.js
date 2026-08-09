const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const payload = {
  status: 'open',
  start_time: new Date().toISOString(),
  starting_cash: 100,
  expected_amount: 100,
  user_id: '00000000-0000-0000-0000-000000000000',
  user_name: 'test_user_name' // Test user_name field
};

fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
  .then(res => { console.log(res.status); return res.text(); })
  .then(txt => console.log('RESPONSE:', txt))
  .catch(err => console.error(err));
