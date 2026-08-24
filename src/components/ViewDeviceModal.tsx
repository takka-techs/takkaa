// import React from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { X, Smartphone, Hash, Calendar, DollarSign, Info, Tag, Box, Battery, Printer } from 'lucide-react';

// interface ViewDeviceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   device: any;
// }

// export default function ViewDeviceModal({ isOpen, onClose, device }: ViewDeviceModalProps) {
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
//                 <Smartphone className="w-5 h-5" />
//               </div>
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل الجهاز</h2>
//             </div>
//             <button 
//               onClick={onClose}
//               className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

//             {/* Main Info Card */}
//             <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Hash className="w-4 h-4 text-blue-400" />
//                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">معلومات الجهاز</h3>
//               </div>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">رقم التعريف:</p>
//                   <p className="text-sm font-bold text-blue-400">#{device.id}</p>
//                 </div>
//                 <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMEI 1:</p>
//                   <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{device.imei1 || '-'}</p>
//                 </div>
//                 <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMEI 2:</p>
//                   <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{device.imei2 || '-'}</p>
//                 </div>
//                 <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الحالة:</p>
//                   <div className="flex items-center gap-2 mt-1">
//                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
//                     <p className="text-sm font-bold text-emerald-400">متوفر في المخزن</p>
//                   </div>
//                 </div>
//                 <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5 sm:col-span-2">
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المخزن:</p>
//                   <div className="flex items-center gap-2 mt-1">
//                     <Box className="w-4 h-4 text-purple-400" />
//                     <p className="text-sm font-bold text-purple-400">مخزن الأجهزة الرئيسي</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Specs Card */}
//             <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Tag className="w-4 h-4 text-emerald-400" />
//                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">المواصفات</h3>
//               </div>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">النوع:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">{device.company || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">الموديل:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">{device.model || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">السعة:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">{device.storage || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">اللون:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">{device.color || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">الحالة العامة:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">{device.condition || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">صحة البطارية:</span>
//                   <div className="flex items-center gap-2">
//                     <Battery className="w-4 h-4 text-emerald-400" />
//                     {device.battery_percentage ? <span className="text-sm font-bold text-emerald-400">{device.battery_percentage}%</span> : <span className="text-sm font-bold text-slate-500 dark:text-slate-400">-</span>}
//                   </div>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة:</span>
//                   <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{device.has_box ? 'بكرتونة' : 'بدون كرتونة'}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Pricing Card */}
//             <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <DollarSign className="w-4 h-4 text-orange-400" />
//                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">الأسعار والتكلفة</h3>
//               </div>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">التكلفة:</span>
//                   <span className="text-sm font-bold text-rose-400">{(device.cost_price || 0).toLocaleString()} جنيه</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">السعر المتوقع:</span>
//                   <span className="text-sm font-bold text-emerald-400">{(device.selling_price || 0).toLocaleString()} جنيه</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">الهامش:</span>
//                   <span className="text-sm font-bold text-teal-400">
//                     {((device.selling_price || 0) - (device.cost_price || 0)).toLocaleString()} جنيه 
//                     ({device.cost_price ? (((device.selling_price || 0) - (device.cost_price || 0)) / device.cost_price * 100).toFixed(1) : 0}%)
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Additional Info */}
//             <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Info className="w-4 h-4 text-blue-400" />
//                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">معلومات إضافية</h3>
//               </div>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">المصدر:</span>
//                   <span className="text-sm font-bold text-teal-400">{device.source || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
//                   <span className="text-xs text-slate-500 dark:text-slate-400">تاريخ الإضافة:</span>
//                   <span className="text-sm font-bold text-slate-900 dark:text-white">
//                     {device.created_at ? new Date(device.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
//                   </span>
//                 </div>
//                 {device.notes && (
//                   <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5 mt-2">
//                     <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">ملاحظات:</span>
//                     <span className="text-sm text-slate-900 dark:text-white">{device.notes}</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//           </div>

//           {/* Footer */}
//           <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-center">
//             <button 
//               className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center gap-2"
//             >
//               <Printer className="w-4 h-4" /> طباعة باركود
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Hash, Calendar, DollarSign, Info, Tag, Box, Battery, Printer } from 'lucide-react';

interface ViewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: any;
}

export default function ViewDeviceModal({ isOpen, onClose, device }: ViewDeviceModalProps) {
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
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل الجهاز</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

            {/* Main Info Card */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">معلومات الجهاز</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">رقم التعريف:</p>
                  <p className="text-sm font-bold text-blue-400">#{device.id}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMEI 1:</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{device.imei1 || '-'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMEI 2:</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{device.imei2 || '-'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الحالة:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-sm font-bold text-emerald-400">متوفر في المخزن</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5 sm:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المخزن:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-bold text-purple-400">مخزن الأجهزة الرئيسي</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs Card */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">المواصفات</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">النوع:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.company || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الموديل:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.model || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">السعة:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.storage || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">اللون:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.color || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الحالة العامة:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.condition || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الرام:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.ram || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">حالة التفعيل:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.activation_status || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">نوع الشريحة:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{device.sim_type || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">صحة البطارية:</span>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    {device.battery_percentage ? <span className="text-sm font-bold text-emerald-400">{device.battery_percentage}%</span> : <span className="text-sm font-bold text-slate-500 dark:text-slate-400">-</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الكرتونة:</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{device.has_box ? 'بكرتونة' : 'بدون كرتونة'}</span>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">الأسعار والتكلفة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">التكلفة:</span>
                  <span className="text-sm font-bold text-rose-400">{(device.cost_price || 0).toLocaleString()} جنيه</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">سعر البيع قطاعي:</span>
                  <span className="text-sm font-bold text-emerald-400">{(device.selling_price || 0).toLocaleString()} جنيه</span>
                </div>
                {device.wholesale_price && (
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">سعر البيع جملة:</span>
                    <span className="text-sm font-bold text-indigo-400">{(device.wholesale_price || 0).toLocaleString()} جنيه</span>
                  </div>
                )}
                {device.half_wholesale_price && (
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">سعر البيع نصف جملة:</span>
                    <span className="text-sm font-bold text-purple-400">{(device.half_wholesale_price || 0).toLocaleString()} جنيه</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">الهامش:</span>
                  <span className="text-sm font-bold text-teal-400">
                    {((device.selling_price || 0) - (device.cost_price || 0)).toLocaleString()} جنيه
                    ({device.cost_price ? (((device.selling_price || 0) - (device.cost_price || 0)) / device.cost_price * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">معلومات إضافية</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">المصدر:</span>
                  <span className="text-sm font-bold text-teal-400">{device.source || '-'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">تاريخ الإضافة:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {device.created_at ? new Date(device.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </span>
                </div>
                {device.notes && (
                  <div className="bg-slate-50 dark:bg-[#080c13] rounded-xl p-3 border border-slate-200 dark:border-white/5 mt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">ملاحظات:</span>
                    <span className="text-sm text-slate-900 dark:text-white">{device.notes}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-center">
            <button
              className="bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> طباعة باركود
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


