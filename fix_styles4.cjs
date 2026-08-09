const fs = require('fs');
const filePath = './src/components/DailyReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicates again
content = content.replace(/text-slate-700 dark:text-slate-700 dark:text-slate-300/g, 'text-slate-700 dark:text-slate-300');

// There's a `bg-slate-900/50 print:bg-slate-100` header in tables on line 557. Let's fix that for light mode!
// The original was probably `bg-[#11151c]/50` maybe? 
// Actually we should just apply `bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100`
content = content.replace(/bg-slate-900\/50 print:bg-slate-100/g, 'bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100');

fs.writeFileSync(filePath, content);
console.log('Fixed more styles.');
