const fs = require('fs');
const text = fs.readFileSync('openapi.json', 'utf8');
try {
  const json = JSON.parse(text);
  console.log(Object.keys(json.paths).filter(k => k.startsWith('/rpc/')));
} catch (e) {
  console.log(text.slice(0, 100));
}
