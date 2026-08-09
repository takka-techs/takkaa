const fs = require('fs');
let data = fs.readFileSync('src/components/POS.tsx', 'utf8');

data = data.replace(
  /Battery, createPortal } from 'react-dom';/,
  `createPortal } from 'react-dom';`
);

if (!data.includes('Battery,')) {
    data = data.replace(
      /RefreshCw, Upload, Download, List, Store,/,
      `RefreshCw, Upload, Download, List, Store, Battery,`
    );
}

fs.writeFileSync('src/components/POS.tsx', data);
console.log("Done");
