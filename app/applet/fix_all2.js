const fs = require('fs');

const devFile = 'src/components/Devices.tsx';
let devData = fs.readFileSync(devFile, 'utf8');

const modelTag = `{device.model || 'غير محدد'}`;
if (!devData.includes('battery_percentage ? (') && devData.includes(modelTag)) {
  const insertIndex = devData.indexOf(modelTag);
  if (insertIndex !== -1) {
    const batteryDiv = `
                        {(device.company === 'Apple' || device.company === 'apple') && device.battery_percentage ? (
                          <div className="mt-1">
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30">
                              % {device.battery_percentage}
                            </span>
                          </div>
                        ) : null}`;
    
    // Insert after modelTag
    const endIndex = insertIndex + modelTag.length;
    devData = devData.slice(0, endIndex) + batteryDiv + devData.slice(endIndex);
  }
}

fs.writeFileSync(devFile, devData);
console.log("Done");
