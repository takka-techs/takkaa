import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const testUser = 'db99b9cf-2b63-495c-abeb-9dc4b1b3152d'; // we just need any uuid, or maybe we have to login

    // Try dummy insert into branches to see postgrest error
    const { data: cols, error: err } = await supabase.from('branches').insert([{ tenant_id: testUser, name: "Test" }]);
    console.log("tenant_id ONLY insert Error:", err);

    const { error: err2 } = await supabase.from('branches').insert([{ owner_id: testUser, name: "Test2" }]);
    console.log("owner_id ONLY insert Error:", err2);
    
    const { error: err3 } = await supabase.from('branches').insert([{ tenant_id: testUser, owner_id: testUser, name: "Test3" }]);
    console.log("tenant_id AND owner_id insert Error:", err3);
}
main();
