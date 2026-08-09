const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password: 'Password123!',
      data: {
        company_name: 'Test Co',
        has_branches: true
      }
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

testSignup();
