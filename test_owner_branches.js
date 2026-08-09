import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    // sign up new owner
    const email = `test_owner_${Date.now()}@example.com`;
    const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email,
        password: 'Password@123456',
    });

    if (signupErr) { console.error(signupErr); return; }

    const token = authData.session.access_token;
    
    // Check RPC
    const rpces = ['exec_sql', 'execute_sql', 'run_sql', 'query'];
    for (const rpc of rpces) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
            method: 'POST',
            headers: {
                apikey: ANON_KEY,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: 'SELECT 1' })
        });
        console.log(`RPC ${rpc} status:`, res.status);
    }
}
main();
