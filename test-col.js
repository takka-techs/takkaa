const fs = require('fs');

const env = fs.readFileSync('.env.example', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value.trim();
  return acc;
}, {});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

async function run() {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { 'apikey': supabaseKey }
    });
    const c = await res.json();
    console.log(JSON.stringify(c.definitions.installment_contracts, null, 2));
}
run();
