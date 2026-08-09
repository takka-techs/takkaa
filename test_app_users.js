import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    // sign in to test.branch...
    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'test.branch.1777462414396@example.com',
        password: 'Password@123456',
    });

    const token = authData.session.access_token;
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Warehouses`, {
        method: 'POST',
        headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            name: "Test Warehouse",
            type: "devices",
            is_default: false,
            color: "blue",
            icon: "box",
            branch_id: "e2098d62-11ae-4c7b-b8bc-2edacc6539c2"
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
main();
