import fs from 'fs';

async function testQuery() {
  try {
    const res = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=warehouse_id,quantity,cost_price&limit=1', {
      headers: {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
      }
    });
    console.log("Devices with quantity:", res.status, res.statusText);
    const text = await res.text();
    console.log("Body:", text);
    
    // retry without quantity
    const res2 = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=warehouse_id,cost_price&limit=1', {
      headers: {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'
      }
    });
    console.log("Devices without quantity:", res2.status, res2.statusText);
    
  } catch(e) {
    console.error(e);
  }
}
testQuery();
