const fetch = globalThis.fetch;
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function checkSchema() {
    try {
        const res = await fetch(URL);
        const data = await res.json();
        
        // PostgREST 9+ uses components.schemas
        // PostgREST 8- uses definitions
        const schemas = data.components?.schemas || data.definitions;
        
        if (!schemas) {
            console.log('Could not find schemas in OpenAPI spec', Object.keys(data));
            return;
        }
        
        console.log('Looking for crm_logs schema...');
        if (schemas['crm_logs']) {
            console.log('crm_logs columns:', Object.keys(schemas['crm_logs'].properties));
        } else {
            console.log('crm_logs table not found in schema. Available tables:', Object.keys(schemas));
        }
    } catch (e) {
        console.error(e);
    }
}
checkSchema();
