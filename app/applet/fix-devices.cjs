const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function fix() {
  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Fix devices
  await fetch(`${SUPABASE_URL}/rest/v1/Devices?status=is.null`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'available' })
  });

  await fetch(`${SUPABASE_URL}/rest/v1/Devices?is_locked_for_installment=is.null`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_locked_for_installment: false })
  });
  
  console.log("Fixed status and is_locked_for_installment for Devices");
}

fix();
