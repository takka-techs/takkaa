import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walkDir('src/components');

files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const oldStr = "warehouse_id: warehouseId || null,";
    const newStr = "warehouse_id: (!warehouseId || warehouseId === 'ALL' || warehouseId === 'NONE') ? null : warehouseId,";
    if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
