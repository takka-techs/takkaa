const fs = require('fs');
let data = fs.readFileSync('src/components/AddDeviceModal.tsx', 'utf8');

data = data.replace(
    /battery_percentage: formData.company === 'Apple' && formData.battery_percentage \? Number\(formData.battery_percentage\) : null,/g,
    'battery_percentage: formData.battery_percentage ? Number(formData.battery_percentage) : null,'
);

data = data.replace(/\{\(formData.company === 'Apple' \|\| formData.company === 'apple'\) && \(\s*(<div className="space-y-2">\s*<label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">\s*<Battery className="w-4 h-4 text-emerald-400" \/> نسبة البطارية\s*<\/label>\s*<input \s*type="number" name="battery_percentage" value=\{formData.battery_percentage\} onChange=\{handleChange\} min="0" max="100"\s*placeholder="نسبة البطارية \(%\)"\s*className="w-full bg-slate-50 dark:bg-\[\#080c13\] border border-slate-200 dark:border-white\/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"\s*\/>\s*<\/div>\s*)\}/g, '$1');

fs.writeFileSync('src/components/AddDeviceModal.tsx', data);
console.log("Done AddDeviceModal");
