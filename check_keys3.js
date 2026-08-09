import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi-actual.json', 'utf8'));

console.log(Object.keys(data.definitions || {}));
