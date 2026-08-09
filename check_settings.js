const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function check() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?limit=1`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  
  if (!res.ok) {
    console.log("Error checking app_settings:", await res.text());
  } else {
    console.log("Success checking app_settings:", await res.json());
  }
}

check();
