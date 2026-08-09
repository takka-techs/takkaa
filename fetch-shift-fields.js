import fs from 'fs';
fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa')
  .then(res => res.json())
  .then(data => {
     let shifts = data.definitions?.shifts?.properties || data.components?.schemas?.shifts?.properties || {};
     console.log('shifts:', Object.keys(shifts));
  })
  .catch(console.error);
