import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('branches').select('*').limit(1);
    console.log("Branches:", data);
    if(error) console.error("Error:", error);
}

main();
