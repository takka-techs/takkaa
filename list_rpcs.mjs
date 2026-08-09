import fs from 'fs';
const openapi = JSON.parse(fs.readFileSync('/openapi-actual.json', 'utf8'));
const paths = Object.keys(openapi.paths).filter(p => p.startsWith('/rpc/'));
console.log(paths.join('\n'));
