import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    // Provide the email and password for the admin account
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'az8588521@gmail.com', // wait, I don't know the exact email used in testing.
        password: 'Password@123456'
    });

    if (authErr) {
        console.log("Could not login:", authErr.message);
        return;
    }

    const { data: appUsers, error: auErr } = await supabase.from('app_users').select('*').eq('user_id', authData.user.id).limit(1);

    if (auErr || !appUsers?.length) {
        console.log("No app user found", auErr);
        return;
    }

    const realTenantId = appUsers[0].tenant_id;
    console.log("Found real tenant_id:", realTenantId);

    // Now try to insert into branches!
    const { data: branchData, error: branchErr } = await supabase.from('branches').insert([{ tenant_id: realTenantId, name: 'Test API Branch' }]).select();
    
    if (branchErr) {
        console.error("Failed to insert branch with correct tenant_id:", branchErr);
    } else {
        console.log("SUCCESSFULLY inserted branch!", branchData);
    }
}
main();
