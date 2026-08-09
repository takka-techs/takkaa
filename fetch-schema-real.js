import fs from 'fs';
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

fetch(URL, { headers: { apikey: API_KEY } })
  .then(res => res.json())
  .then(data => {
     if (data.definitions && data.definitions.crm_logs) {
        console.log('CRM LOGS SCHEMA', JSON.stringify(data.definitions.crm_logs, null, 2));
     } else {
        console.log('Not found');
     }
  })
  .catch(err => console.error(err));
