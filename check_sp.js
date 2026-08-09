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
    const token = session.access_token;
    
    const wRes = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/rest/v1/Warehouses?select=id,type,name,branch_id`, {
        headers: { apikey: KEY, Authorization: `Bearer ${token}` }
    });
    console.log("Warehouses:", await wRes.json());
    
    const spRes = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,name,warehouse_id,branch_id&limit=10`, {
        headers: { apikey: KEY, Authorization: `Bearer ${token}` }
    });
    console.log("Spare Parts:", await spRes.json());
}
run();
