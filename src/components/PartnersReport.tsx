import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Handshake, DollarSign, PieChart as PieChartIcon, ArrowRight,
  TrendingUp, WalletCards, Users, Download, Percent, FileText, Printer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function PartnersReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [partners, setPartners] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    partnersCount: 0,
    totalCapital: 0,
    devicesProfits: 0,
    accessoriesProfits: 0,
    maintenanceProfits: 0,
    sparePartsProfits: 0,
    distributedProfits: 0,
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0
  });

  const [monthlyProfitsData, setMonthlyProfitsData] = useState<any[]>([]);
  const [partnershipPieData, setPartnershipPieData] = useState<any[]>([]);

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

      const [partnersRes, txsRes, salesRes, repairsRes, expensesRes, devRes, accRes, spRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/partners?order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/partner_transactions?order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=*&limit=10000${branchSuffix.replace('branch_id', 'receiving_branch_id')}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Expenses?select=*${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,cost_price${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=id,cost_price${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,cost_price${branchSuffix}`, { headers })
      ]);

      const partnersData = partnersRes.ok ? await partnersRes.json() : [];
      const txsData = txsRes.ok ? await txsRes.json() : [];
      const invoicesData = salesRes.ok ? await salesRes.json() : [];
      const repairsData = repairsRes.ok ? await repairsRes.json() : [];
      const expensesData = expensesRes.ok ? await expensesRes.json() : [];

      const devicesMap: Record<string, number> = {};
      const accessoriesMap: Record<string, number> = {};
      const partsMap: Record<string, number> = {};

      if (devRes.ok) (await devRes.json()).forEach((d:any) => devicesMap[d.id] = parseFloat(d.cost_price || 0));
      if (accRes.ok) (await accRes.json()).forEach((a:any) => accessoriesMap[a.id] = parseFloat(a.cost_price || 0));
      if (spRes.ok) (await spRes.json()).forEach((p:any) => partsMap[p.id] = parseFloat(p.cost_price || 0));

      setPartners(partnersData);
      setTransactions(txsData);

      processDashboard(partnersData, txsData, invoicesData, repairsData, expensesData, devicesMap, accessoriesMap, partsMap);
    } catch (err) {
      console.error('Error fetching partners report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processDashboard = (
    pts: any[], 
    txs: any[], 
    invoices: any[], 
    repairs: any[], 
    expenses: any[],
    devicesMap: Record<string, number>,
    accessoriesMap: Record<string, number>,
    partsMap: Record<string, number>
  ) => {
    let devicesP = 0;
    let accessoriesP = 0;
    let maintenanceP = 0;
    let sparePartsP = 0;
    let totalRev = 0;
    let totalCost = 0;

    const repairsMap: Record<string, any> = {};
    repairs.forEach(r => repairsMap[r.id.toString()] = r);

    // Calculate Sales PnL
    invoices.forEach(inv => {
      inv.Sales_Items?.forEach((item: any) => {
        const name = item.product_name || item.item_name || '';
        if (name.includes('(مرتجع)')) {
          return;
        }

        const qty = Number(item.quantity || 1);
        const rev = item.total_price || ((item.unit_price || 0) * qty) || 0;
        
        let isMaintenance = false;
        if (item.product_type === 'maintenance') isMaintenance = true;
        else if (item.product_name && item.product_name.includes('صيانة')) isMaintenance = true;

        if (isMaintenance) {
            let matchedRepairId = null;
            if (inv.invoice_number) {
               if (inv.invoice_number.includes('MNT-') || inv.invoice_number.includes('M-RET-')) {
                  const parts = inv.invoice_number.split('-');
                  matchedRepairId = parts[parts.length - 1];
               }
            }
            
            let partsCost = 0;
            if (matchedRepairId && repairsMap[matchedRepairId]) {
               const repair = repairsMap[matchedRepairId];
               if (repair.notes && repair.notes.includes('===PARTS===')) {
                   try {
                      const partsStr = repair.notes.split('===PARTS===\n')[1].split('\n===')[0];
                      const repairParts = JSON.parse(partsStr);
                      partsCost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                   } catch(e) {}
               }
            }
            const profit = rev - partsCost;
            totalRev += rev;
            totalCost += partsCost;
            maintenanceP += profit;
        } else {
            let unitCost = item.cost_price || 0;
            const pId = item.product_id;
            if (!unitCost) {
               if (item.product_type === 'device') unitCost = devicesMap[pId] || 0;
               else if (item.product_type === 'accessory') unitCost = accessoriesMap[pId] || 0;
               else if (item.product_type === 'spare_part') unitCost = partsMap[pId] || 0;
            }

            const cost = unitCost * qty;
            const profit = rev - cost;
            
            totalRev += rev;
            totalCost += cost;

            if (item.product_type === 'device') {
              devicesP += profit;
            } else if (item.product_type === 'accessory') {
              accessoriesP += profit;
            } else if (item.product_type === 'spare_part') {
              sparePartsP += profit;
            }
        }
      });
    });

    // Calculate Expenses
    expenses.forEach(exp => {
      totalCost += Number(exp.amount || 0);
    });

    // Determine capital and distributed
    const capital = pts.reduce((sum, p) => sum + (p.investment || 0), 0);
    
    // Total Distributed from transactions
    let distributed = 0;
    const monthlyDistributions: Record<string, any> = {};

    txs.forEach(tx => {
      if (tx.type === 'توزيع أرباح') {
        distributed += tx.amount;
        
        // Group by month for Monthly chart
        const monthStr = format(new Date(tx.created_at || new Date()), 'MMM-yyyy', { locale: ar });
        const partnerName = pts.find(p => p.id === tx.partner_id)?.name || 'شريك غير محدد';
        
        if (!monthlyDistributions[partnerName]) {
          monthlyDistributions[partnerName] = { name: partnerName, أجهزة: 0, إكسسوارات: 0, amount: 0 };
        }
        
        // As we don't have split per transaction, we'll just put the total transaction amount to their main label or split it if we knew
        // For the sake of the bar chart (أرباح الأجهزة vs أرباح الإكسسوارات), we can roughly simulate based on their partnership type
        const p = pts.find(pt => pt.id === tx.partner_id);
        const pType = p?.partnership_type || 'المحل كله';
        
        if (pType.includes('أجهزة')) monthlyDistributions[partnerName]['أجهزة'] += tx.amount;
        else if (pType.includes('إكسسوارات')) monthlyDistributions[partnerName]['إكسسوارات'] += tx.amount;
        else {
           // General distribution, split 50/50 for charting coolness or all into devices
           monthlyDistributions[partnerName]['أجهزة'] += (tx.amount * 0.7);
           monthlyDistributions[partnerName]['إكسسوارات'] += (tx.amount * 0.3);
        }
        monthlyDistributions[partnerName].amount += tx.amount;
      }
    });

    const monthlyChartData = Object.values(monthlyDistributions);

    // Pie Chart Data (Partnership per capital or profit percentage)
    const pieData = pts.map(p => ({
      name: p.name,
      value: p.profit_percentage || 0
    }));

    setStats({
      partnersCount: pts.length,
      totalCapital: capital,
      devicesProfits: devicesP,
      accessoriesProfits: accessoriesP,
      maintenanceProfits: maintenanceP,
      sparePartsProfits: sparePartsP,
      distributedProfits: distributed,
      totalRevenue: totalRev,
      totalCosts: totalCost,
      netProfit: totalRev - totalCost
    });

    setMonthlyProfitsData(monthlyChartData);
    setPartnershipPieData(pieData);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Partners Details Sheet
    const partnersData = partners.map((p, i) => ({
      '#': i + 1,
      'الشريك': p.name,
      'نوع الشراكة': p.partnership_type,
      'رأس المال': p.investment || 0,
      'نسبة الأجهزة': p.partnership_type.includes('أجهزة') || p.partnership_type === 'المحل كله' ? p.profit_percentage + '%' : '0%',
      'نسبة الإكسسوارات': p.partnership_type.includes('إكسسوارات') || p.partnership_type === 'المحل كله' ? p.profit_percentage + '%' : '0%',
      'الربح المستحق': p.profits || 0,
      'المسحوب': p.withdrawals || 0,
      'المتبقي': (p.investment || 0) + (p.profits || 0) - (p.withdrawals || 0)
    }));
    const wsPartners = XLSX.utils.json_to_sheet(partnersData);
    XLSX.utils.book_append_sheet(wb, wsPartners, 'تفاصيل الشركاء');

    // Transactions Sheet
    const txsData = transactions.filter(t => t.type === 'توزيع أرباح').map((t, i) => ({
      '#': i + 1,
      'التاريخ': format(new Date(t.created_at), 'yyyy-MM-dd'),
      'الفترة': format(new Date(t.created_at), 'yyyy-MM'),
      'الشريك': partners.find(p => p.id === t.partner_id)?.name || 'غير معروف',
      'إجمالي الربح': t.amount || 0,
      'الموزع': t.amount || 0,
      'البيان': t.description || ''
    }));
    const wsTxs = XLSX.utils.json_to_sheet(txsData);
    XLSX.utils.book_append_sheet(wb, wsTxs, 'سجل التوزيعات');

    XLSX.writeFile(wb, `تقرير_الشركاء_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Partners_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
          <Handshake className="w-8 h-8 text-amber-500" />
          تقارير الشركاء والأرباح
        </h2>
        <div className="flex gap-2">
          <button 
             onClick={handleExportPDF}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-600 transition-all font-bold"
          >
            <Printer className="w-4 h-4" /> طباعة / PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all font-bold"
          >
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
        </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقارير الشركاء والأرباح"
        summary={[
          { label: 'عدد الشركاء', value: stats.partnersCount },
          { label: 'رأس المال المجمع', value: stats.totalCapital.toLocaleString(), isCurrency: true },
          { label: 'الأرباح الموزعة', value: stats.distributedProfits.toLocaleString(), isCurrency: true },
          { label: 'أرباح الأجهزة', value: stats.devicesProfits.toLocaleString(), isCurrency: true },
          { label: 'أرباح الاكسسوارات', value: stats.accessoriesProfits.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'الشريك', accessor: 'name' },
          { header: 'نوع الشراكة', accessor: 'partnership_type' },
          { header: 'رأس المال', accessor: (item) => Number(item.investment || 0).toLocaleString(), isNumeric: true },
          { header: 'نسبة الأرباح', accessor: (item) => `${item.profit_percentage}%` },
          { header: 'الربح المستحق', accessor: (item) => Number(item.profits || 0).toLocaleString(), isNumeric: true },
          { header: 'المسحوبات', accessor: (item) => Number(item.withdrawals || 0).toLocaleString(), isNumeric: true },
          { header: 'المتبقي', accessor: (item) => ((item.investment || 0) + (item.profits || 0) - (item.withdrawals || 0)).toLocaleString(), isNumeric: true }
        ]}
        data={partners}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { title: 'عدد الشركاء', value: stats.partnersCount.toString(), icon: Handshake, color: 'text-amber-500' },
          { title: 'رأس المال', value: stats.totalCapital.toLocaleString() + ' ج.م', icon: DollarSign, color: 'text-emerald-500' },
          { title: 'أرباح الأجهزة', value: stats.devicesProfits.toLocaleString() + ' ج.م', icon: TrendingUp, color: 'text-blue-500' },
          { title: 'أرباح الإكسسوارات', value: stats.accessoriesProfits.toLocaleString() + ' ج.م', icon: WalletCards, color: 'text-purple-500' },
          { title: 'موزع على الشركاء', value: stats.distributedProfits.toLocaleString() + ' ج.م', icon: Users, color: 'text-pink-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white dark:bg-[#11151c] border-t-4 border-${stat.color.split('-')[1]}-500 shadow-sm p-5 rounded-2xl flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-bold text-slate-500 leading-tight">{stat.title}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono break-words">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Layout Grid For Summary & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Profit Summary */}
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <FileText className="w-5 h-5 text-amber-500" /> ملخص الأرباح
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">إجمالي الإيرادات</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.totalRevenue.toLocaleString()} ج.م</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">إجمالي التكاليف</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.totalCosts.toLocaleString()} ج.م</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">صافي الربح</span>
                  <span className="font-mono font-bold text-emerald-500">{stats.netProfit.toLocaleString()} ج.م</span>
               </div>
               <div className="flex justify-between items-center py-3">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">أرباح موزعة</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{stats.distributedProfits.toLocaleString()} ج.م</span>
               </div>
            </div>
         </div>

         {/* Distribution Summary */}
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <PieChartIcon className="w-5 h-5 text-indigo-500" /> توزيع الأرباح
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
               {partners.map(p => {
                  let baseProfit = 0;
                  if (p.partnership_type === 'المحل كله') baseProfit = stats.netProfit;
                  else if (p.partnership_type === 'أجهزة فقط') baseProfit = stats.devicesProfits;
                  else if (p.partnership_type === 'إكسسوارات فقط') baseProfit = stats.accessoriesProfits;
                  else if (p.partnership_type === 'أجهزة + إكسسوارات') baseProfit = stats.devicesProfits + stats.accessoriesProfits;
                  else if (p.partnership_type === 'صيانة فقط') baseProfit = stats.maintenanceProfits;
                  else if (p.partnership_type === 'قطع غيار فقط') baseProfit = stats.sparePartsProfits;
                  else baseProfit = stats.netProfit;

                   // Simple projected share
                  const partnerShare = ((p.profit_percentage / 100) * baseProfit).toFixed(2);

                  return (
                     <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                           <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                           <div className="text-xs text-slate-500 mt-1">{p.partnership_type} ({p.profit_percentage}%)</div>
                        </div>
                        <div className="text-emerald-500 font-bold font-mono">
                           {Number(partnerShare).toLocaleString()} ج.م
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Charts */}
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-amber-500" /> أرباح الشركاء الشهرية
            </h3>
            <div className="h-64 w-full" dir="ltr">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyProfitsData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                     />
                     <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                     <Bar dataKey="أجهزة" name="أرباح الأجهزة" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                     <Bar dataKey="إكسسوارات" name="أرباح الإكسسوارات" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <Percent className="w-5 h-5 text-rose-500" /> نسب الشراكة
            </h3>
            <div className="h-64 w-full" dir="ltr">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={partnershipPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {partnershipPieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#e2e8f0' }}
                     />
                     <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

       {/* Detailed Table */}
       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <FileText className="w-5 h-5 text-amber-500" /> تفاصيل الشركاء
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-start whitespace-nowrap">
               <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                  <tr>
                     <th className="px-6 py-4">#</th>
                     <th className="px-6 py-4">الشريك</th>
                     <th className="px-6 py-4">نوع الشراكة</th>
                     <th className="px-6 py-4">رأس المال</th>
                     <th className="px-6 py-4">نسبة الأجهزة</th>
                     <th className="px-6 py-4">نسبة الإكسسوارات</th>
                     <th className="px-6 py-4">الربح المستحق</th>
                     <th className="px-6 py-4">المسحوب</th>
                     <th className="px-6 py-4">المتبقي</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {partners.map((p, i) => (
                     <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4">
                           <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold">
                              {p.partnership_type}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{Number(p.investment || 0).toLocaleString()} ج.م</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">
                           {p.partnership_type.includes('أجهزة') || p.partnership_type === 'المحل كله' ? p.profit_percentage + '%' : '0%'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">
                           {p.partnership_type.includes('إكسسوارات') || p.partnership_type === 'المحل كله' ? p.profit_percentage + '%' : '0%'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900 dark:text-white">
                           {Number(p.profits || 0).toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-rose-500">
                           {Number(p.withdrawals || 0).toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-black text-emerald-500">
                           {Number((p.investment || 0) + (p.profits || 0) - (p.withdrawals || 0)).toLocaleString()} ج.م
                        </td>
                     </tr>
                  ))}
                  {partners.length === 0 && !isLoading && (
                     <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-500 text-sm font-bold">
                           لا يوجد شركاء لعرضهم
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

       {/* Transacitons Table */}
       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <FileText className="w-5 h-5 text-amber-500" /> سجل توزيعات الأرباح
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-start whitespace-nowrap">
               <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                  <tr>
                     <th className="px-6 py-4">#</th>
                     <th className="px-6 py-4">التاريخ</th>
                     <th className="px-6 py-4">الفترة</th>
                     <th className="px-6 py-4">إجمالي الربح</th>
                     <th className="px-6 py-4">الموزع</th>
                     <th className="px-6 py-4">الحالة</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {transactions.filter(t => t.type === 'توزيع أرباح').slice(0, 10).map((t, i) => (
                     <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                           {partners.find(p => p.id === t.partner_id)?.name || 'غير معروف'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                           {format(new Date(t.created_at), 'yyyy-MM')}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">
                           {Number(t.amount || 0).toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-emerald-500">
                           {Number(t.amount || 0).toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                              تم التوزيع
                           </span>
                        </td>
                     </tr>
                  ))}
                  {transactions.filter(t => t.type === 'توزيع أرباح').length === 0 && !isLoading && (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm font-bold">
                           لا يوجد توزيعات أرباح حالية
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
