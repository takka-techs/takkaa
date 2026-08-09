const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function checkCols(table, cols) {
    const valid = [];
    for (const col of cols) {
        const res = await (globalThis.fetch ? globalThis.fetch : fetch)(`${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1`, {
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
        });
        if (res.status === 400 || res.status === 404) {
             const text = await res.text();
             if (text.includes("does not exist") || text.includes("PGRST106")) {
                 console.log("Missing:", col);
                 continue;
             }
        }
        valid.push(col);
    }
    console.log(`${table} valid columns:`, valid);
}
checkCols('Sales_Items', ['cost_price', 'quantity', 'unit_price', 'total_price']);
