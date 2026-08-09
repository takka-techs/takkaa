const fs = require('fs');

async function testQuery() {
  const q = `
    SELECT * FROM pg_policies WHERE tablename = 'app_settings';
  `;
  
  const res = await fetch("https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/rpc/test_query", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
        Authorization: "Bearer sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa"
    },
    body: JSON.stringify({ q_str: q })
  });
  console.log(await res.text());
}
testQuery();
