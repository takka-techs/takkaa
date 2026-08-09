import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Download, Printer, Smartphone, Wrench, CircleDollarSign, CheckSquare, BarChart3,
  Search, FileText, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function DeviceReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [filters, setFilters] = useState({ state: 'الكل', brand: 'الكل', search: '' });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    availableCost: 0,
    sold: 0,
    soldTotal: 0,
    maintenance: 0,
    profit: 0
  });

  const [brandsData, setBrandsData] = useState<{name: string, count: number}[]>([]);
  const [statusData, setStatusData] = useState<{name: string, value: number, fill: string}[]>([]);

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
      const [devRes, whRes, salesRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Devices?order=created_at.desc${branchSuffix}`, { headers }),
        fetch(whUrl, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)${branchSuffix}`, { headers })
      ]);

      const devData = devRes.ok ? await devRes.json() : [];
      const whData = whRes.ok ? await whRes.json() : [];
      const salesData = salesRes.ok ? await salesRes.json() : [];

      const whMap: Record<string, string> = {};
      whData.forEach((w: any) => whMap[w.id] = w.name);

      const mappedDevices: any[] = devData.map((d: any) => ({
        ...d,
        warehouseName: d.warehouse_id ? (whMap[d.warehouse_id] || 'مخزن غير معروف') : 'مخزن الأجهزة'
      }));

      // Add Sold Devices from Sales_Invoices
      salesData.forEach((invoice: any) => {
         if (invoice.status === 'مرتجعة') return;
         invoice.Sales_Items?.forEach((item: any) => {
            if (item.product_type === 'device' || item.item_type === 'device' || item.type === 'device' || item.product_name?.toLowerCase().includes('جهاز')) {
               const pId = String(item.product_id || item.item_id);
               const existingIndex = mappedDevices.findIndex((d: any) => String(d.id) === pId);
               
               if (existingIndex !== -1) {
                  mappedDevices[existingIndex].status = 'sold';
                  mappedDevices[existingIndex].warehouseName = 'مباع';
               } else {
                  mappedDevices.push({
                    id: `sold-${item.id}`,
                    company: item.product_name || item.item_name || 'جهاز مباع',
                    model: '',
                    imei1: item.imei || '',
                    status: 'sold',
                    cost_price: (Number(item.cost_price || 0) / Number(item.quantity || 1)) || 0,
                    selling_price: (Number(item.total_price || ((item.unit_price || 0) * Number(item.quantity || 1)) || 0)) / Number(item.quantity || 1),
                    warehouseName: 'مباع',
                    created_at: invoice.created_at
                  });
               }
            }
         });
      });

      // Sort by created_at desc
      mappedDevices.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setDevices(mappedDevices);
      calculateStats(mappedDevices);

    } catch (err) {
      console.error('Error fetching device report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNormalizedStatus = (raw: string) => {
    if (!raw) return 'available';
    const lower = raw.toLowerCase();
    if (lower === 'متاح' || lower === 'available') return 'available';
    if (lower === 'مباع' || lower === 'sold') return 'sold';
    if (lower === 'صيانة' || lower === 'maintenance') return 'maintenance';
    if (lower === 'محجوز' || lower === 'reserved') return 'reserved';
    if (lower === 'مرتجع' || lower === 'returned') return 'returned';
    if (lower === 'on_installment') return 'on_installment';
    if (lower === 'sold_installment') return 'sold_installment';
    return lower;
  };

  const calculateStats = (data: any[]) => {
    let avail = 0, sld = 0, maint = 0, totalP = 0, soldTotalRevenue = 0, availableCostTotal = 0;
    
    const brandsCount: Record<string, number> = {};
    const statusCounts: Record<string, number> = { available: 0, sold: 0, maintenance: 0, reserved: 0, returned: 0, other: 0 };

    data.forEach(d => {
       const stat = getNormalizedStatus(d.status);
       
       if (stat === 'available') {
          avail++;
          availableCostTotal += Number(d.cost_price || 0);
       }
       else if (stat === 'sold') {
          sld++;
          const price = Number(d.selling_price || 0);
          let cost = Number(d.cost_price || 0);
          const currentProfit = cost > 0 ? (price - cost) : 0;
          totalP += currentProfit;
          soldTotalRevenue += price;
       }
       else if (stat === 'maintenance') maint++;

       const brand = d.company || 'أخرى';
       brandsCount[brand] = (brandsCount[brand] || 0) + 1;
       
       if (statusCounts[stat] !== undefined) {
         statusCounts[stat]++;
       } else {
         statusCounts.other++;
       }
    });

    setStats({
      total: data.length,
      available: avail,
      availableCost: availableCostTotal,
      sold: sld,
      soldTotal: soldTotalRevenue,
      maintenance: maint,
      profit: Math.max(0, totalP)
    });

    setBrandsData(Object.entries(brandsCount).map(([name, count]) => ({ name, count })));
    
    const sData = [];
    if (statusCounts.available > 0) sData.push({ name: 'متاح', value: statusCounts.available, fill: '#10b981' });
    if (statusCounts.sold > 0) sData.push({ name: 'مباع', value: statusCounts.sold, fill: '#3b82f6' });
    if (statusCounts.maintenance > 0) sData.push({ name: 'صيانة', value: statusCounts.maintenance, fill: '#f59e0b' });
    if (statusCounts.reserved > 0) sData.push({ name: 'محجوز', value: statusCounts.reserved, fill: '#a855f7' });
    if (statusCounts.returned > 0) sData.push({ name: 'مرتجع', value: statusCounts.returned, fill: '#ef4444' });
    if (statusCounts.other > 0) sData.push({ name: 'أخرى', value: statusCounts.other, fill: '#64748b' });
    
    // Fallback if empty
    if (sData.length === 0) sData.push({ name: 'لا يوجد', value: 1, fill: '#1e293b' });
    
    setStatusData(sData);
  };

  const handleExportExcel = () => {
    const exportData = filteredList.map((d, index) => {
      const isSold = getNormalizedStatus(d.status) === 'sold';
      const sel = Number(d.selling_price || 0);
      let cost = Number(d.cost_price || 0);
      const profit = isSold && cost > 0 ? (sel - cost) : 0;
      const displayProfit = isSold ? (cost > 0 ? profit : 'التكلفة غير متوفرة') : '';
      
      return {
        'م': index + 1,
        'الجهاز': `${d.company} ${d.model} ${d.storage && d.ram ? `${d.storage}/${d.ram}` : ''}`,
        'IMEI 1': d.imei1 || '',
        'IMEI 2': d.imei2 || '',
        'المخزن': d.warehouseName || '',
        'الحالة': d.status || '',
        'سعر الشراء': cost > 0 ? cost : 'التكلفة غير متوفرة',
        'سعر البيع': isSold ? sel : '',
        'الربح': displayProfit || '',
        'التاريخ': d.created_at ? format(new Date(d.created_at), 'yyyy/MM/dd') : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير الأجهزة');
    XLSX.writeFile(workbook, `تقارير_الأجهزة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Device_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const uniqueBrands = ['الكل', ...new Set(devices.map(d => d.company || 'أخرى'))];

  // Apply filters to data list
  const filteredList = devices.filter(d => {
    const s = getNormalizedStatus(d.status);
    let matchState = true;
    if (filters.state === 'متاح') matchState = s === 'available';
    else if (filters.state === 'مباع') matchState = s === 'sold';
    else if (filters.state === 'صيانة') matchState = s === 'maintenance';
    else if (filters.state === 'مرتجع') matchState = s === 'returned';

    const matchBrand = filters.brand === 'الكل' || d.company === filters.brand;
    const matchSearch = filters.search === '' || 
      (d.model && d.model.toLowerCase().includes(filters.search.toLowerCase())) ||
      (d.imei1 && d.imei1.includes(filters.search)) ||
      (d.imei2 && d.imei2.includes(filters.search));

    return matchState && matchBrand && matchSearch;
  });

  const renderStatusBadge = (rawStatus: string) => {
    const s = getNormalizedStatus(rawStatus);
    switch(s) {
      case 'available': return <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">متاح</span>;
      case 'sold': return <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded-full text-[10px]">مباع</span>;
      case 'returned': return <span className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 px-2 py-0.5 rounded-full text-[10px]">مرتجع</span>;
      case 'maintenance': return <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">صيانة</span>;
      case 'reserved': return <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-2 py-0.5 rounded-full text-[10px]">محجوز</span>;
      case 'on_installment': return <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-2 py-0.5 rounded-full text-[10px]">في التقسيط</span>;
      case 'sold_installment': return <span className="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 px-2 py-0.5 rounded-full text-[10px]">في التقسيط</span>;
      default: return <span className="bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20 px-2 py-0.5 rounded-full text-[10px]">{rawStatus || 'غير محدد'}</span>;
    }
  };

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl dark:border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
             <div className="text-indigo-600 dark:text-indigo-400 font-bold">جاري تحديث التقرير...</div>
          </div>
        </div>
      )}

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        
        {/* الربح من الأجهزة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">الربح من الأجهزة</h3>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stats.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h2>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
          </div>
        </div>

        {/* صيانة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
               <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">صيانة</h3>
            <div className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-xl border border-orange-100 dark:border-orange-500/20">
               <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.maintenance}
            </h2>
          </div>
        </div>

        {/* مباع */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">مباع</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
               <CircleDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.sold}
            </h2>
            <div className="flex items-baseline gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.soldTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span>ج.م</span>
            </div>
          </div>
        </div>

        {/* متاح للبيع */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">متاح للبيع</h3>
            </div>
            <div className="bg-teal-50 dark:bg-teal-500/10 p-2.5 rounded-xl border border-teal-100 dark:border-teal-500/20">
               <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.available}
            </h2>
            <div className="flex items-baseline gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.availableCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span>ج.م (تكلفة)</span>
            </div>
          </div>
        </div>

        {/* إجمالي الأجهزة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
               <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي الأجهزة</h3>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
               <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.total}
            </h2>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-6 mb-6 px-2 text-sm">
         <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 mb-1">الحالة:</span>
            <select 
               value={filters.state} 
               onChange={e => setFilters({...filters, state: e.target.value})}
               className="bg-transparent border-none text-slate-900 dark:text-white font-medium focus:ring-0 cursor-pointer"
            >
               <option className="bg-white dark:bg-[#161b22]">الكل</option>
               <option className="bg-white dark:bg-[#161b22]">متاح</option>
               <option className="bg-white dark:bg-[#161b22]">مباع</option>
               <option className="bg-white dark:bg-[#161b22]">صيانة</option>
               <option className="bg-white dark:bg-[#161b22]">مرتجع</option>
            </select>
         </div>
         <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-6">
            <span className="text-slate-600 dark:text-slate-400 mb-1">الماركة:</span>
            <select 
               value={filters.brand} 
               onChange={e => setFilters({...filters, brand: e.target.value})}
               className="bg-transparent border-none text-slate-900 dark:text-white font-medium focus:ring-0 cursor-pointer"
            >
               {uniqueBrands.map(b => (
                 <option key={b} className="bg-white dark:bg-[#161b22]">{b}</option>
               ))}
            </select>
         </div>
         <div className="relative border-r border-slate-200 dark:border-white/10 pr-6 mr-full pl-2 flex-grow sm:flex-grow flex items-center justify-between">
            <div className="flex items-center w-full max-w-sm">
               <span className="text-slate-600 dark:text-slate-400 ml-2 whitespace-nowrap">البحث:</span>
               <input 
                 type="text" 
                 placeholder="IMEI أو الموديل..." 
                 value={filters.search}
                 onChange={e => setFilters({...filters, search: e.target.value})}
                 className="w-full bg-transparent border-b border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none pb-1"
               />
            </div>
            
            <button 
               onClick={handleExportPDF}
               className="flex items-center justify-center gap-2 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 border border-slate-200 dark:border-white/10 text-white rounded-lg transition-colors font-medium mr-2 shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-4 h-4" />
              طباعة / PDF
            </button>
            <button 
               onClick={handleExportExcel}
               disabled={isLoading}
               className="flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium mr-auto"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير الأجهزة"
        subtitle={`الحالة: ${filters.state} | الماركة: ${filters.brand}`}
        summary={[
          { label: 'إجمالي الأجهزة', value: stats.total },
          { label: 'أجهزة متاحة', value: stats.available },
          { label: 'أجهزة مباعة', value: stats.sold },
          { label: 'إجمالي المبيعات', value: stats.soldTotal.toLocaleString(), isCurrency: true },
          { label: 'إجمالي الأرباح', value: stats.profit.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'الشركة', accessor: 'company' },
          { header: 'الموديل', accessor: 'model' },
          { header: 'المخزن', accessor: 'warehouseName' },
          { header: 'الحالة', accessor: (item) => getNormalizedStatus(item.status) },
          { header: 'التكلفة', accessor: (item) => {
              let cost = Number(item.cost_price || 0);
              return cost > 0 ? cost.toLocaleString() : 'التكلفة غير متوفرة';
          }, isCurrency: true },
          { header: 'سعر البيع', accessor: (item) => getNormalizedStatus(item.status) === 'sold' ? Number(item.selling_price || 0).toLocaleString() : '-' },
          { header: 'الربح', accessor: (item) => {
              const status = getNormalizedStatus(item.status);
              if (status === 'sold') {
                 const sel = Number(item.selling_price || 0);
                 let cost = Number(item.cost_price || 0);
                 if (cost === 0) return 'التكلفة غير متوفرة';
                 const profit = sel - cost;
                 return profit.toLocaleString();
              }
              return '-';
            }
          }
        ]}
        data={filteredList}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         {/* Bar Chart */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-none flex flex-col h-[300px]">
            <div className="flex justify-center items-center gap-2 mb-4">
               <h3 className="font-bold text-slate-800 dark:text-slate-200">توزيع الأجهزة حسب الماركة</h3>
               <BarChart3 className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1 w-full text-[11px] font-mono">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={true} tickLine={false} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                       contentStyle={{ backgroundColor: 'var(--tw-prose-body, #0f172a)', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                       cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="عدد الأجهزة" />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Donut Chart */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-none flex flex-col h-[300px]">
            <div className="flex justify-center items-center gap-2 mb-4">
               <h3 className="font-bold text-slate-800 dark:text-slate-200">توزيع الأجهزة حسب الحالة</h3>
               <PieChart className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 w-full flex justify-center text-xs">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                       data={statusData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={95}
                       paddingAngle={3}
                       dataKey="value"
                       stroke="none"
                     >
                       {statusData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                     </Pie>
                     <RechartsTooltip 
                       formatter={(value, name) => [value, name]}
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                       itemStyle={{ color: '#fff' }}
                     />
                     <Legend 
                       verticalAlign="bottom" 
                       height={36} 
                       iconType="square" 
                       wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-none overflow-hidden">
         <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2">
               <h3 className="font-bold text-slate-800 dark:text-slate-200">تفاصيل الأجهزة</h3>
               <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-500/20">
               {filteredList.length} جهاز
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 text-xs">
                  <tr>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">#</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">الجهاز</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">IMEI</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">المخزن</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">الحالة</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">سعر الشراء</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">سعر البيع</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">الربح</th>
                     <th className="py-4 px-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-left">التاريخ</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5 relative">
                  {filteredList.map((d, i) => {
                     const isSold = getNormalizedStatus(d.status) === 'sold';
                     const sel = Number(d.selling_price || 0);
                     let cost = Number(d.cost_price || 0);
                     const profit = isSold && cost > 0 ? (sel - cost) : 0;
                     
                     return (
                       <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{i + 1}</td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">{d.company} {d.model} {d.storage && d.ram ? `${d.storage}/${d.ram}` : ''}</td>
                          <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-xs">{d.imei1 || '-'}</td>
                          <td className="py-4 px-4 text-center">
                             <span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {d.warehouseName}
                             </span>
                          </td>
                          <td className="py-4 px-4 text-center">{renderStatusBadge(d.status)}</td>
                          <td className="py-4 px-4 text-center font-mono text-slate-600 dark:text-slate-200">
                             {cost > 0 ? `${cost.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م` : <span className="text-xs text-slate-400">غير متوفرة</span>}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-slate-600 dark:text-slate-200">{isSold ? `${sel.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م` : '-'}</td>
                          <td className="py-4 px-4 text-center">
                             {isSold ? (
                               cost > 0 ? <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span> : <span className="text-xs text-slate-400">غير متوفرة</span>
                             ) : '-'}
                          </td>
                          <td className="py-4 px-4 text-left font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                             {d.created_at ? format(new Date(d.created_at), 'yyyy/MM/dd') : '-'}
                          </td>
                       </tr>
                     );
                  })}
               </tbody>
            </table>
            
            {filteredList.length === 0 && !isLoading && (
               <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                  <Search className="w-8 h-8 opacity-20 mb-3" />
                  <p>لا توجد بيانات مطابقة لخيارات الفرز الحالية.</p>
               </div>
            )}
         </div>
      </div>

    </div>
  );
}
