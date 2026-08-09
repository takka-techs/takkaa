const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/employees?limit=1';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};
fetch(url, { headers })
  .then(res => { console.log(res.status); return res.json(); })
  .then(data => console.log('COLUMNS:', Object.keys(data[0] || {})))
  .catch(err => console.error(err));
