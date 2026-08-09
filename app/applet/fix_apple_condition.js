const fs = require('fs');

// 1. ViewDeviceModal.tsx
let vdmFile = 'src/components/ViewDeviceModal.tsx';
let vdmData = fs.readFileSync(vdmFile, 'utf8');
vdmData = vdmData.replace(/\{\(device\.company === 'Apple' \|\| device\.company === 'apple'\) && \(\s*<div className="flex justify-between items-center bg-slate-50/, '<div className="flex justify-between items-center bg-slate-50');
vdmData = vdmData.replace(/<\/div>\n              \)}\n                <div className="flex justify-between items-center bg-slate-50 dark:bg-\[\#080c13\] rounded-xl p-3 border border-slate-200 dark:border-white\/5">\n                  <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة/g, '</div>\n                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">\n                  <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة');
fs.writeFileSync(vdmFile, vdmData);

// 2. Devices.tsx
let devFile = 'src/components/Devices.tsx';
let devData = fs.readFileSync(devFile, 'utf8');
devData = devData.replace(/\{\(device\.company === 'Apple' \|\| device\.company === 'apple'\) && device\.battery_percentage \? \(/, '{device.battery_percentage ? (');
fs.writeFileSync(devFile, devData);

// 3. DeviceDetailsModal.tsx
let ddmFile = 'src/components/DeviceDetailsModal.tsx';
let ddmData = fs.readFileSync(ddmFile, 'utf8');
ddmData = ddmData.replace(/\{\(device\.company === 'Apple' \|\| device\.company === 'apple'\) && device\.battery_percentage && \(/, '{device.battery_percentage && (');
fs.writeFileSync(ddmFile, ddmData);

console.log("Done");
