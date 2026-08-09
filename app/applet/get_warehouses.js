import { config } from 'dotenv';
config();

fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id,name,branch_id,branches!branch_id(name)', {
    headers: {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
    }
}).then(r => r.json()).then(console.log);
