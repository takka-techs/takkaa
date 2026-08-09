const fs = require('fs');

{
  const file = 'src/components/AddMultipleDevicesModal.tsx';
  let data = fs.readFileSync(file, 'utf8');
  
  data = data.replace(
    /\{ id: Date.now\(\), imei1: '', imei2: '', color: globalColor, barcode: '' \}/,
    `{ id: Date.now(), imei1: '', imei2: '', color: globalColor, barcode: '', battery_percentage: '' }`
  );
  
  fs.writeFileSync(file, data);
}

{
  const file = 'src/components/EditDeviceModal.tsx';
  let data = fs.readFileSync(file, 'utf8');
  
  // duplicate line replacement
  data = data.replace(/battery_percentage: device.battery_percentage \|\| '',\n        cost_price: device.cost_price\?\.toString\(\) \|\| '', \n        battery_percentage: device.battery_percentage \|\| '',/,
  `battery_percentage: device.battery_percentage || '',\n        cost_price: device.cost_price?.toString() || '', `);
  
  fs.writeFileSync(file, data);
}
