const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(openapi => {
    const table = 'employees';
    if (openapi.definitions[table]) {
        console.log(Object.keys(openapi.definitions[table].properties).join(', '));
    } else {
        console.log(`Table ${table} not found.`);
    }
}).catch(console.error);
