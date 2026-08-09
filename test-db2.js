async function run() {
  try {
    const res = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa');
    const data = await res.json();
    console.log("Devices properties:", Object.keys(data.definitions.Devices.properties));
    console.log("Accessories properties:", Object.keys(data.definitions.Accessories.properties));
    console.log("spare_parts properties:", Object.keys(data.definitions.spare_parts.properties));
  } catch (e) {
    console.error("Error", e);
  }
}
run();
