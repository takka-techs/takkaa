import * as fs from 'fs';
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(data => {
  fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
}).catch(console.error);
