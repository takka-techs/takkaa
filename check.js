import fs from 'fs';

let urlStr = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?name=ilike.*test2*';
fetch(urlStr, {
    headers: {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${process.env.SUPABASE_TOKEN || ''}` // won't work
    }
});
