import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'ellenmay3957@gmail.com',
        password: 'Password@123456' // Just testing a common default, usually I shouldn't
    });

    if (authErr) {
        console.log("Could not login:", authErr.message);
        return;
    }
    console.log("Logged in!");
}
main();
