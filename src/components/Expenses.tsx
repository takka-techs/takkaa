import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt, Plus, Search, Wallet, Tag,
  TrendingDown, Calendar, CheckCircle, AlertCircle,
  Loader2, RefreshCw, ChevronDown,
  Download, BarChart3, Clock,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const EXPENSE_CATEGORIES = [
  { label: 'إيجار', icon: '🏠', color: 'from-rose-500 to-red-600' },
  { label: 'فواتير كهرباء', icon: '⚡', color: 'from-yellow-500 to-amber-600' },
  { label: 'فواتير مياه', icon: '💧', color: 'from-blue-500 to-cyan-600' },
  { label: 'فواتير إنترنت', icon: '🌐', color: 'from-indigo-500 to-violet-600' },
  { label: 'مرتبات موظفين', icon: '👥', color: 'from-emerald-500 to-teal-600' },
  { label: 'مصاريف تسويق', icon: '📢', color: 'from-purple-500 to-fuchsia-600' },
  { label: 'صيانة وإصلاح', icon: '🔧', color: 'from-orange-500 to-red-600' },
  { label: 'مواصلات ووقود', icon: '🚗', color: 'from-slate-500 to-slate-700' },
  { label: 'مستلزمات مكتبية', icon: '📎', color: 'from-sky-500 to-blue-600' },
  { label: 'ضرائب ورسوم', icon: '🏛️', color: 'from-red-500 to-rose-700' },
  { label: 'منظفات ومستلزمات نظافة', icon: '🧹', color: 'from-cyan-500 to-teal-600' },
  { label: 'أكل وشرب', icon: '☕', color: 'from-amber-500 to-orange-600' },
  { label: 'مطبوعات وتصوير', icon: '🖨️', color: 'from-violet-500 to-purple-600' },
  { label: 'عمولات وسطاء', icon: '🤝', color: 'from-lime-500 to-green-600' },
  { label: 'مصاريف شحن وتوصيل', icon: '📦', color: 'from-pink-500 to-rose-600' },
  { label: 'اشتراكات وتراخيص', icon: '🔑', color: 'from-teal-500 to-emerald-600' },
  { label: 'أخرى', icon: '📋', color: 'from-gray-500 to-slate-600' },
];

const STAT_PERIODS = [
  { label: 'اليوم', value: '1' },
  { label: '٧ أيام', value: '7' },
  { label: '٣٠ يوم', value: '30' },
  { label: 'الكل', value: 'all' },
];

function formatAmount(val: number) {
  return val?.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0';
}

