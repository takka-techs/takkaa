async function main() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Sales_Items?limit=1&apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const res = await globalThis.fetch(url);
  const data = await res.json();
  console.log(Object.keys(data[0] || {}));
}
main();
