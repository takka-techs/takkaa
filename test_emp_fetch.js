const options = {
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
  }
};
fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/employees?limit=1', options)
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
