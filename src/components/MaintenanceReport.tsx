import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download, Wrench, Package, DollarSign, TrendingUp, AlertTriangle, Search, Settings, FileText, Lock, Unlock, CreditCard, Activity, PenTool, Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
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
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function MaintenanceReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'يعد الكل', // 'all', 'month', 'week'
    status: 'الكل',
  });
  
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalCost: 0,
    netProfit: 0,
    avgTicketValue: 0,
    openTickets: 0,
    closedTickets: 0 // financially closed (paid_amount >= total_amount)
  });

  const [trendType, setTrendType] = useState<'revenue' | 'collections'>('revenue');

  const [trendData, setTrendData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [techData, setTechData] = useState<any[]>([]);

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

      let repairsData = [];
      try {
        let hasMore = true;
        let lastId = null;
        let totalFetched = 0;
        const pageSize = 1000;
        const repairsUrl = `${SUPABASE_URL}/rest/v1/Repairs?order=id.desc&limit=${pageSize}${branchSuffix.replace('branch_id', 'receiving_branch_id')}`;

        while (hasMore) {
          const fetchUrl = lastId ? `${repairsUrl}&id=lt.${lastId}` : repairsUrl;
          const res = await fetch(fetchUrl, { headers });
          if (res.ok) {
            const data = await res.json();
            repairsData = [...repairsData, ...data];
            totalFetched += data.length;
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              lastId = data[data.length - 1].id;
              if (totalFetched >= 30000) hasMore = false;
            }
          } else {
            console.error('Failed to fetch repairs', await res.text());
            hasMore = false;
          }
        }
      } catch (err) {
        console.error('Repairs fetch error', err);
      }

      setRepairs(repairsData);
      processDashboard(repairsData, filters);
    } catch (err) {
      console.error('Error fetching maintenance report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (repairs.length > 0) {
      processDashboard(repairs, filters);
    }
  }, [filters, repairs]);

  const processDashboard = (data: any[], currentFilters: any) => {
    let filtered = data;

    // Filter by period
    if (currentFilters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      filtered = filtered.filter(r => new Date(r.created_at) >= lastMonth);
    } else if (currentFilters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      filtered = filtered.filter(r => new Date(r.created_at) >= lastWeek);
    }

    // Filter by status
    if (currentFilters.status !== 'الكل') {
      filtered = filtered.filter(r => (r.status || 'مستلم') === currentFilters.status);
    }

    let tRev = 0;
    let tCol = 0;
    let tCost = 0;
    let tProfit = 0;
    let openCount = 0;
    let closedCount = 0;

    const tMap: Record<string, { rev: number, col: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      tMap[format(d, 'd/M')] = { rev: 0, col: 0 };
    }

    const sMap: Record<string, number> = {};
    const techMap: Record<string, { count: number, revenue: number, cost: number, profit: number }> = {};

    filtered.forEach(r => {
      const total = Number(r.total_amount || 0);
      const paid = Number(r.paid_amount || 0);
      let cost = 0;
      let hasParsedCost = false;

      if (r.notes && r.notes.includes('===PARTS===')) {
          try {
             const partsStr = r.notes.split('===PARTS===\n')[1].split('\n===')[0];
             const repairParts = JSON.parse(partsStr);
             cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
             hasParsedCost = true;
          } catch(e) {}
      }

      if (!hasParsedCost) {
         cost = Number(r.spare_parts_cost || 0);
      }

      const profit = total > 0 ? total - cost : 0;
      
      tRev += total;
      tCol += paid;
      tCost += cost;
      tProfit += profit;

      if (paid >= total && total > 0 && r.status === 'تم الانتهاء') {
        closedCount++;
      } else {
        openCount++;
      }

      // Trend
      const dStr = format(new Date(r.created_at), 'd/M');
      if (tMap[dStr] !== undefined) {
        tMap[dStr].rev += total;
        tMap[dStr].col += paid;
      }

      // Status Pie
      const stat = r.status || 'مستلم';
      sMap[stat] = (sMap[stat] || 0) + 1;

      // Tech Data
      const tech = r.technician_name || '— بدون فني —';
      if (!techMap[tech]) techMap[tech] = { count: 0, revenue: 0, cost: 0, profit: 0 };
      techMap[tech].count += 1;
      techMap[tech].revenue += total;
      techMap[tech].cost += cost;
      techMap[tech].profit += profit;
    });

    setStats({
      totalTickets: filtered.length,
      totalRevenue: tRev,
      totalCollected: tCol,
      totalCost: tCost,
      netProfit: tProfit,
      avgTicketValue: filtered.length > 0 ? tRev / filtered.length : 0,
      openTickets: openCount,
      closedTickets: closedCount
    });

    setTrendData(Object.keys(tMap).map(k => ({ date: k, الإيراد: tMap[k].rev, التحصيلات: tMap[k].col })));
    
    setTechData(Object.keys(techMap).map(k => ({ name: k, count: techMap[k].count, rev: techMap[k].revenue, cost: techMap[k].cost, profit: techMap[k].profit })));

    const pData = Object.entries(sMap).map(([name, value]) => ({ name, value }));
    if (pData.length === 0) pData.push({ name: 'لا يوجد تذاكر', value: 1 });
    setStatusData(pData);
  };

  const clearFilters = () => {
    setFilters({ period: 'الكل', status: 'الكل' });
  };

  const handleExportExcel = () => {
    const exportData = repairs.map((r, index) => {
      const isFinanciallyClosed = Number(r.paid_amount || 0) >= Number(r.total_amount || 0) && Number(r.total_amount || 0) > 0 && r.status === 'تم الانتهاء';
      const total = Number(r.total_amount || 0);
      const paid = Number(r.paid_amount || 0);
      let cost = 0;
      let hasParsedCost = false;
      
      if (r.notes && r.notes.includes('===PARTS===')) {
          try {
             const partsStr = r.notes.split('===PARTS===\n')[1].split('\n===')[0];
             const repairParts = JSON.parse(partsStr);
             cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
             hasParsedCost = true;
          } catch(e) {}
      }

      if (!hasParsedCost) {
         cost = Number(r.spare_parts_cost || 0);
      }
      
      const profit = total > 0 ? total - cost : 0;
      
      return {
        '#': index + 1,
        'رقم التذكرة': `R-${new Date(r.created_at).getFullYear()}${new Date(r.created_at).getMonth()+1}-${r.id.toString().padStart(5, '0')}`,
        'العميل': r.customer_name || 'غير محدد',
        'الجهاز / الموديل': r.device_name || '-',
        'الفني': r.technician_name || '— بدون فني —',
        'الحالة': r.status || 'مستلم',
        'الإجمالي (ج.م)': total.toFixed(2),
        'التكلفة (ج.م)': cost.toFixed(2),
        'الربح (ج.م)': profit.toFixed(2),
        'المدفوع (ج.م)': paid.toFixed(2),
        'المتبقي (ج.م)': (total - paid).toFixed(2),
        'مقفولة مالياً': isFinanciallyClosed ? 'نعم' : 'لا',
        'تاريخ الإنشاء': format(new Date(r.created_at), 'yyyy/MM/dd'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير إدارة الصيانة');
    XLSX.writeFile(workbook, `تقارير_الصيانة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    documentTitle: `Maintenance_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم الانتهاء': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'قيد المعالجة': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'رفض الإصلاح': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'مستلم': default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const uniqueStatuses = ['الكل', ...new Set(repairs.map(r => r.status || 'مستلم'))].filter(Boolean);

  let displayRepairs = repairs;
  if (filters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      displayRepairs = displayRepairs.filter(r => new Date(r.created_at) >= lastMonth);
  } else if (filters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      displayRepairs = displayRepairs.filter(r => new Date(r.created_at) >= lastWeek);
  }
  if (filters.status !== 'الكل') {
      displayRepairs = displayRepairs.filter(r => (r.status || 'مستلم') === filters.status);
  }

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-slate-500 animate-spin"></div>
             <div className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل بيانات الصيانة...</div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-slate-500" /> تقارير إدارة الصيانة
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={handleExportPDF}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-500/20"
           >
             <Printer className="w-4 h-4" /> طباعة / PDF
           </button>
           <button 
             onClick={handleExportExcel}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
           >
             <Download className="w-4 h-4" /> تصدير Excel
           </button>
        </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقارير إدارة الصيانة"
        subtitle={`الفترة: ${filters.period} | الحالة: ${filters.status}`}
        summary={[
          { label: 'إجمالي التذاكر', value: stats.totalTickets },
          { label: 'تذاكر مفتوحة', value: stats.openTickets },
          { label: 'إجمالي الإيرادات', value: stats.totalRevenue.toLocaleString(), isCurrency: true },
          { label: 'إجمالي التكلفة', value: stats.totalCost.toLocaleString(), isCurrency: true },
          { label: 'صافي الربح', value: stats.netProfit.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'العميل', accessor: (item) => item.customer_name || 'غير محدد' },
          { header: 'الجهاز / الموديل', accessor: (item) => item.device_name || '-' },
          { header: 'الفني', accessor: (item) => item.technician_name || '— بدون فني —' },
          { header: 'الحالة', accessor: (item) => item.status || 'مستلم' },
          { header: 'الإجمالي', accessor: (item) => Number(item.total_amount || 0).toLocaleString(), isNumeric: true },
          { header: 'الربح', accessor: (item) => {
              const total = Number(item.total_amount || 0);
              let cost = 0;
              let hasParsedCost = false;

              if (item.notes && item.notes.includes('===PARTS===')) {
                  try {
                     const partsStr = item.notes.split('===PARTS===\n')[1].split('\n===')[0];
                     const repairParts = JSON.parse(partsStr);
                     cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                     hasParsedCost = true;
                  } catch(e) {}
              }

              if (!hasParsedCost) {
                 cost = Number(item.spare_parts_cost || 0);
              }
              return total > 0 ? (total - cost).toLocaleString() : '0';
          }, isNumeric: true },
          { header: 'المدفوع', accessor: (item) => Number(item.paid_amount || 0).toLocaleString(), isNumeric: true }
        ]}
        data={displayRepairs}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-4 mb-8 text-sm">
         <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">الفترة</span>
            <select 
               value={filters.period} 
               onChange={e => setFilters({...filters, period: e.target.value})}
               className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
               <option value="الكل">الكل</option>
               <option value="آخر أسبوع">آخر أسبوع</option>
               <option value="آخر شهر">آخر شهر</option>
            </select>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">حالة التذكرة</span>
            <select 
               value={filters.status} 
               onChange={e => setFilters({...filters, status: e.target.value})}
               className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
               {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <button onClick={() => setFilters({...filters})} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all">تطبيق</button>
         <button onClick={clearFilters} className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-all border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1.5">مسح الفلاتر</button>
         <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-emerald-500/30">
            <Download className="w-4 h-4" /> تصدير Excel
         </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        
        {/* عدد تذاكر الصيانة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-slate-400"></div>
          <FileText className="w-5 h-5 text-slate-400 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">تذاكر الصيانة</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalTickets}</h2>
        </div>

        {/* إجمالي الإيراد */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
          <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">إجمالي الإيراد</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {/* تكلفة قطع الغيار */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
          <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">تكلفة القطع</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {/* صافي الربح */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-1 h-full ${stats.netProfit < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <TrendingUp className={`w-5 h-5 mb-2 ${stats.netProfit < 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">صافي الربح</h3>
          <h2 className={`text-lg font-bold font-mono ${stats.netProfit < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{stats.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {/* إجمالي التحصيلات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-teal-400"></div>
          <CreditCard className="w-5 h-5 text-teal-400 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">التحصيلات</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalCollected.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {/* متوسط قيمة التذكرة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
          <Activity className="w-5 h-5 text-purple-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">متوسط قيمة التذكرة</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.avgTicketValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {/* التذاكر المفتوحة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
          <Unlock className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">التذاكر المفتوحة</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.openTickets}</h2>
        </div>

        {/* المقفولة مالياً */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-slate-800 dark:bg-slate-500"></div>
          <Lock className="w-5 h-5 text-slate-800 dark:text-slate-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">المقفولة مالياً</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.closedTickets}</h2>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Line Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-blue-400"/>
                 <h3 className="font-bold text-lg dark:text-white">اتجاه التدفق المالي</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                 <button onClick={() => setTrendType('revenue')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${trendType === 'revenue' ? 'bg-white dark:bg-[#161b22] text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>الإيرادات</button>
                 <button onClick={() => setTrendType('collections')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${trendType === 'collections' ? 'bg-white dark:bg-[#161b22] text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>التحصيلات</button>
              </div>
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
                 <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}/>
                 <Line type="monotone" dataKey={trendType === 'revenue' ? "الإيراد" : "التحصيلات"} stroke={trendType === 'revenue' ? "#3b82f6" : "#2dd4bf"} strokeWidth={3} dot={{r:0}} activeDot={{r:5, strokeWidth:0, fill: trendType === 'revenue' ? '#3b82f6' : '#2dd4bf'}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-end gap-2 mb-6">
              <h3 className="font-bold text-lg dark:text-white">توزيع الحالات</h3>
              <Activity className="w-5 h-5 text-purple-400"/>
           </div>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={70}
                   outerRadius={100}
                   paddingAngle={2}
                   dataKey="value"
                   stroke="none"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                   itemStyle={{ color: '#f8fafc' }}
                 />
                 <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Tech Breakdown Table */}
      <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden mb-6">
         <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-end gap-2 bg-slate-100 dark:bg-white/[0.02]">
            <h3 className="font-bold text-base dark:text-white">تذاكر حسب الفني</h3>
            <PenTool className="w-4 h-4 text-purple-500" />
         </div>
         <div className="p-0">
               <table className="w-full text-sm text-right">
                <thead className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                   <tr>
                      <th className="px-6 py-3">الفني</th>
                      <th className="px-6 py-3 text-center">عدد التذاكر</th>
                      <th className="px-6 py-3 text-center">التكلفة</th>
                      <th className="px-6 py-3 text-center">الربح</th>
                      <th className="px-6 py-3 text-left">إجمالي الإيراد</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-transparent">
                   {techData.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                         <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{t.name}</td>
                         <td className="px-6 py-3 text-center font-mono">{t.count}</td>
                         <td className="px-6 py-3 text-center font-mono text-rose-500">{Number(t.cost).toLocaleString()} ج.م</td>
                         <td className={`px-6 py-3 text-center font-mono ${t.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(t.profit).toLocaleString()} ج.م</td>
                         <td className="px-6 py-3 text-left font-mono font-bold text-blue-500">{Number(t.rev).toLocaleString()} ج.م</td>
                      </tr>
                   ))}
                   {techData.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد بيانات للفنيين</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

      {/* Detail Table */}
      <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden mb-8">
         <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 bg-slate-100 dark:bg-white/[0.02]">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-base dark:text-white text-right">
               تفاصيل تذاكر الصيانة <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full mr-2">{displayRepairs.length} تذكرة</span>
            </h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-right">
               <thead className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                  <tr>
                     <th className="px-5 py-3">#</th>
                     <th className="px-5 py-3 font-medium">رقم التذكرة</th>
                     <th className="px-5 py-3 font-medium">العميل</th>
                     <th className="px-5 py-3 font-medium">الجهاز / الموديل</th>
                     <th className="px-5 py-3 font-medium text-center">الحالة</th>
                     <th className="px-5 py-3 font-medium">التكلفة</th>
                     <th className="px-5 py-3 font-medium">الربح</th>
                     <th className="px-5 py-3 font-medium">الإجمالي</th>
                     <th className="px-5 py-3 font-medium">المدفوع</th>
                     <th className="px-5 py-3 font-medium">المتبقي</th>
                     <th className="px-5 py-3 font-medium text-center">مقفولة مالياً</th>
                     <th className="px-5 py-3 font-medium">تاريخ الإنشاء</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-transparent">
                  {displayRepairs.map((r, i) => {
                     const total = Number(r.total_amount || 0);
                     const paid = Number(r.paid_amount || 0);
                     let cost = 0;
                     let hasParsedCost = false;

                     if (r.notes && r.notes.includes('===PARTS===')) {
                        try {
                           const partsStr = r.notes.split('===PARTS===\n')[1].split('\n===')[0];
                           const repairParts = JSON.parse(partsStr);
                           cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                           hasParsedCost = true;
                        } catch(e) {}
                     }

                     if (!hasParsedCost) {
                        cost = Number(r.spare_parts_cost || 0);
                     }

                     const profit = total > 0 ? total - cost : 0;
                     const remaining = total - paid;
                     const isFinanciallyClosed = paid >= total && total > 0 && r.status === 'تم الانتهاء';

                     return (
                     <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-slate-500 text-xs font-mono">{i + 1}</td>
                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white font-mono text-xs">
                            R-{new Date(r.created_at).getFullYear()}{new Date(r.created_at).getMonth()+1}-{r.id.toString().padStart(5, '0')}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                           {r.customer_name || 'غير محدد'}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{r.device_name || '-'}</td>
                        <td className="px-5 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium border flex items-center justify-center w-max mx-auto ${getStatusColor(r.status)}`}>
                              {r.status || 'مستلم'}
                            </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-rose-500 dark:text-rose-400">{cost.toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className={`px-5 py-3 font-mono ${profit < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{profit.toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className="px-5 py-3 font-mono text-slate-900 dark:text-slate-100 font-bold">{total.toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className="px-5 py-3 font-mono text-blue-600 dark:text-blue-400">{paid.toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className="px-5 py-3 font-mono text-slate-500 dark:text-slate-400">{remaining.toFixed(2)} <span className="text-[10px]">ج.م</span></td>
                        <td className="px-5 py-3 text-center">
                            {isFinanciallyClosed ? (
                                <Lock className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                                <Unlock className="w-4 h-4 text-amber-500 mx-auto" />
                            )}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                            {format(new Date(r.created_at), 'yyyy/MM/dd')}
                        </td>
                     </tr>
                  )})}
                  
                  {displayRepairs.length === 0 && (
                     <tr>
                        <td colSpan={12} className="px-6 py-12 text-center text-slate-500">لا توجد صيانة مطابقة</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
