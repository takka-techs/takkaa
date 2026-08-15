const fs = require('fs');
let maintContent = fs.readFileSync('src/components/Maintenance.tsx', 'utf8');

const regex1 = /<PrintMaintenanceSticker\s+ref=\{barcodePrintRef\}\s+repair=\{repair\}\s*\/>/g;
const rep1 = `{settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={barcodePrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={barcodePrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={barcodePrintRef} repair={repair} />
            ) : (
              <PrintMaintenanceSticker ref={barcodePrintRef} repair={repair} />
            )}`;

maintContent = maintContent.replace(regex1, rep1);

const regex2 = /<PrintMaintenanceSticker\s+ref=\{barcodePrintRef\}\s+repair=\{successData\}\s*\/>/g;
const rep2 = `{settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={barcodePrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={barcodePrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={barcodePrintRef} repair={successData} />
            ) : (
              <PrintMaintenanceSticker ref={barcodePrintRef} repair={successData} />
            )}`;

maintContent = maintContent.replace(regex2, rep2);

fs.writeFileSync('src/components/Maintenance.tsx', maintContent);
console.log('done updating maintenance.tsx properly');
