import 'dotenv/config';

async function mockFullFlow() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
  };

  // 1. get a valid employee
  const emps = await (await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id&limit=1`, {headers})).json();
  const empId = emps[0].id;
  
  // 2. get a valid client
  const clients = await (await fetch(`${SUPABASE_URL}/rest/v1/clients?select=id&limit=1`, {headers})).json();
  const clientId = clients[0].id;
  
  // 3. create a contract simply
  const payload = {
      p_client_id: clientId,
      p_device_id: null,
      p_invoice_id: null,
      p_wallet_id: null,
      p_total_price: 1500,
      p_down_payment: 500,
      p_installment_amount: 1000,
      p_installment_count: 1,
      p_start_date: '2026-05-01',
      p_created_by: empId,
      p_payments: [
          { installment_no: 1, due_amount: 1000, due_date: '2026-05-01', status: 'pending'}
      ]
  };

  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_installment_contract`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
  });
  
  console.log('Contract creation status:', createRes.status);
  
}
mockFullFlow();
