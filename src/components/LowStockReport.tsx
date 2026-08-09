import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Archive, AlertTriangle, XCircle, Search, Download, Printer, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface LowStockItem {
  id: string;
  name: string;
  barcode: string;
  category: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  status: 'out_of_stock' | 'low_stock';
  shortage: number;
}

export default function LowStockReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [estimatedShortageValue, setEstimatedShortageValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };

      // Fetch all inventory items
      const [devicesRes, accessoriesRes, sparePartsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=*${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=*${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*${branchSuffix}`, { headers })
      ]);

      const devices = devicesRes.ok ? await devicesRes.json() : [];
      const accessories = accessoriesRes.ok ? await accessoriesRes.json() : [];
      const spareParts = sparePartsRes.ok ? await sparePartsRes.json() : [];

      const lowStockItems: LowStockItem[] = [];

      const processItems = (data: any[], catName: string) => {
        data.forEach(item => {
          const qty = Number(item.quantity) || 0;
          const minQty = Number(item.alert_quantity || item.minimum_quantity || 5);
          
          if (qty <= minQty) {
            lowStockItems.push({
              id: item.id || Math.random().toString(),
              name: item.device_name || item.item_name || item.name || 'بدون اسم',
              barcode: item.barcode || '-',
              category: catName,
              quantity: qty,
              minQuantity: minQty,
              costPrice: Number(item.cost_price || item.purchase_price || 0),
              status: qty === 0 ? 'out_of_stock' : 'low_stock',
              shortage: qty < minQty ? minQty - qty : 0
            });
          }
        });
      };

      processItems(devices, 'جهاز');
      processItems(accessories, 'إكسسوار');
      processItems(spareParts, 'قطعة غيار');

      setItems(lowStockItems);

      // Calculations
      let outCount = 0;
      let lowCount = 0;
      let shortageValue = 0;

      lowStockItems.forEach(item => {
        if (item.status === 'out_of_stock') outCount++;
        else lowCount++;
        
        shortageValue += item.shortage * item.costPrice;
      });

      setOutOfStockCount(outCount);
      setLowStockCount(lowCount);
      setEstimatedShortageValue(shortageValue);

    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    const header = "الصنف,الباركود,التصنيف,الكمية الحالية,الحد الأدنى,النقص,الحالة\n";
    const csvContent = filteredItems.map((item) => {
       const statusAr = item.status === 'out_of_stock' ? 'نفد من المخزون' : 'مخزون منخفض';
       return `"${item.name}","${item.barcode}","${item.category}",${item.quantity},${item.minQuantity},${item.shortage},"${statusAr}"`;
    }).join("\n");
    
    const blob = new Blob([BOM + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المخزون_المنخفض_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportRef = useRef<HTMLDivElement>(null);
  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    executePrint();
  };
  const executePrint = useReactToPrint({
    contentRef: exportReportRef,
    documentTitle: `Low_Stock_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-50 dark:bg-[#0b101a] text-slate-900 dark:text-white p-6 rounded-b-3xl min-h-screen" dir="rtl">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20">
               <Archive className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                المخزون المنخفض والنواقص <span className="text-2xl">📦</span>
              </h2>
            </div>
         </div>
         
         <div className="flex gap-2 w-full sm:w-auto items-center">
            <button 
               onClick={fetchData}
               disabled={isLoading}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors font-bold flex-1 sm:flex-none shadow-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              تحديث
            </button>
            <button 
               onClick={handleExportExcel}
               disabled={isLoading || filteredItems.length === 0}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors font-bold flex-1 sm:flex-none shadow-sm"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
            <button 
               onClick={handleExportPDF}
               disabled={isLoading || filteredItems.length === 0}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors font-bold flex-1 sm:flex-none shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-4 h-4" />
              طباعة / PDF
            </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير المخزون المنخفض والنواقص"
        subtitle={`التاريخ: ${format(new Date(), 'yyyy/MM/dd hh:mm a', { locale: ar })}`}
        summary={[
          { label: 'نفد من المخزون', value: outOfStockCount },
          { label: 'مخزون منخفض', value: lowStockCount },
          { label: 'قيمة النواقص المقدرة', value: estimatedShortageValue.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'الصنف', accessor: 'name' },
          { header: 'الباركود', accessor: 'barcode' },
          { header: 'التصنيف', accessor: 'category' },
          { header: 'الكمية الحالية', accessor: 'quantity', isNumeric: true },
          { header: 'الحد الأدنى', accessor: 'minQuantity', isNumeric: true },
          { header: 'الكمية الناقصة', accessor: 'shortage', isNumeric: true },
          { header: 'الحالة', accessor: (item) => item.status === 'out_of_stock' ? 'نفد' : 'قارب' }
        ]}
        data={filteredItems}
      />

      {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">جاري فحص المخزون...</p>
         </div>
      ) : (
         <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                 className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border-2 border-slate-200 dark:border-white/5 border-r-4 border-r-red-500 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
               >
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight mb-2 relative z-10">{outOfStockCount}</h3>
                  <div className="flex items-center gap-2 text-red-500 font-bold text-sm relative z-10">
                     نفد من المخزون <XCircle className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl"></div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
                 className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border-2 border-slate-200 dark:border-white/5 border-r-4 border-r-orange-500 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
               >
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight mb-2 relative z-10">{lowStockCount}</h3>
                  <div className="flex items-center gap-2 text-orange-500 font-bold text-sm relative z-10">
                     مخزون منخفض <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl"></div>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}
                 className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border-2 border-slate-200 dark:border-white/5 border-r-4 border-r-emerald-500 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
               >
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight mb-2 relative z-10">{estimatedShortageValue.toLocaleString()} <span className="text-2xl font-bold font-sans">ج.م</span></h3>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm relative z-10">
                     قيمة النواقص المقدرة 💰
                  </div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
               </motion.div>
            </div>

            {/* Main Table */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
               className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
               {/* Search */}
               {items.length > 0 && (
                 <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                    <div className="relative w-full max-w-md mx-auto sm:mx-0">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ابحث بالصنف، الباركود، أو التصنيف..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl pr-9 pl-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                 </div>
               )}

               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-center">
                   <thead>
                     <tr className="bg-slate-100 dark:bg-[#1a212d] text-slate-600 dark:text-slate-300 text-sm border-b border-slate-200 dark:border-slate-800">
                       <th className="px-6 py-4 font-bold">الصنف</th>
                       <th className="px-6 py-4 font-bold">الباركود</th>
                       <th className="px-6 py-4 font-bold">التصنيف</th>
                       <th className="px-6 py-4 font-bold">الكمية الحالية</th>
                       <th className="px-6 py-4 font-bold">الحد الأدنى</th>
                       <th className="px-6 py-4 font-bold">النقص</th>
                       <th className="px-6 py-4 font-bold outline-none border-none">الحالة</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                     {filteredItems.length > 0 ? (
                        filteredItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                             <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                               {item.name}
                             </td>
                             <td className="px-6 py-4 text-slate-500 font-mono text-sm max-w-[150px] truncate" title={item.barcode}>
                               {item.barcode}
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-slate-600 dark:text-slate-300 text-sm font-bold bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                                  {item.category}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`font-mono text-lg font-black ${item.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                  {item.quantity}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-mono font-bold text-slate-400">
                                {item.minQuantity}
                             </td>
                             <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                                <span className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg">{item.shortage}</span>
                             </td>
                             <td className="px-6 py-4">
                                {item.status === 'out_of_stock' ? (
                                   <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-500/20 w-max mx-auto shadow-sm">
                                      <XCircle className="w-4 h-4" /> نفد من المخزون
                                   </div>
                                ) : (
                                   <div className="flex items-center justify-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/20 w-max mx-auto shadow-sm">
                                      <AlertTriangle className="w-4 h-4" /> مخزون منخفض
                                   </div>
                                )}
                             </td>
                          </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={7} className="px-6 py-12 text-center">
                              {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
                                   <span className="text-3xl mb-3">🎉</span>
                                   <p className="text-lg font-bold text-slate-800 dark:text-white">كل الأصناف مخزونها كافي!</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                   <Search className="w-12 h-12 mb-3 opacity-20" />
                                   <p className="text-sm font-bold">لا توجد نواقص مطابقة للبحث</p>
                                </div>
                              )}
                           </td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  );
}
