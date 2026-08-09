const fs = require('fs');

const file = 'src/components/EditDeviceModal.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add Battery import
if (!data.includes('Battery')) {
  data = data.replace(
    /\} from 'lucide-react';/,
    `, Battery } from 'lucide-react';`
  );
}

// 2. Add battery_percentage to formData
if (!data.includes('battery_percentage:')) {
  data = data.replace(
    /cost_price: 0,/,
    `cost_price: 0,\n    battery_percentage: '',`
  );
  data = data.replace(
    /cost_price: device.cost_price.*,/,
    `$& \n        battery_percentage: device.battery_percentage || '',`
  );
}

// 3. Add battery_percentage to payload
if (!data.includes('battery_percentage:')) {
  data = data.replace(
    /cost_price: Number\(formData.cost_price\)/,
    `battery_percentage: (formData.company === 'Apple' || formData.company === 'apple') && formData.battery_percentage ? Number(formData.battery_percentage) : null,\n        cost_price: Number(formData.cost_price)`
  );
}

const inputField = `
              {(formData.company === 'Apple' || formData.company === 'apple') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Battery className="w-3.5 h-3.5 text-blue-400" /> نسبة البطارية
                  </label>
                  <input 
                    type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}`;

if (!data.includes('value={formData.battery_percentage}')) {
  const referenceText = '<option value="مستعمل">مستعمل</option>';
  const insertIndex = data.indexOf(referenceText);
  if (insertIndex !== -1) {
    const endSelect = data.indexOf('</select>', insertIndex);
    const endDiv = data.indexOf('</div>', endSelect);
    if (endDiv !== -1) {
      data = data.slice(0, endDiv + 6) + inputField + data.slice(endDiv + 6);
    }
  }
}

fs.writeFileSync(file, data);
