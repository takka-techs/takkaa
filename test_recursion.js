import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    const email = `test.branch.${Date.now()}@example.com`;
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: 'Password@123456',
        options: {
            data: { full_name: 'Test Boss' }
        }
    });

    const token = authData.session.access_token;
    const userId = authData.user.id;

    // insert branch
    const bRes = await supabase.from('branches').insert([{ tenant_id: userId, name: "Test B" }]);
    console.log("Branch Insert:", bRes.error);

    const res = await supabase.from('branches').select('*');
    console.log("Branches:", res.data, res.error);
}
main();
