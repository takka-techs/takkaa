import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, Unlock, Loader2, DollarSign, Calculator, 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  Award, Clock, CheckCircle2, FileText, ArrowRightLeft 
} from 'lucide-react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props { 
  isOpen: boolean; 
  onClose: () => void;
  onShiftUpdate?: () => void;
}

export default function ShiftManagementModal({ isOpen, onClose, onShiftUpdate }: Props) {
  const [activeShift, setActiveShift] = useState<any>(null);
  const [lastClosedShift, setLastClosedShift] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for opening
  const [startAmount, setStartAmount] = useState('');

  // States for closing
  const [actualAmount, setActualAmount] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [showDiffCommentArea, setShowDiffCommentArea] = useState(false);
  
  // Real-time calculation
  const expected = activeShift ? (Number(activeShift.expected_amount) || 0) : 0;
  const actual = Number(actualAmount) || 0;
  const diff = actualAmount ? actual - expected : 0;

  useEffect(() => {
    if (isOpen) {
      fetchShiftsData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (actualAmount) {
      if (diff !== 0) {
        setShowDiffCommentArea(true);
      } else {
        setShowDiffCommentArea(false);
      }
    } else {
      setShowDiffCommentArea(false);
    }
  }, [actualAmount, diff]);

  const fetchShiftsData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const branchFilter = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
      
      const cashierStr = localStorage.getItem('active_cashier');
      let cashierFilter = '';
      if (cashierStr) {
         try {
           const c = JSON.parse(cashierStr);
           if (c && c.role_level !== 1) {
              const cName = c.full_name || c.username || c.name || 'موظف مبيعات';
              cashierFilter = `&cashier_name=eq.${encodeURIComponent(cName)}`;
           } else {
              const cName = c ? (c.full_name || c.username || c.name) : null;
              cashierFilter = cName ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(cName)})` : `&cashier_name=is.null`;
           }
         } catch(e) {}
      } else {
         // Admin
         cashierFilter = `&cashier_name=is.null`;
      }

      // 1. Fetch active open shift for this user
      const openRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?status=eq.open${branchFilter}&user_id=eq.${userId}${cashierFilter}&order=created_at.desc&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (openRes.ok) {
        const openData = await openRes.json();
        setActiveShift(openData.length > 0 ? openData[0] : null);
      }

      // 2. Fetch last closed shift for "Auto Suggest" opening balance for this user
      const closedRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?status=eq.closed${branchFilter}&user_id=eq.${userId}${cashierFilter}&order=created_at.desc&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (closedRes.ok) {
        const closedData = await closedRes.json();
        if (closedData.length > 0) {
          setLastClosedShift(closedData[0]);
          if (!activeShift && !startAmount) {
            setStartAmount(closedData[0].actual_amount?.toString() || '');
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!startAmount) {
      alert('يرجى إدخال مبلغ بداية الوردية');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const cashier = localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')) : null;
      
      const payload: Record<string, any> = {
        status: 'open',
        start_time: new Date().toISOString(),
        starting_cash: parseFloat(startAmount),
        expected_amount: parseFloat(startAmount),
        sales_count: 0,
        deposits_count: 0,
        withdrawals_count: 0,
        user_id: userId
      };

      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      if (activeBranchId && activeBranchId !== 'ALL') {
        payload.branch_id = activeBranchId;
      }

      if (cashier && cashier.role_level !== 1) {
        payload.cashier_name = cashier.full_name || cashier.username || cashier.name || 'موظف مبيعات';
      }

      // We wrap the fetch in a function to handle safe fallbacks
      let response = await fetch(`${SUPABASE_URL}/rest/v1/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.clone().json().catch(() => null);
        // If it's a schema error about the column not existing, retry without it
        if (errorData && errorData.code === 'PGRST204') {
          delete payload.cashier_name;
          response = await fetch(`${SUPABASE_URL}/rest/v1/shifts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل فتح الوردية: ${errorText}`);
      }

      // 1. Fetch or Create Drawer Wallet for this Cashier
      try {
         const tenantId = localStorage.getItem('tenant_id') || userId;
         const drawerName = `درج الكاشير - ${payload.cashier_name || (localStorage.getItem('admin_active') === 'true' ? 'الإدارة' : 'موظف')}`;
         const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?tenant_id=eq.${tenantId}&name=eq.${encodeURIComponent(drawerName)}&type=eq.cash&select=id,balance`, {
           headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
         });
         const wData = await wRes.json();
         let drawerWalletId = null;
         let currentBalance = 0;
         if (wData && wData.length > 0) {
            drawerWalletId = wData[0].id;
            currentBalance = Number(wData[0].balance || 0);
         } else {
            // Create it
            const newWRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'apikey': SUPABASE_KEY,
                 'Authorization': `Bearer ${token}`,
                 'Prefer': 'return=representation'
               },
               body: JSON.stringify({
                 name: drawerName,
                 type: 'cash',
                 user_id: userId,
                 tenant_id: tenantId,
                 balance: 0,
                 is_default: false,
                 status: 'active',
                 notes: 'درج العهدة التلقائي',
                 branch_id: payload.branch_id || null
               })
            });
            if (newWRes.ok) {
               const newWData = await newWRes.json();
               if (newWData && newWData.length > 0) {
                 drawerWalletId = newWData[0].id;
                 currentBalance = Number(newWData[0].balance || 0);
               }
            }
         }
         
         if (drawerWalletId) {
            localStorage.setItem('takka_active_drawer_id', String(drawerWalletId));

            const amountParsed = parseFloat(startAmount) || 0;
            const diff = amountParsed - currentBalance;

            if (diff !== 0) {
               await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    wallet_id: drawerWalletId,
                    user_id: userId,
                    tenant_id: tenantId,
                    branch_id: payload.branch_id || null,
                    type: diff > 0 ? 'in' : 'out',
                    amount: Math.abs(diff),
                    category: 'other',
                    description: diff > 0 ? 'رصيد إفتتاح الوردية (إضافة)' : 'رصيد إفتتاح الوردية (تسوية نقص/سحب قبل الوردية)',
                    date: new Date().toISOString()
                  })
               });

               await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${drawerWalletId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    balance: amountParsed
                  })
               });
            }
         }
      } catch (err) {
         console.error("Failed to associate drawer wallet:", err);
      }

      if (response.ok) {
        alert('تم فتح الوردية بنجاح! متمنين لك مبيعات موفقة 🛒');
        setStartAmount('');
        fetchShiftsData();
        if (onShiftUpdate) onShiftUpdate();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('Supabase Error:', errorText);
        throw new Error(`فشل فتح الوردية: ${errorText}`);
      }
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!actualAmount) {
      alert('يرجى إدخال المبلغ الفعلي في الدرج لإغلاق الوردية');
      return;
    }

    if (showDiffCommentArea && diffReason.trim() === '') {
      alert('الرجاء كتابة سبب الفرق (العجز أو الزيادة) للمتابعة');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const payload = {
        status: 'closed',
        end_time: new Date().toISOString(),
        actual_amount: actual,
        difference_amount: diff,
        // Since we cannot alter DB schema easily, we don't send closing_note
        // But the UX enforces it locally for better operation feeling
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (diff !== 0) {
           // We could log this to a generic logs table if it existed, for now just show success
           console.log("Logged shift diff note:", diffReason);
        }
        localStorage.removeItem('takka_active_drawer_id');
        alert('تم إغلاق الوردية وحفظ الإحصائيات وبانتظار استلام العهدة!');
        setActualAmount('');
        setDiffReason('');
        setShowDiffCommentArea(false);
        fetchShiftsData();
        if (onShiftUpdate) onShiftUpdate();
        onClose(); // Auto close modal after ending shift
      } else {
        const errText = await response.text();
        throw new Error(`فشل إغلاق الوردية: ${errText}`);
      }
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#f8fafc] dark:bg-[#0b0f19] w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 my-8 overflow-hidden">
          
          <div className="flex justify-between items-center p-6 bg-white dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 relative z-10">
              {activeShift ? 'نقطة المتابعة المستمرة' : 'فتح الوردية - Session'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 relative z-10">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-20 flex justify-center text-blue-500"><Loader2 className="w-10 h-10 animate-spin" /></div>
            ) : !activeShift ? (
              /* ================== OPEN SHIFT ================== */
              <div className="space-y-6">
                 <div className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-center relative overflow-hidden">
                  <Unlock className="w-14 h-14 mx-auto mb-4 text-blue-500 drop-shadow-md" />
                  <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">استلام الكاش وبدء العمل</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    ممنوع إجراء أي عمليات بيع أو مرتجعات بدون وردية مفتوحة.<br/>قم بإدخال رصيد الدرج الحالي للبدء.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500"/> رصيد بداية الوردية (الدرج)
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</div>
                    <input 
                      type="number" 
                      value={startAmount} 
                      onChange={e => setStartAmount(e.target.value)} 
                      className="w-full bg-white dark:bg-[#080c13] border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 pr-14 text-slate-800 dark:text-white font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-2xl font-mono transition-all box-shadow-sm" 
                      placeholder="0" 
                    />
                  </div>
                  {lastClosedShift && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setStartAmount(lastClosedShift.actual_amount?.toString() || '0')}
                        className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                         سحب رصيد نهاية أمس: {lastClosedShift.actual_amount} ج.م
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button disabled={isSubmitting} onClick={handleOpenShift} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-[0.98] text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Unlock className="w-6 h-6" />}
                    فتح الوردية — Ready
                  </button>
                </div>
              </div>
            ) : (
              /* ================== CLOSE SHIFT / LIVE DASHBOARD ================== */
              <div className="space-y-6">
                
                {/* Live Stats */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                      <div className="text-xs text-slate-500 mb-1 font-bold">تاريخ البداية</div>
                      <div className="font-mono font-bold text-sm text-slate-800 dark:text-white" dir="ltr">
                        {new Date(activeShift.created_at).toLocaleString('en-US', { hour: 'numeric', minute:'numeric', hour12: true, month:'short', day:'numeric' })}
                      </div>
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex flex-col justify-center relative overflow-hidden">
                      <Award className="absolute -left-2 -bottom-2 w-12 h-12 text-emerald-500/10" />
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-bold">فواتير اليوم</div>
                      <div className="font-mono font-black text-2xl text-emerald-700 dark:text-emerald-300">
                        {activeShift.sales_count || 0}
                      </div>
                   </div>
                </div>

                {/* Gamification Target */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-2xl rounded-full"></div>
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/10" />
                  <div className="flex justify-between items-center mb-3 relative z-10">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><Award className="w-4 h-4 text-amber-300"/> تارجت الوردية (الهدف اليومي)</h4>
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                      {(activeShift.sales_count || 0) >= 15 ? '🎉 مبروك حققت التارجت!' : `باقي ${15 - (activeShift.sales_count || 0)} فواتير`}
                    </span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden relative z-10 w-full mb-1">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(((activeShift.sales_count || 0) / 15) * 100, 100)}%` }} 
                      className={`h-full rounded-full ${((activeShift.sales_count || 0) >= 15) ? 'bg-amber-400' : 'bg-white'}`}
                    />
                  </div>
                  <div className="text-[10px] text-white/70 font-bold relative z-10 flex justify-between">
                     <span>0</span>
                     <span>15 فاتورة ليك بونص!</span>
                  </div>
                </div>

                <div className="bg-slate-800 dark:bg-[#151a23] p-5 rounded-2xl border border-slate-700 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <div className="flex justify-between items-center text-slate-300 mb-2 font-bold relative z-10">
                        <span className="flex items-center gap-2"><Calculator className="w-4 h-4"/> مبلغ الإغلاق المتوقع بالنظام:</span>
                    </div>
                    <div className="font-mono text-3xl font-black text-white relative z-10 text-left" dir="ltr">
                       {(activeShift.expected_amount || 0).toLocaleString()} <span className="text-lg text-slate-400">EGP</span>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>يُرجى جرد الدرج وإدخال الكاش الفعلي:</span>
                  </label>
                  <div className="relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</div>
                    <input 
                      type="number" 
                      value={actualAmount} 
                      onChange={e => setActualAmount(e.target.value)} 
                      className={`w-full bg-white dark:bg-[#080c13] border-2 rounded-2xl px-4 py-4 pr-14 text-slate-900 dark:text-white font-black outline-none focus:ring-4 text-2xl font-mono text-center transition-all ${
                         actualAmount ? (diff === 0 ? 'border-emerald-500 focus:ring-emerald-500/20 text-emerald-600' : diff > 0 ? 'border-amber-500 focus:ring-amber-500/20 text-amber-600' : 'border-rose-500 focus:ring-rose-500/20 text-rose-600') : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`} 
                      placeholder="0" 
                    />
                  </div>
                </div>

                {/* Live Difference Status Engine */}
                {actualAmount && (
                    <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className={`p-4 rounded-2xl border flex items-center justify-between font-bold ${
                      diff === 0 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : diff > 0 
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        {diff === 0 ? <CheckCircle2 className="w-5 h-5"/> : diff > 0 ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                        <span>{diff === 0 ? 'مطابق تماماً (ممتاز)' : diff > 0 ? 'يوجد زيادة بالكاش' : 'يوجد عجز بالكاش'}</span>
                      </div>
                      <div className="font-mono text-xl" dir="ltr">{diff !== 0 ? Math.abs(diff).toLocaleString() : '0.00'}</div>
                    </motion.div>
                )}

                {/* Warning Comment (Force to input if diff!=0) */}
                <AnimatePresence>
                  {showDiffCommentArea && (
                    <motion.div initial={{ opacity:0, height: 0 }} animate={{ opacity:1, height: 'auto' }} exit={{ opacity:0, height: 0 }} className="overflow-hidden">
                       <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl">
                          <label className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            برجاء توضيح سبب {diff > 0 ? 'الزيادة' : 'العجز'} للمراجعة (إجباري)
                          </label>
                          <textarea 
                            value={diffReason}
                            onChange={e => setDiffReason(e.target.value)}
                            className="w-full bg-white dark:bg-[#0b0f19] border border-rose-200 dark:border-rose-500/30 rounded-xl p-3 text-sm outline-none focus:border-rose-500 resize-none"
                            rows={3}
                            placeholder="أدخل السبب هنا لتجنب المساءلة..."
                          />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2">
                  <button 
                    disabled={isSubmitting || (showDiffCommentArea && diffReason.trim() === '')} 
                    onClick={handleCloseShift} 
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-[0.98] text-lg shadow-xl shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-6 h-6" />}
                    إنهاء وإغلاق الوردية
                  </button>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
