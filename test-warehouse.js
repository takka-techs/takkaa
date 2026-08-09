const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function testWarehouse() {
    let url = `${SUPABASE_URL}/rest/v1/Warehouses?select=id&type=eq.spare_parts`;
    const res = await (globalThis.fetch ? globalThis.fetch : fetch)(url, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    console.log("Warehouses", res.status, await res.text());
}
testWarehouse();
