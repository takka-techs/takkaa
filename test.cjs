async function run() {
  const payload = {
    wallet_id: 1, // assumption
    user_id: '00000000-0000-0000-0000-000000000000',
    type: 'in',
    amount: 1,
    category: 'مبيعات يومية',
    description: `مبيعات`,
    date: new Date().toISOString()
  };
  const res = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions', {
    method: 'POST',
    headers: { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());
}
run();
