const fs = require('fs');

function fix(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Add variables at start of component if they don't exist
    if (!content.includes('const [currentPage,')) {
        content = content.replace(
            /const \[filters,\s*setFilters\]/g,
            "const [currentPage, setCurrentPage] = React.useState(1);\n  const [itemsPerPage, setItemsPerPage] = React.useState(50);\n  const totalPages = 1;\n\n  const [filters, setFilters]"
        );
    }
    
    // For SpareParts specifically, add it near sortConfig
    if (file.includes('SpareParts.tsx') && !content.includes('const [currentPage,')) {
         content = content.replace(
            /const \[sortConfig,\s*setSortConfig\] = React\.useState/g,
            "const [currentPage, setCurrentPage] = React.useState(1);\n  const [itemsPerPage, setItemsPerPage] = React.useState(50);\n  const totalPages = 1;\n\n  const [sortConfig, setSortConfig] = React.useState"
         );
    }

    // Add Chevron imports
    content = content.replace(/,\s*ChevronLeft,\s*ChevronRight\s*\}\s*from\s*'lucide-react';/g, "} from 'lucide-react';");
    content = content.replace(/,\s*ChevronLeft\s*\}\s*from\s*'lucide-react';/g, "} from 'lucide-react';");
    content = content.replace(/,\s*ChevronRight\s*\}\s*from\s*'lucide-react';/g, "} from 'lucide-react';");
    
    if (!content.includes('ChevronLeft')) {
        content = content.replace(/} from 'lucide-react';/, ", ChevronLeft, ChevronRight } from 'lucide-react';");
    }
    
    // Add missing CheckCircle2 for SpareParts
    if (file.includes('SpareParts') && !content.includes('CheckCircle2')) {
        content = content.replace(/} from 'lucide-react';/, ", CheckCircle2 } from 'lucide-react';");
    }

    fs.writeFileSync(file, content);
}

const files = [
  'src/components/Accessories.tsx',
  'src/components/AccessoryPurchases.tsx',
  'src/components/DevicePurchases.tsx',
  'src/components/SparePartPurchases.tsx',
  'src/components/GeneralPurchases.tsx',
  'src/components/PurchaseReturnsReport.tsx',
  'src/components/GeneralSales.tsx',
  'src/components/DeviceSales.tsx',
  'src/components/AccessorySales.tsx',
  'src/components/SparePartSales.tsx',
  'src/components/SpareParts.tsx'
];

files.forEach(fix);
