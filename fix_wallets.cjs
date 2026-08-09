const fs = require('fs');

function updateFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    let original = content;
    for (const rep of replacements) {
        content = content.replace(rep.find, rep.replace);
    }
    if (content !== original) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Updated', path);
    }
}

updateFile('src/components/Installments/CreateInstallment.tsx', [
    { find: /select=id,name/g, replace: 'select=id,name,branches(name)' },
    { find: /<option key={w.id} value={w.id}>{w.name}<\/option>/g, replace: '<option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>' }
]);

updateFile('src/components/Installments/InstallmentDetailsModal.tsx', [
    { find: /select=\*&order=name\.asc/g, replace: 'select=*,branches(name)&order=name.asc' },
    { find: /<option key={w.id} value={w.id}>{w.name}<\/option>/g, replace: '<option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>' }
]);

updateFile('src/components/Installments/BulkPaymentModal.tsx', [
    { find: /rest\/v1\/wallets\?select=\*/g, replace: 'rest/v1/wallets?select=*,branches(name)' },
    { find: /<option key={w.id} value={w.id}>{w.name}<\/option>/g, replace: '<option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>' }
]);
