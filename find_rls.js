import fs from 'fs';
const files = fs.readdirSync('.').filter(f => f.endsWith('.sql'));
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.match(/row level security/i) || code.match(/POLICY/i) || code.match(/Warehouses/i)) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
       if (lines[i].toLowerCase().includes('warehouses')) {
          console.log(`[${file}:${i+1}] ${lines.slice(Math.max(0, i-5), i+6).join('\n')}`);
       }
    }
  }
}
