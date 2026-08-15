const fs = require('fs');
let content = fs.readFileSync('src/components/Maintenance.tsx', 'utf8');

const target1 = `            {settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed
                ref={receiptPrintRef}
                repair={repair}
              />
            ) : (
              <PrintMaintenanceReceipt
                ref={receiptPrintRef}
                repair={repair}
              />
            )}`;

const repl1 = `            {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
              <PrintMaintenanceReceiptSecondDetailed ref={receiptPrintRef} repair={repair} />
            ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed ref={receiptPrintRef} repair={repair} />
            ) : (
              <PrintMaintenanceReceipt ref={receiptPrintRef} repair={repair} />
            )}`;

content = content.replace(target1, repl1);

const target2 = `          {settings?.maintenanceReceiptTemplate === 'detailed' ? (
            <PrintMaintenanceReceiptDetailed
              ref={receiptPrintRef}
              repair={successData}
            />
          ) : (
            <PrintMaintenanceReceipt
              ref={receiptPrintRef}
              repair={successData}
            />
          )}`;

const repl2 = `          {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
            <PrintMaintenanceReceiptSecondDetailed ref={receiptPrintRef} repair={successData} />
          ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
            <PrintMaintenanceReceiptDetailed ref={receiptPrintRef} repair={successData} />
          ) : (
            <PrintMaintenanceReceipt ref={receiptPrintRef} repair={successData} />
          )}`;

content = content.replace(target2, repl2);

const target3 = `            {settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed
                ref={receiptPrintRef}
                repair={successData}
              />
            ) : (
              <PrintMaintenanceReceipt
                ref={receiptPrintRef}
                repair={successData}
              />
            )}`;

const repl3 = `            {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
              <PrintMaintenanceReceiptSecondDetailed ref={receiptPrintRef} repair={successData} />
            ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed ref={receiptPrintRef} repair={successData} />
            ) : (
              <PrintMaintenanceReceipt ref={receiptPrintRef} repair={successData} />
            )}`;

content = content.replace(target3, repl3);

fs.writeFileSync('src/components/Maintenance.tsx', content);
console.log('done replacing blocks');
