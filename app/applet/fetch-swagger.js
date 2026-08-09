const fs = require('fs');
fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa')
.then(r => r.json())
.then(data => fs.writeFileSync('swagger2.json', JSON.stringify(data, null, 2)))
.catch(console.error);
