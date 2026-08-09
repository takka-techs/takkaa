import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, PackagePlus } from 'lucide-react';

interface AddAccessoryQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessories: any[];
  selectedAccessoryId?: number | null;
}

export default function AddAccessoryQuantityModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  accessories,
  selectedAccessoryId
}: AddAccessoryQuantityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    accessory_id: '',
    quantity: '1',
    cost_price: '',
    tax: '0',
    supplier: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&order=name.asc', {
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setSuppliers(data);
          }
        } catch (error) {
          console.error('Error fetching suppliers:', error);
        }
      };
      fetchSuppliers();

      if (selectedAccessoryId) {
        const acc = accessories.find(a => a.id === selectedAccessoryId);
        setFormData({
          accessory_id: selectedAccessoryId.toString(),
          quantity: '1',
          cost_price: acc?.cost_price?.toString() || '',
          tax: acc?.tax?.toString() || '0',
          supplier: acc?.supplier || '',
          notes: ''
        });
      } else {
        setFormData({
          accessory_id: '',
          quantity: '1',
          cost_price: '',
          tax: '0',
          supplier: '',
          notes: ''
        });
      }
      setError('');
    }
  }, [isOpen, selectedAccessoryId, accessories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-fill cost price if accessory changes
      if (name === 'accessory_id') {
        const acc = accessories.find(a => a.id.toString() === value);
        if (acc) {
          newData.cost_price = acc.cost_price?.toString() || '';
          newData.tax = acc.tax?.toString() || '0';
          newData.supplier = acc.supplier || '';
        } else {
          newData.cost_price = '';
          newData.tax = '0';
          newData.supplier = '';
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accessory_id) {
      setError('يرجى اختيار الصنف');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      // First, get current accessory to update its quantity
      const acc = accessories.find(a => a.id.toString() === formData.accessory_id);
      if (!acc) throw new Error('الصنف غير موجود');

      const newQuantity = (acc.quantity || 0) + Number(formData.quantity);
      
      // Update accessory quantity (and optionally cost price/tax if it changed)
      const updatePayload: any = {
        quantity: newQuantity
      };
      
      if (formData.cost_price && Number(formData.cost_price) !== acc.cost_price) {
        updatePayload.cost_price = Number(formData.cost_price);
      }
      if (formData.tax && Number(formData.tax) !== acc.tax) {
        updatePayload.tax = Number(formData.tax);
      }
      if (formData.supplier && formData.supplier !== acc.supplier) {
        updatePayload.supplier = formData.supplier;
      }

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?id=eq.${formData.accessory_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث الكمية');
      }

      // TODO: Log the movement in a movements table if it exists

      onSuccess();
      onClose();
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
          className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة كمية للصنف</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
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

            <form id="add-quantity-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اختر الصنف *</label>
                <select 
                  name="accessory_id"
                  required
                  value={formData.accessory_id}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
                >
                  <option value="">-- اختر الصنف --</option>
                  {accessories.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (الكمية: {acc.quantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر الشراء</label>
                  <input 
                    type="number" 
                    name="cost_price"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
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
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                   />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية المضافة *</label>
                  <input 
                    type="number" 
                    name="quantity"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد</label>
                <select 
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
                >
                  <option value="">بدون مورد</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="سبب الإضافة..."
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="add-quantity-form"
              disabled={isLoading}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-slate-900 dark:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              إضافة الكمية 📦
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
