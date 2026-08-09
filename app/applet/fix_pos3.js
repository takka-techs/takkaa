const fs = require('fs');

const file = 'src/components/POS.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /model: '',\s*capacity: '128GB',/g,
  `model: '',\n        batteryPercentage: '',\n        capacity: '128GB',`
);

if (!data.includes('Battery,')) {
  data = data.replace(
    /import {/,
    `import {\n  Battery,`
  );
}

fs.writeFileSync(file, data);
console.log("Done");
