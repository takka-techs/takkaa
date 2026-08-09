// import React, { useState } from "react";
// import { motion, AnimatePresence } from "motion/react";
// import { Settings, User, Building2, Package, Globe, Check, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";

// export function SignupWizard({ initialEmail, initialCompany, onCancel, onComplete, isSubmitting, error }: { initialEmail?: string; initialCompany?: string; onCancel: () => void; onComplete: (data: any) => void; isSubmitting: boolean; error: string }) {
//   const [step, setStep] = useState(1);
//   const totalSteps = 5;
  
//   // State
//   const [data, setData] = useState({
//     companyName: initialCompany || "",
//     logo: "",
//     currency: "EG",
//     dateFormat: "DD/MM/YYYY",
//     language: "AR",
//     lowStockThreshold: 10,
//     enableLowStockAlerts: true,
//     preventZeroStockSales: false,
//     autoTrackInventory: true,
//     autoPrint: false,
//     confirmDeletions: true,
//     autoSave: true,
//     notifications: true,
//     sounds: true,
//     autoBackup: true,
//     fullName: "",
//   });

//   const handleChange = (key: string, value: any) => {
//     setData(prev => ({ ...prev, [key]: value }));
//   };

//   const steps = [
//     { num: 1, title: "الشركة", icon: <Building2 className="w-5 h-5" /> },
//     { num: 2, title: "الإقليمية", icon: <Globe className="w-5 h-5" /> },
//     { num: 3, title: "المخزون", icon: <Package className="w-5 h-5" /> },
//     { num: 4, title: "التفضيلات", icon: <Settings className="w-5 h-5" /> },
//     { num: 5, title: "المراجعة", icon: <Check className="w-5 h-5" /> }
//   ];

//   return (
//     <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#080c13] flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto min-h-screen" dir="rtl">
//       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
      
//       <div className="w-full max-w-4xl max-h-full flex flex-col relative z-10">
//         {error && (
//             <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold text-center">
//                 {error}
//             </div>
//         )}
        
//         {/* Timeline */}
//         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-6 mb-8 flex justify-between items-center relative shadow-lg">
//           <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-white/5 start-0 mt-[-10px] -z-10 rounded-full" />
//           <div 
//             className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 start-0 mt-[-10px] -z-10 transition-all duration-500 rounded-full shadow-[0_0_10px_var(--accent-500)]" 
//             style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
//           />
//           {steps.map((s, index) => (
//             <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative z-10">
//               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= s.num ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_0_20px_var(--accent-500)] ring-4 ring-primary-500/20' : 'bg-slate-100 dark:bg-[#1a1f26] text-slate-400 border border-slate-200 dark:border-white/5 shadow-inner'} ${step === s.num ? 'scale-110' : ''}`}>
//                 {s.icon}
//               </div>
//               <span className={`text-xs font-bold whitespace-nowrap mt-2 ${step === s.num ? 'text-primary-600 dark:text-primary-400' : step > s.num ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{s.title}</span>
//             </div>
//           ))}
//         </div>

//         {/* Main Card */}
//         <div className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col flex-1 shrink-0 shadow-primary-500/5">
//           <div className="p-8 sm:p-12 overflow-y-auto">
//             <AnimatePresence mode="wait">
//               <motion.div 
//                 key={step}
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -20 }}
//                 transition={{ duration: 0.3 }}
//                 className="space-y-8"
//               >
//                 {step === 1 && <Step1 data={data} handleChange={handleChange} />}
//                 {step === 2 && <Step2 data={data} handleChange={handleChange} />}
//                 {step === 3 && <Step3 data={data} handleChange={handleChange} />}
//                 {step === 4 && <Step4 data={data} handleChange={handleChange} />}
//                 {step === 5 && <Step6 data={data} />}
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           <div className="p-6 bg-slate-50 dark:bg-[#0c1017] border-t border-slate-200 dark:border-white/5 flex justify-between items-center mt-auto">
//             <button 
//                onClick={onCancel}
//                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-4 py-2 font-bold text-sm transition-colors"
//                disabled={isSubmitting}
//             >
//               تسجيل الخروج
//             </button>
            
