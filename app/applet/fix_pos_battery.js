const fs = require('fs');
let data = fs.readFileSync('src/components/POS.tsx', 'utf8');

data = data.replace(
    /battery_percentage: \['apple', 'iphone'\].some\(kw => purchaseData.model.toLowerCase\(\).includes\(kw\)\) && purchaseData.batteryPercentage \? Number\(purchaseData.batteryPercentage\) : null,/,
    'battery_percentage: purchaseData.batteryPercentage ? Number(purchaseData.batteryPercentage) : null,'
);

data = data.replace(/\{\['apple', 'iphone'\].some\(kw => purchaseData\.model\.toLowerCase\(\)\.includes\(kw\)\) && \(\s*<div className="space-y-2">/, '<div className="space-y-2">');

data = data.replace(/placeholder="نسبة البطارية \(%\)"\s*\/>\s*<\/div>\s*\)\}/, 'placeholder="نسبة البطارية (%)"\n                        />\n                      </div>');

fs.writeFileSync('src/components/POS.tsx', data);
console.log("Done POS");
