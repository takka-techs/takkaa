const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?select=id,name,role,status,tenant_id,branch_id,username_en';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};

fetch(url, { headers })
  .then(res => { console.log(res.status); return res.text(); })
  .then(txt => console.log('RESPONSE:', txt))
  .catch(err => console.error(err));
