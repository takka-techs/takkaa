import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Package, Filter, FileText, ArrowRight, X, Loader2, Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function PurchasesReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'الكل',
  });
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${localStorage.getItem('access_token') || SUPABASE_KEY}`
      };

      const [devicesRes, accessoriesRes, sparePartsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=*&entry_type=eq.purchase&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=*&entry_type=eq.purchase&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*&entry_type=eq.purchase&order=created_at.desc${branchSuffix}`, { headers })
      ]);

      const devices = devicesRes.ok ? await devicesRes.json() : [];
      const accessories = accessoriesRes.ok ? await accessoriesRes.json() : [];
      const spareParts = sparePartsRes.ok ? await sparePartsRes.json() : [];

      let allPurchases: any[] = [
        ...devices.map((d: any) => ({
          id: `device-${d.id}`,
          raw_id: d.id,
          date: d.created_at,
          type: 'أجهزة',
          product: `${d.company || ''} ${d.model || ''}`.trim(),
          supplier: d.source || 'غير محدد',
          quantity: 1, 
          unitPrice: d.cost_price || 0,
          total: (d.cost_price || 0) + (d.tax || 0),
          isReturned: d.status === 'returned'
        })),
        ...accessories.map((a: any) => ({
           id: `accessory-${a.id}`,
           raw_id: a.id,
           date: a.created_at,
           type: 'إكسسوارات',
           product: a.name || 'غير محدد',
           supplier: a.supplier || 'غير محدد',
           quantity: a.quantity || 0, // In reality, partial returns reduce quantity, but we display the flag if notes have "مرتجع"
           unitPrice: a.cost_price || 0,
           total: ((a.cost_price || 0) + (a.tax || 0)) * (a.quantity || 0),
           isReturned: a.status === 'returned' || (a.notes && a.notes.includes('مرتجع'))
        })),
        ...spareParts.map((s: any) => ({
           id: `spare-${s.id}`,
           raw_id: s.id,
           date: s.created_at,
           type: 'قطع غيار',
           product: s.name || 'غير محدد',
           supplier: s.supplier || 'غير محدد',
           quantity: s.quantity || 0,
           unitPrice: s.cost_price || 0,
           total: ((s.cost_price || 0) + (s.tax || 0)) * (s.quantity || 0),
           isReturned: s.status === 'returned' || (s.notes && s.notes.includes('مرتجع'))
        }))
      ];

      // Sort by date desc
      allPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPurchases(allPurchases);
    } catch (err) {
      console.error('Error fetching purchases report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredPurchases = () => {
    let filtered = purchases;

    if (filters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      filtered = filtered.filter(i => new Date(i.date) >= lastMonth);
    } else if (filters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      filtered = filtered.filter(i => new Date(i.date) >= lastWeek);
    }

    return filtered;
  };

  const filteredPurchases = getFilteredPurchases();
  const totalAmount = filteredPurchases.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleExportExcel = () => {
    const exportData = filteredPurchases.map((item, index) => ({
      'م': index + 1,
      'التاريخ': format(new Date(item.date), 'yyyy/MM/dd'),
      'النوع': item.type,
      'المنتج': item.product,
      'المورد': item.supplier,
      'الكمية': item.quantity,
      'سعر الوحدة': Number(item.unitPrice).toFixed(2),
      'الإجمالي': Number(item.total).toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المشتريات');
    XLSX.writeFile(workbook, `تقرير_المشتريات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: exportTemplateRef,
    documentTitle: `Purchases_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    handlePrint();
  };

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 animate-spin"></div>
             <div className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل التقرير...</div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
            >
              <ArrowRight className="w-6 h-6 text-slate-500" />
            </button>
          )}
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" /> تقرير المشتريات
          </h2>
        </div>
      </div>

      {/* Toolbar & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">إجمالي المشتريات</div>
            <div className="text-3xl font-black text-amber-600 font-mono">
               {totalAmount.toLocaleString()} <span className="text-sm">ج.م</span>
            </div>
         </div>

         <div className="md:col-span-2 bg-white dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none space-y-1">
                 <label className="text-sm font-medium text-slate-500 dark:text-slate-400">الفترة</label>
                 <select 
                    value={filters.period} 
                    onChange={e => setFilters({...filters, period: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                 >
                    <option value="الكل">الكل</option>
                    <option value="آخر أسبوع">آخر أسبوع</option>
                    <option value="آخر شهر">آخر شهر</option>
                 </select>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-500/30">
                <Printer className="w-4 h-4" /> طباعة / PDF
              </button>
              <button 
                 onClick={handleExportExcel} 
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                 <Download className="w-4 h-4" /> تصدير Excel
              </button>
            </div>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportTemplateRef}
        title="تقرير المشتريات"
        subtitle={`الفترة: ${filters.period}`}
        summary={[
          { label: 'إجمالي المشتريات', value: totalAmount.toLocaleString(), isCurrency: true },
          { label: 'عدد العمليات', value: filteredPurchases.length },
          { label: 'الأجهزة', value: filteredPurchases.filter(p => p.type === 'أجهزة').length },
          { label: 'الإكسسوارات', value: filteredPurchases.filter(p => p.type === 'إكسسوارات').length }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.date), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'النوع', accessor: 'type' },
          { header: 'المنتج', accessor: 'product' },
          { header: 'المورد', accessor: 'supplier' },
          { header: 'الكمية', accessor: 'quantity', isNumeric: true },
          { header: 'سعر الوحدة', accessor: (item) => Number(item.unitPrice).toLocaleString(), isNumeric: true },
          { header: 'الإجمالي', accessor: (item) => Number(item.total).toLocaleString(), isNumeric: true }
        ]}
        data={filteredPurchases}
      />

      {/* Data Table */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                <th className="px-6 py-4 whitespace-nowrap">النوع</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">المنتج</th>
                <th className="px-6 py-4 whitespace-nowrap">المورد</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">الكمية</th>
                <th className="px-6 py-4 whitespace-nowrap text-left">سعر الوحدة</th>
                <th className="px-6 py-4 whitespace-nowrap text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              <AnimatePresence>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((item, idx) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500 text-xs">
                        {format(new Date(item.date), 'yyyy/MM/dd HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          item.type === 'أجهزة' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 
                          item.type === 'إكسسوارات' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' : 
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.product}</span>
                          {item.isReturned && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] rounded-md font-bold whitespace-nowrap">مرتجع</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left font-mono font-medium">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.total.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      لا توجد عمليات شراء تطابق بحثك
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
