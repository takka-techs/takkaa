import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function test() {
  const d = await fetch(`${SUPABASE_URL}/rest/v1/Devices?limit=1`,{headers:{apikey:API_KEY}}).then(r=>r.json());
  const a = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?limit=1`,{headers:{apikey:API_KEY}}).then(r=>r.json());
  const s = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?limit=1`,{headers:{apikey:API_KEY}}).then(r=>r.json());
  if(d.length) console.log("Device", Object.keys(d[0]));
  if(a.length) console.log("Accessory", Object.keys(a[0]));
  if(s.length) console.log("SparePart", Object.keys(s[0]));
}
test();
