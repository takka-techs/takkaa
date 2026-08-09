import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const testUser = 'db99b9cf-2b63-495c-abeb-9dc4b1b3152d';

    const { error: err } = await supabase.from('branches').insert([{ user_id: testUser, tenant_id: testUser, name: "Test" }]);
    console.log("user_id + tenant_id insert Error:", err);
}
main();
