const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf8');

const startIndex = code.indexOf('{/* Purchase Device Modal */}');
const endIndex = code.indexOf('{/* Right Column (in RTL): Product Selection. On Mobile, it stays on top. */}');

let before = code.substring(0, startIndex);
let modal = code.substring(startIndex, endIndex);
let after = code.substring(endIndex);

modal = modal.replace(/bg-\[#0a0c10\]/g, 'bg-white dark:bg-[#0a0c10]');
modal = modal.replace(/bg-slate-950\/90/g, 'bg-slate-900/20 dark:bg-slate-950/90');
modal = modal.replace(/bg-white\/2/g, 'bg-slate-50 dark:bg-white/5');
modal = modal.replace(/bg-\[#080c13\]/g, 'bg-white dark:bg-[#080c13]');
modal = modal.replace(/text-white/g, 'text-slate-900 dark:text-white');
modal = modal.replace(/text-slate-500 hover:text-white/g, 'text-slate-500 hover:text-slate-800 dark:hover:text-white');
modal = modal.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
modal = modal.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');
// Make sure "bg-white/5" is correctly replaced when it's just "bg-white/5"
modal = modal.replace(/bg-white\/5/g, 'bg-slate-100 dark:bg-white/5');
modal = modal.replace(/bg-white\/10/g, 'bg-slate-200 dark:bg-white/10');
modal = modal.replace(/shadow-\[0_0_100px_rgba\(16,185,129,0.1\)\]/g, 'shadow-2xl dark:shadow-[0_0_100px_rgba(16,185,129,0.1)]');
modal = modal.replace(/text-slate-950/g, 'text-emerald-950 dark:text-slate-950');

// Fix buttons text colour that got replaced incorrectly to text-slate-900 dark:text-white
modal = modal.replace(/bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white/g, 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950');

fs.writeFileSync('src/components/POS.tsx', before + modal + after);
