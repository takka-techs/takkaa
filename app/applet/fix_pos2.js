const fs = require('fs');

const file = 'src/components/POS.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Check imports and add Battery
if (!data.includes('Battery,')) {
  data = data.replace(
    /import {\n/,
    `import {\n  Battery,\n`
  );
}

// 2. Add batteryPercentage to the reset state
if (!data.includes('batteryPercentage: "",')) {
  data = data.replace(
    /model: '',\s+capacity: '64GB',/g,
    `model: '',\n          batteryPercentage: '',\n          capacity: '64GB',`
  );
}

// Ensure the first replace hit everything just in case
data = data.replace(
    /model: '',\s+capacity: '64GB',/g,
    `model: '',\n        batteryPercentage: '',\n        capacity: '64GB',`
);


fs.writeFileSync(file, data);
console.log("Done");
