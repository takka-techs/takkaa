import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Wallet, Users, Landmark, Activity,
  Briefcase, Plus, FileText, Download, Printer,
  Database, Server, CreditCard, ChevronDown, CheckCircle2,
  PieChart as PieChartIcon, TrendingUp, Laptop, Headphones, Settings, Package, DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// Chart colors
const PIE_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#ec4899', '#10b981', '#f59e0b'];
const BAR_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e'];

export default function CapitalReport() {
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [devicesData, setDevicesData] = useState({ count: 0, totalValue: 0 });
  const [accessoriesData, setAccessoriesData] = useState({ count: 0, totalValue: 0 });
  const [sparePartsData, setSparePartsData] = useState({ count: 0, totalValue: 0 });
  const [warehousesCount, setWarehousesCount] = useState(0);
  
  const [walletsData, setWalletsData] = useState({
    drawerCash: 0,
    liquidCash: 0,
    eWallets: 0,
    bankAccounts: 0,
    totalCash: 0
  });

  const [receivables, setReceivables] = useState<any[]>([]); // Customers with debts
  const [payables, setPayables] = useState<any[]>([]); // Suppliers with credits

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
    documentTitle: `Capital_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  useEffect(() => {
    fetchCapitalData();
  }, []);

  const fetchCapitalData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };

      // 1. Fetch Devices (Available only)
      const dRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=cost_price,status&or=(status.eq.متاح,status.eq.available)${branchSuffix}`, { headers });
      const devices = dRes.ok ? await dRes.json() : [];
      const devTotal = devices.reduce((sum: number, d: any) => sum + (Number(d.cost_price) || 0), 0);
      setDevicesData({ count: devices.length, totalValue: devTotal });

      // 2. Fetch Accessories
      const aRes = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=cost_price,quantity${branchSuffix}`, { headers });
      const accessories = aRes.ok ? await aRes.json() : [];
      let accCount = 0;
      let accTotal = 0;
      accessories.forEach((a: any) => {
         const qty = Number(a.quantity) || 0;
         accCount += qty;
         accTotal += (Number(a.cost_price) || 0) * qty;
      });
      setAccessoriesData({ count: accCount, totalValue: accTotal });

      // 3. Fetch Spare Parts
      const spRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=cost,quantity${branchSuffix}`, { headers });
      const spareParts = spRes.ok ? await spRes.json() : [];
      let spCount = 0;
      let spTotal = 0;
      spareParts.forEach((sp: any) => {
         const qty = Number(sp.quantity) || 0;
         spCount += qty;
         spTotal += (Number(sp.cost) || 0) * qty;
      });
      setSparePartsData({ count: spCount, totalValue: spTotal });

      // 4. Fetch Warehouses count
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let whUrl = `${SUPABASE_URL}/rest/v1/Warehouses?select=id`;
      if (activeBranchId) whUrl += `&branch_id=eq.${activeBranchId}`;
      else {
        const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
        if (tenantId) whUrl += `&tenant_id=eq.${tenantId}`;
      }
      const whRes = await fetch(whUrl, { headers });
      const warehouses = whRes.ok ? await whRes.json() : [];
      setWarehousesCount(warehouses.length);

      // 5. Fetch Wallets
      const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=balance,type${branchSuffix}`, { headers });
      const wallets = wRes.ok ? await wRes.json() : [];
      let drawer = 0, liquid = 0, ewallet = 0, bank = 0, totalC = 0;
      wallets.forEach((w: any) => {
         const bal = Number(w.balance) || 0;
         totalC += bal;
         // Assume basic classification mapping:
         if (w.type === 'cash' || !w.type) drawer += bal;
         else if (w.type === 'bank') bank += bal;
         else if (w.type === 'ewallet' || w.type === 'electronic' || w.type === 'e_wallet') ewallet += bal;
         else liquid += bal; // Other or liquid
      });
      setWalletsData({
         drawerCash: drawer,
         liquidCash: liquid,
         eWallets: ewallet,
         bankAccounts: bank,
         totalCash: totalC
      });

      // 6. Fetch Customers (Receivables)
      const cRes = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=id,name,phone,initial_balance,created_at${branchSuffix}`, { headers });
      const customers = cRes.ok ? await cRes.json() : [];
      const rec = customers.filter((c: any) => Number(c.initial_balance) > 0);
      setReceivables(rec);

      // 7. Fetch Suppliers (Payables)
      const sRes = await fetch(`${SUPABASE_URL}/rest/v1/suppliers?select=id,name,phone,initial_balance,created_at${branchSuffix}`, { headers });
      const suppliers = sRes.ok ? await sRes.json() : [];
      const pay = suppliers.filter((s: any) => Number(s.initial_balance) > 0);
      setPayables(pay);

    } catch (err) {
      console.error('Error fetching capital data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">جاري إعداد تقرير رأس المال...</p>
        </div>
      </div>
    );
  }

  // Derived values
  const receivablesTotal = receivables.reduce((sum, c) => sum + (Number(c.initial_balance) || 0), 0);
  const payablesTotal = payables.reduce((sum, s) => sum + (Number(s.initial_balance) || 0), 0);
  
  // Loans - mapped as 0.00 since there's no debts-on-us table currently
  const loansTotal = 0;
  const loansCount = 0;
  const storageValue = 0; // Following the mockup

  const totalAssets = devicesData.totalValue + accessoriesData.totalValue + sparePartsData.totalValue + storageValue + walletsData.totalCash + receivablesTotal;
  const totalLiabilities = payablesTotal + loansTotal;
  const netCapital = totalAssets - totalLiabilities;

  const pieData = [
    { name: 'مخزون الأجهزة', value: devicesData.totalValue },
    { name: 'مخزون الإكسسوارات', value: accessoriesData.totalValue },
    { name: 'قطع الغيار', value: sparePartsData.totalValue },
    { name: 'المخازن التخزينية', value: storageValue },
    { name: 'النقدية', value: walletsData.totalCash },
    { name: 'الذمم المدينة', value: receivablesTotal },
  ].filter(item => item.value > 0); // Only show non-zero in pie chart

  const barData = [
    { name: 'الأجهزة', value: devicesData.totalValue },
    { name: 'الإكسسوارات', value: accessoriesData.totalValue },
    { name: 'قطع الغيار', value: sparePartsData.totalValue },
    { name: 'النقدية', value: walletsData.totalCash },
    { name: 'الذمم المدينة', value: receivablesTotal },
    { name: 'ذمم الموردين', value: payablesTotal },
    { name: 'القروض', value: loansTotal },
    { name: 'رأس المال الصافي', value: netCapital }
  ];

  const handleExportExcel = () => {
     // Prepare simple summary for excel
     const summary = [
        { البند: 'إجمالي رأس المال الصافي', القيمة: netCapital },
        { البند: 'إجمالي الأصول', القيمة: totalAssets },
        { البند: 'إجمالي الالتزامات', القيمة: totalLiabilities },
        { البند: 'مخزون الأجهزة', القيمة: devicesData.totalValue },
        { البند: 'مخزون الإكسسوارات', القيمة: accessoriesData.totalValue },
        { البند: 'مخزن قطع الغيار', القيمة: sparePartsData.totalValue },
        { البند: 'إجمالي النقدية', القيمة: walletsData.totalCash },
        { البند: 'الذمم المدينة (لنا)', القيمة: receivablesTotal },
        { البند: 'الذمم الدائنة (علينا)', القيمة: payablesTotal }
     ];
     const ws = XLSX.utils.json_to_sheet(summary);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Capital Summary");
     XLSX.writeFile(wb, "capital_report.xlsx");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
        <h2 className="text-2xl flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100">
          <Landmark className="w-8 h-8 text-blue-500" />
          تقرير رأس المال
        </h2>
        <div className="flex items-center gap-3">
          <button 
             onClick={handleExportPDF} 
             className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium shadow-md shadow-indigo-500/20"
          >
            <Printer className="w-5 h-5" /> طباعة / PDF
          </button>
          <button 
             onClick={handleExportExcel}
             className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-5 h-5" /> تصدير Excel
          </button>
        </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير رأس المال"
        summary={[
          { label: 'إجمالي الأصول', value: totalAssets.toLocaleString(), isCurrency: true },
          { label: 'إجمالي الالتزامات', value: totalLiabilities.toLocaleString(), isCurrency: true },
          { label: 'رأس المال الصافي', value: netCapital.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'البند', accessor: 'item' },
          { header: 'القيمة', accessor: (item) => item.value ? item.value.toLocaleString() : '-', isNumeric: true }
        ]}
        data={[
          { item: 'مخزون الأجهزة', value: devicesData.totalValue },
          { item: 'مخزون الإكسسوارات', value: accessoriesData.totalValue },
          { item: 'مخزن قطع الغيار', value: sparePartsData.totalValue },
          { item: 'إجمالي النقدية', value: walletsData.totalCash },
          { item: 'الذمم المدينة (لنا)', value: receivablesTotal },
          { item: 'المخازن التخزينية', value: storageValue },
          { item: 'الذمم الدائنة (علينا)', value: payablesTotal },
          { item: 'القروض', value: loansTotal }
        ]}
      />

      {/* Main Total Big Info */}
      <div className="bg-white dark:bg-[#11151c] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
        <div className="absolute left-6 top-6">
           <Landmark className="w-12 h-12 text-blue-500/20" />
        </div>
        <div className="flex flex-col text-right">
           <span className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-2">إجمالي رأس المال</span>
           <div className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
              {totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-2xl text-slate-500 font-bold">ج.م</span>
           </div>
           <span className="text-sm text-slate-400 mt-2">مجموع كل الأصول</span>
        </div>
      </div>

      {/* Assets Breakdown Row - using flex-row-reverse behavior locally by explicitly setting orders if needed or just grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* الذمم المدينة */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">الذمم المدينة (الفلوس اللي لينا)</span>
                <CreditCard className="w-5 h-5 text-blue-500" />
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد العملاء المدينين</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{receivables.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">إجمالي المديونيات</span>
                    <span className="font-bold text-emerald-500 font-mono text-base">{receivablesTotal.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

          {/* النقدية */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">النقدية</span>
                <Wallet className="w-5 h-5 text-emerald-500" />
             </div>
             <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">الكاش في درج الكاش</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{walletsData.drawerCash.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">كاش سائل</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{walletsData.liquidCash.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">محفظة إلكترونية</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{walletsData.eWallets.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">حساب بنكي</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{walletsData.bankAccounts.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-slate-500">إجمالي الخزنة</span>
                    <span className="font-bold text-emerald-500 font-mono text-base">{walletsData.totalCash.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

          {/* المخازن التخزينية */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">المخازن التخزينية</span>
                <Package className="w-5 h-5 text-orange-500" />
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد المخازن التخزينية</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{warehousesCount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">قيمة البضاعة المخزنة</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono text-base">{storageValue.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

          {/* مخزن قطع الغيار */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">مخزن قطع الغيار</span>
                <Settings className="w-5 h-5 text-slate-500" />
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد الأصناف في المخزن</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{sparePartsData.count.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">تكلفة قطع الغيار</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono text-base">{sparePartsData.totalValue.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

          {/* مخزون الإكسسوارات */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">مخزون الإكسسوارات</span>
                <Headphones className="w-5 h-5 text-purple-500" />
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد الإكسسوارات في المخزن</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{accessoriesData.count.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">تكلفة الإكسسوارات</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono text-base">{accessoriesData.totalValue.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

          {/* مخزون الأجهزة */}
          <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold text-slate-800 dark:text-white">مخزون الأجهزة</span>
                <Laptop className="w-5 h-5 text-blue-700" />
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد الأجهزة في المخزن</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{devicesData.count}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">تكلفة الأجهزة (سعر الشراء)</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono text-base whitespace-nowrap">{devicesData.totalValue.toLocaleString()} ج.م</span>
                 </div>
             </div>
          </div>

      </div>

      {/* Liabilities Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* القروض والسلف */}
         <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-slate-500" />
                <span className="font-bold text-slate-800 dark:text-white">القروض والسلف (ديون علينا)</span>
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد القروض</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{loansCount}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">إجمالي القروض</span>
                    <span className="font-bold text-rose-500 font-mono text-base">{loansTotal.toLocaleString()} ج.م</span>
                 </div>
             </div>
         </div>

         {/* الذمم الدائنة */}
         <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="font-bold text-slate-800 dark:text-white">الذمم الدائنة (الفلوس اللي علينا)</span>
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">عدد الموردين الدائنين</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{payables.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">إجمالي المستحقات</span>
                    <span className="font-bold text-rose-500 font-mono text-base">{payablesTotal.toLocaleString()} ج.م</span>
                 </div>
             </div>
         </div>
      </div>

      {/* Net Capital Highlight */}
      <div className="bg-white dark:bg-[#11151c] p-8 rounded-3xl border-l-8 border-l-emerald-500 border border-slate-200 dark:border-white/5 shadow-sm relative relative overflow-hidden">
        <div className="absolute left-6 top-6">
           <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="flex flex-col text-right">
           <span className="text-slate-500 dark:text-slate-400 font-bold mb-2">رأس المال الصافي (بعد طرح الالتزامات)</span>
           <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
              {netCapital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-2xl text-slate-500 font-bold">ج.م</span>
           </div>
           <span className="text-sm text-slate-400 mt-2">إجمالي الأصول - إجمالي الالتزامات</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Bar Chart : تطور رأس المال */}
         <div className="bg-white dark:bg-[#11151c] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">تطور رأس المال</h3>
             </div>
             <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} />
                      <RechartsTooltip 
                         formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'القيمة']}
                         contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', textAlign: 'right' }} 
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                         {barData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
         </div>

         {/* Pie Chart : توزيع رأس المال */}
         <div className="bg-white dark:bg-[#11151c] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-2 mb-8">
                <PieChartIcon className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">توزيع رأس المال</h3>
             </div>
             <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={pieData}
                         cx="50%"
                         cy="50%"
                         innerRadius={70}
                         outerRadius={100}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                      </Pie>
                      <RechartsTooltip 
                         formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'القيمة']}
                         contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', textAlign: 'right' }} 
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                   </PieChart>
                </ResponsiveContainer>
             </div>
         </div>
      </div>

      {/* Details Tables Row */}
      <div className="grid grid-cols-1 gap-6">
         {/* تفاصيل الذمم المدينة */}
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" /> تفاصيل الذمم المدينة (الفلوس اللي لينا عند العملاء)
               </h3>
               <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-bold">
                  {receivables.length} عميل
               </span>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-start whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                     <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">العميل</th>
                        <th className="px-6 py-4">الهاتف</th>
                        <th className="px-6 py-4">المبلغ المستحق</th>
                        <th className="px-6 py-4">آخر معاملة</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                     {receivables.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد ذمم مدينة</td>
                        </tr>
                     ) : (
                        receivables.map((c, i) => (
                           <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{c.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-mono">{c.phone || '-'}</td>
                              <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900 dark:text-white">
                                 {Number(c.initial_balance).toLocaleString()} <span className="text-xs text-slate-400">ج.م</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                 {c.created_at ? format(new Date(c.created_at), 'yyyy/MM/dd') : '-'}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* تفاصيل الذمم الدائنة */}
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col border-r-4 border-r-rose-500">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500"></div> تفاصيل الذمم الدائنة (الفلوس اللي علينا للموردين)
               </h3>
               <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-sm font-bold">
                  {payables.length} مورد
               </span>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-start whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                     <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">المورد</th>
                        <th className="px-6 py-4">الهاتف</th>
                        <th className="px-6 py-4">المبلغ المستحق</th>
                        <th className="px-6 py-4">آخر معاملة</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                     {payables.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد ذمم دائنة</td>
                        </tr>
                     ) : (
                        payables.map((s, i) => (
                           <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{s.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-mono">{s.phone || '-'}</td>
                              <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900 dark:text-white">
                                 {Number(s.initial_balance).toLocaleString()} <span className="text-xs text-slate-400">ج.م</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                 {s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

      </div>

    </div>
  );
}
