const fs = require('fs');
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

async function test() {
  const hdrs = { 'apikey': API_KEY, 'Accept': 'application/openapi+json' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: hdrs });
  const data = await res.json();
  const funcs = Object.keys(data.paths).filter(p => p.includes('rpc/'));
  console.log('Available RPC:', funcs);
}
test();
