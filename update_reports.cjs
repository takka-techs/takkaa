const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Report') && f.endsWith('.tsx'));

files.push('MonthlyReportModal.tsx', 'ComprehensiveReportModal.tsx', 'DailyReportModal.tsx', 'MoneyTransfersReportModal.tsx', 'ShiftClosuresReportModal.tsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  if (file === 'DashboardReport.tsx') continue;
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Insert the variables right after "const headers =" if not already there
  if (!content.includes('const branchSuffix = ')) {
    content = content.replace(
      /const headers = {/g,
      `const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = _activeBranchId ? \`&branch_id=eq.\${_activeBranchId}\` : (_tenantId ? \`&tenant_id=eq.\${_tenantId}\` : "");
      const branchSuffixFirst = _activeBranchId ? \`?branch_id=eq.\${_activeBranchId}\` : (_tenantId ? \`?tenant_id=eq.\${_tenantId}\` : "");
      const headers = {`
    );
  }

  // Replace fetch(\`\${SUPABASE_URL}...`) where we add \${branchSuffix} if there is a '?' before the end of the URL template string.
  // Wait, if it already has \${branchSuffix}, skip.
  const fetchRegex = /fetch\((?:await.*?fetch\()?`([^`]+)`/g;
  
  content = content.replace(fetchRegex, (match, url) => {
    if (url.includes('branchSuffix') || url.includes('branchSuffixFirst') || url.includes('takka_active_branch_id')) return match;
    
    if (url.includes('Warehouses')) return match; // Handled separately in AccessoryReport, SparePartReport etc.
    
    if (url.includes('?')) {
        return `fetch(\`${url}\${branchSuffix}\``;
    } else {
        return `fetch(\`${url}\${branchSuffixFirst}\``;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
