import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download, DollarSign, TrendingUp, Smartphone, Headphones, Wrench, BarChart3, PieChart as PieChartIcon, FileText, Printer, RotateCcw
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
const PIE_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#64748b'];

export default function SalesReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [salesItems, setSalesItems] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'آخر شهر', // 'all', 'month', 'week'
  });
  
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    devicesSales: 0,
    devicesCount: 0,
    accessoriesSales: 0,
    accessoriesCount: 0,
    sparePartsSales: 0, // POS + Maintenance
    sparePartsCount: 0,
    invoiceCount: 0,
    avgInvoiceValue: 0,
    totalReturns: 0,
    returnsCount: 0
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const [costMap, setCostMap] = useState<any>({ device: new Map(), accessory: new Map(), spare_part: new Map() });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${localStorage.getItem('access_token') || SUPABASE_KEY}`
      };

      const [res, devRes, accRes, spRes, returnsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Returns?select=*&order=created_at.desc${branchSuffix}`, { headers })
      ]);
      const data = res.ok ? await res.json() : [];
      const returnsData = (returnsRes && returnsRes.ok) ? await returnsRes.json() : [];
      
      const cMap = {
        device: new Map<string, number>(),
        accessory: new Map<string, number>(),
        spare_part: new Map<string, number>(),
      };

      if (devRes && devRes.ok) { const devs = await devRes.json(); devs.forEach((d: any) => cMap.device.set(String(d.id), d.cost_price || 0)); }
      if (accRes && accRes.ok) { const accs = await accRes.json(); accs.forEach((a: any) => cMap.accessory.set(String(a.id), a.cost_price || 0)); }
      if (spRes && spRes.ok) { const sps = await spRes.json(); sps.forEach((s: any) => cMap.spare_part.set(String(s.id), s.cost_price || 0)); }
      setCostMap(cMap);

      setInvoices(data);
      setSalesReturns(returnsData);
      processDashboard(data, returnsData, filters, cMap);
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoices.length > 0 || salesReturns.length > 0) {
      processDashboard(invoices, salesReturns, filters, costMap);
    }
  }, [filters, invoices, salesReturns, costMap]);

  const processDashboard = (data: any[], returnsList: any[], currentFilters: any, cMap: any) => {
    let filtered = data.filter((inv: any) => !['ملغي', 'مرفوض', 'مرتجع', 'draft'].includes(inv.status));
    let filteredReturns = returnsList || [];

    // Filter by period
    if (currentFilters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      filtered = filtered.filter(i => new Date(i.created_at) >= lastMonth);
      filteredReturns = filteredReturns.filter(r => new Date(r.created_at) >= lastMonth);
    } else if (currentFilters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      filtered = filtered.filter(i => new Date(i.created_at) >= lastWeek);
      filteredReturns = filteredReturns.filter(r => new Date(r.created_at) >= lastWeek);
    }

    let tSales = 0;
    let tCost = 0;
    
    let devSales = 0;
    let devCount = 0;
    
    let accSales = 0;
    let accCount = 0;
    
    let partSales = 0;
    let partCount = 0;

    const tMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      tMap[format(d, 'd/M')] = 0;
    }

    const typeCountMap: Record<string, number> = {};
    const extractedItems: any[] = [];

    filtered.forEach(inv => {
      // Trend
      const dStr = format(new Date(inv.created_at), 'd/M');
      if (tMap[dStr] !== undefined) {
        tMap[dStr] += Number(inv.total_amount || 0);
      }

      inv.Sales_Items?.forEach((item: any) => {
        const name = item.product_name || item.item_name || '';
        if (name.includes('(مرتجع)')) {
          // Skip returned sales items completely
          return;
        }

        const qty = Number(item.quantity || 1);
        const price = Number(item.total_price || ((item.unit_price || 0) * qty) || 0); // Handle total_price vs unit_price * qty if needed
        let cost = Number(item.cost_price || 0);
        
        const pType = item.product_type || item.item_type || 'device';
        const pId = String(item.product_id || item.item_id);

        if (cost === 0) {
           const unitCost = cMap[pType as keyof typeof cMap]?.get(pId) || 0;
           cost = unitCost * qty;
        }

        const profit = cost > 0 ? Math.max(price - cost, 0) : 0;

        tSales += price;
        tCost += cost;

        if (pType === 'device') {
            devSales += price;
            devCount += qty;
        } else if (pType === 'accessory') {
            accSales += price;
            accCount += qty;
        } else if (pType === 'spare_part') {
            partSales += price;
            partCount += qty;
        }

        const typeName = pType === 'device' ? 'الأجهزة' : pType === 'accessory' ? 'الإكسسوارات' : pType === 'spare_part' ? 'قطع الغيار' : 'أخرى';
        typeCountMap[typeName] = (typeCountMap[typeName] || 0) + price;

        extractedItems.push({
            id: item.id || Math.random(),
            invoice_id: inv.invoice_number,
            invoice_raw_id: inv.id,
            date: inv.created_at,
            customer: inv.customer_name || 'نقدي',
            product_name: item.product_name || item.item_name || 'منتج غير محدد',
            type: typeName,
            quantity: qty,
            price: price,
            profit: profit
        });
      });
    });

    let tReturns = 0;
    filteredReturns.forEach(ret => {
      const amount = Number(ret.refund_amount) || Number(ret.total_amount) || 0;
      tReturns += amount;

      const dStr = format(new Date(ret.created_at), 'd/M');
      if (tMap[dStr] !== undefined) {
         tMap[dStr] = Math.max(0, tMap[dStr] - amount);
      }

      const matchedInv = data.find((inv: any) => inv.invoice_number === ret.invoice_number);
      if (matchedInv && matchedInv.Sales_Items) {
        const matchedItem = matchedInv.Sales_Items.find((si: any) => {
           const siId = String(si.product_id || si.item_id || '');
           const retId = String(ret.product_id || ret.item_id || '');
           return siId && retId && siId === retId;
        });
        if (matchedItem) {
           const pQty = Number(matchedItem.quantity || 1);
           const retQty = Number(ret.quantity || ret.qty || pQty);
           
           let totalOriginalCost = Number(matchedItem.cost_price || 0);
           let unitCost = 0;
           if (totalOriginalCost > 0) {
               unitCost = totalOriginalCost / pQty;
           } else {
               const pType = matchedItem.product_type || matchedItem.item_type || 'device';
               unitCost = cMap[pType as keyof typeof cMap]?.get(String(ret.product_id || ret.item_id)) || 0;
           }
           const itemCost = (unitCost * retQty) || 0;
           
           tSales = Math.max(0, tSales - amount);
           tCost = Math.max(0, tCost - itemCost);

           const pType = matchedItem.product_type || matchedItem.item_type || 'device';
           const typeName = pType === 'device' ? 'الأجهزة' : pType === 'accessory' ? 'الإكسسوارات' : pType === 'spare_part' ? 'قطع الغيار' : 'أخرى';
           if (typeCountMap[typeName]) {
              typeCountMap[typeName] = Math.max(0, typeCountMap[typeName] - amount);
           }
           
           if (pType === 'device') {
              devSales = Math.max(0, devSales - amount);
              devCount = Math.max(0, devCount - retQty);
           } else if (pType === 'accessory') {
              accSales = Math.max(0, accSales - amount);
              accCount = Math.max(0, accCount - retQty);
           } else if (pType === 'spare_part') {
              partSales = Math.max(0, partSales - amount);
              partCount = Math.max(0, partCount - retQty);
           }
        }
      }
    });

    const tProfit = tSales - tCost;
    const pMargin = tSales > 0 ? (tProfit / tSales) * 100 : 0;

    setStats({
      totalSales: tSales,
      totalCost: tCost,
      totalProfit: tProfit,
      profitMargin: pMargin,
      devicesSales: devSales,
      devicesCount: devCount,
      accessoriesSales: accSales,
      accessoriesCount: accCount,
      sparePartsSales: partSales,
      sparePartsCount: partCount,
      invoiceCount: filtered.length,
      avgInvoiceValue: filtered.length > 0 ? tSales / filtered.length : 0,
      totalReturns: tReturns,
      returnsCount: filteredReturns.length
    });

    setTrendData(Object.keys(tMap).map(k => ({ date: k, الإيراد: tMap[k] })));
    
    const pData = Object.entries(typeCountMap).map(([name, value]) => ({ name, value }));
    if (pData.length === 0) pData.push({ name: 'لا توجد مبيعات', value: 1 });
    setTypeData(pData);

    setSalesItems(extractedItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: exportTemplateRef,
    documentTitle: `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    handlePrint();
  };

  const handleExportExcel = () => {
    const exportData = salesItems.map((item, index) => {
      return {
        '#': index + 1,
        'التاريخ': format(new Date(item.date), 'yyyy/MM/dd'),
        'رقم الفاتورة': item.invoice_id,
        'العميل': item.customer,
        'النوع': item.type,
        'المنتج': item.product_name,
        'الكمية': item.quantity,
        'الإجمالي': Number(item.price).toFixed(2),
        'الربح': Number(item.profit).toFixed(2)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير المبيعات');
    XLSX.writeFile(workbook, `تقارير_المبيعات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getTypeColor = (type: string) => {
      if (type === 'الأجهزة') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      if (type === 'الإكسسوارات') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      if (type === 'قطع غيار') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  };

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 animate-spin"></div>
             <div className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل تقارير المبيعات...</div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-amber-500" /> تقارير المبيعات
        </h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-4 mb-8 text-sm">
         <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">الفترة</span>
            <select 
               value={filters.period} 
               onChange={e => setFilters({...filters, period: e.target.value})}
               className="bg-slate-100 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
               <option value="الكل">الكل</option>
               <option value="آخر أسبوع">آخر أسبوع</option>
               <option value="آخر شهر">آخر شهر</option>
            </select>
         </div>
         <button onClick={() => setFilters({...filters})} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20">تطبيق</button>
         <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-500/30">
            <Printer className="w-4 h-4" /> طباعة / PDF
         </button>
         <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-500/30">
            <Download className="w-4 h-4" /> تصدير Excel
         </button>
      </div>

      <PrintReportTemplate
        ref={exportTemplateRef}
        title="تقرير المبيعات الشامل"
        subtitle={`الفترة: ${filters.period}`}
        summary={[
          { label: 'إجمالي المبيعات', value: stats.totalSales.toLocaleString(), isCurrency: true },
          { label: 'إجمالي المرتجعات', value: stats.totalReturns.toLocaleString(), isCurrency: true },
          { label: 'صافي المبيعات', value: (stats.totalSales - stats.totalReturns).toLocaleString(), isCurrency: true },
          { label: 'صافي الربح', value: stats.totalProfit.toLocaleString(), isCurrency: true },
          { label: 'هامش الربح', value: `${stats.profitMargin.toFixed(1)}%` },
          { label: 'عدد الفواتير', value: stats.invoiceCount }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.date), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'رقم الفاتورة', accessor: 'invoice_id' },
          { header: 'العميل', accessor: 'customer' },
          { header: 'النوع', accessor: 'type' },
          { header: 'المنتج', accessor: 'product_name' },
          { header: 'الكمية', accessor: 'quantity', isNumeric: true },
          { header: 'الإجمالي', accessor: (item) => Number(item.price).toLocaleString(), isNumeric: true },
          { header: 'الربح', accessor: (item) => Number(item.profit).toLocaleString(), isNumeric: true }
        ]}
        data={salesItems}
      />

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        
        {/* إجمالي المبيعات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-blue-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي المبيعات</h3>
            <div className="bg-blue-500/10 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-blue-500"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
             {stats.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal">ج.م</span>
          </h2>
        </div>

        {/* إجمالي المرتجعات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-rose-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي المرتجعات</h3>
            <div className="bg-rose-500/10 p-2 rounded-lg"><RotateCcw className="w-5 h-5 text-rose-500 animate-spin-slow"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-rose-500 mt-2">
             {stats.totalReturns.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal text-slate-500">ج.م</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2">{stats.returnsCount} عملية مرتجع</p>
        </div>

        {/* إجمالي الربح */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-purple-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي الربح</h3>
            <div className="bg-purple-500/10 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-500"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
             {stats.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal">ج.م</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2">هامش {stats.profitMargin.toFixed(1)}%</p>
        </div>

        {/* مبيعات الأجهزة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-sky-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">مبيعات الأجهزة</h3>
            <div className="bg-sky-500/10 p-2 rounded-lg"><Smartphone className="w-5 h-5 text-sky-500"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
             {stats.devicesSales.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal">ج.م</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2">{stats.devicesCount} جهاز</p>
        </div>

        {/* مبيعات الإكسسوارات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-indigo-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">مبيعات الإكسسوارات</h3>
            <div className="bg-indigo-500/10 p-2 rounded-lg"><Headphones className="w-5 h-5 text-indigo-500"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
             {stats.accessoriesSales.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal">ج.م</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2">{stats.accessoriesCount} عملية</p>
        </div>

        {/* قطع الغيار (POS + صيانة) */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group border-r-4 border-r-amber-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">قطع الغيار (POS)</h3>
            <div className="bg-amber-500/10 p-2 rounded-lg"><Wrench className="w-5 h-5 text-amber-500"/></div>
          </div>
          <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
             {stats.sparePartsSales.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-sm font-normal">ج.م</span>
          </h2>
          <p className="text-xs text-slate-500 mt-2">{stats.sparePartsCount} قطعة</p>
        </div>

      </div>

      {/* Middle Section: Summary & Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* ملخص المبيعات */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-end gap-2 mb-6">
                <h3 className="font-bold text-lg dark:text-white">ملخص المبيعات</h3>
                <DollarSign className="w-5 h-5 text-amber-500"/>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">إجمالي المبيعات</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.totalSales.toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-rose-500 font-medium">إجمالي المرتجعات</span>
                  <span className="font-bold font-mono text-rose-500">{stats.totalReturns.toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 bg-rose-50/10 dark:bg-rose-950/5 px-2 rounded-lg">
                  <span className="text-emerald-500 font-bold">صافي المبيعات (الفعلي)</span>
                  <span className="font-bold font-mono text-emerald-500">{(stats.totalSales - stats.totalReturns).toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">تكلفة البضاعة</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.totalCost.toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">إجمالي الربح</span>
                  <span className="font-bold font-mono text-emerald-500">{stats.totalProfit.toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">هامش الربح</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.profitMargin.toFixed(1)}%</span>
               </div>
            </div>
         </div>

         {/* إحصائيات */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-end gap-2 mb-6">
                <h3 className="font-bold text-lg dark:text-white">إحصائيات</h3>
                <BarChart3 className="w-5 h-5 text-emerald-500"/>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">عدد الفواتير</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.invoiceCount}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">متوسط الفاتورة</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.avgInvoiceValue.toLocaleString()} <span className="text-xs">ج.م</span></span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">أجهزة مباعة</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.devicesCount}</span>
               </div>
               <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">إكسسوارات مباعة</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{stats.accessoriesCount}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Line Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-end">
           <div className="flex items-center justify-end gap-2 mb-6">
              <h3 className="font-bold text-lg dark:text-white">المبيعات اليومية</h3>
              <TrendingUp className="w-5 h-5 text-blue-400"/>
           </div>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.05} vertical={false}/>
                 <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                   itemStyle={{ color: '#f8fafc' }}
                 />
                 <Line type="monotone" dataKey="الإيراد" stroke="#3b82f6" strokeWidth={3} dot={{r:3}} activeDot={{r:6, strokeWidth:0, fill: '#3b82f6'}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-end">
           <div className="flex items-center justify-end gap-2 mb-6">
              <h3 className="font-bold text-lg dark:text-white">المبيعات حسب النوع</h3>
              <PieChartIcon className="w-5 h-5 text-purple-400"/>
           </div>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={typeData}
                   cx="50%"
                   cy="50%"
                   innerRadius={70}
                   outerRadius={100}
                   paddingAngle={2}
                   dataKey="value"
                   stroke="none"
                 >
                   {typeData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                   itemStyle={{ color: '#f8fafc' }}
                   formatter={(value: number) => `${value.toLocaleString()} ج.م`}
                 />
                 <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden mb-8">
         <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 bg-slate-100 dark:bg-white/[0.02]">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-base dark:text-white text-right">
               تفاصيل المبيعات
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
               <thead className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                  <tr>
                     <th className="px-5 py-4">#</th>
                     <th className="px-5 py-4 font-medium">التاريخ</th>
                     <th className="px-5 py-4 font-medium">رقم الفاتورة</th>
                     <th className="px-5 py-4 font-medium">العميل</th>
                     <th className="px-5 py-4 font-medium">النوع</th>
                     <th className="px-5 py-4 font-medium text-center">المنتج</th>
                     <th className="px-5 py-4 font-medium text-center">الكمية</th>
                     <th className="px-5 py-4 font-medium">الإجمالي</th>
                     <th className="px-5 py-4 font-medium">الربح</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-transparent">
                  {salesItems.map((item, i) => {
                     return (
                     <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">{i + 1}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                            {format(new Date(item.date), 'yyyy/MM/dd')}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {item.invoice_id || `SAL-00000${item.invoice_raw_id}`}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                           {item.customer || 'نقدي'}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">
                           <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium border flex items-center justify-center w-max ${getTypeColor(item.type)}`}>
                             {item.type}
                           </span>
                        </td>
                        <td className="px-5 py-4 text-center text-slate-700 dark:text-slate-300">{item.product_name || 'غير متوفر'}</td>
                        <td className="px-5 py-4 font-mono text-center text-slate-900 dark:text-slate-100">{item.quantity}</td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">{Number(item.price).toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">{Number(item.profit).toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                     </tr>
                  )})}
                  
                  {salesItems.length === 0 && (
                     <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-500">لا توجد مبيعات في هذه الفترة</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
