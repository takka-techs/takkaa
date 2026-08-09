const fs = require('fs');
const filePath = './src/components/DailyReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace backgrounds
content = content.replace(/bg-\[#080c13\]\/50/g, 'bg-slate-50 dark:bg-[#080c13]/50');
content = content.replace(/bg-\[#080c13\]/g, 'bg-slate-50 dark:bg-[#080c13]');
content = content.replace(/bg-\[#11151c\]/g, 'bg-white dark:bg-[#11151c]');
content = content.replace(/bg-\[#161b22\]/g, 'bg-slate-50 dark:bg-[#161b22]');

// Buttons
content = content.replace(/bg-slate-800/g, 'bg-slate-100 dark:bg-slate-800');
content = content.replace(/hover:bg-slate-700/g, 'hover:bg-slate-200 dark:hover:bg-slate-700');
content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-200 dark:hover:bg-slate-800');
content = content.replace(/hover:bg-white\/\[0\.02\]/g, 'hover:bg-slate-50 dark:hover:bg-white/[0.02]');

// Borders
content = content.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');

// Texts
content = content.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300');
content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-500');

fs.writeFileSync(filePath, content);
console.log('Fixed styles.');
