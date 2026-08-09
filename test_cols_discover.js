const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function checkCols(table, cols) {
    const valid = [];
    for (const col of cols) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1`, {
            headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
        });
        if (res.ok || res.status === 401) {
            // Unauth or OK means column exists, though we might still get 401. Let's see if 400 is returned for missing cols.
        }
        if (res.status === 400) {
             const text = await res.text();
             if (text.includes("does not exist")) {
                 continue;
             }
        }
        valid.push(col);
    }
    console.log(`${table} valid columns:`, valid);
}

const userCols = ['id', 'user_id', 'name', 'username', 'role', 'status', 'tenant_id', 'branch_id', 'company_name', 'email', 'full_name', 'has_branches', 'password'];
const settingsCols = ['id', 'tenant_id', 'company_name', 'has_branches', 'logo', 'tax_number', 'company_address', 'owner_id'];

checkCols('app_users', userCols).then(() => checkCols('app_settings', settingsCols));
