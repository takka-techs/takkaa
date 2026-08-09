const fs = require('fs');

const files = [
  'src/components/AccessoryDetailsModal.tsx',
  'src/components/ComprehensiveReportModal.tsx',
  'src/components/DailyReportModal.tsx',
  'src/components/DeviceDetailsModal.tsx',
  'src/components/MoneyTransfersReportModal.tsx',
  'src/components/MonthlyReportModal.tsx',
  'src/components/PeriodComparisonModal.tsx',
  'src/components/ShiftClosuresReportModal.tsx'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf-8');
  
  // Replace import
  content = content.replace(/import html2canvas from 'html2canvas';/g, "import { toPng } from 'html-to-image';");
  
  // Replace AccessoryDetailsModal / DeviceDetailsModal (await)
  content = content.replace(/const canvas = await html2canvas\(element,\s*\{[\s\S]*?\}\);/g, `
    const dataUrl = await toPng(element, { pixelRatio: 2 });
  `);
  content = content.replace(/const imgData = canvas\.toDataURL\('image\/png'\);/g, `const imgData = dataUrl;`);
  content = content.replace(/const pdfHeight = \(canvas\.height \* pdfWidth\) \/ canvas\.width;/g, `const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;`);
  
  // Replace promise style
  content = content.replace(/html2canvas\(input,\s*\{\s*scale:\s*2\s*\}\)\.then\(\(canvas\)\s*=>|html2canvas\(input,\s*\{\s*scale:\s*2\s*\}\)\.then\(canvas\s*=>/g, `toPng(input, { pixelRatio: 2 }).then(dataUrl =>`);
  
  content = content.replace(/const imgData = canvas\.toDataURL\((?:'|")image\/png(?:'|")\);/g, `const imgData = dataUrl;`);
  
  // Replace the canvas.height usage inside the promise
  content = content.replace(/const pdfHeight = \(canvas\.height \*\s*pdfWidth\) \/\s*canvas\.width;/g, `const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;`);

  fs.writeFileSync(f, content);
}
console.log('done');
