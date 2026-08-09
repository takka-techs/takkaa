const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(res => {
  const rpcs = Object.keys(res.paths).filter(k => k.startsWith('/rpc/'));
  console.log(rpcs);
}).catch(console.error);
