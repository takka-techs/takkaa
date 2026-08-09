const fs = require('fs');
console.log(fs.readFileSync('src/components/POS.tsx', 'utf8').split('\n').slice(0, 20).join('\n'));
