import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Download, Wrench, Package, DollarSign, TrendingUp, AlertTriangle, Search, Settings, FileText, Lock, Unlock, CreditCard, Activity, PenTool, Printer, X, Loader2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from 'date-fns';
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

export default function MaintenanceCommissionReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    period: 'يعد الكل', // 'all', 'month', 'week'
    status: 'الكل',
  });

  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalCommissions: 0
  });

  const [trendType, setTrendType] = useState<'revenue' | 'collections'>('revenue');

  const [trendData, setTrendData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [techData, setTechData] = useState<any[]>([]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Payment Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

      let empData = [];
      try {
        const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*${branchSuffix}`, { headers });
        if (empRes.ok) {
          empData = await empRes.json();
        }
      } catch (err) {
        console.error('Employees fetch error', err);
      }

      let walletsData: any[] = [];
      try {
        const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*${branchSuffix}&order=is_default.desc`, { headers });
        if (wRes.ok) {
          walletsData = await wRes.json();
        }
      } catch (err) {
        console.error('Wallets fetch error', err);
      }

      let payoutsData: any[] = [];
      try {
        const pRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,description,created_at&category=eq.${encodeURIComponent('عمولات صيانة')}${branchSuffix}`, { headers });
        if (pRes.ok) {
          payoutsData = await pRes.json();
        }
      } catch (err) {
        console.error('Payouts fetch error', err);
      }

      setEmployees(empData);
      setWallets(walletsData);
      setPayouts(payoutsData);
      if (walletsData.length > 0) setSelectedWallet(walletsData[0].id.toString());
      setRepairs(repairsData);
      processDashboard(repairsData, filters, empData, payoutsData);
    } catch (err) {
      console.error('Error fetching maintenance report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (repairs.length > 0) {
      processDashboard(repairs, filters, employees, payouts);
    }
  }, [filters, repairs, employees, payouts]);

  const processDashboard = (data: any[], currentFilters: any, emps: any[], payoutsData: any[] = payouts) => {
    let filtered = data;

    // Filter by period
    const now = new Date();
    if (currentFilters.period === 'اليوم') {
      const start = startOfDay(now);
      filtered = filtered.filter(r => new Date(r.created_at) >= start);
    } else if (currentFilters.period === 'الأمس') {
      const yesterday = subDays(now, 1);
      const start = startOfDay(yesterday);
      const end = endOfDay(yesterday);
      filtered = filtered.filter(r => new Date(r.created_at) >= start && new Date(r.created_at) <= end);
    } else if (currentFilters.period === 'هذا الأسبوع') {
      const start = startOfWeek(now, { weekStartsOn: 6 });
      filtered = filtered.filter(r => new Date(r.created_at) >= start);
    } else if (currentFilters.period === 'الأسبوع الماضي') {
      const lastWeek = subWeeks(now, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 6 });
      const end = endOfWeek(lastWeek, { weekStartsOn: 6 });
      filtered = filtered.filter(r => new Date(r.created_at) >= start && new Date(r.created_at) <= end);
    } else if (currentFilters.period === 'هذا الشهر') {
      const start = startOfMonth(now);
      filtered = filtered.filter(r => new Date(r.created_at) >= start);
    } else if (currentFilters.period === 'الشهر الماضي') {
      const lastMonthDate = subMonths(now, 1);
      const start = startOfMonth(lastMonthDate);
      const end = endOfMonth(lastMonthDate);
      filtered = filtered.filter(r => new Date(r.created_at) >= start && new Date(r.created_at) <= end);
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
    const techMap: Record<string, { count: number, revenue: number, cost: number, profit: number, commissionPercent: number, commissionValue: number }> = {};

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
        } catch (e) { }
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
      if (!techMap[tech]) {
        const emp = emps.find(e => e.full_name === tech);
        const commissionPercent = emp ? Number(emp.maintenance_commission_value ?? emp.commission_value ?? 0) : 0;
        techMap[tech] = { count: 0, revenue: 0, cost: 0, profit: 0, commissionPercent, commissionValue: 0 };
      }
      techMap[tech].count += 1;
      techMap[tech].revenue += total;
      techMap[tech].cost += cost;
      techMap[tech].profit += profit;
      // Calculate commission per ticket profit
      techMap[tech].commissionValue += (profit > 0 ? profit : 0) * (techMap[tech].commissionPercent / 100);
    });

    Object.keys(techMap).forEach(tech => {
      const techPayouts = payoutsData.filter(p => {
        if (!p.description || !p.description.includes(`للموظف/الفني: ${tech} عن فترة:`)) return false;
        if (currentFilters.period === 'الكل' || currentFilters.period === 'all') return true;
        return p.description.includes(`عن فترة: ${currentFilters.period}`);
      });
      const totalPaid = techPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      techMap[tech].paidCommission = totalPaid;
      techMap[tech].remainingCommission = techMap[tech].commissionValue - totalPaid;
    });

    setStats({
      totalTickets: filtered.length,
      totalRevenue: tRev,
      totalCost: tCost,
      netProfit: tProfit,
      totalCommissions: Object.values(techMap).reduce((sum, tech) => sum + tech.commissionValue, 0)
    });

    setTrendData(Object.keys(tMap).map(k => ({ date: k, الإيراد: tMap[k].rev, التحصيلات: tMap[k].col })));

    setTechData(Object.keys(techMap).map(k => ({
      name: k,
      count: techMap[k].count,
      rev: techMap[k].revenue,
      cost: techMap[k].cost,
      profit: techMap[k].profit,
      commissionPercent: techMap[k].commissionPercent,
      commissionValue: techMap[k].commissionValue,
      paidCommission: techMap[k].paidCommission,
      remainingCommission: techMap[k].remainingCommission
    })));

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
        } catch (e) { }
      }

      if (!hasParsedCost) {
        cost = Number(r.spare_parts_cost || 0);
      }

      const profit = total > 0 ? total - cost : 0;

      return {
        '#': index + 1,
        'رقم التذكرة': `R-${new Date(r.created_at).getFullYear()}${new Date(r.created_at).getMonth() + 1}-${r.id.toString().padStart(5, '0')}`,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير عمولة الصيانة');
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

  const handlePaymentSubmit = async () => {
    if (!selectedTech || !selectedWallet) return;
    if (paymentAmount <= 0) {
      alert("يجب إدخال قيمة صحيحة للعمولة");
      return;
    }

    const selectedWalletObj = wallets.find(w => w.id.toString() === selectedWallet.toString());
    if (selectedWalletObj && Number(selectedWalletObj.balance || 0) < paymentAmount) {
      alert("رصيد الخزينة غير كافٍ لإتمام عملية الصرف");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const branchId = localStorage.getItem('takka_active_branch_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;

      const payload: any = {
        wallet_id: selectedWallet,
        user_id: userId,
        type: 'out',
        amount: paymentAmount,
        category: 'عمولات صيانة',
        description: `صرف ${paymentType === 'full' ? 'كلي' : 'جزئي'} لعمولة صيانة للموظف/الفني: ${selectedTech.name} عن فترة: ${filters.period}`,
        tenant_id: tenantId
      };

      if (branchId && branchId !== 'ALL') {
        payload.branch_id = branchId;
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to insert transaction");

      // update wallet balance
      const walletRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${selectedWallet}&select=balance`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.length > 0) {
          const currentBal = Number(wData[0].balance || 0);
          await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${selectedWallet}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: currentBal - paymentAmount })
          });
        }
      }

      alert("تم صرف العمولة بنجاح وتسجيلها في الخزينة");
      setIsPayModalOpen(false);
      fetchData();

    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء صرف العمولة");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

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
          <Wrench className="w-6 h-6 text-slate-500" /> تقارير عمولة الصيانة
        </h2>
        {/* <div className="flex gap-2">
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
        </div> */}
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقارير عمولة الصيانة"
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
          {
            header: 'الربح', accessor: (item) => {
              const total = Number(item.total_amount || 0);
              let cost = 0;
              let hasParsedCost = false;

              if (item.notes && item.notes.includes('===PARTS===')) {
                try {
                  const partsStr = item.notes.split('===PARTS===\n')[1].split('\n===')[0];
                  const repairParts = JSON.parse(partsStr);
                  cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                  hasParsedCost = true;
                } catch (e) { }
              }

              if (!hasParsedCost) {
                cost = Number(item.spare_parts_cost || 0);
              }
              return total > 0 ? (total - cost).toLocaleString() : '0';
            }, isNumeric: true
          },
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
            onChange={e => setFilters({ ...filters, period: e.target.value })}
            className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="الكل">الكل</option>
            <option value="اليوم">اليوم</option>
            <option value="الأمس">الأمس</option>
            <option value="هذا الأسبوع">هذا الأسبوع</option>
            <option value="الأسبوع الماضي">الأسبوع الماضي</option>
            <option value="هذا الشهر">هذا الشهر</option>
            <option value="الشهر الماضي">الشهر الماضي</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">حالة التذكرة</span>
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => setFilters({ ...filters })} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all">تطبيق</button>
        <button onClick={clearFilters} className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-all border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1.5">مسح الفلاتر</button>
        <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-emerald-500/30">
          <Download className="w-4 h-4" /> تصدير Excel
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* عدد تذاكر الصيانة */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-slate-400"></div>
          <FileText className="w-5 h-5 text-slate-400 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">إجمالي التذاكر</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalTickets}</h2>
        </div>

        {/* إجمالي الإيراد */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
          <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">إجمالي الإيراد</h3>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>

        {/* صافي الربح */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-1 h-full ${stats.netProfit < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <TrendingUp className={`w-5 h-5 mb-2 ${stats.netProfit < 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">صافي الربح</h3>
          <h2 className={`text-lg font-bold font-mono ${stats.netProfit < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>

        {/* إجمالي العمولات */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
          <Activity className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mb-1">إجمالي العمولات</h3>
          <h2 className="text-lg font-bold font-mono text-amber-600 dark:text-amber-500">{stats.totalCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
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
                <th className="px-6 py-3 text-center">نسبة العمولة</th>
                <th className="px-6 py-3 text-center">العمولة الكلية</th>
                <th className="px-6 py-3 text-center text-emerald-500">المدفوع</th>
                <th className="px-6 py-3 text-center text-rose-500">المتبقي</th>
                <th className="px-6 py-3 text-left">إجمالي الإيراد</th>
                <th className="px-6 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-transparent">
              {techData.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{t.name}</td>
                  <td className="px-6 py-3 text-center font-mono">{t.count}</td>
                  <td className="px-6 py-3 text-center font-mono text-rose-500">{Number(t.cost).toLocaleString()} ج.م</td>
                  <td className={`px-6 py-3 text-center font-mono ${t.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(t.profit).toLocaleString()} ج.م</td>
                  <td className="px-6 py-3 text-center font-mono text-amber-500">{t.commissionPercent}%</td>
                  <td className="px-6 py-3 text-center font-mono font-bold text-amber-600">{Number(t.commissionValue).toLocaleString()} ج.م</td>
                  <td className="px-6 py-3 text-center font-mono font-bold text-emerald-500">{Number(t.paidCommission).toLocaleString()} ج.م</td>
                  <td className="px-6 py-3 text-center font-mono font-bold text-rose-500">{Number(t.remainingCommission).toLocaleString()} ج.م</td>
                  <td className="px-6 py-3 text-left font-mono font-bold text-blue-500">{Number(t.rev).toLocaleString()} ج.م</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedTech(t);
                        setPaymentAmount(t.remainingCommission > 0 ? t.remainingCommission : t.commissionValue);
                        setPaymentType('full');
                        setIsPayModalOpen(true);
                      }}
                      disabled={t.remainingCommission <= 0}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {t.remainingCommission <= 0 ? 'تم الصرف' : 'صرف العمولة'}
                    </button>
                  </td>
                </tr>
              ))}
              {techData.length === 0 && (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-slate-500">لا توجد بيانات للفنيين</td></tr>
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
                  } catch (e) { }
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
                      R-{new Date(r.created_at).getFullYear()}{new Date(r.created_at).getMonth() + 1}-{r.id.toString().padStart(5, '0')}
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
                )
              })}

              {displayRepairs.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-500">لا توجد صيانة مطابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isPayModalOpen && selectedTech && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                صرف عمولة للفني: {selectedTech.name}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-center">
                <h4 className="text-amber-700 dark:text-amber-400 text-sm font-medium mb-1">العمولة المستحقة عن الفترة ({filters.period})</h4>
                <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-500">{Number(selectedTech.remainingCommission).toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الصرف</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === 'full'}
                      onChange={() => {
                        setPaymentType('full');
                        setPaymentAmount(selectedTech.remainingCommission);
                      }}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">صرف كلي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === 'partial'}
                      onChange={() => {
                        setPaymentType('partial');
                        setPaymentAmount(0);
                      }}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">صرف جزئي</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المبلغ المراد صرفه (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  disabled={paymentType === 'full'}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الخصم من الخزينة</label>
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-colors"
                >
                  {wallets.length === 0 && <option value="" disabled>لا توجد خزائن متاحة</option>}
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({Number(w.balance || 0).toLocaleString()} ج.م)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2 bg-slate-50 dark:bg-white/[0.02]">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isSubmittingPayment || paymentAmount <= 0}
                className="px-4 py-2 text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                تأكيد الصرف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
