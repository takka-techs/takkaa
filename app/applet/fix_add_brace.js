const fs = require('fs');
let data = fs.readFileSync('src/components/AddDeviceModal.tsx', 'utf8');

data = data.replace(/<input \s*type="number" name="battery_percentage" value=\{formData\.battery_percentage\} onChange=\{handleChange\} min="0" max="100"\s*placeholder="نسبة البطارية \(%\)"\s*className="w-full bg-slate-50 dark:bg-\[\#080c13\] border border-slate-200 dark:border-white\/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"\s*\/>\s*<\/div>\s*\)\}/g, '<input \n                    type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"\n                    placeholder="نسبة البطارية (%)"\n                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"\n                  />\n                </div>');

fs.writeFileSync('src/components/AddDeviceModal.tsx', data);
console.log("Done AddDeviceModal");
