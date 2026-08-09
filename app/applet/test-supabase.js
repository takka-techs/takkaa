const fetch = globalThis.fetch;
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';

async function testSupabase() {
    try {
        console.log('1. Fetching first repair ID...');
        const repairRes = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?limit=1`, { headers: { 'apikey': API_KEY } });
        const repairs = await repairRes.json();
        
        if (!repairs || repairs.length === 0) {
           console.log('No repairs found.');
           return;
        }
        const repairId = repairs[0].id;
        console.log('Found Repair ID:', repairId);

        console.log('2. Trying to insert a log for this repair...');
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ repair_id: repairId, description: 'Test from backend script' })
        });
        
        const insertData = await insertRes.text();
        console.log('Insert Response:', insertRes.status, insertData);

        console.log('3. Trying to read logs...');
        const readRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_logs?limit=5`, { headers: { 'apikey': API_KEY } });
        const readData = await readRes.text();
        console.log('Read Response:', readRes.status, readData);

    } catch (e) {
        console.error('Error in script:', e);
    }
}

testSupabase();
