const fs = require('fs');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[1.1em] h-[1.1em]">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>`;

// 1. PrintMaintenanceReceipt.tsx
let f1 = fs.readFileSync('src/components/PrintMaintenanceReceipt.tsx', 'utf8');
const r1 = /<div className="leading-none opacity-90 text-\[10px\] lowercase tracking-normal">takka\.fun<\/div>/;
const rep1 = `<div className="flex items-center justify-center gap-1 opacity-90 text-[10px] lowercase tracking-normal mt-1">
          ${svgIcon}
          <span>takka.fun</span>
        </div>`;
f1 = f1.replace(r1, rep1);
fs.writeFileSync('src/components/PrintMaintenanceReceipt.tsx', f1);


// 2. PrintMaintenanceReceiptDetailed.tsx
let f2 = fs.readFileSync('src/components/PrintMaintenanceReceiptDetailed.tsx', 'utf8');
const r2 = /<div className="leading-none opacity-90 text-\[1em\] lowercase tracking-normal">takka\.fun<\/div>/;
const rep2 = `<div className="flex items-center justify-center gap-1 opacity-90 text-[1.1em] lowercase tracking-normal mt-1">
          ${svgIcon}
          <span>takka.fun</span>
        </div>`;
f2 = f2.replace(r2, rep2);
fs.writeFileSync('src/components/PrintMaintenanceReceiptDetailed.tsx', f2);


// 3. PrintMaintenanceReceiptSecondDetailed.tsx
let f3 = fs.readFileSync('src/components/PrintMaintenanceReceiptSecondDetailed.tsx', 'utf8');
const r3 = /<div className="leading-none opacity-90 text-\[1em\] lowercase tracking-normal">takka\.fun<\/div>/;
const rep3 = `<div className="flex items-center justify-center gap-1 opacity-90 text-[1.1em] lowercase tracking-normal mt-1">
          ${svgIcon}
          <span>takka.fun</span>
        </div>`;
f3 = f3.replace(r3, rep3);
fs.writeFileSync('src/components/PrintMaintenanceReceiptSecondDetailed.tsx', f3);

console.log('done replacing footers');
