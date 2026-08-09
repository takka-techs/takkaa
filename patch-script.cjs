const fs = require('fs');

let c = fs.readFileSync('src/components/POS.tsx', 'utf8');
c = c.replace(/executePrintReceipt = useReactToPrint\(\{[\s\S]*?pageStyle:\s*'',/g, "executePrintReceipt = useReactToPrint({\n    contentRef: receiptPrintRef,\n    documentTitle: 'Receipt',\n    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,");

c = c.replace(/executePrintBarcode = useReactToPrint\(\{[\s\S]*?pageStyle:\s*'',/g, "executePrintBarcode = useReactToPrint({\n    contentRef: barcodePrintRef,\n    documentTitle: 'Barcode',\n    pageStyle: `@page { size: ${barcodeWidth} ${barcodeHeight}; margin: 0; } @media print { body { margin: 0; } }`,");

fs.writeFileSync('src/components/POS.tsx', c);

let m = fs.readFileSync('src/components/Maintenance.tsx', 'utf8');
m = m.replace(/executePrintReceipt = useReactToPrint\(\{[\s\S]*?pageStyle:\s*'',/g, "executePrintReceipt = useReactToPrint({\n    contentRef: receiptPrintRef,\n    documentTitle: 'Receipt',\n    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,");

m = m.replace(/executePrintInvoice = useReactToPrint\(\{[\s\S]*?pageStyle:\s*'',/g, "executePrintInvoice = useReactToPrint({\n    contentRef: invoicePrintRef,\n    documentTitle: 'Invoice',\n    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,");

m = m.replace(/executePrintBarcode = useReactToPrint\(\{[\s\S]*?pageStyle:\s*'',/g, "executePrintBarcode = useReactToPrint({\n    contentRef: barcodePrintRef,\n    documentTitle: 'Barcode',\n    pageStyle: `@page { size: ${settings?.barcodeWidth || '50mm'} ${settings?.barcodeHeight || '30mm'}; margin: 0; } @media print { body { margin: 0; } }`,");

fs.writeFileSync('src/components/Maintenance.tsx', m);
