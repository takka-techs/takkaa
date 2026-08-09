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

updateFile('src/components/POS.tsx', [
    { find: /<option key={w.id} value={w.id.toString\(\)}>{w.name}<\/option>/g, replace: '<option key={w.id} value={w.id.toString()}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>' },
    { find: /<option key={w.id} value={w.id}>{w.name}<\/option>/g, replace: '<option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>' }
]);