//             <div className="flex gap-4">
//               {step > 1 && (
//                 <button 
//                   onClick={() => setStep(s => s - 1)}
//                   className="px-6 py-3 bg-white dark:bg-[#1a1f29] text-slate-700 dark:text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-[#2a3140] transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50"
//                   disabled={isSubmitting}
//                 >
//                   <ChevronRight className="w-5 h-5" /> السابق
//                 </button>
//               )}
//               {step < totalSteps ? (
//                 <button 
//                   onClick={() => setStep(s => s + 1)}
//                   className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/20"
//                 >
//                   التالي <ChevronLeft className="w-5 h-5" />
//                 </button>
//               ) : (
//                 <button 
//                   onClick={() => onComplete(data)}
//                   disabled={isSubmitting}
//                   className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإنهاء'} <Check className="w-5 h-5" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StepHeader({ icon, title, desc }: { icon: any, title: string, desc: string }) {
//   return (
//     <div className="flex flex-col mb-10 items-end">
//       <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#1a1f29] py-3 px-5 rounded-xl border border-slate-200 dark:border-white/5 mb-4 float-right shadow-sm">
//          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h2>
//          <div className="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center shadow-md">
//            {icon}
//          </div>
//       </div>
//       <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-end w-full">{desc}</p>
//     </div>
//   );
// }

// function CardToggle({ title, desc, checked, onChange, icon: Icon, color = "primary" }: any) {
//   return (
//     <div className={`flex items-center justify-between p-6 bg-white dark:bg-[#1a1f29] rounded-2xl border transition-colors shadow-sm cursor-pointer ${checked ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`} onClick={() => onChange(!checked)}>
//        <div className="flex items-center gap-4 pointer-events-none">
//           <label className="relative inline-flex items-center cursor-pointer">
//               <input type="checkbox" className="sr-only peer" checked={checked} readOnly />
//               <div className="w-14 h-7 bg-slate-200 dark:bg-[#161a23] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-scale-x-100 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500 shadow-inner"></div>
//           </label>
//        </div>
//        <div className="flex flex-col items-end text-end">
//          <div className="flex items-center gap-2 mb-1">
//             <h3 className="text-slate-800 dark:text-white font-bold">{title}</h3>
//             {Icon && <Icon className="w-5 h-5 text-slate-400" />}
//          </div>
//          <p className="text-slate-500 text-xs">{desc}</p>
//        </div>
//     </div>
//   );
// }

// function Step1({ data, handleChange }: any) {
//   return (
//     <div className="flex flex-col items-end">
//       <StepHeader icon={<Building2 className="w-6 h-6" />} title="إعدادات الشركة" desc="أدخل اسم مسؤول النظام واسم الشركة ليتم استخدامهما في الفواتير والتقارير." />
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
//         <div className="space-y-3 text-end">
//            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اسم المسؤول (المدير)</label>
//            <div className="relative">
//              <input type="text" value={data.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="مثال: أحمد محمد" className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold placeholder-slate-400 dark:placeholder-slate-600" />
//            </div>
//            <p className="text-xs text-slate-500 mt-2">اسم المالك أو المسؤول المباشر.</p>
//         </div>
//         <div className="space-y-3 text-end">
//            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اسم الشركة</label>
//            <div className="relative">
//              <input type="text" value={data.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder="مثال: شركة تكنو جروب" className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold placeholder-slate-400 dark:placeholder-slate-600" />
//            </div>
//            <p className="text-xs text-slate-500 mt-2">سيتم استخدام هذا الاسم في الفواتير أعلى الصفحة.</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// const currencies = [
//   { id: 'EG', name: 'جنيه مصري', symbol: 'ج.م', code: 'EGP' },
//   { id: 'SA', name: 'ريال سعودي', symbol: 'ر.س', code: 'SAR' },
//   { id: 'AE', name: 'درهم إماراتي', symbol: 'د.إ', code: 'AED' },
//   { id: 'US', name: 'دولار أمريكي', symbol: '$', code: 'USD' },
//   { id: 'EU', name: 'يورو', symbol: '€', code: 'EUR' },
//   { id: 'KW', name: 'دينار كويتي', symbol: 'د.ك', code: 'KWD' },
// ];

