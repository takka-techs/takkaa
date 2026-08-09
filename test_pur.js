const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

async function test() {
  const token = ""; // unauth will test if syntax is correct (RLS will give 200 with [], Schema error will give 400)
  
  const h = { 'apikey': apiKey, 'Content-Type': 'application/json' };
  
  const reqs = [
    fetch(`${baseUrl}/Devices?select=*&entry_type=eq.purchase`, { headers: h }),
    fetch(`${baseUrl}/Accessories?select=*&entry_type=eq.purchase`, { headers: h }),
    fetch(`${baseUrl}/spare_parts?select=*&entry_type=eq.purchase`, { headers: h })
  ];
  
  const res = await Promise.all(reqs);
  for (const r of res) {
     console.log(r.url.split('/').pop(), r.status, await r.text());
  }
}
test();
