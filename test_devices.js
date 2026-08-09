const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,entry_type,company,model&order=created_at.desc&limit=5`, { headers: hdrs });
  console.log(await res.json());
}
test();
