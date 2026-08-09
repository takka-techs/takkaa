const fs = require('fs');

const files = [
    'src/components/Accessories.tsx',
    'src/components/AccessoryPurchases.tsx',
    'src/components/DevicePurchases.tsx',
    'src/components/SparePartPurchases.tsx',
    'src/components/PurchaseReturnsReport.tsx'
];

for (const file of files) {
   if (!fs.existsSync(file)) continue;
   let text = fs.readFileSync(file, 'utf8');

   text = text.replace(/const \[currentPage, setCurrentPage\][^;]+;\\n/g, "");
   text = text.replace(/const \[itemsPerPage, setItemsPerPage\][^;]+;\\n/g, "");
   text = text.replace(/const totalPages = 1;\\n/g, "");
   
   // remove the specific useEffect
   text = text.replace(/React\.useEffect\(\(\) => \{\\n\s*setCurrentPage\(1\);\\n\s*\}, \[[^\]]+\]\);\\n/g, "");
   text = text.replace(/React\.useEffect\(\(\) => \{\\n\s*setCurrentPage\(1\);\\n\s*\}, \[searchTerm, filters\]\);/g, "");

   // accessories redundant declarations
   text = text.replace(/const totalPages = Math\.ceil[^\n]+\n/g, "");
   text = text.replace(/const paginatedAccessories = filteredAccessories\.slice\([^\n]+\n/g, "");

   let idx = text.indexOf('{/* Pagination Controls */}');
   if (idx !== -1) {
       // Find the end div of pagination controls
       let endIdx = text.indexOf('</div>\n      </div>', idx);
       if (endIdx !== -1) {
            text = text.substring(0, idx) + '</div>\n      </div>' + text.substring(endIdx + 20);
       }
   }

   fs.writeFileSync(file, text);
}
