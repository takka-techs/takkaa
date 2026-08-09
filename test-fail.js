import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
  };
  
  const appUsersRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=id,name`, { headers });
  console.log(appUsersRes.status, await appUsersRes.text());
}
test();
