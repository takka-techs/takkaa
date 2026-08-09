const fetch = globalThis.fetch;
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/crm_logs?select=*,users(full_name)&limit=1';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(URL, { headers: { apikey: API_KEY } })
  .then(res => res.text())
  .then(data => {
      console.log('GET Result:', data);
  })
  .catch(err => console.error(err));
