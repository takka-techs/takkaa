const fs = require('fs');
const openapi = JSON.parse(fs.readFileSync('openapi-actual.json'));

if (openapi.definitions && openapi.definitions.wallets) {
  console.log("Wallets columns:");
  console.log(Object.keys(openapi.definitions.wallets.properties));
} else {
  console.log("Wallets not found in openapi-actual.json");
}
