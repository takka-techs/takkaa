const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_capital`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT tgname, relname FROM pg_trigger JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid WHERE tgname ILIKE \'%auth%\' OR tgname ILIKE \'%user%\' OR relname = \'users\'' })
    });
    console.log(res.status, await res.json());
}
run();
