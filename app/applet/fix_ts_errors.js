const fs = require('fs');

// Fix AddMultipleDevicesModal
const amdmFile = 'src/components/AddMultipleDevicesModal.tsx';
let amdmData = fs.readFileSync(amdmFile, 'utf8');

// The issue is in addNewDevice
amdmData = amdmData.replace(
  /color: 'أسود', barcode: '' }\]\)/,
  `color: 'أسود', barcode: '', battery_percentage: '' }])`
);

fs.writeFileSync(amdmFile, amdmData);

// Fix EditDeviceModal
const edmFile = 'src/components/EditDeviceModal.tsx';
let edmData = fs.readFileSync(edmFile, 'utf8');

if (!edmData.includes('battery_percentage: \'\'')) {
  edmData = edmData.replace(
    /cost_price: '',/,
    `cost_price: '',\n    battery_percentage: '',`
  );
  edmData = edmData.replace(
    /cost_price: device.cost_price/,
    `battery_percentage: device.battery_percentage || '',\n        cost_price: device.cost_price`
  );
}

// wait, replacing cost_price: 0 in the previous script?
// Let's make sure `battery_percentage: ''` is in formData
if (!edmData.includes('battery_percentage: \'\'')) {
    edmData = edmData.replace(
      /notes: ''\n  }\);/,
      `notes: '',\n    battery_percentage: ''\n  });`
    );
}

fs.writeFileSync(edmFile, edmData);
