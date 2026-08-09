const fs = require('fs');

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add pagination state near end of states (after let's say "const [sortConfig...")
  if (!content.includes('currentPage') && content.includes('const [sortConfig')) {
    content = content.replace(
      /const \[sortConfig.*?\];\n/s,
      `const [sortConfig, setSortConfig] = React.useState<{key: string, direction: 'asc'|'desc'} | null>(null);\n\n  // Pagination\n  const [currentPage, setCurrentPage] = React.useState(1);\n  const [itemsPerPage, setItemsPerPage] = React.useState(50);\n\n  React.useEffect(() => {\n    setCurrentPage(1);\n  }, [searchTerm, selectedCategory, statusFilter]);\n`
    );
  }

  // Add icon imports
  if (!content.includes('ChevronLeft')) {
    content = content.replace(
      /} from 'lucide-react';/,
      `, ChevronLeft, ChevronRight } from 'lucide-react';`
    );
  }

  // Add pagination logic after filtering
  if (!content.includes('paginatedParts')) {
    content = content.replace(
      /const totalValue \= parts\.reduce[^\n]+\n/,
      `const totalValue = parts.reduce((acc, p) => acc + (p.quantity * p.cost_price), 0);\n\n  // Pagination\n  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);\n  const paginatedParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);\n`
    );
  }

  // Map paginated
  content = content.replace(
    /filteredParts\.map\(/g,
    `paginatedParts.map(`
  );

  // Buttons
  const buttonsHtml = `
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02]">
              <div>
                عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredParts.length)} من أصل {filteredParts.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                  {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>عدد الصفوف:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>`;

   if (!content.includes('عرض {((currentPage - 1) * itemsPerPage) + 1}')) {
     content = content.replace(
       /<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*<\/div>/,
       `</tbody>\n            </table>\n          </div>\n${buttonsHtml}`
     );
   }

   fs.writeFileSync(filePath, content);
   console.log(`Processed ${filePath}`);
}

processFile('src/components/SpareParts.tsx');
