// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { 
//   X, Smartphone, LayoutGrid, Settings, Package, 
//   Store, Barcode, DollarSign, Building2, FileText,
//   Save, Loader2, Edit3
// , Battery } from 'lucide-react';
// import { useBranchPermissions } from '../hooks/useBranchPermissions';

// interface EditDeviceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   device: any;
// }

// export default function EditDeviceModal({ isOpen, onClose, onSuccess, device }: EditDeviceModalProps) {
//   const { canEditPrices } = useBranchPermissions();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const [formData, setFormData] = useState({
//     company: '',
//     model: '',
//     storage: '',
//     color: '',
//     ram: '',
//     condition: 'جديد',
//     has_box: true,
//     source: '',
//     imei1: '',
//     imei2: '',
//     cost_price: '',
//     battery_percentage: '',
//     selling_price: '',
//     tax: '',
//     notes: ''
//   });

//   useEffect(() => {
//     if (device) {
//       setFormData({
//         company: device.company || '',
//         model: device.model || '',
//         storage: device.storage || '',
//         color: device.color || '',
//         ram: device.ram || '',
//         condition: device.condition || 'جديد',
//         has_box: device.has_box,
//         source: device.source || '',
//         imei1: device.imei1 || '',
//         imei2: device.imei2 || '',
//         battery_percentage: device.battery_percentage || '',
//         cost_price: device.cost_price?.toString() || '', 
//         selling_price: device.selling_price?.toString() || '',
//         tax: device.tax?.toString() || '',
//         notes: device.notes || ''
//       });
//     }
//   }, [device]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value, type } = e.target;
    
//     if (type === 'checkbox') {
//       const checked = (e.target as HTMLInputElement).checked;
//       setFormData(prev => ({ ...prev, [name]: checked }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }
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
      
//       const payload = {
//         ...formData,
//         cost_price: Number(formData.cost_price) || 0,
//         selling_price: Number(formData.selling_price) || 0,
//         tax: Number(formData.tax) || 0,
//         has_box: formData.has_box.toString() === 'true' || formData.has_box === true,
//         battery_percentage: formData.battery_percentage ? Number(formData.battery_percentage) : null,
//         imei2: formData.imei2 || null
//       };

//       const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?id=eq.${device.id}`, {
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
//         throw new Error('فشل في تحديث بيانات الجهاز');
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen || !device) return null;

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
//               <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
//                 <Edit3 className="w-5 h-5" />
//               </div>
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white">تعديل بيانات الجهاز</h2>
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
//               <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
//                 {error}
//               </div>
//             )}

//             <form id="edit-device-form" onSubmit={handleSubmit} className="space-y-8">
              
