const fs = require('fs');
const files = [
    'src/components/AddDeviceModal.tsx',
    'src/components/AddAccessoryModal.tsx',
    'src/components/AddSparePartPurchaseModal.tsx',
    'src/components/Customers.tsx',
    'src/components/ComprehensiveReportModal.tsx',
    'src/components/TransfersReport.tsx',
    'src/components/CapitalReport.tsx',
    'src/components/CashflowReport.tsx'
];

function updateFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    let original = content;

    // Fix query
    content = content.replace(/wallets\?select=\*/g, 'wallets?select=*,branches(name)');
    content = content.replace(/wallets\?select=id,name/g, 'wallets?select=id,name,branches(name)');
    content = content.replace(/wallets\?select=id,name,type,balance/g, 'wallets?select=id,name,type,balance,branches(name)');
    content = content.replace(/wallets\?select=id, balance/g, 'wallets?select=id,balance,branches(name)');

    // Fix render
    content = content.replace(/<option([^>]*)>\{w\.name\}<\/option>/g, '<option$1>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>');
    content = content.replace(/<option([^>]*)>\{wallet\.name\}<\/option>/g, '<option$1>{wallet.name} {wallet.branches?.name ? ` - (${wallet.branches.name})` : ""}</option>');

    if (content !== original) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Updated', path);
    }
}

for (const file of files) {
    updateFile(file);
}
