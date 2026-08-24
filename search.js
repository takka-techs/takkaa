const fs = require('fs'); const lines = fs.readFileSync('d:/TAKKA FINEL/src/components/POS.tsx', 'utf8').split('\n'); lines.forEach((line, i) => { if (line.includes('????') || line.includes('????') || line.includes('??????') || line.toLowerCase().includes('device')) console.log((i+1) + ': ' + line.trim()); })

    