//               {/* Basic Info */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-blue-400 mb-2">
//                   <LayoutGrid className="w-4 h-4" />
//                   <h3 className="text-sm font-bold">المعلومات الأساسية</h3>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
//                       <Building2 className="w-3.5 h-3.5" /> الشركة
//                     </label>
//                     <input 
//                       type="text" 
//                       name="company"
//                       value={formData.company}
//                       onChange={handleChange}
//                       required
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
//                       <Smartphone className="w-3.5 h-3.5" /> الموديل
//                     </label>
//                     <input 
//                       type="text" 
//                       name="model"
//                       value={formData.model}
//                       onChange={handleChange}
//                       required
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Specs */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-emerald-400 mb-2">
//                   <Settings className="w-4 h-4" />
//                   <h3 className="text-sm font-bold">المواصفات</h3>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">السعة</label>
//                     <input 
//                       type="text" 
//                       name="storage"
//                       value={formData.storage}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الرام</label>
//                     <input 
//                       type="text" 
//                       name="ram"
//                       value={formData.ram}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">اللون</label>
//                     <input 
//                       type="text" 
//                       name="color"
//                       value={formData.color}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الحالة</label>
//                     <select 
//                       name="condition"
//                       value={formData.condition}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
//                     >
//                       <option value="جديد">جديد</option>
//                       <option value="كالجديد">كالجديد</option>
//                       <option value="مستعمل">مستعمل</option>
//                       <option value="عاطل">عاطل</option>
//                     </select>
//                   </div>
//               {(formData.company === 'Apple' || formData.company === 'apple') && (
//                 <div className="space-y-1.5">
//                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
//                     <Battery className="w-3.5 h-3.5 text-blue-400" /> نسبة البطارية
//                   </label>
//                   <input 
//                     type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
//                   />
//                 </div>
//               )}
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الكرتونة</label>
//                     <select 
//                       name="has_box"
//                       value={formData.has_box.toString()}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
//                     >
//                       <option value="true">بكرتونة</option>
//                       <option value="false">بدون كرتونة</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Identifiers */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-purple-400 mb-2">
//                   <Barcode className="w-4 h-4" />
//                   <h3 className="text-sm font-bold">المعرفات</h3>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">IMEI 1</label>
//                     <input 
//                       type="text" 
//                       name="imei1"
//                       value={formData.imei1}
//                       onChange={handleChange}
//                       required
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all font-mono"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">IMEI 2 (اختياري)</label>
//                     <input 
//                       type="text" 
//                       name="imei2"
//                       value={formData.imei2}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all font-mono"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Pricing */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-orange-400 mb-2">
//                   <DollarSign className="w-4 h-4" />
//                   <h3 className="text-sm font-bold">التسعير</h3>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر التكلفة</label>
//                     <input 
//                       type="number" 
//                       name="cost_price"
//                       value={formData.cost_price}
//                       onChange={handleChange}
//                       disabled={!canEditPrices}
//                       required
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all disabled:opacity-50"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر البيع</label>
//                     <input 
//                       type="number" 
//                       name="selling_price"
//                       value={formData.selling_price}
//                       onChange={handleChange}
//                       disabled={!canEditPrices}
//                       required
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all disabled:opacity-50"
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ضريبة NTRA</label>
//                     <input 
//                       type="number" 
//                       name="tax"
//                       value={formData.tax}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Additional */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-rose-400 mb-2">
//                   <Store className="w-4 h-4" />
//                   <h3 className="text-sm font-bold">إضافي</h3>
//                 </div>
                
//                 <div className="space-y-1.5">
//                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400">المصدر</label>
//                   <input 
//                     type="text" 
//                     name="source"
//                     value={formData.source}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div className="space-y-1.5">
//                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
//                     <FileText className="w-3.5 h-3.5" /> ملاحظات (اختياري)
//                   </label>
//                   <textarea 
//                     name="notes"
//                     value={formData.notes}
//                     onChange={handleChange}
//                     rows={3}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all resize-none"
//                     placeholder="أي ملاحظات إضافية..."
//                   />
//                 </div>
//               </div>

//             </form>
//           </div>

//           {/* Footer */}
//           <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
//             <button 
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
//             >
//               إلغاء
//             </button>
//             <button 
//               type="submit"
//               form="edit-device-form"
//               disabled={isLoading}
//               className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
//             >
//               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//               حفظ التعديلات
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Smartphone, LayoutGrid, Settings, Package, 
  Store, Barcode, DollarSign, Building2, FileText,
  Save, Loader2, Edit3
, Battery } from 'lucide-react';
import { useBranchPermissions } from '../hooks/useBranchPermissions';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: any;
}

