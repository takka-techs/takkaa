const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function check() {
  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  const r = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,entry_type`, { headers });
  const d = await r.json();
  const counts = d.reduce((acc, curr) => {
    const k = curr.entry_type;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  console.log(counts);
}
check();
