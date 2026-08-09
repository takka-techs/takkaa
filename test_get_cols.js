const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    let res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?limit=1`, { headers: { 'apikey': KEY } });
    console.log("app_settings_cols:", Object.keys((await res.json())[0] || {}));

    res = await fetch(`${SUPABASE_URL}/rest/v1/app_users?limit=1`, { headers: { 'apikey': KEY } });
    console.log("app_users:", Object.keys((await res.json())[0] || {}));
}
run();