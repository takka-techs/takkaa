import fetch from 'node-fetch';
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function checkCols(table, cols) {
    const valid = [];
    for (const col of cols) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1`, {
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
        });
        if (res.status === 400 || res.status === 404) {
             const text = await res.text();
             if (text.includes("does not exist") || text.includes("PGRST106")) {
                 continue;
             }
        }
        valid.push(col);
    }
    console.log(`${table} valid columns:`, valid);
}

const cols = ['id', 'inventory_id', 'item_id', 'item_type', 'item_name', 'expected_quantity', 'actual_quantity', 'cost_price', 'notes', 'tenant_id', 'branch_id', 'user_id', 'created_at', 'updated_at'];
checkCols('store_inventory_items', cols);
