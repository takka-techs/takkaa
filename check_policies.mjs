import fetch from 'node-fetch';

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

fetch(`${SUPABASE_URL}/rest/v1/rpc/get_function_def?function_name=test`, { 
  method: 'GET',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
}).then(r => r.json()).then(res => {
  console.log('branches policies:', res);
}).catch(console.error);
