import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, FileText, Printer, Search, Calendar, Filter, ArrowRightLeft,
  DollarSign, Repeat, ArrowUpRight, ArrowDownRight, CheckCircle2, TrendingUp, X
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function TransfersReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'آخر شهر', // 'الكل', 'آخر أسبوع', 'آخر شهر', 'اليوم'
    type: 'الكل', // 'الكل', 'صادرة', 'واردة'
    searchQuery: ''
  });
  
  const [stats, setStats] = useState({
    transfersCount: 0,
    totalAmounts: 0,
    totalCommissions: 0,
    avgCommission: 0
  });

  const [displayData, setDisplayData] = useState<any[]>([]);
  const [viewModalData, setViewModalData] = useState<any | null>(null);

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

      const [txRes, walletsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?order=created_at.desc&limit=2000${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/wallets${branchSuffixFirst}`, { headers })
      ]);

      const txData = txRes.ok ? await txRes.json() : [];
      const walletsData = walletsRes.ok ? await walletsRes.json() : [];
      
      setWallets(walletsData);

      // Filter only transfer-related transactions
      const transferTxs = txData.filter((tx: any) => 
        tx.category && tx.category.includes('تحويل')
      );

      setTransfers(transferTxs);
      processDashboard(transferTxs, walletsData, filters);
    } catch (err) {
      console.error('Error fetching transfers report:', err);
      processDashboard([], [], filters);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    processDashboard(transfers, wallets, filters);
  }, [filters, transfers, wallets]);

  const processDashboard = (txs: any[], availableWallets: any[], currentFilters: any) => {
    let combined: any[] = [];

    // Format Transfers
    txs.forEach(tx => {
      // Determine if it's out or in based on type or category
      let direction = 'غير محدد';
      if (tx.type === 'out' || tx.category === 'تحويل صادرة') direction = 'صادرة';
      if (tx.type === 'in' || tx.category === 'تحويل واردة') direction = 'واردة';

      const wallet = availableWallets.find(w => w.id === tx.wallet_id);
      
      // Attempt to extract commission from description or db (we default to 0 if not exist)
      let commission = 0;
      let customer = 'غير محدد';
      let phone = '-';
      
      combined.push({
        id: tx.id,
        date: tx.created_at,
        category: tx.category,
        direction: direction,
        amount: Math.abs(tx.amount || 0),
        commission: commission,
        walletName: wallet ? wallet.name : 'مجهول',
        customer: customer,
        phone: phone,
        description: tx.description || 'بدون تفاصيل',
        raw: tx
      });
    });

    // Default Sort (date desc)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply Period Filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentFilters.period === 'اليوم') {
      combined = combined.filter(i => new Date(i.date) >= today);
    } else if (currentFilters.period === 'آخر شهر') {
      const lastMonth = subDays(today, 30);
      combined = combined.filter(i => new Date(i.date) >= lastMonth);
    } else if (currentFilters.period === 'آخر أسبوع') {
      const lastWeek = subDays(today, 7);
      combined = combined.filter(i => new Date(i.date) >= lastWeek);
    }

    // Calc Stats before Type & Search Filter
    let totalAmt = 0;
    let totalComm = 0;
    let count = combined.length;

    combined.forEach(c => {
      totalAmt += c.amount;
      totalComm += c.commission;
    });

    setStats({
      transfersCount: count,
      totalAmounts: totalAmt,
      totalCommissions: totalComm,
      avgCommission: count > 0 ? (totalComm / count) : 0
    });

    // Apply Type Filter
    if (currentFilters.type !== 'الكل') {
      combined = combined.filter(i => i.direction === currentFilters.type);
    }

    // Apply Search Filter
    if (currentFilters.searchQuery.trim()) {
      const q = currentFilters.searchQuery.toLowerCase();
      combined = combined.filter(i => 
        i.description.toLowerCase().includes(q) || 
        i.walletName.toLowerCase().includes(q) ||
        i.customer.toLowerCase().includes(q)
      );
    }

    setDisplayData(combined);
  };

  const handleExportExcel = () => {
    const wsData = displayData.map(item => ({
      'رقم الحركة': item.id,
      'التاريخ': format(new Date(item.date), 'yyyy-MM-dd'),
      'الوقت': format(new Date(item.date), 'HH:mm'),
      'النوع': item.category,
      'الاتجاه': item.direction,
      'المبلغ': item.amount,
      'العمولة': item.commission,
      'العميل': item.customer,
      'الهاتف': item.phone,
      'المحفظة': item.walletName,
      'ملاحظات': item.description,
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transfers');
    XLSX.writeFile(wb, `Transfers_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Transfers_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <label className="relative flex-1 max-w-sm">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في التحويلات..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 dark:text-white"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-2xl p-1.5">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            <div className="flex gap-1">
              {['الكل', 'آخر شهر', 'آخر أسبوع', 'اليوم'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, period: p }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filters.period === p 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'الكل' ? 'صادرة' : prev.type === 'صادرة' ? 'واردة' : 'الكل' }))}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-all font-bold text-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              الاتجاه: {filters.type}
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 border border-slate-200 dark:border-white/10 text-white rounded-2xl transition-all font-bold text-sm"
            >
              <Printer className="w-4 h-4" /> طباعة / PDF
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-all font-bold text-sm"
            >
              <Download className="w-4 h-4" /> تصدير
            </button>
          </div>
        </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير التحويلات"
        subtitle={`الفترة: ${filters.period} | الاتجاه: ${filters.type}`}
        summary={[
          { label: 'عدد التحويلات', value: stats.transfersCount },
          { label: 'إجمالي المبالغ', value: stats.totalAmounts.toLocaleString(), isCurrency: true },
          { label: 'إجمالي العمولات', value: stats.totalCommissions.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.date), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'النوع', accessor: 'category' },
          { header: 'الاتجاه', accessor: 'direction' },
          { header: 'المبلغ', accessor: (item) => Number(item.amount).toLocaleString(), isNumeric: true },
          { header: 'العمولة', accessor: (item) => Number(item.commission).toLocaleString(), isNumeric: true },
          { header: 'المحفظة', accessor: 'walletName' },
          { header: 'ملاحظات', accessor: 'description' }
        ]}
        data={displayData}
      />

      {/* Stats Bento Grid based on screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'عدد التحويلات', 
            value: stats.transfersCount.toString(), 
            icon: Repeat, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            borderColor: 'border-indigo-200 dark:border-indigo-500/20' 
          },
          { 
            title: 'إجمالي المبالغ المحولة', 
            value: stats.totalAmounts.toLocaleString() + ' ج.م', 
            icon: DollarSign, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            borderColor: 'border-emerald-200 dark:border-emerald-500/20' 
          },
          { 
            title: 'إجمالي العمولات (الربح)', 
            value: stats.totalCommissions.toLocaleString() + ' ج.م', 
            icon: TrendingUp, 
            color: 'text-blue-500', 
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            borderColor: 'border-blue-200 dark:border-blue-500/20'  
          },
          { 
            title: 'متوسط العمولة', 
            value: stats.avgCommission.toFixed(2) + ' ج.م', 
            icon: ArrowUpRight, 
            color: 'text-purple-500', 
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            borderColor: 'border-purple-200 dark:border-purple-500/20' 
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white dark:bg-[#0b101a] border ${stat.borderColor} p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all duration-300`}
          >
            <div className="relative z-10 flex flex-col gap-4">
               <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-slate-500 font-bold mb-1">{stat.title}</h3>
                  <div className={`text-2xl font-black ${stat.color} font-mono block`}>
                    {stat.value}
                  </div>
               </div>
            </div>
            <div className={`absolute top-0 end-0 w-32 h-32 ${stat.bg} rounded-full blur-3xl -mx-10 -my-10 opacity-50 group-hover:opacity-80 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              سجل التحويلات التفصيلي
            </h3>
            <span className="text-sm font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg">
              {displayData.length} سجل
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#0b101a]/50 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 justify-center rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-slate-500 animate-pulse">جاري تحميل البيانات...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد تحويلات مسجلة</p>
              <p className="text-sm font-medium text-slate-500 mt-1">جرب تغيير محددات البحث أو تصفية التاريخ</p>
            </div>
          ) : (
            <table className="w-full text-start whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#11151c] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">رقم الحركة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">التاريخ والوقت</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">النوع</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">الاتجاه</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">المبلغ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">العمولة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">العميل - هاتف</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">المحفظة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {displayData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setViewModalData(tx)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                      #{tx.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {format(new Date(tx.date), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">
                          {format(new Date(tx.date), 'hh:mm a')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200 dark:border-white/5">
                        <Repeat className="w-3.5 h-3.5" />
                        {tx.category || 'تحويل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                        tx.direction === 'صادرة' 
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' 
                          : tx.direction === 'واردة'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                      }`}>
                        {tx.direction === 'صادرة' ? <ArrowUpRight className="w-3.5 h-3.5" /> : tx.direction === 'واردة' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                        {tx.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {tx.amount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">ج.م</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-blue-500 font-mono">
                        {tx.commission.toLocaleString()} <span className="text-xs text-blue-500/50 font-bold">ج.م</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{tx.customer}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{tx.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {tx.walletName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-[200px]">
                        {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

       {/* View Modal */}
       <AnimatePresence>
        {viewModalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#11151c] w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  تفاصيل التحويل #{viewModalData.id}
                </h3>
                <button onClick={() => setViewModalData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">المبلغ</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{viewModalData.amount.toLocaleString()} ج.م</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">العمولة</p>
                        <p className="text-lg font-black text-blue-500 font-mono">{viewModalData.commission.toLocaleString()} ج.م</p>
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                    <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                       <span className="text-sm font-bold text-slate-500">التاريخ</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white">{format(new Date(viewModalData.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                       <span className="text-sm font-bold text-slate-500">من محفظة</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white">{viewModalData.walletName}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                       <span className="text-sm font-bold text-slate-500">الاتجاه / النوع</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white">{viewModalData.direction} / {viewModalData.category}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                       <span className="text-sm font-bold text-slate-500">العميل</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white">{viewModalData.customer}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-sm font-bold text-slate-500">الهاتف</span>
                       <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{viewModalData.phone}</span>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">ملاحظات</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{viewModalData.description}</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-slate-800/50 flex justify-end gap-3">
                 <button onClick={() => setViewModalData(null)} className="px-6 py-2.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold transition-all border border-slate-200 dark:border-white/10">
                  إغلاق
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
