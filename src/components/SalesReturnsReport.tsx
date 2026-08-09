import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download, CornerDownLeft, AlertCircle, Smartphone, Headphones, FileText, CalendarDays, RefreshCcw, PieChart as PieChartIcon, TrendingUp, Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#64748b'];

export default function SalesReturnsReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'آخر شهر',
  });
  
  const [stats, setStats] = useState({
    totalReturns: 0,
    totalRefundAmount: 0,
    devicesReturns: 0,
    accessoriesReturns: 0,
    sparePartsReturns: 0,
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [reasonData, setReasonData] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);

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
      
      const userId = localStorage.getItem('user_id');
      // We will try to fetch the Sales_Returns table
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Returns?select=*&order=created_at.desc${branchSuffix}`, { headers });
      const data = res.ok ? await res.json() : [];

      setReturns(data);
      processDashboard(data, filters);
    } catch (err) {
      console.error('Error fetching sales returns report:', err);
      processDashboard([], filters);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    processDashboard(returns, filters);
  }, [filters, returns]);

  const processDashboard = (data: any[], currentFilters: any) => {
    let filtered = data || [];

    if (currentFilters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      filtered = filtered.filter(i => new Date(i.created_at) >= lastMonth);
    } else if (currentFilters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      filtered = filtered.filter(i => new Date(i.created_at) >= lastWeek);
    }

    let tRefund = 0;
    let devReturns = 0;
    let accReturns = 0;
    let spareReturns = 0;

    const tMap: Record<string, number> = {};
    const reasonMap: Record<string, number> = {};
    const monthMap: Record<string, { count: number, devices: number, accs: number, spare: number, total: number }> = {};

    filtered.forEach(item => {
      const amount = Number(item.refund_amount) || Number(item.total_amount) || 0;
      tRefund += amount;
      
      const retQty = Number(item.quantity || item.qty || 1);

      const type = item.product_type || item.type;
      if (type === 'device' || type === 'جهاز') devReturns += retQty;
      else if (type === 'accessory' || type === 'إكسسوار') accReturns += retQty;
      else spareReturns += retQty;

      // Daily Trend
      const dLabel = format(new Date(item.created_at || new Date()), 'd/M');
      tMap[dLabel] = (tMap[dLabel] || 0) + amount;

      // Reason Pie
      const reason = item.reason || 'إرجاع عام';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;

      // Monthly
      const mLabel = format(new Date(item.created_at || new Date()), 'MMMM yyyy', { locale: ar });
      if (!monthMap[mLabel]) monthMap[mLabel] = { count: 0, devices: 0, accs: 0, spare: 0, total: 0 };
      monthMap[mLabel].count += retQty;
      monthMap[mLabel].total += amount;
      if (type === 'device' || type === 'جهاز') monthMap[mLabel].devices += retQty;
      else if (type === 'accessory' || type === 'إكسسوار') monthMap[mLabel].accs += retQty;
      else monthMap[mLabel].spare += retQty;
    });

    setStats({
      totalReturns: filtered.reduce((sum, r) => sum + Number(r.quantity || r.qty || 1), 0),
      totalRefundAmount: tRefund,
      devicesReturns: devReturns,
      accessoriesReturns: accReturns,
      sparePartsReturns: spareReturns,
    });

    // Populate trendData from mapping. Sort by date loosely by maintaining insertion if not already sorted.
    // In our case `filtered` is already desc, reverse it for chronos order in line chart.
    const uniqueKeys = Object.keys(tMap).reverse();
    setTrendData(uniqueKeys.map(k => ({ date: k, "قيمة المرتجعات": tMap[k] })));
    
    const rData = Object.entries(reasonMap).map(([name, value]) => ({ name, value }));
    setReasonData(rData.length > 0 ? rData : []);

    setMonthlySummary(Object.entries(monthMap).map(([month, d]) => ({ month, ...d })));
  };

  const handleExportExcel = () => {
    const exportData = returns.map((item, index) => {
      return {
        '#': index + 1,
        'التاريخ': format(new Date(item.created_at || new Date()), 'yyyy/MM/dd'),
        'رقم الفاتورة': item.invoice_number || '-',
        'العميل': item.customer_name || 'نقدي',
        'النوع': item.product_type || 'غير محدد',
        'المنتج': item.product_name || '-',
        'السبب': item.reason || '-',
        'المبلغ المسترد': Number(item.refund_amount || item.total_amount || 0).toFixed(2),
        'الحالة': item.status || 'مكتمل'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مرتجعات المبيعات');
    XLSX.writeFile(workbook, `مرتجعات_المبيعات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: exportTemplateRef,
    documentTitle: `Sales_Returns_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    handlePrint();
  };

  const getStatusColor = (status: string) => {
      if (status === 'مكتمل') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      if (status === 'قيد المراجعة') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  };

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-rose-500 animate-spin"></div>
             <div className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل تقارير المرتجعات...</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
         <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
              <CornerDownLeft className="w-6 h-6 text-rose-500" />
            </div>
            مرتجعات المبيعات
         </h2>
         <div className="flex bg-slate-100 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 p-1.5 rounded-xl">
            <button 
               onClick={() => setFilters({period: 'آخر أسبوع'})} 
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filters.period === 'آخر أسبوع' ? 'bg-white dark:bg-[#161b22] text-rose-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
               آخر أسبوع
            </button>
            <button 
               onClick={() => setFilters({period: 'آخر شهر'})} 
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filters.period === 'آخر شهر' ? 'bg-white dark:bg-[#161b22] text-rose-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
               آخر شهر
            </button>
            <button 
               onClick={() => setFilters({period: 'الكل'})} 
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filters.period === 'الكل' ? 'bg-white dark:bg-[#161b22] text-rose-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
               الكل
            </button>
         </div>
         <div className="flex items-center gap-2">
           <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-500/30">
              <Printer className="w-4 h-4" /> طباعة / PDF
           </button>
           <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-500/30">
              <Download className="w-4 h-4" /> تصدير Excel
           </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportTemplateRef}
        title="تقرير مرتجعات المبيعات"
        subtitle={`الفترة: ${filters.period}`}
        summary={[
          { label: 'إجمالي المرتجعات', value: stats.totalReturns },
          { label: 'المبالغ المستردة', value: stats.totalRefundAmount.toLocaleString(), isCurrency: true },
          { label: 'مرتجعات الأجهزة', value: stats.devicesReturns },
          { label: 'مرتجعات أخرى', value: stats.accessoriesReturns + stats.sparePartsReturns }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.created_at || new Date()), 'yyyy/MM/dd', { locale: ar }) },
          { header: 'رقم الفاتورة', accessor: (item) => item.invoice_number || '-' },
          { header: 'العميل', accessor: (item) => item.customer_name || 'نقدي' },
          { header: 'النوع', accessor: (item) => item.product_type || 'غير محدد' },
          { header: 'المنتج', accessor: (item) => item.product_name || '-' },
          { header: 'السبب', accessor: (item) => item.reason || '-' },
          { header: 'المبلغ المسترد', accessor: (item) => Number(item.refund_amount || item.total_amount || 0).toLocaleString(), isNumeric: true },
          { header: 'الحالة', accessor: (item) => item.status || 'مكتمل' }
        ]}
        data={returns}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         {[
           { title: 'إجمالي المرتجعات', value: stats.totalReturns, icon: RefreshCcw, color: 'text-rose-500', bg: 'bg-rose-500/10' },
           { title: 'المبالغ المستردة', value: `${stats.totalRefundAmount.toLocaleString()} ج.م`, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
           { title: 'مرتجعات الأجهزة', value: stats.devicesReturns, icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
           { title: 'مرتجعات الإكسسوارات', value: stats.accessoriesReturns, icon: Headphones, color: 'text-purple-500', bg: 'bg-purple-500/10' },
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.05 }}
             className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center gap-5 shadow-sm"
           >
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</div>
                <div className="text-2xl font-black font-mono">{stat.value}</div>
              </div>
           </motion.div>
         ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reasons Pie Chart */}
        <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[350px]">
           <h3 className="text-lg font-bold flex items-center justify-center gap-2 mb-4 w-full border-b border-slate-100 dark:border-white/5 pb-4">
              <PieChartIcon className="w-5 h-5 text-indigo-400" />
              المرتجعات حسب السبب
           </h3>
           <div className="flex-1 w-full flex items-center justify-center">
             {reasonData.length > 0 ? (
               <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reasonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reasonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                       contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827', color: '#fff', fontWeight: 'bold' }}
                       itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                   <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-white/5"></div>
                   لا توجد بيانات للفترة المحددة
                </div>
             )}
           </div>
        </div>

        {/* Daily Returns Trend */}
        <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 flex flex-col min-h-[350px]">
           <h3 className="text-lg font-bold flex items-center justify-end gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              المرتجعات اليومية
           </h3>
           <div className="flex-1 w-full">
             {trendData.length > 0 ? (
               <ResponsiveContainer width="100%" height={250}>
                 <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                   <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                   <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(val) => Math.floor(val).toString()} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Line type="monotone" dataKey="قيمة المرتجعات" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold flex-col gap-2">
                   <div className="flex items-end gap-1 h-32 w-full max-w-[200px] border-b-2 border-l-2 border-slate-100 dark:border-white/5 p-4">
                   </div>
                   لا توجد بيانات
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Return Details Table */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
           <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              تفاصيل المرتجعات
           </h3>
           <div className="flex items-center gap-2">
             <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-transparent dark:border-white/10 dark:hover:bg-white/10 rounded-xl text-sm font-bold transition-all shadow-sm">
                <Download className="w-4 h-4 text-emerald-500" /> تصدير Excel
             </button>
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-right">
             <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100/50 dark:bg-white/2">
                <tr>
                   <th className="px-6 py-4">#</th>
                   <th className="px-6 py-4">التاريخ</th>
                   <th className="px-6 py-4">رقم الفاتورة</th>
                   <th className="px-6 py-4">العميل</th>
                   <th className="px-6 py-4 text-center">النوع</th>
                   <th className="px-6 py-4">المنتج</th>
                   <th className="px-6 py-4">السبب</th>
                   <th className="px-6 py-4 text-left">المبلغ المسترد</th>
                   <th className="px-6 py-4 text-center">الحالة</th>
                </tr>
             </thead>
             <tbody>
                {returns.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
                     <td className="px-6 py-4 font-mono font-bold">{idx + 1}</td>
                     <td className="px-6 py-4 font-mono text-xs">{format(new Date(r.created_at || new Date()), 'yyyy/MM/dd')}</td>
                     <td className="px-6 py-4 font-mono text-xs">{r.invoice_number || '-'}</td>
                     <td className="px-6 py-4 font-bold">{r.customer_name || 'نقدي'}</td>
                     <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 tracking-wider">
                          {r.product_type || 'غير محدد'}
                        </span>
                     </td>
                     <td className="px-6 py-4 font-medium max-w-[150px] truncate">{r.product_name || '-'}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{r.reason || '-'}</td>
                     <td className="px-6 py-4 font-black font-mono text-left text-rose-500">{(r.refund_amount || r.total_amount || 0).toLocaleString()} ج.م</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${getStatusColor(r.status || 'مكتمل')}`}>
                          {r.status || 'مكتمل'}
                        </span>
                     </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50 dark:bg-white/[0.01]">لا توجد مرتجعات في هذه الفترة</td>
                  </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
           <h3 className="text-lg font-bold flex items-center gap-2 w-full justify-end">
              ملخص شهري للمرتجعات
              <CalendarDays className="w-5 h-5 text-indigo-400" />
           </h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
             <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100/50 dark:bg-white/2">
                <tr>
                   <th className="px-6 py-4 text-right">الشهر</th>
                   <th className="px-6 py-4 text-center">عدد المرتجعات</th>
                   <th className="px-6 py-4 text-center">أجهزة</th>
                   <th className="px-6 py-4 text-center">إكسسوارات</th>
                   <th className="px-6 py-4 text-center">قطع غيار</th>
                   <th className="px-6 py-4 text-left">إجمالي المستردات</th>
                </tr>
             </thead>
             <tbody>
                {monthlySummary.map((m, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5">
                     <td className="px-6 py-4 font-bold">{m.month}</td>
                     <td className="px-6 py-4 text-center font-mono font-bold">{m.count}</td>
                     <td className="px-6 py-4 text-center font-mono">{m.devices}</td>
                     <td className="px-6 py-4 text-center font-mono">{m.accs}</td>
                     <td className="px-6 py-4 text-center font-mono">{m.spare}</td>
                     <td className="px-6 py-4 text-left font-black font-mono text-rose-500">{m.total.toLocaleString()} ج.م</td>
                  </tr>
                ))}
                {monthlySummary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50 dark:bg-white/[0.01]">لا توجد بيانات</td>
                  </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
