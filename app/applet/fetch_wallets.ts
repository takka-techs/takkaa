import https from 'https';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'; // using the one from the files

https.get(`${SUPABASE_URL}/rest/v1/wallets?limit=1`, {
  headers: {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (e) => {
  console.error(e);
});
