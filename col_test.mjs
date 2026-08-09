const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: KEY } });
  const data = await res.json();
  const def = data.definitions.Devices || data.definitions.devices;
  if (def) {
    console.log("Devices cols:", Object.keys(def.properties).join(', '));
  } else {
    console.log("Devices table not found in definitions.");
  }
}
run();
