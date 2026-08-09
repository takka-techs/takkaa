const fs = require('fs');

const file = 'src/components/Devices.tsx';
let data = fs.readFileSync(file, 'utf8');

if (!data.includes('battery_percentage?: number;')) {
  data = data.replace(
    /cost_price: number;/,
    `cost_price: number;\n  battery_percentage?: number;`
  );
}

if (!data.includes('نسبة البطارية') && data.includes('<td className="px-5 py-4">')) {
  // Let's find where company and model is printed.
  // <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
  // {device.company} <span className="text-blue-500">{device.model}</span>
  
  const spanText = `<span className="text-blue-500 dark:text-blue-400">{device.model}</span>`;
  const insertIndex = data.indexOf(spanText);
  if (insertIndex !== -1) {
    const endDiv = data.indexOf('</div>', insertIndex);
    if (endDiv !== -1) {
      const batteryDiv = `
                                  {(device.company === 'Apple' || device.company === 'apple') && device.battery_percentage && (
                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-medium border border-emerald-200 dark:border-emerald-500/30">
                                      {device.battery_percentage}%
                                    </span>
                                  )}
      `;
      data = data.slice(0, endDiv) + batteryDiv + data.slice(endDiv);
    }
  }
}

fs.writeFileSync(file, data);
