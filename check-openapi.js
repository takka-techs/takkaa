const fs = require('fs');
const text = fs.readFileSync('openapi.json', 'utf8');
try {
  const json = JSON.parse(text);
  console.log(Object.keys(json.definitions).filter(k => k.toLowerCase().includes('warehouse')));
} catch (e) {
  console.log(text.slice(0, 100));
}
