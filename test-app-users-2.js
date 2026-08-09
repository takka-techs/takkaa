const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?limit=1';
const headers = { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa' };

fetch(url, { headers })
  .then(r => r.json())
  .then(data => {
    if (data && data.length) {
      console.log('COLUMNS:', Object.keys(data[0]));
      console.log('ID TYPE:', typeof data[0].id, data[0].id);
    } else {
      console.log('NO USERS FOUND');
    }
  })
  .catch(console.error);
