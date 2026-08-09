import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const d = new Date();
const dateStr = d.toISOString().split('T')[0];
console.log(dateStr);
fetch(`${URL}/rest/v1/Repairs?select=id,device_name,issue,total_amount,paid_amount,status,created_at,updated_at,customer_name&limit=10`, { headers: { apikey: KEY } })
  .then(r => r.json())
  .then(d => {
    console.log("Found:", d.length);
    console.log(d.slice(0, 3));
  })
  .catch(e => console.error(e));
