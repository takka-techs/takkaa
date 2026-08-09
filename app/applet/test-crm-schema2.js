const fetch = globalThis.fetch;
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/crm_logs?limit=3';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(URL, { headers: { apikey: API_KEY } })
  .then(res => res.json())
  .then(data => {
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, trying to insert a dummy record to see schema error or success.');
      fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/crm_logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ repair_id: 1, user_id: '123e4567-e89b-12d3-a456-426614174000', description: 'test' })
      })
      .then(res => res.text())
      .then(errData => console.log('Insert Result:', errData));
    }
  })
  .catch(err => console.error(err));
