const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function main() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${KEY}`).then(res => res.json());
  console.log("Employees Props:", Object.keys(r.definitions.employees?.properties || {}).join(', '));
}
main();
