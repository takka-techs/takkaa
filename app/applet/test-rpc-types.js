import 'dotenv/config';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test(walletFormat) {
  const hdrs = { 
    'apikey': API_KEY, 
    'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'invalid'}`, 
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_contract_bulk_payment`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 10,
      p_employee_id: '00000000-0000-0000-0000-000000000000',
      p_wallet_id: walletFormat,
      p_idempotency_key: 'test',
      p_notes: 'test'
    })
  });
  console.log(typeof walletFormat, res.status, await res.text());
}

async function run() {
  await test(1);
  await test("1");
}
run();
