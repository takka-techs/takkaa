import fs from 'fs';
import path from 'path';

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (content.includes('const branchSuffix = _activeBranchId ? `&branch_id=eq.${_activeBranchId}`')) {
    content = content.replace(/const branchSuffix = _activeBranchId \? `&branch_id=eq\.\$\{_activeBranchId\}` : \(_tenantId \? `&tenant_id=eq\.\$\{_tenantId\}` : ""\);/g, 'const branchSuffix = (_activeBranchId && _activeBranchId !== \'ALL\') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");');
    changed = true;
  }
  
  if (content.includes('const branchSuffixFirst = _activeBranchId ? `?branch_id=eq.${_activeBranchId}`')) {
     content = content.replace(/const branchSuffixFirst = _activeBranchId \? `\?branch_id=eq\.\$\{_activeBranchId\}` : \(_tenantId \? `\?tenant_id=eq\.\$\{_tenantId\}` : ""\);/g, 'const branchSuffixFirst = (_activeBranchId && _activeBranchId !== \'ALL\') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");');
     changed = true;
  }

  // Treasury has branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;
  if (content.includes('branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;') && !content.includes('!== \'ALL\'')) {
     content = content.replace(/if \(activeBranchId\) \{\n\s*branchOrTenantQuery = `&branch_id=eq\.\$\{activeBranchId\}`;/g, 'if (activeBranchId && activeBranchId !== \'ALL\') {\n        branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;');
     changed = true;
  }
  
  // DashboardHome has similar
  if (content.includes('branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;') && !content.includes('!== \'ALL\'')) {
     content = content.replace(/if \(activeBranchId\) \{\n\s*branchOrTenantQuery = `&branch_id=eq\.\$\{activeBranchId\}`;/g, 'if (activeBranchId && activeBranchId !== \'ALL\') {\n          branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;');
     changed = true;
  }

  // Maintenance branchQuery
  if (content.includes('const branchQuery = activeBranchId ? `&branch_id=eq.${activeBranchId}` : \'\';') && !content.includes('!== \'ALL\'')) {
     content = content.replace(/const branchQuery = activeBranchId \? `&branch_id=eq\.\$\{activeBranchId\}` : '';/g, 'const branchQuery = (activeBranchId && activeBranchId !== \'ALL\') ? `&branch_id=eq.${activeBranchId}` : \'\';');
     changed = true;
  }
  
  if (content.includes('const branchQuery = targetBranchId ? `&branch_id=eq.${targetBranchId}` : \'\';') && !content.includes('!== \'ALL\'')) {
     content = content.replace(/const branchQuery = targetBranchId \? `&branch_id=eq\.\$\{targetBranchId\}` : '';/g, 'const branchQuery = (targetBranchId && targetBranchId !== \'ALL\') ? `&branch_id=eq.${targetBranchId}` : \'\';');
     changed = true;
  }

  // Maintenance targetBranchId
  if (content.includes('repairBranchId || activeBranchId;') || content.includes('localStorage.getItem(\'takka_active_branch_id\') || null')) {
    content = content.replace(/branch_id: localStorage.getItem\('takka_active_branch_id'\) \|\| null/g, 'branch_id: localStorage.getItem(\'takka_active_branch_id\') === \'ALL\' ? null : (localStorage.getItem(\'takka_active_branch_id\') || null)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
