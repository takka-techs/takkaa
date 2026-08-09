const fs = require('fs');
const filePath = './src/components/DailyReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix text-white inside the stat boxes (so it's visible on white bg in light mode)
content = content.replace(/text-white print:text-black/g, 'text-slate-900 dark:text-white print:text-black');

// Also look out for `divide-white/5`
content = content.replace(/divide-white\/5/g, 'divide-slate-200 dark:divide-white/5');

// text-slate-300 print:bg-slate-100
content = content.replace(/text-slate-300 print:text-slate-800/g, 'text-slate-700 dark:text-slate-300 print:text-slate-800');

// the "DollarsSign" typo in DailyReport on line 474:
content = content.replace(/<DollarsSign/g, '<DollarSign');

// In case we missed any other bg-slate-50s
content = content.replace(/bg-white dark:bg-\[#11151c\] print:bg-white/g, 'bg-white dark:bg-[#11151c] print:bg-white'); // leave it, it's fine

// The search input has `bg-slate-50 dark:bg-[#161b22]` - check text-slate-200
content = content.replace(/text-slate-800 dark:text-slate-200/g, 'text-slate-800 dark:text-slate-200');

fs.writeFileSync(filePath, content);
console.log('Fixed additional styles and typo.');
