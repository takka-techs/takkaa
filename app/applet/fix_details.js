const fs = require('fs');

const file = 'src/components/DeviceDetailsModal.tsx';
let data = fs.readFileSync(file, 'utf8');

if (!data.includes('battery_percentage?: number;')) {
  data = data.replace(
    /cost_price: number;/,
    `cost_price: number;\n  battery_percentage?: number;`
  );
}

if (!data.includes('Battery')) {
  data = data.replace(
    /Smartphone,/,
    `Smartphone, Battery,`
  );
}

const batteryInfo = `
                        {(device.company === 'Apple' || device.company === 'apple') && device.battery_percentage && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-500/20">
                            <Battery className="w-4 h-4" /> نسبة البطارية: %{device.battery_percentage}
                          </div>
                        )}`;

if (!data.includes('نسبة البطارية')) {
  const insertIndex = data.indexOf('<div className="flex flex-wrap gap-3">');
  if (insertIndex !== -1) {
    const endDiv = data.indexOf('</div>', insertIndex);
    if (endDiv !== -1) {
      data = data.slice(0, insertIndex + 38) + batteryInfo + data.slice(insertIndex + 38);
    }
  }
}

fs.writeFileSync(file, data);
