import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, CornerDownRight, Filter, FileText, ArrowRight, Loader2, Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function PurchaseReturnsReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);
  
  
  
  

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ 
    period: 'الكل',
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);
  const totalPages = 1;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);
  
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
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=*&status=eq.returned&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=*&notes=ilike.*مرتجع*&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*&notes=ilike.*مرتجع*&order=created_at.desc${branchSuffix}`, { headers })
      ]);

      const devices = devicesRes.ok ? await devicesRes.json() : [];
      const accessories = accessoriesRes.ok ? await accessoriesRes.json() : [];
      const spareParts = sparePartsRes.ok ? await sparePartsRes.json() : [];

      let allReturns: any[] = [
        ...devices.map((d: any) => ({
          id: `device-${d.id}`,
          date: d.created_at, // Approximating return date
          type: 'أجهزة',
          product: `${d.company || ''} ${d.model || ''}`.trim(),
          supplier: d.source || 'غير محدد',
          quantity: 1, 
          value: d.cost_price || 0,
          reason: d.notes ? d.notes.replace('مرتجع: ', '') : 'غير محدد'
        })),
        ...accessories.map((a: any) => ({
           id: `accessory-${a.id}`,
           date: a.created_at,
           type: 'إكسسوارات',
           product: a.name || 'غير محدد',
           supplier: a.supplier || 'غير محدد',
           quantity: 'حسب الملاحظات',
           value: a.cost_price || 0,
           reason: a.notes || 'غير محدد'
        })),
        ...spareParts.map((s: any) => ({
           id: `spare-${s.id}`,
           date: s.created_at,
           type: 'قطع غيار',
           product: s.name || 'غير محدد',
           supplier: s.supplier || 'غير محدد',
           quantity: 'حسب الملاحظات',
           value: s.cost_price || 0,
           reason: s.notes || 'غير محدد'
        }))
      ];

      // Sort by date desc
      allReturns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReturns(allReturns);
    } catch (err) {
      console.error('Error fetching purchase returns report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredReturns = () => {
    let filtered = returns;

    if (filters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      filtered = filtered.filter(i => new Date(i.date) >= lastMonth);
    } else if (filters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      filtered = filtered.filter(i => new Date(i.date) >= lastWeek);
    }

    return filtered;
  };

  const filteredReturns = getFilteredReturns();
  const totalAmount = filteredReturns.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const handleExportExcel = () => {
    const exportData = filteredReturns.map((item, index) => ({
      'م': index + 1,
      'التاريخ': format(new Date(item.date), 'yyyy/MM/dd'),
      'النوع': item.type,
      'المنتج': item.product,
      'المورد': item.supplier,
      'ملاحظات / سبب الإرجاع': item.reason
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مرتجعات المشتريات');
    XLSX.writeFile(workbook, `مرتجعات_المشتريات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: exportTemplateRef,
    documentTitle: `Purchase_Returns_Report_${format(new Date(), 'yyyy-MM-dd')}`,
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
            <CornerDownRight className="w-6 h-6 text-blue-500" /> تقرير مرتجعات المشتريات
          </h2>
        </div>
      </div>

      {/* Toolbar & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الكمية المقدرة للمرتجعات</div>
            <div className="text-3xl font-black text-blue-500 font-mono">
               {filteredReturns.length} <span className="text-sm">سجل</span>
            </div>
         </div>

         <div className="md:col-span-2 bg-white dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none space-y-1">
                 <label className="text-sm font-medium text-slate-500 dark:text-slate-400">الفترة</label>
                 <select 
                    value={filters.period} 
                    onChange={e => setFilters({...filters, period: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
        title="تقرير مرتجعات المشتريات"
        subtitle={`الفترة: ${filters.period}`}
        summary={[
          { label: 'إجمالي المرتجعات', value: filteredReturns.length },
          { label: 'الأجهزة', value: filteredReturns.filter(p => p.type === 'أجهزة').length },
          { label: 'الإكسسوارات', value: filteredReturns.filter(p => p.type === 'إكسسوارات').length },
          { label: 'قطع غيار', value: filteredReturns.filter(p => p.type === 'قطع غيار').length }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.date), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'النوع', accessor: 'type' },
          { header: 'المنتج', accessor: 'product' },
          { header: 'المورد', accessor: 'supplier' },
          { header: 'الكمية', accessor: 'quantity', isNumeric: true },
          { header: 'القيمة المقدرة', accessor: (item) => Number(item.value).toLocaleString(), isNumeric: true },
          { header: 'السبب / ملاحظات', accessor: 'reason' }
        ]}
        data={filteredReturns}
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
                <th className="px-6 py-4 whitespace-nowrap text-left">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              <AnimatePresence>
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((item, idx) => (
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
                          'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.product}</span>
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] rounded-md font-bold whitespace-nowrap">مرتجع</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 text-left font-medium max-w-sm shrink break-words text-slate-500 dark:text-slate-400">
                        {item.reason}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      لا توجد مرتجعات مشتريات تطابق بحثك
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
            </table>
          </div>

          </div>
      </div>  );
}
