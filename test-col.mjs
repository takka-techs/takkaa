import fs from 'fs';

const supabaseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const supabaseKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function run() {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const c = await res.json();
    console.log(JSON.stringify(c.definitions.clients.properties, null, 2));
}
run();
