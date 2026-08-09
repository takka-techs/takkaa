async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/?apikey=sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const res = await fetch(url);
  const data = await res.json();
  console.log(Object.keys(data.definitions));
}
test();
