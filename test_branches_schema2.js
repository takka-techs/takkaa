const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function main() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`);
    const swagger = await res.json();
    console.log(Object.keys(swagger));
    if (swagger.definitions) console.log(Object.keys(swagger.definitions).filter(x => x.includes('branch')));
    if (swagger.components?.schemas) console.log(Object.keys(swagger.components.schemas).filter(x => x.includes('branch')));
}
main();
