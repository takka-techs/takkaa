import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

console.log("app_users:");
console.log(Object.keys(data.definitions?.app_users?.properties || {}));
console.log("\napp_settings:");
console.log(Object.keys(data.definitions?.app_settings?.properties || {}));
console.log("\nrpc:");
console.log(Object.keys(data.paths).filter(p => p.startsWith('/rpc/')));
