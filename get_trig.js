const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_capital`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT tgname, proname, prosrc FROM pg_trigger JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid WHERE tgname ILIKE \'%auth%\' OR tgname ILIKE \'%user%\'' })
    });
    console.log(res.status, await res.json());
}
run();
