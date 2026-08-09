import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${API_KEY}`);
  const spec = await res.json();
  const def = spec.definitions.installment_contracts;
  if(def) console.log(Object.keys(def.properties));
  else console.log('not found');
}
run();
