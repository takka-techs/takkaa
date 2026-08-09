const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
  const email = `test_inv_${Date.now()}@example.com`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', data: { company_name: 'Test Co' } })
  });
  const data = await res.json();
  const token = data.session ? data.session.access_token : data.access_token;
  
  let q1 = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,category,model,company,cost_price&limit=1`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log("With category:", q1.status, await q1.text());

  let q2 = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,model,company,cost_price&limit=1`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log("Without category:", q2.status, await q2.text());
}
run();
