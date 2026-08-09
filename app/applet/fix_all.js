const fs = require('fs');

// 1. Fix AddDeviceModal.tsx
const admFile = 'src/components/AddDeviceModal.tsx';
let admData = fs.readFileSync(admFile, 'utf8');
admData = admData.replace('</div>\\n', '</div>');
fs.writeFileSync(admFile, admData);

// 2. Fix ViewDeviceModal.tsx
const vdmFile = 'src/components/ViewDeviceModal.tsx';
let vdmData = fs.readFileSync(vdmFile, 'utf8');

if (!vdmData.includes('battery_percentage?: number;')) {
  vdmData = vdmData.replace(
    /cost_price: number;/,
    `cost_price: number;\n  battery_percentage?: number;`
  );
}

vdmData = vdmData.replace(
  /<span className="text-sm font-bold text-emerald-400">100%<\/span>/,
  `{device.battery_percentage ? <span className="text-sm font-bold text-emerald-400">{device.battery_percentage}%</span> : <span className="text-sm font-bold text-slate-500 dark:text-slate-400">-</span>}`
);
if (!vdmData.includes(`device.company === 'Apple'`)) {
  const targetHTML = `<div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">صحة البطارية:</span>`;
  const replaceHTML = `{(device.company === 'Apple' || device.company === 'apple') && (
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">صحة البطارية:</span>`;
  const targetHTML2 = `</div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة:</span>`;
  const replaceHTML2 = `</div>
              )}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة:</span>`;
  vdmData = vdmData.replace(targetHTML, replaceHTML);
  vdmData = vdmData.replace(targetHTML2, replaceHTML2);
}

fs.writeFileSync(vdmFile, vdmData);

// 3. Fix Devices.tsx
const devFile = 'src/components/Devices.tsx';
let devData = fs.readFileSync(devFile, 'utf8');

if (!devData.includes('battery_percentage?: number;')) {
  devData = devData.replace(
    /cost_price: number;/,
    `cost_price: number;\n  battery_percentage?: number;`
  );
}

if (!devData.includes('{device.battery_percentage}%') && devData.includes('<span className="text-blue-500 dark:text-blue-400">{device.model}</span>')) {
  const spanText = `<span className="text-blue-500 dark:text-blue-400">{device.model}</span>`;
  const insertIndex = devData.indexOf(spanText);
  if (insertIndex !== -1) {
    const endDiv = devData.indexOf('</div>', insertIndex);
    if (endDiv !== -1) {
      const batteryDiv = `
                                  {(device.company === 'Apple' || device.company === 'apple') && device.battery_percentage ? (
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30">
                                      {device.battery_percentage}%
                                    </span>
                                  ) : null}
      `;
      devData = devData.slice(0, endDiv) + batteryDiv + devData.slice(endDiv);
    }
  }
}

fs.writeFileSync(devFile, devData);

console.log("Done");
