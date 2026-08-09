const fetch = require('node-fetch'); // actually we can use global fetch if available, but let's use global fetch
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/crm_logs';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    // Note: without Authorization it might fail RLS, let's see!
  },
  body: JSON.stringify({ repair_id: 1, user_id: '123', description: 'Test' })
})
  .then(res => res.text())
  .then(data => console.log('DATA:', data))
  .catch(err => console.error(err));
