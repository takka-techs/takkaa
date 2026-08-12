// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { X, Save, Calendar, ChevronDown, Loader2 } from 'lucide-react';
// import { useBranch } from '../contexts/BranchContext';

// interface AddEmployeeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   employee?: any;
// }

// const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
// const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// export default function AddEmployeeModal({ isOpen, onClose, onSuccess, employee }: AddEmployeeModalProps) {
//   const { branches, isOwner, currentBranchId: contextBranchId } = useBranch();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [formData, setFormData] = useState({
//     full_name: '',
//     national_id: '',
//     job_title: '',
//     email: '',
//     salary_type: 'شهري',
//     department: '',
//     monthly_salary: 0,
//     fixed_allowances: 0,
//     commission_type: 'none',
//     commission_value: 0,
//     commission_target: 'devices_only',
//     vacation_balance: 21,
//     hire_date: new Date().toISOString().split('T')[0],
//     status: 'نشط',
//     address: '',
//     notes: '',
//     branch_id: contextBranchId || ''
//   });

//   React.useEffect(() => {
//     if (isOpen) {
//       if (employee) {
//         setFormData({
//           full_name: employee.full_name || '',
//           national_id: employee.national_id || '',
//           job_title: employee.job_title || '',
//           email: employee.email || '',
//           salary_type: employee.salary_type || 'شهري',
//           department: employee.department || '',
//           monthly_salary: employee.monthly_salary || 0,
//           fixed_allowances: employee.fixed_allowances || 0,
//           commission_type: employee.commission_type || 'none',
//           commission_value: employee.commission_value || 0,
//           commission_target: employee.commission_target || 'devices_only',
//           vacation_balance: employee.vacation_balance ?? 21,
//           hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
//           status: employee.status || 'نشط',
//           address: employee.address || '',
//           notes: employee.notes || '',
//           branch_id: employee.branch_id || contextBranchId || ''
//         });
//       } else {
//         setFormData({
//           full_name: '',
//           national_id: '',
//           job_title: '',
//           email: '',
//           salary_type: 'شهري',
//           department: '',
//           monthly_salary: 0,
//           fixed_allowances: 0,
//           commission_type: 'none',
//           commission_value: 0,
//           commission_target: 'devices_only',
//           vacation_balance: 21,
//           hire_date: new Date().toISOString().split('T')[0],
//           status: 'نشط',
//           address: '',
//           notes: '',
//           branch_id: contextBranchId || ''
//         });
//       }
//     }
//   }, [isOpen, employee, contextBranchId]);

