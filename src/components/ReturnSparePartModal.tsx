import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

interface ReturnSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sparePart: any;
}

export default function ReturnSparePartModal({ isOpen, onClose, onSuccess, sparePart }: ReturnSparePartModalProps) {
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnReason, setReturnReason] = useState('عيب مصنعي');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      const fetchWallets = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const tenantId = localStorage.getItem('tenant_id') || userId;
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };
          let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          if (activeBranchId && activeBranchId !== 'ALL') {
            walletsUrl += `&branch_id=eq.${activeBranchId}`;
          }
          const res = await fetch(walletsUrl, { headers });
          if (res.ok) {
            setWallets(await res.json());
          }
        } catch (error) {
          console.error('Error fetching wallets:', error);
        }
      };
      fetchWallets();
    }
  }, [isOpen]);

  if (!isOpen || !sparePart) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(returnQuantity);
    
    if (qty > (sparePart.quantity || 0)) {
      setError('لا يمكن إرجاع كمية أكبر من الكمية المتوفرة');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      const payload = {
        name: sparePart.name,
        sku: sparePart.sku,
        category: sparePart.category,
        barcode: sparePart.barcode,
        barcode_type: sparePart.barcode_type,
        sell_price: sparePart.sell_price,
        min_quantity: sparePart.min_quantity,
        cost_price: sparePart.cost_price,
        tax: sparePart.tax,
        quantity: qty,
        supplier: sparePart.supplier,
        entry_type: 'purchase',
        status: 'returned',
        notes: `مرتجع للمورد: ${returnReason}`,
        user_id: userId || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3'
      };

      // 1. Create return record
      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء سجل المرتجع');
      }

      // 2. Reduce the original quantity
      const newQuantity = (sparePart.quantity || 0) - qty;
      const patchResponse = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?id=eq.${sparePart.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!patchResponse.ok) console.error("فشل تقليل الكمية الأصلية");

      // 3. Treasury transaction if cash
      if (refundMethod === 'cash') {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            wallet_id: selectedWalletId || null,
            type: 'in',
            category: 'refund',
            amount: qty * (sparePart.cost_price || 0),
            description: `استرداد نقدي لمرتجع قطع غيار ${sparePart.name} (${qty} قطعة)`,
            user_id: userId
          })
        });
      }

      onSuccess();
      onClose();
      setReturnQuantity('1');
      setReturnReason('عيب مصنعي');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإرجاع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إرجاع للمورد</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-white/5">
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{sparePart.name}</div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>المورد: <span className="font-bold text-slate-700 dark:text-slate-300">{sparePart.supplier || 'غير محدد'}</span></span>
                <span>الكمية المتوفرة: <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{sparePart.quantity}</span></span>
              </div>
            </div>

            <form id="return-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية المرتجعة</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={sparePart.quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-red-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-2">طريقة الاسترداد</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      refundMethod === 'cash' 
                        ? 'bg-red-500/10 border-red-500 text-slate-900 dark:text-white' 
                        : 'bg-white dark:bg-[#080c13] border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${refundMethod === 'cash' ? 'border-red-500' : 'border-slate-300'}`}>
                      {refundMethod === 'cash' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                    </div>
                    <span className="font-bold">استرداد نقدي (درج الكاشير)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('supplier')}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      refundMethod === 'supplier' 
                        ? 'bg-red-500/10 border-red-500 text-slate-900 dark:text-white' 
                        : 'bg-white dark:bg-[#080c13] border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${refundMethod === 'supplier' ? 'border-red-500' : 'border-slate-300'}`}>
                      {refundMethod === 'supplier' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                    </div>
                    <span className="font-bold">تعديل رصيد المورد</span>
                  </button>
                </div>
                  
                  {refundMethod === 'cash' && (
                    <div className="mt-4 p-5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3 uppercase tracking-widest">اختر الخزينة للإيداع *</label>
                      <select
                        value={selectedWalletId}
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">-- اختر الخزينة --</option>
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({Number(w.balance).toLocaleString()} ج.م)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سبب الإرجاع</label>
                <textarea 
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="اكتب سبب إرجاع هذه القطعة..."
                  className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-red-500 outline-none transition-colors min-h-[100px] resize-none"
                />
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="return-form"
                disabled={isLoading || Number(returnQuantity) < 1 || (refundMethod === 'cash' && !selectedWalletId)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري التنفيذ...</>
                ) : (
                  'تأكيد الإرجاع'
                )}
              </button>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
