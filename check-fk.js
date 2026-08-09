import 'dotenv/config';

async function test() {
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  // Create a fake installment
  console.log("Will check if we can call it with arbitrary user ID");
}

test();
