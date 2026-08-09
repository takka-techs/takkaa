import fs from 'fs';
fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/installment_contracts?select=*&limit=1', {
  headers: {
    'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
    'Prefer': 'return=representation'
  }
}).then(r => r.json()).then(d => console.log(d));
