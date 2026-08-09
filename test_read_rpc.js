import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const ANON_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    // Call dev_temp_get_indexes which is actually just `pg_get_constraintdef`
    // We already have `get_func_src` so let's call it!
    const { data: src, error: err } = await supabase.rpc('get_func_src', { p_name: 'fn_current_tenant_id' });
    console.log("fn_current_tenant_id:", src, err);
    
    // Also let's fetch the policy for branches via a temporary RPC? We can't create RPCs from here without owner key.
}
main();
