import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

walk('./src').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/&user_id=eq\.\$\{userId\}/g, '');
  content = content.replace(/\?user_id=eq\.\$\{userId\}&/g, '?');
  content = content.replace(/\?user_id=eq\.\$\{userId\}/g, '');
  
  content = content.replace(/&user_id=eq\.' \+ userId \+ '/g, '');
  content = content.replace(/\?user_id=eq\.' \+ userId \+ '&/g, '?');
  content = content.replace(/\?user_id=eq\.' \+ userId/g, '');
  
  fs.writeFileSync(file, content);
});
console.log('Replaced all user_id references in API calls!');
