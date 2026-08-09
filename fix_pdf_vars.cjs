const fs = require('fs');
const files = [
  'src/components/DailyReportModal.tsx',
  'src/components/MonthlyReportModal.tsx',
  'src/components/ComprehensiveReportModal.tsx',
  'src/components/MoneyTransfersReportModal.tsx',
  'src/components/PeriodComparisonModal.tsx',
  'src/components/ShiftClosuresReportModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/element.offsetHeight/g, 'input.offsetHeight');
  content = content.replace(/element.offsetWidth/g, 'input.offsetWidth');
  fs.writeFileSync(file, content);
}
console.log('Fixed PDF script sizes');
