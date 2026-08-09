const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    for (const name of ['on_auth_user_created', 'handle_new_user', 'create_user_profile']) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_func_src`, {
            method: 'POST',
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_name: name })
        });
        const text = await res.text();
        console.log(name, res.status, text);
    }
}
run();
