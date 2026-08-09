const token = "bad";
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function loginAndCheck() {
  const email = `test_inv_${Date.now()}@example.com`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', data: { company_name: 'Test Co' } })
  });
  const data = await res.json();
  const token = data.access_token;
  
  const devRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?limit=1`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${token}` }
  });
  console.log(await devRes.json());
}
loginAndCheck();
