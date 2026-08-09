const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-\[\#080c13\]/g, replacement: 'bg-slate-50 dark:bg-[#080c13]' },
  { regex: /bg-\[\#11151c\]/g, replacement: 'bg-white dark:bg-[#11151c]' },
  { regex: /text-white/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-300/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /border-white\/5/g, replacement: 'border-slate-200 dark:border-white/5' },
  { regex: /border-white\/10/g, replacement: 'border-slate-200 dark:border-white/10' },
  { regex: /bg-white\/5/g, replacement: 'bg-slate-100 dark:bg-white/5' },
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-slate-50 dark:bg-white/[0.02]' },
  { regex: /bg-white\/\[0\.04\]/g, replacement: 'bg-slate-100 dark:bg-white/[0.04]' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-slate-100 dark:hover:bg-white/5' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-slate-200 dark:hover:bg-white/10' },
  { regex: /hover:text-white/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir('./src');
console.log('Done');
