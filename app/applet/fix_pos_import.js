const fs = require('fs');

const file = 'src/components/POS.tsx';
let data = fs.readFileSync(file, 'utf8');

if (!data.includes('Battery')) {
  data = data.replace(
    /RefreshCw, Upload, Download, List, Store,/,
    `RefreshCw, Upload, Download, List, Store, Battery,`
  );
  fs.writeFileSync(file, data);
}

console.log("Done");
