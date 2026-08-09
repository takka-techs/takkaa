import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Receipt, TrendingDown, Calendar, Search, Download, CircleDollarSign, ArrowDownRight, Tag, FileText, Printer
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function ExpensesReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesCount, setExpensesCount] = useState(0);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

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

      let dateFilterStr = '';
      if (dateRange !== 'all') {
         const days = parseInt(dateRange);
         const startDate = subDays(new Date(), days);
         dateFilterStr = `&created_at=gte.${startDate.toISOString()}`;
      }

      // Try fetching from Expenses table first
      let allExpenses: any[] = [];
      try {
        const expRes = await fetch(`${SUPABASE_URL}/rest/v1/Expenses${dateFilterStr}&order=created_at.desc${branchSuffixFirst}`, { headers });
        if (expRes.ok) {
           allExpenses = await expRes.json();
        }
      } catch (e) {
        console.warn('Expenses table not accessible, falling back to treasury_transactions');
      }

      // Fallback or append: If user actually uses wallet_transactions for expenses
      if (allExpenses.length === 0) {
         try {
           const treasRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions${dateFilterStr}&order=created_at.desc${branchSuffixFirst}`, { headers });
           if (treasRes.ok) {
              const txs = await treasRes.json();
              allExpenses = txs.filter((t: any) => {
                 if (!(t.type === 'out' || t.type === 'expense')) return false;
                 if (!t.category) return true;
                 const catStr = t.category.toLowerCase();
                 const excludedKeywords = [
                    'مشتريات', 'شراء', 'مخزون', 'مورد', 'دفعة',
                    'تحويل', 'محافظ', 'رصيد', 'داخلية', 'رأس مال', 'راس مال', 'سحب', 'مالك',
                    'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return', 'reversal', 'reverse'
                 ];
                 return !excludedKeywords.some(kw => catStr.includes(kw));
              });
           }
         } catch (e) {
            console.error('Error fetching treasury_transactions', e);
         }
      }

      setExpenses(allExpenses);

      // Processing
      let total = 0;
      const catMap: Record<string, number> = {};
      const dayMap: Record<string, number> = {};

      allExpenses.forEach(exp => {
        const amt = Number(exp.amount) || 0;
        total += amt;
        
        const cat = exp.category || exp.expense_category || 'أخرى';
        catMap[cat] = (catMap[cat] || 0) + amt;

        const dateStr = format(new Date(exp.created_at || new Date()), 'MMM dd', { locale: ar });
        dayMap[dateStr] = (dayMap[dateStr] || 0) + amt;
      });

      setTotalExpenses(total);
      setExpensesCount(allExpenses.length);

      const pieData = Object.keys(catMap).map((k, i) => ({
        name: k,
        value: catMap[k],
        color: COLORS[i % COLORS.length]
      })).sort((a, b) => b.value - a.value);
      setCategoryData(pieData);

      const barData = Object.keys(dayMap).slice(0, 15).reverse().map(k => ({
        date: k,
        amount: dayMap[k]
      }));
      setDailyData(barData);

    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    const header = "التاريخ,التصنيف,المبلغ,البيان\n";
    const csvContent = filteredExpenses.map((exp: any) => {
       const date = format(new Date(exp.created_at || new Date()), 'yyyy/MM/dd hh:mm a');
       const cat = exp.category || exp.expense_category || 'أخرى';
       const amount = exp.amount || 0;
       const desc = (exp.description || exp.notes || '').replace(/,/g, ' ');
       return `${date},${cat},${amount},${desc}`;
    }).join("\n");
    
    const blob = new Blob([BOM + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المصروفات_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
    documentTitle: `Expenses_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const filteredExpenses = expenses.filter(exp => 
    (exp.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (exp.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-white dark:bg-[#0b101a] text-slate-900 dark:text-white p-6 rounded-b-3xl min-h-screen" dir="rtl">
      {/* Header Toolbar */}
      <div className="border-b border-slate-200 dark:border-white/5 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20">
               <Receipt className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                تقرير المصروفات
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">تحليل تفصيلي للمصروفات المدفوعة</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161b22] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex-1 sm:flex-none">
               <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">الفترة</span>
               <select 
                  className="bg-transparent text-sm font-bold text-slate-900 dark:text-white border-none sm:border-l border-slate-200 dark:border-white/10 sm:pl-2 sm:ml-2 outline-none focus:ring-0"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
               >
                  <option value="today" className="bg-white dark:bg-[#161b22]">اليوم</option>
                  <option value="7" className="bg-white dark:bg-[#161b22]">آخر 7 أيام</option>
                  <option value="30" className="bg-white dark:bg-[#161b22]">آخر شهر</option>
                  <option value="90" className="bg-white dark:bg-[#161b22]">آخر 3 شهور</option>
                  <option value="all" className="bg-white dark:bg-[#161b22]">كل الفترات</option>
               </select>
            </div>
            <button 
               onClick={handleExportPDF}
               disabled={isLoading || filteredExpenses.length === 0}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4" />
              طباعة / PDF
            </button>
            <button 
               onClick={handleExportExcel}
               disabled={isLoading || filteredExpenses.length === 0}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير المصروفات"
        subtitle={`الفترة: ${dateRange === 'all' ? 'الكل' : dateRange === 'today' ? 'اليوم' : `آخر ${dateRange} أيام`}`}
        summary={[
          { label: 'إجمالي المصروفات', value: totalExpenses.toLocaleString(), isCurrency: true },
          { label: 'عدد العمليات', value: expensesCount }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.created_at || new Date()), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'التصنيف', accessor: (item) => item.category || item.expense_category || 'أخرى' },
          { header: 'المبلغ', accessor: (item) => Number(item.amount || 0).toLocaleString(), isNumeric: true },
          { header: 'البيان', accessor: (item) => item.description || item.notes || '-' }
        ]}
        data={filteredExpenses}
      />

      {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">جاري سحب تقارير المصروفات...</p>
         </div>
      ) : (
         <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                 className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-xl relative overflow-hidden flex items-center justify-between"
               >
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">إجمالي المصروفات</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-lg text-slate-500 font-normal">ج.م</span></h3>
                  </div>
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-500/20 shadow-inner">
                     <TrendingDown className="w-7 h-7" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-2xl"></div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                 className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-xl relative overflow-hidden flex items-center justify-between"
               >
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">عدد عمليات الصرف</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{expensesCount} <span className="text-lg text-slate-500 font-normal">عملية</span></h3>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20 shadow-inner">
                     <Receipt className="w-7 h-7" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl"></div>
               </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                 className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
               >
                 <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                       <CircleDollarSign className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">تحليل المصروفات حسب التصنيف</h3>
                 </div>
                 <div className="h-64 mb-4">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={categoryData}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                           >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <RechartsTooltip 
                              formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبلغ']}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', background: 'linear-gradient(to bottom right, #1f2937, #111827)', color: 'white', fontWeight: 'bold' }}
                              itemStyle={{ color: '#e5e7eb' }}
                           />
                         </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">لا توجد بيانات للفترة المحددة</div>
                    )}
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryData.map((cat, i) => (
                       <div key={i} className="flex flex-col p-2 bg-slate-50 dark:bg-[#0b101a] rounded-lg border border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white mr-4" dir="ltr">{cat.value.toLocaleString()} ج.م</span>
                       </div>
                    ))}
                 </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                 className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
               >
                 <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                       <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">المصروفات بمرور الوقت</h3>
                 </div>
                 <div className="h-80">
                    {dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                            <RechartsTooltip 
                               formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'إجمالي المصروفات']}
                               labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'linear-gradient(to bottom right, #1f2937, #111827)', color: 'white', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                         </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">لا توجد بيانات للفترة المحددة</div>
                    )}
                 </div>
               </motion.div>
            </div>

            {/* Expenses List */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
               className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
               <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-white/[0.02]">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                     <FileText className="w-5 h-5 text-indigo-500" /> سجّل المصروفات المدفوعة
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث بالبيان أو التصنيف..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl pr-9 pl-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white transition-all shadow-sm"
                    />
                  </div>
               </div>

               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-start">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-[#1a212d] text-slate-500 dark:text-slate-400 text-sm">
                       <th className="px-6 py-4 font-bold text-start">التاريخ والوقت</th>
                       <th className="px-6 py-4 font-bold text-start">التصنيف</th>
                       <th className="px-6 py-4 font-bold text-start">البيان</th>
                       <th className="px-6 py-4 font-bold text-end">المبلغ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                     {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((exp, idx) => (
                          <tr key={exp.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                             <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-800 dark:text-white">{format(new Date(exp.created_at || new Date()), 'yyyy/MM/dd')}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(exp.created_at || new Date()), 'hh:mm a')}</div>
                             </td>
                             <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 flex items-center gap-1.5 w-fit">
                                   <Tag className="w-3 h-3 text-slate-400" /> {exp.category || exp.expense_category || 'أخرى'}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm truncate" title={exp.description || exp.notes || 'بدون بيان'}>
                                  {exp.description || exp.notes || 'بدون بيان'}
                                </p>
                             </td>
                             <td className="px-6 py-4 text-end">
                                <div className="flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400 font-bold font-mono" dir="ltr">
                                  <ArrowDownRight className="w-4 h-4 opacity-50" />
                                  <span>-{Number(exp.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</span>
                                </div>
                             </td>
                          </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={4} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                 <Receipt className="w-12 h-12 mb-3 opacity-20" />
                                 <p className="text-sm font-bold">لا توجد سجلات مصروفات مطابقة للبحث</p>
                              </div>
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
