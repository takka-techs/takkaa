import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';

interface AddSparePartQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  spareParts: any[];
}

export default function AddSparePartQuantityModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  spareParts
}: AddSparePartQuantityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    part_id: '',
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
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Auto-fill cost price when part is selected
    if (e.target.name === 'part_id') {
      const part = spareParts.find(p => p.id.toString() === e.target.value);
      if (part) {
        setFormData(prev => ({
          ...prev,
          cost_price: part.cost_price?.toString() || '',
          supplier: part.supplier || ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.part_id) {
      setError('يرجى اختيار قطعة الغيار');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const selectedPart = spareParts.find(a => a.id.toString() === formData.part_id);
      
      if (!selectedPart) {
        throw new Error('قطعة الغيار غير موجودة');
      }

      // Add new purchase record with the selected part details
      const payload = {
        name: selectedPart.name,
        sku: selectedPart.sku,
        category: selectedPart.category,
        barcode: selectedPart.barcode,
        barcode_type: selectedPart.barcode_type,
        sell_price: selectedPart.sell_price,
        min_quantity: selectedPart.min_quantity,
        cost_price: Number(formData.cost_price),
        tax: Number(formData.tax),
        quantity: Number(formData.quantity),
        supplier: formData.supplier,
        entry_type: 'purchase',
        status: 'متاح',
        notes: formData.notes,
        user_id: localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3'
      };

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
        throw new Error('فشل في إضافة الكمية');
      }

      onSuccess();
      onClose();
      setFormData({
        part_id: '',
        quantity: '1',
        cost_price: '',
        tax: '0',
        supplier: '',
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter unique parts by name or SKU
  const uniquePartsMap = new Map();
  spareParts.forEach(part => {
    if (!uniquePartsMap.has(part.name)) {
      uniquePartsMap.set(part.name, part);
    }
  });
  const uniqueParts = Array.from(uniquePartsMap.values());

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
          className="relative w-full max-w-xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة كمية / فاتورة مورد</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form id="add-quantity-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">قطعة الغيار *</label>
                <select 
                  name="part_id"
                  required
                  value={formData.part_id}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors appearance-none"
                >
                  <option value="">اختر الصنف...</option>
                  {uniqueParts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.sku ? `(${a.sku})` : ''} - متوفر: {a.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية المضافة *</label>
                  <input 
                    type="number" 
                    name="quantity"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر التكلفة للوحدة *</label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات الفاتورة</label>
                  <input 
                    type="text" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="رقم الفاتورة أو ملاحظات..."
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>
              
              {formData.quantity && formData.cost_price && (
                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex justify-between items-center text-teal-600 dark:text-teal-400">
                  <span className="font-bold">إجمالي الفاتورة للصنف:</span>
                  <span className="text-lg font-black font-mono">
                    {(Number(formData.quantity) * Number(formData.cost_price)).toLocaleString()}
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
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
                form="add-quantity-form"
                disabled={isLoading}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  'تأكيد الإضافة'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
