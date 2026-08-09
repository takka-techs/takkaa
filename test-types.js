const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts?limit=5';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};
fetch(url, { headers })
  .then(res => res.json())
  .then(data => {
    // try to fetch app_users?id=... to see its type error when we pass 'hello'
  })
