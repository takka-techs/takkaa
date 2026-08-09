const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function checkCols() {
    for (const table of ['Devices', 'Accessories', 'spare_parts']) {
        const res = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/rest/v1/${table}?select=id,cost_price,buy_price,price,selling_price&limit=1`, {
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
        });
        const text = await res.text();
        console.log(table, res.status, text.substring(0, 100));
    }
}
checkCols();
