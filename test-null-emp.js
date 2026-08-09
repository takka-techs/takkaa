import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
  };

  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_installment_payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
          p_payment_id: "cccccccc-0000-0000-0000-000000000000",
          p_amount: 10,
          p_employee_id: null,
          p_wallet_id: null,
          p_idempotency_key: 'test' + Date.now(),
          p_notes: 'test'
      })
  });
  
  console.log('Status:', createRes.status);
  console.log('Body:', await createRes.text());
}
test();
