import crypto from 'crypto';
const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}` // Note: This is inserting without proper user token (Using anon token). RLS might block it. But let's see.
        },
        body: JSON.stringify({ 
            name: "test", username: "test_emp_" + Date.now(), password: "123", role: "employee", 
            role_level: 3, status: "نشط", branch_id: null, tenant_id: crypto.randomUUID()
        })
    });
    console.log(res.status, await res.text());
}
run();