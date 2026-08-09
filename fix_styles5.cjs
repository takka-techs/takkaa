const fs = require('fs');
const filePath = './src/components/DailyReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-white\/5(?!0)/g, 'bg-slate-100 dark:bg-white/5');

// text-white print:text-slate-800 ?
// Some status tags had `text-slate-300 print:text-slate-800` that became `text-slate-700 dark:text-slate-300 print:text-slate-800`
// which is perfectly fine.

// What about `bg-[#080c13]` in status tags?
// Check for exactly `bg-[#080c13]` inside td
content = content.replace(/bg-slate-50 dark:bg-\[#080c13\]/g, 'bg-slate-100 dark:bg-[#080c13]');

fs.writeFileSync(filePath, content);
console.log('Fixed empty states.');