// function Step2({ data, handleChange }: any) {
//   return (
//     <div className="flex flex-col items-end">
//       <StepHeader icon={<Globe className="w-6 h-6" />} title="الإعدادات الإقليمية" desc="اختر العملة وتنسيق التاريخ المناسب لمنطقتك." />
//       <div className="mb-8 w-full mt-4">
//          <label className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 block text-end me-2">العملة الافتراضية</label>
//          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
//             {currencies.map(c => (
//               <div 
//                 key={c.id} 
//                 onClick={() => handleChange('currency', c.id)}
//                 className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-3 ${data.currency === c.id ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/20 ring-2 ring-primary-500/50' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161a23] hover:bg-slate-100 dark:hover:bg-[#1a1f29]'}`}
//               >
//                  <span className={`text-2xl font-black ${data.currency === c.id ? 'text-primary-600 dark:text-primary-400 drop-shadow-sm' : 'text-slate-400'}`}>{c.id}</span>
//                  <span className={`text-md font-bold ${data.currency === c.id ? 'text-primary-500' : 'text-slate-500'}`}>{c.name}</span>
//                  <span className="text-xs text-slate-600 bg-black/5 dark:bg-black/20 px-2 py-1 rounded-md">{c.code} - {c.symbol}</span>
//               </div>
//             ))}
//          </div>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
//          <div className="space-y-3 text-end">
//             <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">تنسيق التاريخ</label>
//             <select value={data.dateFormat} onChange={e => handleChange('dateFormat', e.target.value)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 appearance-none font-bold" dir="rtl">
//               <option>DD/MM/YYYY (31/12/2025)</option>
//               <option>MM/DD/YYYY (12/31/2025)</option>
//               <option>YYYY-MM-DD (2025-12-31)</option>
//             </select>
//          </div>
//          <div className="space-y-3 text-end">
//             <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اللغة</label>
//             <select value={data.language} onChange={e => handleChange('language', e.target.value)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 appearance-none font-bold" dir="rtl">
//               <option value="AR">العربية</option>
//               <option value="EN">English</option>
//             </select>
//          </div>
//       </div>
//     </div>
//   );
// }

// function Step3({ data, handleChange }: any) {
//   return (
//     <div className="flex flex-col items-end w-full">
//       <StepHeader icon={<Package className="w-6 h-6" />} title="إعدادات المخزون" desc="قم بتخصيص إعدادات المخزون والتنبيهات حسب احتياجاتك." />
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 w-full mt-4">
//         <div className="col-span-2 md:col-span-1 space-y-3 text-end">
//            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">حد تنبيه المخزون المنخفض</label>
//            <input type="number" min="0" value={data.lowStockThreshold} onChange={e => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 font-bold" dir="ltr" />
//            <p className="text-xs text-slate-500 mt-2">سيتم تنبيهك عندما يقل مخزون أي منتج عن هذا الرقم.</p>
//         </div>
//         <div className="col-span-2 md:col-span-1 space-y-3 text-end opacity-50">
//            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">الحد الأدنى للمخزون الافتراضي</label>
//            <input type="number" value="5" disabled className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end font-bold cursor-not-allowed" dir="ltr" />
//            <p className="text-xs text-slate-500 mt-2">القيمة الافتراضية للحد الأدنى عند إضافة منتج جديد</p>
//         </div>
//       </div>

