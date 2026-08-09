import 'dotenv/config';

async function test() {
  const url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/';
  const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  
  // We can query the OpenAPI spec to see the RPC schema
  const res = await fetch(url.replace('/rest/v1/', '/rest/v1/?apikey=' + apiKey));
  const data = await res.json();
  const rpc = data.paths['/rpc/create_installment_contract'];
  console.log(JSON.stringify(rpc, null, 2));
}
test();
