const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY };
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/employees?limit=1`, { headers: hdrs });
  console.log("employees:", await res1.json());
  
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/employee_loans?limit=1`, { headers: hdrs });
  console.log("employee_loans:", await res2.json());
}
test();