export default function Expenses() {
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [period, setPeriod] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [form, setForm] = useState({
    wallet_id: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const notifTimeout = useRef<NodeJS.Timeout | null>(null);

  function showNotif(type: 'success' | 'error', msg: string) {
    setNotification({ type, msg });
    if (notifTimeout.current) clearTimeout(notifTimeout.current);
    notifTimeout.current = setTimeout(() => setNotification(null), 4000);
  }

  const getHeaders = () => {
    const token = localStorage.getItem('access_token') || '';
    return { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id') || '';
      const activeBranchId = localStorage.getItem('takka_active_branch_id');
      const branchQ = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : `&tenant_id=eq.${tenantId}`;

      let dateFilter = '';
      if (period !== 'all') {
        const start = subDays(new Date(), parseInt(period));
        dateFilter = `&created_at=gte.${start.toISOString()}`;
      }

      const [walletsRes, txRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*${branchQ}&order=is_default.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=*${branchQ}${dateFilter}&order=created_at.desc`, { headers })
      ]);

      if (walletsRes.ok) setWallets(await walletsRes.json());

      if (txRes.ok) {
        const txs = await txRes.json();
        const expensesOnly = txs.filter((t: any) => {
          if (!(t.type === 'out' || t.type === 'expense')) return false;
          if (!t.category) return true;
          const cat = t.category.toLowerCase();
          const excluded = ['مشتريات', 'شراء', 'مخزون', 'مورد', 'تحويل', 'محافظ', 'رصيد', 'داخلية', 'رأس مال', 'سحب', 'مالك', 'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return', 'إيراد صيانة', 'مقبوضات'];
          return !excluded.some(k => cat.includes(k));
        });
        setExpenses(expensesOnly);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wallet_id) { showNotif('error', 'اختر الخزينة / المحفظة أولاً'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { showNotif('error', 'أدخل مبلغاً صحيحاً'); return; }
    if (!form.category) { showNotif('error', 'اختر فئة المصروف'); return; }

    const amt = parseFloat(form.amount);
    const selectedWallet = wallets.find(w => w.id.toString() === form.wallet_id);

    if (selectedWallet && amt > (selectedWallet.balance || 0)) {
      showNotif('error', `⚠️ رصيد ${selectedWallet.name} (${formatAmount(selectedWallet.balance)} ج.م) أقل من المبلغ المطلوب (${formatAmount(amt)} ج.م)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = getHeaders();
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id') || '';
      const userId = localStorage.getItem('user_id') || '';
      const activeBranchId = localStorage.getItem('takka_active_branch_id');

      const txBody: any = {
        wallet_id: parseInt(form.wallet_id),
        user_id: userId,
        type: 'out',
        category: form.category,
        description: form.description || form.category,
        amount: amt,
        date: new Date(form.date).toISOString(),
        tenant_id: tenantId,
      };
      if (activeBranchId && activeBranchId !== 'ALL') txBody.branch_id = activeBranchId;

      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(txBody)
      });

      if (!txRes.ok) throw new Error('فشل تسجيل المصروف');

      if (selectedWallet) {
        await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${form.wallet_id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ balance: (selectedWallet.balance || 0) - amt })
        });
      }

      showNotif('success', 'تم تسجيل المصروف بنجاح ✅');
      setShowModal(false);
      setForm({ wallet_id: '', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      showNotif('error', err.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !searchTerm || (e.description || '').includes(searchTerm) || (e.category || '').includes(searchTerm);
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalExpenses = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const todayExpenses = expenses
    .filter(e => new Date(e.created_at || e.date).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + (e.amount || 0), 0);

  const categoryTotals = expenses.reduce((acc: any, e: any) => {
    const cat = e.category || 'أخرى';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a: any, b: any) => b[1] - a[1])[0];

  const exportToExcel = () => {
    const data = filtered.map(e => ({
      'التاريخ': e.created_at ? format(parseISO(e.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }) : '',
      'الفئة': e.category || '',
      'الوصف': e.description || '',
      'المبلغ': e.amount || 0,
      'الخزينة': wallets.find(w => w.id === e.wallet_id)?.name || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المصروفات');
    XLSX.writeFile(wb, `مصروفات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const walletName = (id: number) => wallets.find(w => w.id === id)?.name || 'غير محدد';
  const catInfo = (label: string) => EXPENSE_CATEGORIES.find(c => c.label === label) || { icon: '📋', color: 'from-gray-500 to-slate-600', label };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#080c13] overflow-hidden" dir="rtl">

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold max-w-[90vw] ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'}`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </span>
            المصروفات
          </h1>
          <div className="flex items-center gap-2">
            {/* Export - hidden on very small screens */}
            <button onClick={exportToExcel} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
            <button onClick={fetchData} className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">مصروف جديد</span>
              <span className="xs:hidden">إضافة</span>
            </button>
          </div>
        </div>

        {/* Stats - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'إجمالي المصروفات', value: formatAmount(totalExpenses), icon: TrendingDown, color: 'from-rose-500 to-red-600', suffix: 'ج.م' },
            { label: 'مصروفات اليوم', value: formatAmount(todayExpenses), icon: Calendar, color: 'from-orange-500 to-amber-600', suffix: 'ج.م' },
            { label: 'عدد العمليات', value: filtered.length.toString(), icon: BarChart3, color: 'from-violet-500 to-purple-600', suffix: '' },
            { label: 'أكبر فئة', value: topCategory ? (topCategory[0] as string).split(' ').slice(0, 2).join(' ') : 'لا يوجد', icon: Tag, color: 'from-emerald-500 to-teal-600', suffix: topCategory ? `${formatAmount(topCategory[1] as number)} ج.م` : '' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-[#11151c] rounded-2xl border border-slate-100 dark:border-white/5 p-3 sm:p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 leading-tight">{s.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm shrink-0`}>
                  <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
              <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">{s.value}</div>
              {s.suffix && <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{s.suffix}</div>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 pb-3 shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في المصروفات..."
            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-all"
          />
        </div>
        {/* Period + Category on same row */}
        <div className="flex gap-2">
          <div className="flex bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shrink-0">
            {STAT_PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-2.5 py-2 text-[11px] sm:text-xs font-bold transition-all ${period === p.value ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 min-w-0 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all"
          >
            <option value="all">كل الفئات</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-slate-400">
            <Receipt className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-bold">لا توجد مصروفات</p>
            <p className="text-sm mt-1 text-center px-4">اضغط على "مصروف جديد" لتسجيل مصروف</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((exp, i) => {
              const cat = catInfo(exp.category);
              const dateStr = exp.created_at ? format(parseISO(exp.created_at), 'dd MMM - hh:mm a', { locale: ar }) : '';
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-[#11151c] rounded-2xl border border-slate-100 dark:border-white/5 p-3 sm:p-4 hover:border-rose-200 dark:hover:border-rose-500/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg sm:text-xl shadow-sm shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{exp.category || 'غير مصنف'}</div>
                      {exp.description && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{exp.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          <Wallet className="w-3 h-3" />
                          {walletName(exp.wallet_id)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-black text-rose-500 dark:text-rose-400 text-base sm:text-lg whitespace-nowrap">
                        - {formatAmount(exp.amount)}
                      </span>
                      <div className="text-[10px] text-slate-400 text-left">ج.م</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB for mobile - Add Expense button at bottom */}
      <div className="sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-sm shadow-2xl shadow-rose-500/40 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          مصروف جديد
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            {/* Full-screen on mobile, centered card on desktop */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 z-50"
            >
              <div className="bg-white dark:bg-[#11151c] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-white/10 w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                {/* Handle bar (mobile) */}
                <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <Receipt className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white text-base">تسجيل مصروف جديد</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">أدخل بيانات المصروف</p>
                    </div>
                  </div>
                  <button onClick={() => !isSubmitting && setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
                  <div className="p-5 space-y-4">

                    {/* Amount + Wallet side by side on larger screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">المبلغ <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01" step="0.01"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            placeholder="0.00"
                            dir="ltr"
                            inputMode="decimal"
                            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pl-14 text-xl font-black text-rose-500 focus:border-rose-500 outline-none transition-all"
                            required
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ج.م</span>
                        </div>
                      </div>

                      {/* Wallet */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الخزينة / المحفظة <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <select
                            value={form.wallet_id}
                            onChange={e => setForm(f => ({ ...f, wallet_id: e.target.value }))}
                            required
                            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all appearance-none"
                          >
                            <option value="">اختر الخزينة...</option>
                            {wallets.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} — {formatAmount(w.balance || 0)} ج.م
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        {/* Balance warning */}
                        {form.wallet_id && form.amount && parseFloat(form.amount) > 0 && (() => {
                          const w = wallets.find(w => w.id.toString() === form.wallet_id);
                          if (w && parseFloat(form.amount) > (w.balance || 0)) {
                            return (
                              <div className="mt-1.5 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                <span>⚠️</span>
                                <span>الرصيد ({formatAmount(w.balance || 0)} ج.م) أقل من المطلوب!</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">فئة المصروف <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {EXPENSE_CATEGORIES.map(cat => (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                            className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${form.category === cat.label ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-md` : 'bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'}`}
                          >
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-center leading-tight">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description + Date side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الوصف / البيان</label>
                        <input
                          type="text"
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="تفاصيل المصروف..."
                          className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">التاريخ</label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Submit - sticky at bottom */}
                  <div className="px-5 pb-5 pt-2 shrink-0">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-sm shadow-lg shadow-rose-500/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5" /> تسجيل المصروف</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
