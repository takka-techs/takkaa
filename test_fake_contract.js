import 'dotenv/config';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
async function run() {
  const payload = {
        p_client_id: 1, // we need a valid client id
        p_device_id: 999999, // Fake!
        p_invoice_id: null,
        p_wallet_id: null,
        p_total_price: 1000,
        p_down_payment: 0,
        p_installment_amount: 100,
        p_installment_count: 10,
        p_start_date: "2026-05-01",
        p_created_by: null,
        p_payments: []
    };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_installment_contract`, {
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());
}
run();
