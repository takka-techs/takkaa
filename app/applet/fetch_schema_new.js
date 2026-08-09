const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

// Use OpenAPI to check schema
fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(r => r.json()).then(res => {
  console.log("installment_payments schema:");
  console.dir(res.definitions.installment_payments, {depth: null});
  console.log("\ninstallment_contracts schema:");
  console.dir(res.definitions.installment_contracts, {depth: null});
}).catch(console.error);
