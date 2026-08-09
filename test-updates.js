import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
fetch(`${URL}/rest/v1/Repairs?select=updated_at&limit=1`, { headers: { apikey: KEY } })
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
