import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.from('branches').insert([{ tenant_id: 'db99b9cf-2b63-495c-abeb-9dc4b1b3152d', name: "Test", invalid_col: "Test" }]);
    console.log("Insert Result:", { data, error });
}
main();
