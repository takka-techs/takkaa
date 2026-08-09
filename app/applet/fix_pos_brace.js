const fs = require('fs');
let data = fs.readFileSync('src/components/POS.tsx', 'utf8');

data = data.replace(/<input \s*type="number" min="0" max="100"\s*value=\{purchaseData\.batteryPercentage\}\s*onChange=\{\(e\) => setPurchaseData\(\{\.\.\.purchaseData, batteryPercentage: e\.target\.value\}\)\}\s*className="w-full bg-white dark:bg-\[\#080c13\] border border-slate-200 dark:border-white\/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500\/50 transition-all font-mono"\s*placeholder="نسبة البطارية \(%\)"\s*\/>\s*<\/div>\s*\)\}/g, '<input \n                          type="number" min="0" max="100"\n                          value={purchaseData.batteryPercentage}\n                          onChange={(e) => setPurchaseData({...purchaseData, batteryPercentage: e.target.value})}\n                          className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"\n                          placeholder="نسبة البطارية (%)"\n                        />\n                      </div>');

fs.writeFileSync('src/components/POS.tsx', data);
console.log("Done POS");
