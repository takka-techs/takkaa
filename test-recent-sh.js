const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/shifts?limit=5&order=created_at.desc';
const headers = { 
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => {
    data.forEach(d => console.log(d.id, d.employee_id, d.status, d.created_at))
  })
  .catch(console.error);
