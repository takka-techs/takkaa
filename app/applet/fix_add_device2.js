const fs = require('fs');

const file = 'src/components/AddDeviceModal.tsx';
let data = fs.readFileSync(file, 'utf8');

const inputField = `
              {(formData.company === 'Apple' || formData.company === 'apple') && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Battery className="w-4 h-4 text-emerald-400" /> نسبة البطارية
                  </label>
                  <input 
                    type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"
                    placeholder="نسبة البطارية (%)"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              )}`;

if (!data.includes('value={formData.battery_percentage}')) {
  const insertIndex = data.indexOf('<option value="مستعمل">مستعمل</option>');
  if (insertIndex !== -1) {
    const endSelect = data.indexOf('</select>', insertIndex);
    if (endSelect !== -1) {
      const endDiv = data.indexOf('</div>', endSelect);
      if (endDiv !== -1) {
        data = data.slice(0, endDiv + 6) + '\\n' + inputField + data.slice(endDiv + 6);
      }
    }
  }
}

fs.writeFileSync(file, data);