//       <div className="space-y-4 w-full">
//         <CardToggle title="تفعيل تنبيهات المخزون المنخفض" desc="إرسال إشعار عند انخفاض المخزون عن الحد المحدد" checked={data.enableLowStockAlerts} onChange={(v: boolean) => handleChange('enableLowStockAlerts', v)} />
//         <CardToggle title="منع البيع بدون مخزون" desc="لا يمكن إتمام عملية بيع لمنتج نفذ من المخزون" checked={data.preventZeroStockSales} onChange={(v: boolean) => handleChange('preventZeroStockSales', v)} color="rose" />
//         <CardToggle title="تتبع المخزون التلقائي" desc="تحديث المخزون تلقائياً عند كل عملية بيع أو شراء" checked={data.autoTrackInventory} onChange={(v: boolean) => handleChange('autoTrackInventory', v)} color="emerald" />
//       </div>
//     </div>
//   );
// }

// function Step4({ data, handleChange }: any) {
//   return (
//     <div className="flex flex-col items-end w-full">
//       <StepHeader icon={<Settings className="w-6 h-6" />} title="تفضيلات النظام" desc="اختر الميزات والخيارات التي تناسب طريقة عملك." />
//       <div className="space-y-4 w-full mt-4">
//         <CardToggle title="الطباعة التلقائية للفواتير" desc="طباعة الفاتورة تلقائياً بعد إتمام عملية البيع" checked={data.autoPrint} onChange={(v: boolean) => handleChange('autoPrint', v)} />
//         <CardToggle title="تأكيد عمليات الحذف" desc="طلب تأكيد قبل حذف أي عنصر من النظام" checked={data.confirmDeletions} onChange={(v: boolean) => handleChange('confirmDeletions', v)} color="amber" />
//         <CardToggle title="الحفظ التلقائي" desc="حفظ التغيرات تلقائياً دون الحاجة للضغط على زر الحفظ" checked={data.autoSave} onChange={(v: boolean) => handleChange('autoSave', v)} color="blue" />
//         <CardToggle title="الإشعارات" desc="عرض إشعارات النظام والتنبيهات" checked={data.notifications} onChange={(v: boolean) => handleChange('notifications', v)} color="amber" />
//         <CardToggle title="الأصوات" desc="تشغيل أصوات التنبيهات والإشعارات" checked={data.sounds} onChange={(v: boolean) => handleChange('sounds', v)} color="blue" />
//         <CardToggle title="النسخ الاحتياطي التلقائي" desc="إنشاء نسخة احتياطية يومية من البيانات" checked={data.autoBackup} onChange={(v: boolean) => handleChange('autoBackup', v)} />
//       </div>
//     </div>
//   );
// }

// function Step6({ data }: any) {
//   return (
//     <div className="flex flex-col items-end w-full">
//       <StepHeader icon={<Check className="w-6 h-6" />} title="مراجعة الإعدادات" desc="راجع الإعدادات التي اخترتها قبل الحفظ. يمكنك الرجوع لتعديل أي إعداد." />
      
//       <div className="space-y-6 w-full mt-4">
//         <div>
//            <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">معلومات الشركة</h4>
//            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">اسم الشركة</span>
//                     <span className="text-slate-900 dark:text-white font-bold">{data.companyName || '-'}</span>
//                  </div>
//               </div>
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">الاسم الكامل</span>
//                     <span className="text-slate-900 dark:text-white font-bold">{data.fullName || '-'}</span>
//                  </div>
//               </div>
//            </div>
//         </div>

//         <div>
//            <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">الإعدادات الإقليمية</h4>
//            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">تنسيق التاريخ</span>
//                     <span className="text-slate-900 dark:text-white font-bold">{data.dateFormat}</span>
//                  </div>
//               </div>
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">العملة</span>
//                     <span className="text-slate-900 dark:text-white font-bold">{data.currency}</span>
//                  </div>
//               </div>
//            </div>
//         </div>

