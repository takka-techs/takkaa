import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function run() {
  const t = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${API_KEY}`).then(r=>r.json());
  if(t.definitions) {
    console.log(Object.keys(t.definitions.Accessories.properties));
    console.log(Object.keys(t.definitions.spare_parts.properties));
  }
}
run();