//   if (!isOpen) return null;

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: e.target.type === 'number' ? Number(value) : value
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!formData.full_name || !formData.job_title || !formData.hire_date) {
//       alert('برجاء ملء الحقول الإجبارية!');
//       return;
//     }

//     setIsSubmitting(true);
//     const userId = localStorage.getItem('user_id');
//     const activeCashierStr = localStorage.getItem('active_cashier');
//     let ownerId = userId;
//     let tenantId = userId;
    
//     if (activeCashierStr) {
//       try {
//         const cashierAuth = JSON.parse(activeCashierStr);
//         if (cashierAuth.tenant_id) {
//            ownerId = cashierAuth.tenant_id;
//            tenantId = cashierAuth.tenant_id;
//         }
//       } catch(e) {}
//     }

//     const currentBranchId = localStorage.getItem('takka_active_branch_id');
//     const dataToSubmit: any = {
//       ...formData,
//       tenant_id: tenantId
//     };

//     if (isOwner && formData.branch_id) {
//        dataToSubmit.branch_id = formData.branch_id;
//     } else if (currentBranchId) {
//        dataToSubmit.branch_id = currentBranchId;
//     } else {
//        delete dataToSubmit.branch_id;
//     }

//     try {
//       const url = employee 
//         ? `${SUPABASE_URL}/rest/v1/employees?id=eq.${employee.id}&tenant_id=eq.${ownerId}`
//         : `${SUPABASE_URL}/rest/v1/employees`;
        
//       const response = await fetch(url, {
//         method: employee ? 'PATCH' : 'POST',
//         headers: {
//           'apikey': SUPABASE_KEY,
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//           'Prefer': 'return=minimal'
//         },
//         body: JSON.stringify(dataToSubmit)
//       });

//       if (response.ok) {
//         onSuccess();
//         onClose();
//       } else {
//         const errorData = await response.json();
//         alert('حدث خطأ: ' + errorData.message);
//       }
//     } catch (err) {
//       console.error(err);
//       alert('فشل الاتصال بالخادم!');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
//           onClick={onClose}
//         />
        
//         <motion.div 
//           initial={{ opacity: 0, scale: 0.95, y: 20 }} 
//           animate={{ opacity: 1, scale: 1, y: 0 }} 
//           exit={{ opacity: 0, scale: 0.95, y: 20 }}
//           className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/5 shrink-0">
//             <div className="flex items-center gap-3">
//               <span className="text-2xl">👤</span>
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white">
//                 {employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
//               </h2>
//             </div>
//             <button 
//               onClick={onClose}
//               className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors bg-slate-100 dark:bg-white/5"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
//               {/* Row 1 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الموظف <span className="text-red-500">*</span></label>
//                 <input name="full_name" value={formData.full_name} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">رقم الهوية</label>
//                 <input name="national_id" value={formData.national_id} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 2 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الوظيفة <span className="text-red-500">*</span></label>
//                 <input name="job_title" value={formData.job_title} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">البريد الإلكتروني</label>
//                 <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 3 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الراتب <span className="text-red-500">*</span></label>
//                 <div className="relative">
//                   <select name="salary_type" value={formData.salary_type} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">شهري</option>
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">أسبوعي</option>
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">يومي</option>
//                   </select>
//                   <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">القسم</label>
//                 <input name="department" value={formData.department} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 4 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الراتب الشهري <span className="text-red-500">*</span></label>
//                 <input name="monthly_salary" value={formData.monthly_salary} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">البدلات الثابتة</label>
//                 <input name="fixed_allowances" value={formData.fixed_allowances} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 5 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نظام العمولة</label>
//                 <div className="relative">
//                   <select name="commission_type" value={formData.commission_type} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
//                     <option value="none" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">بدون عمولة</option>
//                     <option value="profit_percentage" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">نسبة من الربح (%)</option>
//                     <option value="fixed_amount" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">مبلغ ثابت لكل قطعة (ج.م)</option>
//                   </select>
//                   <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
//                 </div>
//               </div>
//               {formData.commission_type !== 'none' && (
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
//                     {formData.commission_type === 'profit_percentage' ? 'نسبة العمولة (%)' : 'المبلغ الثابت (ج.م)'}
//                   </label>
//                   <input name="commission_value" value={formData.commission_value} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//                 </div>
//               )}

//               {/* Row Target */}
//               {formData.commission_type !== 'none' && (
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تطبق العمولة على</label>
//                   <div className="relative">
//                     <select name="commission_target" value={formData.commission_target} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
//                       <option value="devices_only" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">الأجهزة فقط</option>
//                       <option value="all" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">الأجهزة والإكسسوارات وقطع الغيار</option>
//                     </select>
//                     <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">رصيد الإجازات السنوي</label>
//                 <input name="vacation_balance" value={formData.vacation_balance} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 6 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تاريخ التعيين <span className="text-red-500">*</span></label>
//                 <div className="relative">
//                   <input name="hire_date" value={formData.hire_date} onChange={handleChange} type="date" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
//                 <div className="relative">
//                   <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">نشط</option>
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">غير نشط</option>
//                     <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">معلق</option>
//                   </select>
//                   <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
//                 </div>
//               </div>

//               {/* Row 7 */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">العنوان</label>
//                 <input name="address" value={formData.address} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
//                 <input name="notes" value={formData.notes} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
//               </div>

//               {/* Row 8 */}
//               {isOwner && branches.length > 0 && (
//                 <div className="space-y-2 col-span-1 md:col-span-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تعيين فرع <span className="text-red-500">*</span></label>
//                   <div className="relative">
//                     <select 
//                       name="branch_id"
//                       value={formData.branch_id}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none"
//                     >
//                       <option value="" disabled className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">اختر الفرع</option>
//                       {branches.map(b => (
//                         <option key={b.id} value={b.id} className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">{b.name}</option>
//                       ))}
//                     </select>
//                     <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center gap-3 p-6 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#11151c]">
//             <button 
//               onClick={onClose}
//               className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium"
//             >
//               إلغاء
//             </button>
//             <button 
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white transition-colors font-medium"
//             >
//               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
//               {isSubmitting ? 'جاري الحفظ...' : 'حفظ 💾'}
//             </button>
//           </div>

//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: any;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function AddEmployeeModal({ isOpen, onClose, onSuccess, employee }: AddEmployeeModalProps) {
  const { branches, isOwner, currentBranchId: contextBranchId } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    job_title: '',
    email: '',
    salary_type: 'شهري',
    department: '',
    monthly_salary: 0,
    fixed_allowances: 0,
    commission_type: 'none',
    commission_value: 0,
    commission_target: 'devices_only',
    maintenance_commission_value: 0,
    vacation_balance: 21,
    hire_date: new Date().toISOString().split('T')[0],
    status: 'نشط',
    address: '',
    notes: '',
    branch_id: contextBranchId || ''
  });

  React.useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          full_name: employee.full_name || '',
          national_id: employee.national_id || '',
          job_title: employee.job_title || '',
          email: employee.email || '',
          salary_type: employee.salary_type || 'شهري',
          department: employee.department || '',
          monthly_salary: employee.monthly_salary || 0,
          fixed_allowances: employee.fixed_allowances || 0,
          commission_type: employee.commission_type || 'none',
          commission_value: employee.commission_value || 0,
          commission_target: employee.commission_target || 'devices_only',
          maintenance_commission_value: employee.maintenance_commission_value || 0,
          vacation_balance: employee.vacation_balance ?? 21,
          hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
          status: employee.status || 'نشط',
          address: employee.address || '',
          notes: employee.notes || '',
          branch_id: employee.branch_id || contextBranchId || ''
        });
      } else {
        setFormData({
          full_name: '',
          national_id: '',
          job_title: '',
          email: '',
          salary_type: 'شهري',
          department: '',
          monthly_salary: 0,
          fixed_allowances: 0,
          commission_type: 'none',
          commission_value: 0,
          commission_target: 'devices_only',
          maintenance_commission_value: 0,
          vacation_balance: 21,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'نشط',
          address: '',
          notes: '',
          branch_id: contextBranchId || ''
        });
      }
    }
  }, [isOpen, employee, contextBranchId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.job_title || !formData.hire_date) {
      alert('برجاء ملء الحقول الإجبارية!');
      return;
    }

    setIsSubmitting(true);
    const userId = localStorage.getItem('user_id');
    const activeCashierStr = localStorage.getItem('active_cashier');
    let ownerId = userId;
    let tenantId = userId;
    
    if (activeCashierStr) {
      try {
        const cashierAuth = JSON.parse(activeCashierStr);
        if (cashierAuth.tenant_id) {
           ownerId = cashierAuth.tenant_id;
           tenantId = cashierAuth.tenant_id;
        }
      } catch(e) {}
    }

    const currentBranchId = localStorage.getItem('takka_active_branch_id');
    const dataToSubmit: any = {
      ...formData,
      tenant_id: tenantId
    };

    if (isOwner && formData.branch_id) {
       dataToSubmit.branch_id = formData.branch_id;
    } else if (currentBranchId) {
       dataToSubmit.branch_id = currentBranchId;
    } else {
       delete dataToSubmit.branch_id;
    }

    try {
      const url = employee 
        ? `${SUPABASE_URL}/rest/v1/employees?id=eq.${employee.id}&tenant_id=eq.${ownerId}`
        : `${SUPABASE_URL}/rest/v1/employees`;
        
      const response = await fetch(url, {
        method: employee ? 'PATCH' : 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert('حدث خطأ: ' + errorData.message);
      }
    } catch (err) {
      console.error(err);
      alert('فشل الاتصال بالخادم!');
    } finally {
      setIsSubmitting(false);
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
          className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors bg-slate-100 dark:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Row 1 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الموظف <span className="text-red-500">*</span></label>
                <input name="full_name" value={formData.full_name} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">رقم الهوية</label>
                <input name="national_id" value={formData.national_id} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 2 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الوظيفة <span className="text-red-500">*</span></label>
                <input name="job_title" value={formData.job_title} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">البريد الإلكتروني</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 3 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الراتب <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select name="salary_type" value={formData.salary_type} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">شهري</option>
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">أسبوعي</option>
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">يومي</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">القسم</label>
                <input name="department" value={formData.department} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 4 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الراتب الشهري <span className="text-red-500">*</span></label>
                <input name="monthly_salary" value={formData.monthly_salary} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">البدلات الثابتة</label>
                <input name="fixed_allowances" value={formData.fixed_allowances} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 5 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نظام العمولة</label>
                <div className="relative">
                  <select name="commission_type" value={formData.commission_type} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
                    <option value="none" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">بدون عمولة</option>
                    <option value="profit_percentage" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">نسبة من الربح (%)</option>
                    <option value="fixed_amount" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">مبلغ ثابت لكل قطعة (ج.م)</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {formData.commission_type !== 'none' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {formData.commission_type === 'profit_percentage' ? 'نسبة العمولة (%)' : 'المبلغ الثابت (ج.م)'}
                  </label>
                  <input name="commission_value" value={formData.commission_value} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
                </div>
              )}

              {/* Row Target */}
              {formData.commission_type !== 'none' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تطبق العمولة على</label>
                  <div className="relative">
                    <select name="commission_target" value={formData.commission_target} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
                      <option value="devices_only" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">الأجهزة فقط</option>
                      <option value="all" className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">الأجهزة والإكسسوارات وقطع الغيار</option>
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نسبة عمولة الصيانة (%)</label>
                <input name="maintenance_commission_value" value={formData.maintenance_commission_value} onChange={handleChange} type="number" min="0" max="100" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">رصيد الإجازات السنوي</label>
                <input name="vacation_balance" value={formData.vacation_balance} onChange={handleChange} type="number" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 6 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تاريخ التعيين <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input name="hire_date" value={formData.hire_date} onChange={handleChange} type="date" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
                <div className="relative">
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none">
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">نشط</option>
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">غير نشط</option>
                    <option className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">معلق</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 7 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">العنوان</label>
                <input name="address" value={formData.address} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                <input name="notes" value={formData.notes} onChange={handleChange} type="text" className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors" />
              </div>

              {/* Row 8 */}
              {isOwner && branches.length > 0 && (
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تعيين فرع <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">اختر الفرع</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-[#11151c] text-slate-900 dark:text-white">{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#11151c]">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white transition-colors font-medium"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ 💾'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
