import fs from 'fs';
const raw = fs.readFileSync('openapi-anon.json', 'utf8');
const data = JSON.parse(raw);
console.log('Definitions keys:', Object.keys(data.definitions || data.components?.schemas || {}));
