async function checkSchema() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  let res = await fetch(`${SUPABASE_URL}/rest/v1/app_users?limit=1`, {
    headers: { apikey: SUPABASE_KEY }
  });
  if (res.ok) {
    const data = await res.json();
    if (data.length > 0) {
      console.log("app_users columns:", Object.keys(data[0]));
    } else {
      console.log("app_users table is empty, fetching from options request.");
      res = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: "OPTIONS",
        headers: { apikey: SUPABASE_KEY }
      });
      console.log("OPTIONS:", res.status);
    }
  } else {
    console.log("Failed to fetch app_users", await res.text());
  }

  res = await fetch(`${SUPABASE_URL}/rest/v1/branches?limit=1`, {
    headers: { apikey: SUPABASE_KEY }
  });
  if (res.ok) {
    const data = await res.json();
    if (data.length > 0) {
      console.log("branches columns:", Object.keys(data[0]));
    } else {
      console.log("branches table is empty.");
    }
  } else {
    console.log("Failed to fetch branches", await res.text());
  }
}
checkSchema();
