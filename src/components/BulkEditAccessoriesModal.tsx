import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Edit } from 'lucide-react';

interface BulkEditAccessoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedIds: number[];
}

export default function BulkEditAccessoriesModal({ isOpen, onClose, onSuccess, selectedIds }: BulkEditAccessoriesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // For each field, we need a checkbox to determine if it should be updated
  const [updateFields, setUpdateFields] = useState({
    name: false,
    category: false,
    brand: false,
    supplier: false,
    status: false,
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    supplier: '',
    status: 'جديد'
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setUpdateFields({
        name: false,
        category: false,
        brand: false,
        supplier: false,
        status: false,
      });
      setFormData({
        name: '',
        category: '',
        brand: '',
        supplier: '',
        status: 'جديد'
      });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setUpdateFields({ ...updateFields, [e.target.name]: true });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateFields({ ...updateFields, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    // Build the payload
    const payload: any = {};
    if (updateFields.name) payload.name = formData.name;
    if (updateFields.category) payload.category = formData.category;
    if (updateFields.brand) payload.brand = formData.brand;
    if (updateFields.supplier) payload.supplier = formData.supplier;
    if (updateFields.status) payload.status = formData.status;

    if (Object.keys(payload).length === 0) {
      setError('يرجى تحديد حقل واحد على الأقل للتعديل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?id=in.(${selectedIds.join(',')})`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`فشل في تعديل الأصناف: ${errText}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التعديل المجمع');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-6 h-6 text-cyan-500" />
              تعديل مجمع ({selectedIds.length} صنف)
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
              قم بتفعيل الخيار بجانب الحقل الذي ترغب في تعديله وتطبيقه على جميع الأصناف المحددة.
            </p>

            <form id="bulk-edit-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Name */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      name="name"
                      checked={updateFields.name}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم الصنف</label>
                  </div>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!updateFields.name}
                    placeholder="الاسم الجديد للصنف..."
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Category */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      name="category"
                      checked={updateFields.category}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التصنيف (الفئة)</label>
                  </div>
                  <input 
                    type="text" 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={!updateFields.category}
                    placeholder="التصنيف الجديد..."
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Brand */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      name="brand"
                      checked={updateFields.brand}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الماركة</label>
                  </div>
                  <input 
                    type="text" 
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    disabled={!updateFields.brand}
                    placeholder="الماركة الجديدة..."
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Supplier */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      name="supplier"
                      checked={updateFields.supplier}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المورد</label>
                  </div>
                  <select 
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    disabled={!updateFields.supplier}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none disabled:opacity-50"
                  >
                    <option value="">بدون مورد</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      name="status"
                      checked={updateFields.status}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                  </div>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={!updateFields.status}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none disabled:opacity-50"
                  >
                    <option value="جديد">جديد</option>
                    <option value="مستعمل">مستعمل</option>
                    <option value="تالف">تالف</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center gap-3 shrink-0">
            <button 
              type="submit"
              form="bulk-edit-form"
              disabled={isLoading || !Object.values(updateFields).some(v => v)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تطبيق التعديلات'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
