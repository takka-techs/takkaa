const fs = require('fs');
const filePath = './src/components/DailyReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicates
content = content.replace(/dark:text-slate-500 dark:text-slate-400/g, 'dark:text-slate-400');
content = content.replace(/text-slate-500 dark:text-slate-500/g, 'text-slate-500');
content = content.replace(/hover:bg-slate-100 dark:bg-slate-800/g, 'hover:bg-slate-200 dark:hover:bg-slate-800');
content = content.replace(/text-slate-500 dark:text-slate-400 dark:text-slate-400/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/dark:text-slate-500 group-focus-within/g, 'group-focus-within');

// Print mode fixes (we might have overridden print: stuff)
// E.g. print:border-black/10 might have been caught? No, it used border-white/5.

fs.writeFileSync(filePath, content);
console.log('Fixed duplicates.');
