const fs = require('fs');

const file = 'src/components/AddMultipleDevicesModal.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add Battery import
if (!data.includes('Battery')) {
  data = data.replace(
    /\} from 'lucide-react';/,
    `, Battery } from 'lucide-react';`
  );
}

// 2. Add battery_percentage to devicesList
if (!data.includes('battery_percentage:')) {
  data = data.replace(
    /\{ id: 1, imei1: '', imei2: '', color: 'أسود', barcode: '' \}/,
    `{ id: 1, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' }`
  );
  data = data.replace(
    /\{ id: 2, imei1: '', imei2: '', color: 'أسود', barcode: '' \}/,
    `{ id: 2, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' }`
  );
  data = data.replace(
    /\{ id: 3, imei1: '', imei2: '', color: 'أسود', barcode: '' \}/,
    `{ id: 3, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' }`
  );
}

// 3. Add battery_percentage to addNewDevice
if (!data.includes('battery_percentage: \'\'')) {
  data = data.replace(
    /color: 'أسود', barcode: '' \}/g,
    `color: 'أسود', barcode: '', battery_percentage: '' }`
  );
}

// 4. Add the input inside the map
const inputField = `
                    {(formData.company === 'Apple' || formData.company === 'apple') && (
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" /> البطارية (%)
                        </label>
                        <input 
                          type="number"
                          value={device.battery_percentage}
                          onChange={(e) => updateDevice(device.id, 'battery_percentage', e.target.value)}
                          placeholder="مثال: 95"
                          min="0" max="100"
                          className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    )}`;

if (!data.includes('value={device.battery_percentage}')) {
  // Find where device details are mapped. Probably near `updateDevice(device.id, 'color', e.target.value)`
  const colorInputIndex = data.indexOf(`updateDevice(device.id, 'color'`);
  if (colorInputIndex !== -1) {
    const endOfColorDiv = data.indexOf('</div>', colorInputIndex);
    if (endOfColorDiv !== -1) {
      data = data.slice(0, endOfColorDiv + 6) + '\\n' + inputField + data.slice(endOfColorDiv + 6);
    }
  }
}

// 5. Update the payload in handleSubmit
//          battery_percentage: (formData.company === 'Apple' || formData.company === 'apple') && d.battery_percentage ? Number(d.battery_percentage) : null,
if (!data.includes('battery_percentage: (formData.company')) {
  data = data.replace(
    /imei2: d.imei2 \|\| null,/,
    `imei2: d.imei2 || null,\n        battery_percentage: (formData.company === 'Apple' || formData.company === 'apple') && d.battery_percentage ? Number(d.battery_percentage) : null,`
  );
}

fs.writeFileSync(file, data);
