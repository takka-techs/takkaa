const fs = require('fs');
const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
fetch(url)
  .then(res => res.json())
  .then(data => fs.writeFileSync('schema.json', JSON.stringify(data)))
  .catch(err => console.error(err));
