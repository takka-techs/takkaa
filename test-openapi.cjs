const fs = require('fs');
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY, 'Accept': 'application/openapi+json' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: hdrs });
  fs.writeFileSync('openapi-anon.json', await res.text());
}
test();
