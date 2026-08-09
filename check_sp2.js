const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    const loginRes = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "admin@admin.com", password: "password" })
    });
    const session = await loginRes.json();
    console.log(session);
}
run();
