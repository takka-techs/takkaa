// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { X, Barcode as BarcodeIcon, Loader2 } from 'lucide-react';

// interface EditAccessoryModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   accessory: any;
// }

// import { useBranchPermissions } from '../hooks/useBranchPermissions';

// export default function EditAccessoryModal({ isOpen, onClose, onSuccess, accessory }: EditAccessoryModalProps) {
//   const { canEditPrices } = useBranchPermissions();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('manual');

//   const [formData, setFormData] = useState({
//     name: '',
//     brand: '',
//     category: '',
//     barcode: '',
//     cost_price: '',
//     selling_price: '',
//     tax: '0',
//     quantity: '0',
//     alert_quantity: '5',
//     supplier: '',
//     entry_type: 'purchase',
//     status: 'جديد',
//     location: '',
//     notes: ''
//   });

//   const [suppliers, setSuppliers] = useState<any[]>([]);

//   useEffect(() => {
//     if (isOpen && accessory) {
//       setFormData({
//         name: accessory.name || '',
//         brand: accessory.brand || '',
//         category: accessory.category || '',
//         barcode: accessory.barcode || '',
//         cost_price: accessory.cost_price?.toString() || '',
//         selling_price: accessory.selling_price?.toString() || '',
//         tax: accessory.tax?.toString() || '0',
//         quantity: accessory.quantity?.toString() || '0',
//         alert_quantity: accessory.alert_quantity?.toString() || '5',
//         supplier: accessory.supplier || '',
//         entry_type: accessory.entry_type || 'purchase',
//         status: accessory.status || 'جديد',
//         location: accessory.location || '',
//         notes: accessory.notes || ''
//       });
//       setBarcodeMode('manual');
//       setError('');
//     }
//   }, [isOpen, accessory]);

//   useEffect(() => {
//     if (isOpen) {
//       const fetchSuppliers = async () => {
//         try {
//           const token = localStorage.getItem('access_token');
//           const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&order=name.asc', {
//             headers: {
//               'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//               'Authorization': `Bearer ${token}`
//             }
//           });
//           if (response.ok) {
//             const data = await response.json();
//             setSuppliers(data);
//           }
//         } catch (error) {
//           console.error('Error fetching suppliers:', error);
//         }
//       };
//       fetchSuppliers();
//     }
//   }, [isOpen]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
//     const roleLevel = actCashier?.role_level || 3;
//     const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
//     const specialPerms = actCashier?.permissions?.special || [];

//     if (!isOwnerAct && !specialPerms.includes('تعديل البيانات')) {
//       setError('ليس لديك صلاحية لتعديل البيانات');
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     try {
//       const token = localStorage.getItem('access_token');
      
//       let finalBarcode = formData.barcode;
//       if (barcodeMode === 'auto') {
//         finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
//       }

//       const payload = {
//         name: formData.name,
//         brand: formData.brand,
//         category: formData.category,
//         barcode: finalBarcode,
//         cost_price: Number(formData.cost_price),
//         selling_price: Number(formData.selling_price),
//         tax: Number(formData.tax),
//         quantity: Number(formData.quantity),
//         alert_quantity: Number(formData.alert_quantity),
//         supplier: formData.supplier,
//         entry_type: formData.entry_type,
//         status: formData.status,
//         location: formData.location || null,
//         notes: formData.notes
//       };

//       const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?id=eq.${accessory.id}`, {
//         method: 'PATCH',
//         headers: {
//           'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//           'Prefer': 'return=representation'
//         },
//         body: JSON.stringify(payload)
//       });

//       if (!response.ok) {
//         throw new Error('فشل في تعديل الصنف');
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       setError(err.message || 'حدث خطأ أثناء التعديل');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen || !accessory) return null;

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
//           onClick={onClose}
//         />
        
//         <motion.div 
//           initial={{ opacity: 0, scale: 0.95, y: 20 }} 
//           animate={{ opacity: 1, scale: 1, y: 0 }} 
//           exit={{ opacity: 0, scale: 0.95, y: 20 }}
//           className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
//             <div className="flex items-center gap-3">
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white">تعديل: {accessory.name}</h2>
//             </div>
//             <button 
//               onClick={onClose}
//               className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="p-6 overflow-y-auto custom-scrollbar">
//             {error && (
//               <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
//                 {error}
//               </div>
//             )}

