const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts?status=eq.closed&limit=5';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(console.error);
