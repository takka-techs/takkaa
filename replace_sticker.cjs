const fs = require('fs');

// 1. Update Settings.tsx
let settingsContent = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const regex1 = /maintenance_receipt_template: settingsData\.maintenanceReceiptTemplate,/;
settingsContent = settingsContent.replace(regex1, `maintenance_receipt_template: settingsData.maintenanceReceiptTemplate,\n          maintenance_sticker_template: settingsData.maintenanceStickerTemplate,`);

const regex2 = /<\/select>\s*<\/div>\s*<\/div>\s*<div className="space-y-2">/;
settingsContent = settingsContent.replace(regex2, `</select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-100 dark:border-[#2d3748]">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">قالب طباعة الباركود/الاستيكر</label>
                        <select 
                          value={settingsData.maintenanceStickerTemplate || 'default'}
                          onChange={(e) => handleChange('maintenanceStickerTemplate', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="default">الافتراضي (بسيط)</option>
                          <option value="first">الشكل الأول (نص متجاوب)</option>
                          <option value="seconde">الشكل الثاني (تقسيم 58/42)</option>
                          <option value="third">الشكل الثالث (محاذاة وأيقونات)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">`);

fs.writeFileSync('src/components/Settings.tsx', settingsContent);

// 2. Update Maintenance.tsx
let maintContent = fs.readFileSync('src/components/Maintenance.tsx', 'utf8');

// Add imports if not present
if (!maintContent.includes('PrintMaintenanceStickerfirst')) {
  maintContent = maintContent.replace(
    /import { PrintMaintenanceSticker } from '\.\/PrintMaintenanceSticker';/,
    `import { PrintMaintenanceSticker } from './PrintMaintenanceSticker';\nimport { PrintMaintenanceSticker as PrintMaintenanceStickerFirst } from './PrintMaintenanceStickerfirst';\nimport { PrintMaintenanceSticker as PrintMaintenanceStickerSecond } from './PrintMaintenanceStickerseconde';\nimport { PrintMaintenanceSticker as PrintMaintenanceStickerThird } from './PrintMaintenanceStickerthird';`
  );
}

const targetSticker1 = /<\s*PrintMaintenanceSticker\s+ref=\{stickerPrintRef\}\s+repair=\{repair\}\s*\/>/g;
const repSticker1 = `{settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={stickerPrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={stickerPrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={stickerPrintRef} repair={repair} />
            ) : (
              <PrintMaintenanceSticker ref={stickerPrintRef} repair={repair} />
            )}`;
maintContent = maintContent.replace(targetSticker1, repSticker1);

const targetSticker2 = /<\s*PrintMaintenanceSticker\s+ref=\{stickerPrintRef\}\s+repair=\{successData\}\s*\/>/g;
const repSticker2 = `{settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={stickerPrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={stickerPrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={stickerPrintRef} repair={successData} />
            ) : (
              <PrintMaintenanceSticker ref={stickerPrintRef} repair={successData} />
            )}`;
maintContent = maintContent.replace(targetSticker2, repSticker2);

fs.writeFileSync('src/components/Maintenance.tsx', maintContent);

console.log('done updating settings and maintenance');
