import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download, Wrench, Package, DollarSign, TrendingUp, AlertTriangle, Search, Settings, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#64748b'];

export default function SparePartReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<Record<string, { qty: number, revenue: number, profit: number }>>({});
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  
  const [filters, setFilters] = useState({ category: 'الكل', warehouse: 'الكل', search: '' });
  
  // Stats
  const [stats, setStats] = useState({
    typesCount: 0,
    totalQty: 0,
    salesTotal: 0,
    profitTotal: 0,
    lowStock: 0,
    inventoryValue: 0
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

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

      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let whUrl = `${SUPABASE_URL}/rest/v1/Warehouses`;
      if (activeBranchId) whUrl += `?branch_id=eq.${activeBranchId}`;
      else {
        const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
        if (tenantId) whUrl += `?tenant_id=eq.${tenantId}`;
      }
      const [spareRes, whRes, salesRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?order=created_at.desc${branchSuffix}`, { headers }),
        fetch(whUrl, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)${branchSuffix}`, { headers })
      ]);

      const partsData = spareRes.ok ? await spareRes.json() : [];
      const whData = whRes.ok ? await whRes.json() : [];
      const invData = salesRes.ok ? await salesRes.json() : [];

      const whMap: Record<string, string> = {};
      whData.forEach((w: any) => whMap[w.id] = w.name);
      setWarehouses(whMap);

      const mappedParts = partsData.map((p: any) => ({
        ...p,
        warehouseName: p.warehouse_id ? (whMap[p.warehouse_id] || 'مخزن غير معروف') : 'مخزن قطع الغيار'
      }));

      setSpareParts(mappedParts);

      // Process Sales for trend and profit
      let sTotal = 0;
      let pTotal = 0;
      const tMap: Record<string, number> = {};
      
      // Initialize last 7 days for trend
      for(let i=6; i>=0; i--) {
         const d = new Date();
         d.setDate(d.getDate() - i);
         tMap[format(d, 'd/M')] = 0;
      }

      // Build costMap
      const sprCostMap = new Map();
      mappedParts.forEach((p: any) => sprCostMap.set(String(p.id), p.cost_price || 0));

      // We need to attach sales & profit to each spare part item for the table.
      const partPerformance: Record<string, { qty: number, revenue: number, profit: number }> = {};

      invData.forEach((inv: any) => {
         const isReturn = inv.status === 'مرتجعة';
         const dateStr = format(new Date(inv.created_at || new Date()), 'd/M');
         let daySalesObj = 0;

         inv.Sales_Items?.forEach((item: any) => {
            if (item.product_type === 'spare_part' || item.item_type === 'spare_part') {
               const qty = Number(item.quantity || 1);
               const price = Number(item.total_price || ((item.unit_price || 0) * qty) || 0);
               let cost = Number(item.cost_price || 0);
               
               if (cost === 0) {
                 const unitCost = sprCostMap.get(String(item.product_id || item.item_id)) || 0;
                 cost = unitCost * qty;
               }

               const profit = cost > 0 ? Math.max(price - cost, 0) : 0; 
               
               const factor = isReturn ? -1 : 1;

               sTotal += (price * factor);
               pTotal += (profit * factor);
               daySalesObj += (price * factor);

               const pId = String(item.product_id || item.item_id);
               if (!partPerformance[pId]) partPerformance[pId] = { qty: 0, revenue: 0, profit: 0 };
               partPerformance[pId].qty += (qty * factor);
               partPerformance[pId].revenue += (price * factor);
               partPerformance[pId].profit += (profit * factor);
            }
         });
         
         if (tMap[dateStr] !== undefined) {
             tMap[dateStr] += daySalesObj;
         }
      });
      
      setSalesData(partPerformance);

      // Calculate Stats based on inventory
      let types = new Set();
      let totalQ = 0;
      let lowS = 0;
      let invValue = 0;
      const catCount: Record<string, number> = {};

      mappedParts.forEach(p => {
         const q = Number(p.quantity || 0);
         totalQ += q;
         types.add(p.name);
         const minStock = Number(p.minimum_stock || 5);
         if (q <= minStock) lowS++; // Low stock threshold
         
         invValue += (Number(p.cost_price || 0) * q);

         const cat = p.category || 'غير مصنف';
         catCount[cat] = (catCount[cat] || 0) + 1;
      });

      setStats({
        typesCount: types.size,
        totalQty: totalQ,
        salesTotal: sTotal,
        profitTotal: pTotal,
        lowStock: lowS,
        inventoryValue: invValue
      });

      setTrendData(Object.keys(tMap).map(k => ({ date: k, المبيعات: tMap[k] })));
      
      const pData = Object.entries(catCount).map(([name, value]) => ({ name, value }));
      if (pData.length === 0) pData.push({ name: 'لا يوجد', value: 1 });
      setPieData(pData);

    } catch (err) {
      console.error('Error fetching spare parts report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredList.map((p, index) => {
      const pId = String(p.id);
      const perf = salesData[pId] || { qty: 0, revenue: 0, profit: 0 };
      
      return {
        'م': index + 1,
        'المنتج': p.name || '',
        'التصنيف': p.category || '',
        'المخزن': p.warehouseName || '',
        'الكمية المتبقية': p.quantity || 0,
        'سعر الشراء': p.cost_price || 0,
        'سعر البيع': p.selling_price || p.sell_price || 0,
        'الكمية المباعة': perf.qty || 0,
        'المبيعات': perf.revenue || 0,
        'الربح': perf.profit || 0
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير قطع الغيار');
    XLSX.writeFile(workbook, `تقارير_قطع_الغيار_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Spare_Part_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const uniqueCategories = ['الكل', ...new Set(spareParts.map(p => p.category || 'غير مصنف'))].filter(Boolean);
  const uniqueWarehouses = ['الكل', ...new Set(spareParts.map(p => p.warehouseName))].filter(Boolean);

  const filteredList = spareParts.filter(p => {
    const matchCat = filters.category === 'الكل' || (p.category || 'غير مصنف') === filters.category;
    const matchWh = filters.warehouse === 'الكل' || p.warehouseName === filters.warehouse;
    const matchSearch = filters.search === '' || 
      (p.name && p.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(filters.search));
    return matchCat && matchWh && matchSearch;
  });

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
             <div className="text-indigo-600 dark:text-indigo-400 font-bold">جاري تحديث التقرير...</div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold dark:text-white mb-2 md:mb-0">تقارير قطع الغيار</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30">
            <Printer className="w-4 h-4" /> طباعة / PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
        </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير قطع الغيار"
        subtitle={`التصنيف: ${filters.category} | المخزن: ${filters.warehouse}`}
        summary={[
          { label: 'أنواع القطع', value: stats.typesCount },
          { label: 'إجمالي الكميات', value: stats.totalQty },
          { label: 'إجمالي المبيعات', value: stats.salesTotal.toLocaleString(), isCurrency: true },
          { label: 'إجمالي الأرباح', value: stats.profitTotal.toLocaleString(), isCurrency: true },
          { label: 'نواقص', value: stats.lowStock }
        ]}
        columns={[
          { header: 'المنتج', accessor: 'name' },
          { header: 'التصنيف', accessor: 'category' },
          { header: 'المخزن', accessor: 'warehouseName' },
          { header: 'الكمية المتاحة', accessor: 'quantity', isNumeric: true },
          { header: 'سعر البيع', accessor: (item) => Number(item.selling_price || item.sell_price || 0).toLocaleString(), isCurrency: true },
          { header: 'القطع المباعة', accessor: (item) => ((salesData as any)[item.id] || { qty: 0 }).qty, isNumeric: true },
          { header: 'إجمالي المبيعات', accessor: (item) => ((salesData as any)[item.id] || { revenue: 0 }).revenue.toLocaleString(), isCurrency: true },
          { header: 'إجمالي الأرباح', accessor: (item) => ((salesData as any)[item.id] || { profit: 0 }).profit.toLocaleString(), isCurrency: true }
        ]}
        data={filteredList}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        
        {/* أنواع قطع الغيار */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">أنواع القطع</h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-600/30">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.typesCount}</h2>
          </div>
        </div>

        {/* إجمالي الكميات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col border-b-4 border-b-amber-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي الكميات</h3>
            <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-100 dark:border-amber-500/20">
              <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.totalQty}</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
               {stats.inventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م قيمة
            </div>
          </div>
        </div>

        {/* إجمالي المبيعات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
           <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">مبيعات القطع</h3>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
               <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${stats.salesTotal < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {stats.salesTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </h2>
               <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
          </div>
        </div>

        {/* الربح */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col border-b-4 border-b-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">الربح الصافي</h3>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
               <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${stats.profitTotal < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {stats.profitTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </h2>
               <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
          </div>
        </div>

        {/* مخزون منخفض */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col border-b-4 border-b-red-500">
           <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">مخزون منخفض</h3>
            <div className="bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl border border-red-100 dark:border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.lowStock}</h2>
          </div>
        </div>

      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-6 mb-8 mt-2 px-2 text-sm border-b border-slate-200 dark:border-white/5 pb-6">
         <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">التصنيف:</span>
            <select 
               value={filters.category} 
               onChange={e => setFilters({...filters, category: e.target.value})}
               className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
               {uniqueCategories.map(c => (
                 <option key={c} value={c}>{c}</option>
               ))}
            </select>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">المخزون:</span>
            <select 
               value={filters.warehouse} 
               onChange={e => setFilters({...filters, warehouse: e.target.value})}
               className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
               {uniqueWarehouses.map(w => (
                 <option key={w} value={w}>{w}</option>
               ))}
            </select>
         </div>
         <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[250px]">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="البحث: اسم القطعة أو الباركود..." 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="block w-full pl-3 pr-10 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#11151c] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Line Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg dark:text-white">مبيعات قطع الغيار</h3>
              <div className="bg-amber-500/10 text-amber-500 p-1.5 rounded-lg"><DollarSign className="w-4 h-4"/></div>
           </div>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.1} vertical={false}/>
                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend wrapperStyle={{ fontSize: '12px' }}/>
                 <Line type="monotone" dataKey="المبيعات" stroke="#f59e0b" strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r:6}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg dark:text-white">توزيع أنواع قطع الغيار</h3>
           </div>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend wrapperStyle={{ fontSize: '12px' }}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden mb-8">
         <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
               تفاصيل قطع الغيار <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full">{filteredList.length} قطعة</span>
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
               <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                     <th className="px-6 py-4">#</th>
                     <th className="px-6 py-4">المنتج</th>
                     <th className="px-6 py-4">التصنيف</th>
                     <th className="px-6 py-4">المخزن</th>
                     <th className="px-6 py-4">الكمية المتبقية</th>
                     <th className="px-6 py-4">سعر الشراء</th>
                     <th className="px-6 py-4">سعر البيع</th>
                     <th className="px-6 py-4">الكمية المباعة</th>
                     <th className="px-6 py-4">الربح</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredList.map((p, i) => {
                     const pId = String(p.id);
                     const perf = salesData[pId] || { qty: 0, revenue: 0, profit: 0 };
                     
                     return (
                     <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4">
                           <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-xs">
                              {p.category || 'عام'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.warehouseName}</td>
                        <td className="px-6 py-4 font-mono font-medium text-amber-600 dark:text-amber-400">{p.quantity}</td>
                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                           {Number(p.cost_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px]">ج.م</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                           {Number(p.selling_price || p.sell_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px]">ج.م</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                           {perf.qty} قطعه
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                           {perf.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px]">ج.م</span>
                        </td>
                     </tr>
                  )})}
                  
                  {filteredList.length === 0 && (
                     <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-500">لا توجد قطع غيار مطابقة لشروط البحث</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
