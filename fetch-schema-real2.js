import fs from 'fs';
fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa')
  .then(res => res.json())
  .then(data => {
     let devices = data.definitions?.Devices?.properties || data.components?.schemas?.Devices?.properties || {};
     let acc = data.definitions?.Accessories?.properties || data.components?.schemas?.Accessories?.properties || {};
     let sp = data.definitions?.spare_parts?.properties || data.components?.schemas?.spare_parts?.properties || {};
     let inv = data.definitions?.store_inventories?.properties || data.components?.schemas?.store_inventories?.properties || {};
     console.log('Devices:', Object.keys(devices));
     console.log('Accessories:', Object.keys(acc));
     console.log('spare_parts:', Object.keys(sp));
     console.log('store_inventories:', Object.keys(inv));
  })
  .catch(console.error);
