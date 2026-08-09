import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function test() {
  const t1 = await fetch(`${SUPABASE_URL}/rest/v1/installment_contracts?limit=0`,{headers:{apikey:API_KEY}});
  const t2 = await fetch(`${SUPABASE_URL}/rest/v1/Devices?limit=0`,{headers:{apikey:API_KEY}});
  const t3 = await fetch(`${SUPABASE_URL}/rest/v1/clients?limit=0`,{headers:{apikey:API_KEY}});
  
  console.log("installment_contracts:", await t1.headers.get("Content-Range"));
}
test();
