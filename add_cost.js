const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function addCost() {
    const res = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_str: `ALTER TABLE public."Sales_Items" ADD COLUMN IF NOT EXISTS cost_price NUMERIC;` })
    });
    console.log(res.status, await res.text());
}
addCost();
