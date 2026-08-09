import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
console.log(Object.keys(data));
console.log(data.message);
