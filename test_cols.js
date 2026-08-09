const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function verifyCol(table, col) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=not.is.null&limit=1`, { headers: { 'apikey': API_KEY } });
  if (res.ok) {
    console.log(`${table} has ${col}`);
  } else {
    const err = await res.json();
    console.error(`${table} lacks ${col}:`, err);
  }
}

async function run() {
  await verifyCol('installment_contracts', 'user_id');
  await verifyCol('installment_contracts', 'branch_id');
  await verifyCol('installment_payments', 'user_id');
  await verifyCol('installment_payments', 'branch_id');
}
run();
