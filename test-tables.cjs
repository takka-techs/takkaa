const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY };
  // just try transactions
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bank_transactions?limit=1`, { headers: hdrs });
  console.log('bank_transactions', res.status);
  
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/wallet_ledger?limit=1`, { headers: hdrs });
  console.log('wallet_ledger', res2.status);
  
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/transactions?limit=1`, { headers: hdrs });
  console.log('transactions', res3.status);
}
test();
