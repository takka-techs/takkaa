import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

console.log("Devices properties:", Object.keys(data.definitions?.Devices?.properties || data.components?.schemas?.Devices?.properties || {}));
console.log("Accessories properties:", Object.keys(data.definitions?.Accessories?.properties || data.components?.schemas?.Accessories?.properties || {}));
console.log("spare_parts properties:", Object.keys(data.definitions?.spare_parts?.properties || data.components?.schemas?.spare_parts?.properties || {}));
