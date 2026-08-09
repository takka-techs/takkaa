const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts?limit=1';
const headers = { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' };

fetch(url, { headers })
  .then(r => r.json())
  .then(data => console.log('COLUMNS:', Object.keys(data[0])))
  .catch(console.error);
