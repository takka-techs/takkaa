import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Layers, Wallet, DollarSign, Info, AlertCircle } from 'lucide-react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

type BulkPaymentModalProps = {
  contractId: string;
  totalRemainingDebt: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkPaymentModal({ contractId, totalRemainingDebt, onClose, onSuccess }: BulkPaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWallets, setFetchingWallets] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setFetchingWallets(true);
    try {
      const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
      const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const headers = { 
        'apikey': API_KEY, 
        'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
      };
      
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");

      let queryUrl = `${SUPABASE_URL}/rest/v1/wallets?select=id,name,type`;
      if (_tenantId) queryUrl += `&tenant_id=eq.${_tenantId}`;
      if (activeBranchId && activeBranchId !== 'ALL') queryUrl += `&branch_id=eq.${activeBranchId}`;

      const res = await fetch(queryUrl, { headers });
      if (res.ok) {
        setWallets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingWallets(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val ? Number(val) : '');
  };

  const isOverDebt = typeof amount === 'number' && amount > totalRemainingDebt;
  const isInvalid = !amount || amount <= 0 || !selectedWalletId || isOverDebt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    try {
      const currentUserStr = localStorage.getItem('user_id');
      const activeCashierStr = localStorage.getItem('active_cashier');
      let author = currentUserStr;
      let authorName = '';
      if (activeCashierStr) {
          try {
             const cx = JSON.parse(activeCashierStr);
             if (cx && cx.id) {
               author = cx.id;
               authorName = cx.name || cx.username || '';
             }
          } catch(err) {}
      }

      const hdrs = { 
        'apikey': API_KEY, 
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };

      // Get first unpaid payment ID, since process_installment_payment requires a payment_id 
      // The backend function will cascade the amount over the remaining installments naturally.
      // We will need to fetch the payments for this contract to get the ID.
      const pmtsRes = await fetch(`${SUPABASE_URL}/rest/v1/installment_payments?contract_id=eq.${contractId}&status=neq.paid&order=due_date.asc,installment_no.asc&limit=1`, { headers: hdrs });
      const pmts = await pmtsRes.json();
      if (!pmts || pmts.length === 0) {
          throw new Error('لا توجد أقساط مستحقة الدفع.');
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_installment_payment`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          p_payment_id: pmts[0].id,
          p_amount: amount,
          p_employee_id: null, // Avoid FK violation on installment_partial_payments.collected_by because employees table might be empty
          p_wallet_id: selectedWalletId ? parseInt(selectedWalletId) : null,
          p_idempotency_key: uuidv4(),
          p_receipt_url: null,
          p_notes: 'تحصيل حر بنظام الشلال' + (authorName ? ' (بواسطة: ' + authorName + ')' : '')
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'حدث خطأ أثناء الاتصال بالخادم');
      }

      // ---- Update active shift manually ----
      try {
         const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
         const activeBranchId = localStorage.getItem('takka_active_branch_id');
         const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
         const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*&status=eq.open${branchSuffix}&user_id=eq.${userId}${(() => { const cStr = localStorage.getItem('active_cashier'); if (cStr) { try { const c = JSON.parse(cStr); if (c && c.role_level !== 1) return '&cashier_name=eq.' + encodeURIComponent(c.full_name || c.username || c.name || 'موظف مبيعات'); else if (c && c.role_level === 1) return (c.full_name || c.username || c.name) ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(c.full_name || c.username || c.name)})` : '&cashier_name=is.null'; } catch (e) {} } return '&cashier_name=is.null'; })()}&order=created_at.desc&limit=1`, { headers: hdrs });
         if (shiftRes.ok) {
            const shifts = await shiftRes.json();
            if (shifts && shifts.length > 0) {
               const activeShift = shifts[0];
               const patchBody: any = { deposits_count: Number(activeShift.deposits_count || 0) + 1 };
               const targetWallet = wallets.find((w: any) => w.id.toString() === selectedWalletId.toString());
               if (targetWallet && targetWallet.type === 'cash') {
                   patchBody.expected_amount = Number(activeShift.expected_amount || 0) + Number(amount);
               }
               await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
                  method: 'PATCH',
                  headers: hdrs,
                  body: JSON.stringify(patchBody)
               });
            }
         }
      } catch(e) { console.error('Failed to update shift', e); }

      onSuccess();
    } catch (e: any) {
      console.error("Bulk payment error:", e);
      alert(e.message || "حدث خطأ أثناء تنفيذ الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
      <div className="bg-white/90 dark:bg-[#11151c]/90 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500 dark:text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">تحصيل حر (شلال)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">سداد عدة أقساط معاً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <Info className="w-4 h-4" />
              <span>المديونية المتبقية للعقد</span>
            </div>
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
              {totalRemainingDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج
            </span>
          </div>

          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 text-indigo-500" />
                المبلغ المراد سداده
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={handleAmountChange}
                className={`w-full px-4 py-3 bg-white dark:bg-white/5 border ${isOverDebt ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500'} rounded-xl focus:ring-2 outline-none transition-all dark:text-white font-mono text-lg font-bold text-left`}
                placeholder="0.00"
                dir="ltr"
              />
              {isOverDebt && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 dark:text-red-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>المبلغ يتخطى إجمالي المديونية المتبقية للعقد</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4 text-indigo-500" />
                خزينة / محفظة الاستلام
              </label>
              <select
                required
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                disabled={fetchingWallets}
                className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
              >
                <option value="">-- اختر الخزينة --</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || isInvalid}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'تأكيد الدفع المشترك'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
