const fs = require('fs');
let data = fs.readFileSync('src/components/POS.tsx', 'utf8');

data = data.replace(
    /battery_percentage: \['apple', 'iphone'\].some\(kw => purchaseData.model.toLowerCase\(\)\.includes\(kw\)\) && purchaseData\.batteryPercentage \? Number\(purchaseData\.batteryPercentage\) : null,/g,
    'battery_percentage: purchaseData.batteryPercentage ? Number(purchaseData.batteryPercentage) : null,'
);

data = data.replace(/\{\['apple', 'iphone'\].some\(kw => purchaseData.model.toLowerCase\(\).includes\(kw\)\) && \(\s*(<div className="space-y-2">\s*<label className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center gap-1">\s*<Battery className="w-3 h-3 text-emerald-400" \/> نسبة البطارية\s*<\/label>\s*<input \s*type="number" min="0" max="100"\s*value=\{purchaseData\.batteryPercentage\}\s*onChange=\{\(e\) => setPurchaseData\(\{\.\.\.purchaseData, batteryPercentage: e\.target\.value\}\)\}\s*className="w-full bg-white dark:bg-\[\#080c13\] border border-slate-200 dark:border-white\/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500\/50 transition-all font-mono"\s*placeholder="نسبة البطارية \(%\)"\s*\/>\s*<\/div>\s*)\}/g, '$1');

fs.writeFileSync('src/components/POS.tsx', data);
console.log("Done POS");