export default function EditDeviceModal({ isOpen, onClose, onSuccess, device }: EditDeviceModalProps) {
  const { canEditPrices } = useBranchPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    company: '',
    model: '',
    storage: '',
    color: '',
    ram: '',
    condition: 'جديد',
    has_box: true,
    source: '',
    imei1: '',
    imei2: '',
    cost_price: '',
    battery_percentage: '',
    selling_price: '',
    wholesale_price: '',
    half_wholesale_price: '',
    tax: '',
    notes: ''
  });

  useEffect(() => {
    if (device) {
      setFormData({
        company: device.company || '',
        model: device.model || '',
        storage: device.storage || '',
        color: device.color || '',
        ram: device.ram || '',
        condition: device.condition || 'جديد',
        has_box: device.has_box,
        source: device.source || '',
        imei1: device.imei1 || '',
        imei2: device.imei2 || '',
        battery_percentage: device.battery_percentage || '',
        cost_price: device.cost_price?.toString() || '', 
        selling_price: device.selling_price?.toString() || '',
        wholesale_price: device.wholesale_price?.toString() || '',
        half_wholesale_price: device.half_wholesale_price?.toString() || '',
        tax: device.tax?.toString() || '',
        notes: device.notes || ''
      });
    }
  }, [device]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      
      const payload = {
        ...formData,
        cost_price: Number(formData.cost_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        half_wholesale_price: formData.half_wholesale_price ? Number(formData.half_wholesale_price) : null,
        tax: Number(formData.tax) || 0,
        has_box: formData.has_box.toString() === 'true' || formData.has_box === true,
        battery_percentage: formData.battery_percentage ? Number(formData.battery_percentage) : null,
        imei2: formData.imei2 || null
      };

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?id=eq.${device.id}`, {
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
        throw new Error('فشل في تحديث بيانات الجهاز');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !device) return null;

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
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">تعديل بيانات الجهاز</h2>
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
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form id="edit-device-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <LayoutGrid className="w-4 h-4" />
                  <h3 className="text-sm font-bold">المعلومات الأساسية</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> الشركة
                    </label>
                    <input 
                      type="text" 
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> الموديل
                    </label>
                    <input 
                      type="text" 
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Settings className="w-4 h-4" />
                  <h3 className="text-sm font-bold">المواصفات</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">السعة</label>
                    <input 
                      type="text" 
                      name="storage"
                      value={formData.storage}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الرام</label>
                    <input 
                      type="text" 
                      name="ram"
                      value={formData.ram}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">اللون</label>
                    <input 
                      type="text" 
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الحالة</label>
                    <select 
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="جديد">جديد</option>
                      <option value="كالجديد">كالجديد</option>
                      <option value="مستعمل">مستعمل</option>
                      <option value="عاطل">عاطل</option>
                    </select>
                  </div>
              {(formData.company === 'Apple' || formData.company === 'apple') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Battery className="w-3.5 h-3.5 text-blue-400" /> نسبة البطارية
                  </label>
                  <input 
                    type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">الكرتونة</label>
                    <select 
                      name="has_box"
                      value={formData.has_box.toString()}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="true">بكرتونة</option>
                      <option value="false">بدون كرتونة</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Identifiers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Barcode className="w-4 h-4" />
                  <h3 className="text-sm font-bold">المعرفات</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">IMEI 1</label>
                    <input 
                      type="text" 
                      name="imei1"
                      value={formData.imei1}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">IMEI 2 (اختياري)</label>
                    <input 
                      type="text" 
                      name="imei2"
                      value={formData.imei2}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <h3 className="text-sm font-bold">التسعير</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر التكلفة</label>
                    <input 
                      type="number" 
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      disabled={!canEditPrices}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر البيع قطاعي</label>
                    <input 
                      type="number" 
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      disabled={!canEditPrices}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر البيع جملة (اختياري)</label>
                    <input 
                      type="number" 
                      name="wholesale_price"
                      value={formData.wholesale_price}
                      onChange={handleChange}
                      disabled={!canEditPrices}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">سعر البيع نصف جملة (اختياري)</label>
                    <input 
                      type="number" 
                      name="half_wholesale_price"
                      value={formData.half_wholesale_price}
                      onChange={handleChange}
                      disabled={!canEditPrices}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ضريبة NTRA</label>
                    <input 
                      type="number" 
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Additional */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 mb-2">
                  <Store className="w-4 h-4" />
                  <h3 className="text-sm font-bold">إضافي</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">المصدر</label>
                  <input 
                    type="text" 
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> ملاحظات (اختياري)
                  </label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-all resize-none"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="edit-device-form"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ التعديلات
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
