import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';

interface AddSparePartPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSparePartPurchaseModal({ isOpen, onClose, onSuccess }: AddSparePartPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('auto');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    barcode: '',
    cost_price: '',
    sell_price: '',
    tax: '0',
    quantity: '0',
    min_quantity: '5',
    supplier: '',
    entry_type: 'purchase',
    status: 'متاح',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };

          const tenantId = localStorage.getItem('tenant_id') || userId;
          let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          if (activeBranchId && activeBranchId !== 'ALL') {
             walletsUrl += `&branch_id=eq.${activeBranchId}`;
          }

          const [supRes, walRes] = await Promise.all([
            fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&tenant_id=eq.${tenantId}&order=name.asc`, { headers }),
            fetch(walletsUrl, { headers })
          ]);

          if (supRes.ok) {
            setSuppliers(await supRes.json());
          }
          if (walRes.ok) {
            setWallets(await walRes.json());
          }
        } catch (error) {
          console.error('Error fetching defaults:', error);
        }
      };
      fetchSuppliers();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const commonHeaders = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      let finalBarcode = formData.barcode;
      if (barcodeMode === 'auto') {
        finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      }

      const activeBranchId = localStorage.getItem('takka_active_branch_id');
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        barcode: finalBarcode,
        barcode_type: barcodeMode,
        cost_price: Number(formData.cost_price),
        sell_price: Number(formData.sell_price),
        tax: Number(formData.tax),
        quantity: Number(formData.quantity),
        min_quantity: Number(formData.min_quantity),
        supplier: formData.supplier,
        entry_type: formData.entry_type,
        status: formData.status,
        notes: formData.notes,
        user_id: userId,
        branch_id: activeBranchId && activeBranchId !== 'ALL' ? activeBranchId : null,
        tenant_id: tenantId
      };

      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('فشل في إضافة قطعة الغيار');
      }

      if (formData.supplier && Number(paidAmount) > 0 && selectedWalletId) {
        const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
        if (wallet) {
           await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
             method: 'PATCH',
             headers: commonHeaders,
             body: JSON.stringify({ balance: Number(wallet.balance || 0) - Number(paidAmount) })
           });
        }
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            wallet_id: Number(selectedWalletId),
            user_id: userId,
            type: 'out',
            amount: Number(paidAmount),
            category: 'سداد دفعة للمورد',
            description: `سداد المورد ${formData.supplier} (قطعة غيار: ${formData.name})`,
            branch_id: activeBranchId,
            tenant_id: tenantId
          })
        });
      }

      onSuccess();
      onClose();
      setPaidAmount('');
      setSelectedWalletId('');
      setFormData({
        name: '',
        sku: '',
        category: '',
        barcode: '',
        cost_price: '',
        sell_price: '',
        tax: '0',
        quantity: '0',
        min_quantity: '5',
        supplier: '',
        entry_type: 'purchase',
        status: 'متاح',
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة قطعة غيار جديدة</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form id="add-spare-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم القطعة *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الـ SKU</label>
                  <input 
                    type="text" 
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الإدخال</label>
                  <select 
                    name="entry_type"
                    value={formData.entry_type}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  >
                    <option value="purchase">مشتريات</option>
                    <option value="stock">رصيد أول مدة</option>
                    <option value="manual">إدخال يدوي</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">التصنيف</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  >
                    <option value="">اختر التصنيف...</option>
                    <option value="شاشات">شاشات</option>
                    <option value="بطاريات">بطاريات</option>
                    <option value="فلاتات">فلاتات</option>
                    <option value="كاميرات">كاميرات</option>
                    <option value="أيسيهات">أيسيهات</option>
                    <option value="أدوات صيانة">أدوات صيانة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الباركود</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBarcodeMode('auto')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
                        barcodeMode === 'auto' 
                          ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                      }`}
                    >
                      تلقائي
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarcodeMode('manual')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
                        barcodeMode === 'manual' 
                          ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                      }`}
                    >
                      يدوي
                    </button>
                  </div>
                  <input 
                    type="text" 
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    disabled={barcodeMode === 'auto'}
                    placeholder={barcodeMode === 'auto' ? 'سيتم توليد الباركود تلقائياً' : 'أدخل الباركود'}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر التكلفة *</label>
                   <input 
                     type="number" 
                     name="cost_price"
                     required
                     min="0"
                     step="0.01"
                     value={formData.cost_price}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الضريبة (%)</label>
                   <input 
                     type="number" 
                     name="tax"
                     min="0"
                     step="0.01"
                     value={formData.tax}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع *</label>
                   <input 
                     type="number" 
                     name="sell_price"
                     required
                     min="0"
                     step="0.01"
                     value={formData.sell_price}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية</label>
                  <input 
                    type="number" 
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه</label>
                  <input 
                    type="number" 
                    name="min_quantity"
                    min="0"
                    value={formData.min_quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد</label>
                    <select 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">بدون مورد</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.supplier && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                       <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-600 dark:text-slate-400">إجمالي المطلوب:</span>
                          <span className="text-rose-600 dark:text-rose-400">
                            {((Number(formData.cost_price) || 0) * (Number(formData.quantity) || 1) + (Number(formData.tax) || 0) * (Number(formData.quantity) || 1)).toLocaleString()} ج.م
                          </span>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع (اختياري)</label>
                         <input 
                           type="number"
                           min="0"
                           step="0.01"
                           value={paidAmount}
                           onChange={(e) => setPaidAmount(e.target.value)}
                           placeholder="المبلغ المدفوع الآن"
                           className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                         />
                       </div>
                       {Number(paidAmount) > 0 && (
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-600 dark:text-slate-300">خصم من المحفظة</label>
                           <select
                             value={selectedWalletId}
                             onChange={(e) => setSelectedWalletId(e.target.value)}
                             required={Number(paidAmount) > 0}
                             className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                           >
                             <option value="">اختر المحفظة...</option>
                             {wallets.map(w => (
                               <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
                             ))}
                           </select>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                  <input 
                    type="text" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                form="add-spare-form"
                disabled={isLoading}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  'إضافة إلى المخزون'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