//             <form id="edit-accessory-form" onSubmit={handleSubmit} className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الصنف *</label>
//                    <input 
//                      type="text" 
//                      name="name"
//                      required
//                      value={formData.name}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                    />
//                  </div>
//                  <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الماركة / النوع</label>
//                    <input 
//                      type="text" 
//                      name="brand"
//                      value={formData.brand}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                    />
//                  </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">التصنيف</label>
//                    <input 
//                      type="text" 
//                      name="category"
//                      value={formData.category}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                    />
//                  </div>
//                  <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الإدخال</label>
//                    <select 
//                      name="entry_type"
//                      value={formData.entry_type}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
//                    >
//                      <option value="purchase">مشتريات</option>
//                      <option value="stock">رصيد أول مدة</option>
//                    </select>
//                  </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
//                     <BarcodeIcon className="w-4 h-4 text-[#00d0d4]" /> الباركود
//                   </label>
//                   <div className="flex items-center gap-4 text-sm">
//                     <label className="flex items-center gap-2 cursor-pointer">
//                       <input 
//                         type="radio" 
//                         checked={barcodeMode === 'auto'}
//                         onChange={() => setBarcodeMode('auto')}
//                         className="text-[#00d0d4] focus:ring-[#00d0d4]/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
//                       />
//                       <span className="text-slate-600 dark:text-slate-300">تلقائي جديد 🔄</span>
//                     </label>
//                     <label className="flex items-center gap-2 cursor-pointer">
//                       <input 
//                         type="radio" 
//                         checked={barcodeMode === 'manual'}
//                         onChange={() => setBarcodeMode('manual')}
//                         className="text-[#00d0d4] focus:ring-[#00d0d4]/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
//                       />
//                       <span className="text-slate-600 dark:text-slate-300">الحالي 📌 / يدوي/سكان 📷</span>
//                     </label>
//                   </div>
//                 </div>
//                 {barcodeMode === 'manual' && (
//                   <input 
//                     type="text" 
//                     name="barcode"
//                     value={formData.barcode}
//                     onChange={handleChange}
//                     placeholder="امسح الباركود هنا..."
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                   />
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر الشراء *</label>
//                    <input 
//                      type="number" 
//                      name="cost_price"
//                      required
//                      disabled={!canEditPrices}
//                      min="0"
//                      step="0.01"
//                      value={formData.cost_price}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
//                    />
//                  </div>
//                  <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300" title="قيمة الضريبة">الضريبة (%)</label>
//                    <input 
//                      type="number" 
//                      name="tax"
//                      min="0"
//                      disabled={!canEditPrices}
//                      step="0.01"
//                      value={formData.tax}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
//                    />
//                  </div>
//                  <div className="space-y-2">
//                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع *</label>
//                    <input 
//                      type="number" 
//                      name="selling_price"
//                      required
//                      disabled={!canEditPrices}
//                      min="0"
//                      step="0.01"
//                      value={formData.selling_price}
//                      onChange={handleChange}
//                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
//                    />
//                  </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية</label>
//                   <input 
//                     type="number" 
//                     name="quantity"
//                     min="0"
//                     value={formData.quantity}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه</label>
//                   <input 
//                     type="number" 
//                     name="alert_quantity"
//                     min="0"
//                     value={formData.alert_quantity}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد</label>
//                   <select 
//                     name="supplier"
//                     value={formData.supplier}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
//                   >
//                     <option value="">بدون مورد</option>
//                     {suppliers.map(s => (
//                       <option key={s.id} value={s.name}>{s.name}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
//                     <select 
//                       name="status"
//                       value={formData.status}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
//                     >
//                       <option value="جديد">جديد</option>
//                       <option value="مستعمل">مستعمل</option>
//                     </select>
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-slate-600 dark:text-slate-300">مكان التخزين (اختياري)</label>
//                     <input 
//                       type="text"
//                       name="location"
//                       value={formData.location}
//                       onChange={handleChange}
//                       placeholder="مثال: شوكة رقم 100"
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
//                 <textarea 
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleChange}
//                   rows={3}
//                   className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors resize-none"
//                 />
//               </div>
//             </form>
//           </div>

//           {/* Footer */}
//           <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between">
//             <button 
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
//             >
//               إلغاء
//             </button>
//             <button 
//               type="submit"
//               form="edit-accessory-form"
//               disabled={isLoading}
//               className="bg-[#00d0d4] hover:bg-[#00b8bc] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
//             >
//               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//               حفظ التغييرات
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Barcode as BarcodeIcon, Loader2 } from 'lucide-react';

interface EditAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessory: any;
}

import { useBranchPermissions } from '../hooks/useBranchPermissions';