//         <div>
//            <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">الإعدادات</h4>
//            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">حد المخزون المنخفض</span>
//                     <span className="text-slate-900 dark:text-white font-bold">{data.lowStockThreshold} قطعة</span>
//                  </div>
//               </div>
//               <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
//                  <div className="flex flex-col gap-2 w-full items-end">
//                     <span className="text-slate-500 text-xs font-bold">لغة النظام</span>
//                     <span className="text-slate-900 dark:text-white font-bold" dir="ltr">{data.language}</span>
//                  </div>
//               </div>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, User, Building2, Package, Globe, Check, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";

export function SignupWizard({ initialEmail, initialCompany, onCancel, onComplete, isSubmitting, error }: { initialEmail?: string; initialCompany?: string; onCancel: () => void; onComplete: (data: any) => void; isSubmitting: boolean; error: string }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  
  // State
  const [data, setData] = useState({
    companyName: initialCompany || "",
    logo: "",
    currency: "EG",
    dateFormat: "DD/MM/YYYY",
    language: "AR",
    lowStockThreshold: 10,
    enableLowStockAlerts: true,
    preventZeroStockSales: false,
    autoTrackInventory: true,
    autoPrint: false,
    confirmDeletions: true,
    autoSave: true,
    notifications: true,
    sounds: true,
    autoBackup: true,
    fullName: "",
    phone: "",
  });

  const handleChange = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const steps = [
    { num: 1, title: "الشركة", icon: <Building2 className="w-5 h-5" /> },
    { num: 2, title: "الإقليمية", icon: <Globe className="w-5 h-5" /> },
    { num: 3, title: "المخزون", icon: <Package className="w-5 h-5" /> },
    { num: 4, title: "التفضيلات", icon: <Settings className="w-5 h-5" /> },
    { num: 5, title: "المراجعة", icon: <Check className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#080c13] flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto min-h-screen" dir="rtl">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-4xl max-h-full flex flex-col relative z-10">
        {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold text-center">
                {error}
            </div>
        )}
        
        {/* Timeline */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-6 mb-8 flex justify-between items-center relative shadow-lg">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-white/5 start-0 mt-[-10px] -z-10 rounded-full" />
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 start-0 mt-[-10px] -z-10 transition-all duration-500 rounded-full shadow-[0_0_10px_var(--accent-500)]" 
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
          {steps.map((s, index) => (
            <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= s.num ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_0_20px_var(--accent-500)] ring-4 ring-primary-500/20' : 'bg-slate-100 dark:bg-[#1a1f26] text-slate-400 border border-slate-200 dark:border-white/5 shadow-inner'} ${step === s.num ? 'scale-110' : ''}`}>
                {s.icon}
              </div>
              <span className={`text-xs font-bold whitespace-nowrap mt-2 ${step === s.num ? 'text-primary-600 dark:text-primary-400' : step > s.num ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col flex-1 shrink-0 shadow-primary-500/5">
          <div className="p-8 sm:p-12 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {step === 1 && <Step1 data={data} handleChange={handleChange} />}
                {step === 2 && <Step2 data={data} handleChange={handleChange} />}
                {step === 3 && <Step3 data={data} handleChange={handleChange} />}
                {step === 4 && <Step4 data={data} handleChange={handleChange} />}
                {step === 5 && <Step6 data={data} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-[#0c1017] border-t border-slate-200 dark:border-white/5 flex justify-between items-center mt-auto">
            <button 
               onClick={onCancel}
               className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-4 py-2 font-bold text-sm transition-colors"
               disabled={isSubmitting}
            >
              تسجيل الخروج
            </button>
            
            <div className="flex gap-4">
              {step > 1 && (
                <button 
                  onClick={() => setStep(s => s - 1)}
                  className="px-6 py-3 bg-white dark:bg-[#1a1f29] text-slate-700 dark:text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-[#2a3140] transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <ChevronRight className="w-5 h-5" /> السابق
                </button>
              )}
              {step < totalSteps ? (
                <button 
                  onClick={() => {
                    if (step === 1) {
                      if (!data.fullName || data.fullName.trim() === '') {
                        alert('يرجى إدخال اسم المسؤول أولاً.');
                        return;
                      }
                      if (!data.companyName || data.companyName.trim() === '') {
                        alert('يرجى إدخال اسم الشركة أولاً.');
                        return;
                      }
                      if (!data.phone || data.phone.trim() === '') {
                        alert('يرجى إدخال رقم الهاتف أولاً.');
                        return;
                      }
                    }
                    setStep(s => s + 1);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/20"
                >
                  التالي <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => onComplete(data)}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإنهاء'} <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col mb-10 items-end">
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#1a1f29] py-3 px-5 rounded-xl border border-slate-200 dark:border-white/5 mb-4 float-right shadow-sm">
         <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h2>
         <div className="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center shadow-md">
           {icon}
         </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-end w-full">{desc}</p>
    </div>
  );
}

function CardToggle({ title, desc, checked, onChange, icon: Icon, color = "primary" }: any) {
  return (
    <div className={`flex items-center justify-between p-6 bg-white dark:bg-[#1a1f29] rounded-2xl border transition-colors shadow-sm cursor-pointer ${checked ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`} onClick={() => onChange(!checked)}>
       <div className="flex items-center gap-4 pointer-events-none">
          <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={checked} readOnly />
              <div className="w-14 h-7 bg-slate-200 dark:bg-[#161a23] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-scale-x-100 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500 shadow-inner"></div>
          </label>
       </div>
       <div className="flex flex-col items-end text-end">
         <div className="flex items-center gap-2 mb-1">
            <h3 className="text-slate-800 dark:text-white font-bold">{title}</h3>
            {Icon && <Icon className="w-5 h-5 text-slate-400" />}
         </div>
         <p className="text-slate-500 text-xs">{desc}</p>
       </div>
    </div>
  );
}

function Step1({ data, handleChange }: any) {
  return (
    <div className="flex flex-col items-end">
      <StepHeader icon={<Building2 className="w-6 h-6" />} title="إعدادات الشركة" desc="أدخل اسم مسؤول النظام واسم الشركة ليتم استخدامهما في الفواتير والتقارير." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
        <div className="space-y-3 text-end">
           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اسم المسؤول (المدير) <span className="text-red-500">*</span></label>
           <div className="relative">
             <input type="text" value={data.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="مثال: أحمد محمد" className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold placeholder-slate-400 dark:placeholder-slate-600" />
           </div>
           <p className="text-xs text-slate-500 mt-2">اسم المالك أو المسؤول المباشر.</p>
        </div>
        <div className="space-y-3 text-end">
           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اسم الشركة <span className="text-red-500">*</span></label>
           <div className="relative">
             <input type="text" value={data.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder="مثال: شركة تكنو جروب" className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold placeholder-slate-400 dark:placeholder-slate-600" />
           </div>
           <p className="text-xs text-slate-500 mt-2">سيتم استخدام هذا الاسم في الفواتير أعلى الصفحة.</p>
        </div>
        <div className="space-y-3 text-end md:col-span-2">
           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">رقم الهاتف <span className="text-red-500">*</span></label>
           <div className="relative">
             <input type="tel" value={data.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="مثال: 01012345678" className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold placeholder-slate-400 dark:placeholder-slate-600" />
           </div>
           <p className="text-xs text-slate-500 mt-2">رقم الهاتف مطلوب لاستكمال التسجيل وسيظهر في الفواتير.</p>
        </div>
      </div>
    </div>
  );
}

const currencies = [
  { id: 'EG', name: 'جنيه مصري', symbol: 'ج.م', code: 'EGP' },
  { id: 'SA', name: 'ريال سعودي', symbol: 'ر.س', code: 'SAR' },
  { id: 'AE', name: 'درهم إماراتي', symbol: 'د.إ', code: 'AED' },
  { id: 'US', name: 'دولار أمريكي', symbol: '$', code: 'USD' },
  { id: 'EU', name: 'يورو', symbol: '€', code: 'EUR' },
  { id: 'KW', name: 'دينار كويتي', symbol: 'د.ك', code: 'KWD' },
];

function Step2({ data, handleChange }: any) {
  return (
    <div className="flex flex-col items-end">
      <StepHeader icon={<Globe className="w-6 h-6" />} title="الإعدادات الإقليمية" desc="اختر العملة وتنسيق التاريخ المناسب لمنطقتك." />
      <div className="mb-8 w-full mt-4">
         <label className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 block text-end me-2">العملة الافتراضية</label>
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleChange('currency', c.id)}
                className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-3 ${data.currency === c.id ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/20 ring-2 ring-primary-500/50' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161a23] hover:bg-slate-100 dark:hover:bg-[#1a1f29]'}`}
              >
                 <span className={`text-2xl font-black ${data.currency === c.id ? 'text-primary-600 dark:text-primary-400 drop-shadow-sm' : 'text-slate-400'}`}>{c.id}</span>
                 <span className={`text-md font-bold ${data.currency === c.id ? 'text-primary-500' : 'text-slate-500'}`}>{c.name}</span>
                 <span className="text-xs text-slate-600 bg-black/5 dark:bg-black/20 px-2 py-1 rounded-md">{c.code} - {c.symbol}</span>
              </div>
            ))}
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
         <div className="space-y-3 text-end">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">تنسيق التاريخ</label>
            <select value={data.dateFormat} onChange={e => handleChange('dateFormat', e.target.value)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 appearance-none font-bold" dir="rtl">
              <option>DD/MM/YYYY (31/12/2025)</option>
              <option>MM/DD/YYYY (12/31/2025)</option>
              <option>YYYY-MM-DD (2025-12-31)</option>
            </select>
         </div>
         <div className="space-y-3 text-end">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">اللغة</label>
            <select value={data.language} onChange={e => handleChange('language', e.target.value)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 appearance-none font-bold" dir="rtl">
              <option value="AR">العربية</option>
              <option value="EN">English</option>
            </select>
         </div>
      </div>
    </div>
  );
}

function Step3({ data, handleChange }: any) {
  return (
    <div className="flex flex-col items-end w-full">
      <StepHeader icon={<Package className="w-6 h-6" />} title="إعدادات المخزون" desc="قم بتخصيص إعدادات المخزون والتنبيهات حسب احتياجاتك." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 w-full mt-4">
        <div className="col-span-2 md:col-span-1 space-y-3 text-end">
           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">حد تنبيه المخزون المنخفض</label>
           <input type="number" min="0" value={data.lowStockThreshold} onChange={e => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end focus:outline-none focus:border-primary-500 font-bold" dir="ltr" />
           <p className="text-xs text-slate-500 mt-2">سيتم تنبيهك عندما يقل مخزون أي منتج عن هذا الرقم.</p>
        </div>
        <div className="col-span-2 md:col-span-1 space-y-3 text-end opacity-50">
           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 me-2 block">الحد الأدنى للمخزون الافتراضي</label>
           <input type="number" value="5" disabled className="w-full bg-slate-50 dark:bg-[#161a23] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-end font-bold cursor-not-allowed" dir="ltr" />
           <p className="text-xs text-slate-500 mt-2">القيمة الافتراضية للحد الأدنى عند إضافة منتج جديد</p>
        </div>
      </div>

      <div className="space-y-4 w-full">
        <CardToggle title="تفعيل تنبيهات المخزون المنخفض" desc="إرسال إشعار عند انخفاض المخزون عن الحد المحدد" checked={data.enableLowStockAlerts} onChange={(v: boolean) => handleChange('enableLowStockAlerts', v)} />
        <CardToggle title="منع البيع بدون مخزون" desc="لا يمكن إتمام عملية بيع لمنتج نفذ من المخزون" checked={data.preventZeroStockSales} onChange={(v: boolean) => handleChange('preventZeroStockSales', v)} color="rose" />
        <CardToggle title="تتبع المخزون التلقائي" desc="تحديث المخزون تلقائياً عند كل عملية بيع أو شراء" checked={data.autoTrackInventory} onChange={(v: boolean) => handleChange('autoTrackInventory', v)} color="emerald" />
      </div>
    </div>
  );
}

function Step4({ data, handleChange }: any) {
  return (
    <div className="flex flex-col items-end w-full">
      <StepHeader icon={<Settings className="w-6 h-6" />} title="تفضيلات النظام" desc="اختر الميزات والخيارات التي تناسب طريقة عملك." />
      <div className="space-y-4 w-full mt-4">
        <CardToggle title="الطباعة التلقائية للفواتير" desc="طباعة الفاتورة تلقائياً بعد إتمام عملية البيع" checked={data.autoPrint} onChange={(v: boolean) => handleChange('autoPrint', v)} />
        <CardToggle title="تأكيد عمليات الحذف" desc="طلب تأكيد قبل حذف أي عنصر من النظام" checked={data.confirmDeletions} onChange={(v: boolean) => handleChange('confirmDeletions', v)} color="amber" />
        <CardToggle title="الحفظ التلقائي" desc="حفظ التغيرات تلقائياً دون الحاجة للضغط على زر الحفظ" checked={data.autoSave} onChange={(v: boolean) => handleChange('autoSave', v)} color="blue" />
        <CardToggle title="الإشعارات" desc="عرض إشعارات النظام والتنبيهات" checked={data.notifications} onChange={(v: boolean) => handleChange('notifications', v)} color="amber" />
        <CardToggle title="الأصوات" desc="تشغيل أصوات التنبيهات والإشعارات" checked={data.sounds} onChange={(v: boolean) => handleChange('sounds', v)} color="blue" />
        <CardToggle title="النسخ الاحتياطي التلقائي" desc="إنشاء نسخة احتياطية يومية من البيانات" checked={data.autoBackup} onChange={(v: boolean) => handleChange('autoBackup', v)} />
      </div>
    </div>
  );
}

function Step6({ data }: any) {
  return (
    <div className="flex flex-col items-end w-full">
      <StepHeader icon={<Check className="w-6 h-6" />} title="مراجعة الإعدادات" desc="راجع الإعدادات التي اخترتها قبل الحفظ. يمكنك الرجوع لتعديل أي إعداد." />
      
      <div className="space-y-6 w-full mt-4">
        <div>
           <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">معلومات الشركة</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">اسم الشركة</span>
                    <span className="text-slate-900 dark:text-white font-bold">{data.companyName || '-'}</span>
                 </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">الاسم الكامل</span>
                    <span className="text-slate-900 dark:text-white font-bold">{data.fullName || '-'}</span>
                 </div>
              </div>
           </div>
        </div>

        <div>
           <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">الإعدادات الإقليمية</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">تنسيق التاريخ</span>
                    <span className="text-slate-900 dark:text-white font-bold">{data.dateFormat}</span>
                 </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">العملة</span>
                    <span className="text-slate-900 dark:text-white font-bold">{data.currency}</span>
                 </div>
              </div>
           </div>
        </div>

        <div>
           <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm text-end me-4">الإعدادات</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">حد المخزون المنخفض</span>
                    <span className="text-slate-900 dark:text-white font-bold">{data.lowStockThreshold} قطعة</span>
                 </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-[#1a1f29] rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                 <div className="flex flex-col gap-2 w-full items-end">
                    <span className="text-slate-500 text-xs font-bold">لغة النظام</span>
                    <span className="text-slate-900 dark:text-white font-bold" dir="ltr">{data.language}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
