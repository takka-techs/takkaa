const fetch = require('node-fetch');
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/crm_logs?limit=1';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(URL, { headers: { apikey: API_KEY } })
  .then(res => res.json())
  .then(data => console.log('DATA:', data))
  .catch(err => console.error(err));