export default function EditAccessoryModal({ isOpen, onClose, onSuccess, accessory }: EditAccessoryModalProps) {
  const { canEditPrices } = useBranchPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('manual');

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    half_wholesale_price: '',
    tax: '0',
    quantity: '0',
    alert_quantity: '5',
    supplier: '',
    entry_type: 'purchase',
    status: 'جديد',
    location: '',
    notes: ''
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && accessory) {
      setFormData({
        name: accessory.name || '',
        brand: accessory.brand || '',
        category: accessory.category || '',
        barcode: accessory.barcode || '',
        cost_price: accessory.cost_price?.toString() || '',
        selling_price: accessory.selling_price?.toString() || '',
        wholesale_price: accessory.wholesale_price?.toString() || '',
        half_wholesale_price: accessory.half_wholesale_price?.toString() || '',
        tax: accessory.tax?.toString() || '0',
        quantity: accessory.quantity?.toString() || '0',
        alert_quantity: accessory.alert_quantity?.toString() || '5',
        supplier: accessory.supplier || '',
        entry_type: accessory.entry_type || 'purchase',
        status: accessory.status || 'جديد',
        location: accessory.location || '',
        notes: accessory.notes || ''
      });
      setBarcodeMode('manual');
      setError('');
    }
  }, [isOpen, accessory]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('تعديل البيانات')) {
      setError('ليس لديك صلاحية لتعديل البيانات');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      let finalBarcode = formData.barcode;
      if (barcodeMode === 'auto') {
        finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      }

      const payload = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        barcode: finalBarcode,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        half_wholesale_price: formData.half_wholesale_price ? Number(formData.half_wholesale_price) : null,
        tax: Number(formData.tax),
        quantity: Number(formData.quantity),
        alert_quantity: Number(formData.alert_quantity),
        supplier: formData.supplier,
        entry_type: formData.entry_type,
        status: formData.status,
        location: formData.location || null,
        notes: formData.notes
      };

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?id=eq.${accessory.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('فشل في تعديل الصنف');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التعديل');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !accessory) return null;

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
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">تعديل: {accessory.name}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
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

            <form id="edit-accessory-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الصنف *</label>
                   <input 
                     type="text" 
                     name="name"
                     required
                     value={formData.name}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الماركة / النوع</label>
                   <input 
                     type="text" 
                     name="brand"
                     value={formData.brand}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">التصنيف</label>
                   <input 
                     type="text" 
                     name="category"
                     value={formData.category}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الإدخال</label>
                   <select 
                     name="entry_type"
                     value={formData.entry_type}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
                   >
                     <option value="purchase">مشتريات</option>
                     <option value="stock">رصيد أول مدة</option>
                   </select>
                 </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <BarcodeIcon className="w-4 h-4 text-[#00d0d4]" /> الباركود
                  </label>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={barcodeMode === 'auto'}
                        onChange={() => setBarcodeMode('auto')}
                        className="text-[#00d0d4] focus:ring-[#00d0d4]/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">تلقائي جديد 🔄</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={barcodeMode === 'manual'}
                        onChange={() => setBarcodeMode('manual')}
                        className="text-[#00d0d4] focus:ring-[#00d0d4]/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">الحالي 📌 / يدوي/سكان 📷</span>
                    </label>
                  </div>
                </div>
                {barcodeMode === 'manual' && (
                  <input 
                    type="text" 
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="امسح الباركود هنا..."
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر الشراء *</label>
                   <input 
                     type="number" 
                     name="cost_price"
                     required
                     disabled={!canEditPrices}
                     min="0"
                     step="0.01"
                     value={formData.cost_price}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300" title="قيمة الضريبة">الضريبة (%)</label>
                   <input 
                     type="number" 
                     name="tax"
                     min="0"
                     disabled={!canEditPrices}
                     step="0.01"
                     value={formData.tax}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع قطاعي *</label>
                   <input 
                     type="number" 
                     name="selling_price"
                     required
                     disabled={!canEditPrices}
                     min="0"
                     step="0.01"
                     value={formData.selling_price}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors disabled:opacity-50"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع جملة (اختياري)</label>
                  <input 
                    type="number" 
                    name="wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع نصف جملة (اختياري)</label>
                  <input 
                    type="number" 
                    name="half_wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.half_wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
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
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه</label>
                  <input 
                    type="number" 
                    name="alert_quantity"
                    min="0"
                    value={formData.alert_quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
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
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
                  >
                    <option value="">بدون مورد</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors appearance-none"
                    >
                      <option value="جديد">جديد</option>
                      <option value="مستعمل">مستعمل</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">مكان التخزين (اختياري)</label>
                    <input 
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="مثال: شوكة رقم 100"
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-[#00d0d4] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
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
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="edit-accessory-form"
              disabled={isLoading}
              className="bg-[#00d0d4] hover:bg-[#00b8bc] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              حفظ التغييرات
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
