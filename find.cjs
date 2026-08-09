const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.sql'));
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.toLowerCase().includes('warehouses')) {
     console.log('Found Warehouses in ' + file);
  }
}
