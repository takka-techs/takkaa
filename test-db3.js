import fs from 'fs';
async function run() {
  try {
    const res = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa');
    const data = await res.json();
    fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
    console.log("Written openapi.json");
  } catch (e) {
    console.error("Error", e);
  }
}
run();
