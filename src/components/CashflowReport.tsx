import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Activity, 
  WalletCards, Landmark, CreditCard, Download, Filter,
  RefreshCw, TrendingUp, CalendarDays, Archive, FileText, ArrowLeftRight, Printer
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface WalletType {
  id: number;
  name: string;
  type?: string;
  balance: number;
  branches?: { name: string };
}

interface Transaction {
  id: number;
  wallet_id: number;
  amount: number;
  type: string; // 'in' or 'out'
  category: string;
  description?: string;
  created_at: string;
}

export default function CashflowReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filters
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('last_month');
  
  const [stats, setStats] = useState({
     totalIn: 0,
     totalOut: 0,
     netFlow: 0,
     totalBalance: 0,
     cashBalance: 0,
     ewalletBalance: 0,
     bankBalance: 0,
     walletsTotal: 0,
     transfersCount: 0,
     transfersTotal: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);

  const fetchWalletsOnly = async (headers: any, userId: string) => {
    try {
       const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)${branchSuffix}`, { headers });
       if (wRes.ok) return await wRes.json();
    } catch(e) {}
    return [];
  };

  const fetchTransactionsOnly = async (headers: any, userId: string) => {
     let dateFilterStr = '';
     if (dateRange !== 'all') {
        const days = dateRange === 'today' ? 0 : dateRange === 'last_week' ? 7 : 30;
        const startDate = startOfDay(subDays(new Date(), days));
        dateFilterStr = `&created_at=gte.${startDate.toISOString()}`;
     }
     
     let walletFilterStr = '';
     if (selectedWallet !== 'all') {
        walletFilterStr = `&wallet_id=eq.${selectedWallet}`;
     }

     try {
       const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=*${dateFilterStr}${walletFilterStr}&order=created_at.desc${branchSuffix}`, { headers });
       if (txRes.ok) return await txRes.json();
     } catch(e) {}
     return [];
  };

  const loadData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id') || '';
    const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${localStorage.getItem('access_token') || SUPABASE_KEY}`
    };

    const wData = await fetchWalletsOnly(headers, userId);
    setWallets(wData);
    
    const txData = await fetchTransactionsOnly(headers, userId);
    setTransactions(txData);

    processReport(wData, txData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [dateRange, selectedWallet]);

  const handleApply = () => {
     loadData();
  };

  const processReport = (wData: WalletType[], txData: Transaction[]) => {
     let cBalance = 0;
     let eBalance = 0;
     let bBalance = 0;
     let totBalance = 0;

     const getNormalizedType = (t: string | undefined) => {
       if (t === 'bank' || t === 'حساب بنكي') return 'حساب بنكي';
       if (t === 'e_wallet' || t === 'محفظة إلكترونية') return 'محفظة إلكترونية';
       return 'كاش سائل';
     };

     const filteredWallets = selectedWallet === 'all' 
          ? wData 
          : wData.filter(w => w.id.toString() === selectedWallet);

     filteredWallets.forEach(w => {
        totBalance += w.balance || 0;
        const normType = getNormalizedType(w.type);
        if (normType === 'كاش سائل') cBalance += w.balance || 0;
        else if (normType === 'محفظة إلكترونية') eBalance += w.balance || 0;
        else if (normType === 'حساب بنكي') bBalance += w.balance || 0;
     });

     let tIn = 0;
     let tOut = 0;
     let trCount = 0;
     let trTotal = 0;

     // Calculate reverse running balance for the table
     let currentBalanceMap: Record<number, number> = {};
     wData.forEach(w => { currentBalanceMap[w.id] = w.balance || 0; });

     const processedTable: any[] = [];
     const dflow: Record<string, any> = {};

     // txData is ordered by created_at desc (newest first)
     txData.forEach(tx => {
        const amt = tx.amount || 0;
        if (tx.type === 'in') tIn += amt;
        if (tx.type === 'out') tOut += amt;
        if (tx.category === 'تحويل') {
           trCount++;
           trTotal += amt;
        }

        const dateStr = format(new Date(tx.created_at), 'yyyy-MM-dd');
        if (!dflow[dateStr]) {
            dflow[dateStr] = { date: format(new Date(tx.created_at), 'd/M'), 'كاش سائل': 0, 'محفظة إلكترونية': 0, 'حساب بنكي': 0, 'الإجمالي': 0 };
        }
        
        const wObj = wData.find(w => w.id === tx.wallet_id);
        const wType = getNormalizedType(wObj?.type);

        // Add to daily flow map
        if (tx.type === 'in') {
            dflow[dateStr][wType] += amt;
            dflow[dateStr]['الإجمالي'] += amt;
        } else {
            dflow[dateStr][wType] -= amt;
            dflow[dateStr]['الإجمالي'] -= amt;
        }

        // running balance simulation
        let tb = currentBalanceMap[tx.wallet_id] || 0;
        processedTable.push({
           ...tx,
           wallet_name: wObj?.name || 'محفظة مجهولة',
           running_balance: tb
        });

        // rollback the balance for the previous row
        if (tx.type === 'in') currentBalanceMap[tx.wallet_id] -= amt;
        if (tx.type === 'out') currentBalanceMap[tx.wallet_id] += amt;
     });

     // Reverse table to ascending for charting cumulative, but dflow is daily net.
     // To make chart cumulative like screenshot:
     const chartKeys = Object.keys(dflow).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
     
     // Let's compute a cumulative sum starting from (Current - Total Net of Period)
     let cumCash = cBalance - Object.values(dflow).reduce((s, d) => s + d['كاش سائل'], 0);
     let cumEwallet = eBalance - Object.values(dflow).reduce((s, d) => s + d['محفظة إلكترونية'], 0);
     let cumBank = bBalance - Object.values(dflow).reduce((s, d) => s + d['حساب بنكي'], 0);
     let cumTotal = totBalance - Object.values(dflow).reduce((s, d) => s + d['الإجمالي'], 0);

     const cumChartData: any[] = [];
     chartKeys.forEach(k => {
         cumCash += dflow[k]['كاش سائل'];
         cumEwallet += dflow[k]['محفظة إلكترونية'];
         cumBank += dflow[k]['حساب بنكي'];
         cumTotal += dflow[k]['الإجمالي'];
         
         cumChartData.push({
            date: dflow[k].date,
            'كاش سائل': cumCash > 0 ? cumCash : 0, 
            'محفظة إلكترونية': cumEwallet > 0 ? cumEwallet : 0,
            'حساب بنكي': cumBank > 0 ? cumBank : 0,
            'الإجمالي': cumTotal > 0 ? cumTotal : 0
         });
     });

     // Since the transfer logic in the system usually logs 2 transactions (one in, one out) for a transfer, 
     // the actual count of unique transfers is half the count of category='تحويل'. 
     // We will divide by 2 for accurate real-world representation.
     const actualTransfersCount = Math.floor(trCount / 2);
     const actualTransfersTotal = trTotal / 2;

     setStats({
        totalIn: tIn,
        totalOut: tOut,
        netFlow: tIn - tOut,
        totalBalance: totBalance,
        cashBalance: cBalance,
        ewalletBalance: eBalance,
        bankBalance: bBalance,
        walletsTotal: totBalance,
        transfersCount: actualTransfersCount || trCount, // fallback
        transfersTotal: actualTransfersTotal || trTotal
     });

     setChartData(cumChartData);
     setTableData(processedTable);
  };

  const handleExportExcel = () => {
     const wb = XLSX.utils.book_new();
     
     const dt = tableData.map((t, i) => ({
        '#': i + 1,
        'التاريخ': format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        'المحفظة': t.wallet_name,
        'النوع': t.type === 'in' ? 'إيداع' : 'سحب',
        'الوصف': t.description || t.category || '',
        'المبلغ': t.type === 'in' ? `+${t.amount}` : `-${t.amount}`,
        'الرصيد': t.running_balance
     }));

     const ws = XLSX.utils.json_to_sheet(dt);
     XLSX.utils.book_append_sheet(wb, ws, 'التدفقات_النقدية');
     XLSX.writeFile(wb, `تقرير_التدفق_النقدي_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Cashflow_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  return (
    <div className="space-y-6" dir="rtl">
       {/* Top Header & Filters */}
       <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
               <DollarSign className="w-8 h-8 text-emerald-500" />
               تقارير التدفق النقدي
             </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <select 
                  value={selectedWallet} 
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl appearance-none focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 font-bold min-w-[200px]"
                >
                   <option value="all">جميع المحافظ</option>
                   {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>
                   ))}
                </select>
                <Landmark className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
             </div>
             
             <button 
               onClick={handleExportPDF}
               className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-600 transition-all font-bold"
             >
               <Printer className="w-4 h-4" /> طباعة / PDF
             </button>
             <button 
               onClick={handleExportExcel}
               className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all font-bold"
             >
               <Download className="w-4 h-4" /> تصدير Excel
             </button>
          </div>
       </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير التدفقات النقدية"
        subtitle={`الفترة: ${dateRange} | المحفظة: ${selectedWallet === 'all' ? 'الكل' : wallets.find(w => w.id.toString() === selectedWallet)?.name}`}
        summary={[
          { label: 'إجمالي الرصيد الحالي', value: stats.totalBalance.toLocaleString(), isCurrency: true },
          { label: 'إجمالي الوارد (أثناء الفترة)', value: stats.totalIn.toLocaleString(), isCurrency: true },
          { label: 'إجمالي المنصرف (أثناء الفترة)', value: stats.totalOut.toLocaleString(), isCurrency: true },
          { label: 'صافي التدفق', value: stats.netFlow.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') },
          { header: 'النوع', accessor: (item) => item.type === 'in' ? 'إيداع' : 'سحب' },
          { header: 'المحفظة', accessor: 'wallet_name' },
          { header: 'القيمة', accessor: (item) => Number(item.amount).toLocaleString(), isNumeric: true },
          { header: 'الرصيد', accessor: (item) => Number(item.running_balance).toLocaleString(), isNumeric: true },
          { header: 'البيان', accessor: (item) => item.description || item.category || '-' }
        ]}
        data={tableData}
      />

       {/* Sub-header Filter Area */}
       <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex flex-wrap items-center gap-4 justify-end">
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-slate-600 dark:text-slate-400">الفترة</span>
             <select 
               value={dateRange} 
               onChange={(e) => setDateRange(e.target.value)}
               className="py-2 pl-4 pr-8 bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-hover/10 rounded-lg text-sm focus:outline-none font-bold text-slate-700 dark:text-slate-300"
             >
                <option value="today">اليوم</option>
                <option value="last_week">آخر أسبوع</option>
                <option value="last_month">آخر شهر</option>
                <option value="all">الكل</option>
             </select>
          </div>
          <button 
             onClick={handleApply}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
             تطبيق
          </button>
       </div>

       {/* KPIs Grid */}
       {isLoading ? (
          <div className="h-40 flex items-center justify-center">
             <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Top row */}
            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-t-4 border-emerald-500 border-x border-b border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">التدفقات الداخلة</span>
                 <ArrowDownRight className="w-6 h-6 text-emerald-500" />
               </div>
               <div className="text-3xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.totalIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-base text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-t-4 border-rose-500 border-x border-b border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">التدفقات الخارجة</span>
                 <ArrowUpRight className="w-6 h-6 text-rose-500" />
               </div>
               <div className="text-3xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.totalOut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-base text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-t-4 border-blue-500 border-x border-b border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">صافي التدفق</span>
                 <Activity className="w-6 h-6 text-blue-500" />
               </div>
               <div className="text-3xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.netFlow.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-base text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-t-4 border-amber-500 border-x border-b border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">إجمالي الرصيد</span>
                 <DollarSign className="w-6 h-6 text-amber-500" />
               </div>
               <div className="text-3xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-base text-slate-500">ج.م</span>
               </div>
            </div>

            {/* Bottom row */}
            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-l-4 border-emerald-400 border-y border-r border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">كاش سائل</span>
                 <DollarSign className="w-5 h-5 text-emerald-500" />
               </div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.cashBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-l-4 border-purple-400 border-y border-r border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">محفظة إلكترونية</span>
                 <CreditCard className="w-5 h-5 text-purple-500" />
               </div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.ewalletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-l-4 border-blue-400 border-y border-r border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">حساب بنكي</span>
                 <Landmark className="w-5 h-5 text-blue-500" />
               </div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.bankBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm text-slate-500">ج.م</span>
               </div>
            </div>

            <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-l-4 border-amber-400 border-y border-r border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-slate-500">إجمالي المحافظ</span>
                 <WalletCards className="w-5 h-5 text-amber-500" />
               </div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono break-words">
                  {stats.walletsTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm text-slate-500">ج.م</span>
               </div>
            </div>
          </div>
       )}

       {/* Summaries Panels */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-end gap-2">
                 ملخص التدفق النقدي <DollarSign className="w-5 h-5 text-emerald-500" />
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="font-mono font-bold text-emerald-500">{stats.totalIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">التدفقات الداخلة</span>
                 </div>
                 <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="font-mono font-bold text-rose-500">{stats.totalOut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">التدفقات الخارجة</span>
                 </div>
                 <div className="flex justify-between items-center py-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.netFlow.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">صافي التدفق</span>
                 </div>
              </div>
          </div>

          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-end gap-2">
                 التحويلات بين المحافظ <ArrowLeftRight className="w-5 h-5 text-blue-500" />
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.transfersCount}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">عدد التحويلات</span>
                 </div>
                 <div className="flex justify-between items-center py-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.transfersTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م</span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">إجمالي التحويلات</span>
                 </div>
              </div>
          </div>
       </div>

       {/* Line Chart */}
       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-indigo-400" /> اتجاه التدفق النقدي حسب المحفظة
          </h3>
          <div className="w-full h-[400px]" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                   itemStyle={{ color: '#e2e8f0' }}
                 />
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Line type="monotone" dataKey="كاش سائل" name="كاش سائل" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="محفظة إلكترونية" name="محفظة إلكترونية" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="حساب بنكي" name="حساب بنكي" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="الإجمالي" name="الإجمالي" stroke="#06b6d4" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 8 }} />
               </LineChart>
             </ResponsiveContainer>
          </div>
       </div>

       {/* Transactions Table */}
       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <FileText className="w-5 h-5 text-amber-500" /> حركات الخزينة
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-start whitespace-nowrap">
               <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                  <tr>
                     <th className="px-6 py-4">#</th>
                     <th className="px-6 py-4">التاريخ</th>
                     <th className="px-6 py-4">المحفظة</th>
                     <th className="px-6 py-4">النوع</th>
                     <th className="px-6 py-4">الوصف</th>
                     <th className="px-6 py-4">المبلغ</th>
                     <th className="px-6 py-4">الرصيد</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {tableData.map((t, i) => (
                     <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                           {format(new Date(t.created_at), 'yyyy/MM/dd')}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                           {t.wallet_name}
                        </td>
                        <td className="px-6 py-4">
                           {t.type === 'in' ? (
                              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">إيداع</span>
                           ) : (
                              <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold">سحب</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                           {t.description || t.category || 'بدون وصف'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold">
                           <span className={t.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}>
                              {t.type === 'in' ? '+' : '-'}{Number(t.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-black text-slate-800 dark:text-slate-200">
                           {Number(t.running_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م
                        </td>
                     </tr>
                  ))}
                  {tableData.length === 0 && !isLoading && (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm font-bold">
                           لا توجد حركات مالية لعرضها
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
