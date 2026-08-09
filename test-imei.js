const url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?or=(imei1.eq.346456546546,imei2.eq.346456546546,barcode.eq.346456546546)&select=*`;
const headers = {
  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
  'Authorization': 'Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => console.log('Exact Match:', JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));

const url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?or=(imei1.ilike.*346456546546*,imei2.ilike.*346456546546*,barcode.ilike.*346456546546*)&select=*`;
fetch(url2, { headers })
  .then(res => res.json())
  .then(data => console.log('Ilike Match:', JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));

