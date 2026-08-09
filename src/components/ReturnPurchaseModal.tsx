import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, RotateCcw, Smartphone, Building2, 
  DollarSign, AlertTriangle, Wallet, CreditCard, 
  Banknote, Info, ChevronDown, Loader2
} from 'lucide-react';

interface Device {
  id: number;
  created_at: string;
  company: string;
  model: string;
  source: string;
  cost_price: number;
  imei1: string;
  imei2: string | null;
}

interface ReturnPurchaseModalProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnPurchaseModal({ isOpen, device, onClose, onSuccess }: ReturnPurchaseModalProps) {
  const [returnReason, setReturnReason] = useState('عيب مصنعي');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !device) return null;

  const handleReturn = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      // 1. Update device status
      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?id=eq.${device.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'returned',
          notes: `مرتجع: ${returnReason} - طريقة الاسترداد: ${refundMethod}`
        })
      });

      if (response.ok) {
        // 2. Handle refund method
        if (refundMethod === 'cash') {
          const tId = localStorage.getItem('tenant_id') || userId;
          const bId = localStorage.getItem('takka_active_branch_id');
          const branchVal = bId && bId !== 'ALL' ? bId : null;

          // Add to treasury
          await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
            method: 'POST',
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              tenant_id: tId,
              branch_id: branchVal,
              type: 'in',
              category: 'refund',
              amount: device.cost_price,
              description: `استرداد نقدي لمرتجع جهاز ${device.company} ${device.model} IMEI: ${device.imei1 || ''}`,
              user_id: userId
            })
          });
        } // For supplier balance it would be tracked in transactions or supplier table if exists, but for now cash is main.

        onSuccess();
      }
    } catch (error) {
      console.error('Error processing return:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const returnReasons = [
    'عيب مصنعي',
    'مواصفات غير مطابقة',
    'تلف أثناء الشحن',
    'خطأ في الطلب',
    'جهاز مستعمل/ليس جديد',
    'مشكلة في البطارية',
    'مشكلة في الشاشة',
    'اتفاق مع المورد',
    'سبب آخر'
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col shadow-emerald-500/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center font-bold">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">مرتجع مشتريات</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8 space-y-8 max-h-[70vh]">
            {/* Device Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-500/10 rounded-xl">
                   <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">معلومات الجهاز</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">الجهاز</label>
                   <div className="text-lg font-black text-slate-900 dark:text-white">{device.company} {device.model}</div>
                 </div>
                 <div className="text-left">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">المورد</label>
                   <div className="text-lg font-black text-slate-900 dark:text-white">{device.source || '-'}</div>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IMEI</label>
                   <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-widest">{device.imei1}</div>
                 </div>
                 <div className="text-left">
                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">سعر الشراء</label>
                   <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{device.cost_price.toLocaleString()} ج.م</div>
                 </div>
               </div>
               
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
            </div>

            {/* Warning / Small Balance Message */}
            <div className="bg-orange-500/5 dark:bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 space-y-4 shadow-sm shadow-orange-500/5">
               <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                 <AlertTriangle className="w-5 h-5" />
                 <h4 className="text-sm font-bold">قيمة المرتجع أكبر من رصيد المورد</h4>
               </div>
               <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">يجب تحديد كيفية التعامل مع الفرق المالي المستحق لك.</p>
               
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-sm">
                   <div className="text-[10px] text-slate-500 mb-1">رصيد المورد الحالي</div>
                   <div className="text-xs sm:text-sm font-black text-red-600 dark:text-red-500 font-mono">0.00 ج.م</div>
                 </div>
                 <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-sm">
                   <div className="text-[10px] text-slate-500 mb-1">قيمة المرتجع</div>
                   <div className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400 font-mono">{device.cost_price.toLocaleString()} ج.م</div>
                 </div>
                 <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-sm border-emerald-100 dark:border-emerald-500/10">
                   <div className="text-[10px] text-slate-500 mb-1 font-bold">الفرق لصالحك</div>
                   <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{device.cost_price.toLocaleString()} ج.م</div>
                 </div>
               </div>
            </div>

            {/* Refund Method */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block ms-1 uppercase tracking-widest">كيف تريد التعامل مع الفرق؟</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'cash', label: 'استرداد نقدي (إضافة للكاش)', icon: Banknote, color: 'text-emerald-500 dark:text-emerald-400' },
                  { id: 'wallet', label: 'استرداد على المحفظة الإلكترونية', icon: Wallet, color: 'text-blue-500 dark:text-blue-400' },
                  { id: 'bank', label: 'استرداد على الحساب البنكي', icon: Banknote, color: 'text-purple-500 dark:text-purple-400' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setRefundMethod(method.id)}
                    className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all shadow-sm ${
                      refundMethod === method.id 
                        ? 'bg-teal-500/10 border-teal-500 dark:border-teal-500/50 text-slate-900 dark:text-white' 
                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl bg-white dark:bg-slate-900/40 shadow-sm ${method.color}`}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">{method.label}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      refundMethod === method.id ? 'border-teal-500 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {refundMethod === method.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Select */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block ms-1 uppercase tracking-widest">سبب الإرجاع</label>
              <div className="relative group">
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute top-1/2 end-4 -translate-y-1/2 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                <select 
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-teal-500/30 rounded-[1.5rem] py-5 ps-4 pe-14 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-all appearance-none font-bold shadow-sm"
                >
                  {returnReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-4 p-5 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
               <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
               <p className="text-[11px] text-teal-700 dark:text-teal-400/80 leading-relaxed font-bold">
                 سيتم تصفير دين المورد (0.00 ج.م) واسترداد الفرق ({device.cost_price.toLocaleString()} ج.م) حسب اختيارك.
               </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex gap-4">
            <button 
              onClick={handleReturn}
              disabled={isLoading}
              className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(220,38,38,0.2)] dark:shadow-[0_10px_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RotateCcw className="w-6 h-6" />}
              تأكيد الإرجاع
            </button>
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-5 rounded-[1.5rem] transition-all"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
