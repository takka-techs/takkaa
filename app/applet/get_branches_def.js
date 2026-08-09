const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`);
    const swagger = await res.json();
    const branchesTable = swagger.definitions?.branches;
    console.log(JSON.stringify(branchesTable, null, 2));
}

main();
