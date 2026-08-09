const url1 = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?id=eq.hello';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};

fetch(url1, { headers })
  .then(res => { console.log("app_users ID validation:"); return res.text(); })
  .then(txt => console.log(txt));
