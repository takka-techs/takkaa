// import React, { useRef, useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { 
//   X, Smartphone, Battery, Hash, Calendar, Clock, DollarSign, 
//   Building2, FileText, CheckCircle2, RotateCcw, 
//   Package, Tag, Printer, Info, User, Phone,
//   CreditCard, ShieldCheck, Box, TrendingUp, Loader2
// } from 'lucide-react';
// import jsPDF from 'jspdf';
// import { toPng } from 'html-to-image';

// interface Device {
//   id: number;
//   created_at: string;
//   company: string;
//   model: string;
//   source: string;
//   cost_price: number;
//   battery_percentage?: number;
//   selling_price: number;
//   imei1: string;
//   imei2: string | null;
//   condition: string;
//   storage: string;
//   ram: string;
//   color: string;
//   has_box: boolean;
//   status: string;
//   notes: string | null;
//   tax: number;
// }

// interface DeviceDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   device: Device | null;
// }

// export default function DeviceDetailsModal({ isOpen, onClose, device }: DeviceDetailsModalProps) {
//   const [isPrinting, setIsPrinting] = useState(false);
//   const printRef = useRef<HTMLDivElement>(null);

//   if (!isOpen || !device) return null;

//   const handlePrint = async () => {
//     if (!printRef.current) return;
    
//     setIsPrinting(true);
//     try {
//       const element = printRef.current;
//       const dataUrl = await toPng(element, { pixelRatio: 2 });
      
//       const pdf = new jsPDF({
//         orientation: 'portrait',
//         unit: 'px',
//         format: [element.offsetWidth, element.offsetHeight]
//       });
      
//       pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
//       pdf.save(`device-${device.company}-${device.model}-${device.id}.pdf`);
//     } catch (error) {
//       console.error('Error generating PDF:', error);
//       // Fallback to browser print if PDF generation fails
//       window.print();
//     } finally {
//       setIsPrinting(false);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('ar-EG', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('ar-EG', {
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit'
//     });
//   };

//   const DetailItem = ({ icon: Icon, label, value, colorClass = "text-slate-900 dark:text-white", mono = false }: any) => (
//     <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 transition-all hover:border-teal-500/30 group">
//       <div className="flex items-center gap-3 mb-1">
//         <Icon className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
//         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{label}</span>
//       </div>
//       <div className={`text-sm font-black ${colorClass} ${mono ? 'font-mono' : ''}`}>
//         {value || 'غير محدد'}
//       </div>
//     </div>
//   );

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72 overflow-hidden" dir="rtl">
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="absolute inset-0 bg-slate-100/80 dark:bg-[#080c13]/90 backdrop-blur-xl"
//           onClick={onClose}
//         />
        
//         <motion.div 
//           initial={{ opacity: 0, scale: 0.9, y: 30 }} 
//           animate={{ opacity: 1, scale: 1, y: 0 }} 
//           exit={{ opacity: 0, scale: 0.9, y: 30 }}
//           className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] relative shrink-0">
//             <div className="flex items-center gap-5">
//               <div className="w-14 h-14 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/10">
//                 <FileText className="w-7 h-7" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل التوريد</h2>
//                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-1 space-x-2 space-x-reverse">
//                   <span>#{device.id}</span>
//                   <span className="opacity-30">|</span>
//                   <span className={device.status === 'returned' ? 'text-red-500' : 'text-emerald-500'}>
//                     {device.status === 'returned' ? 'مرتجع' : 'مكتمل'}
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-3">
//               <button 
//                 onClick={handlePrint}
//                 disabled={isPrinting}
//                 className="p-3 bg-white dark:bg-white/5 text-slate-500 hover:text-teal-500 border border-slate-200 dark:border-white/5 rounded-2xl transition-all shadow-sm disabled:opacity-50"
//               >
//                  {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
//               </button>
//               <button 
//                 onClick={onClose}
//                 className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>
            
//             {/* Glossy line effect */}
//             <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
//           </div>

//           {/* Body */}
//           <div ref={printRef} className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 custom-scrollbar bg-white dark:bg-[#111827]">
            
//             {/* Device Info Section */}
//             <section className="space-y-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <Smartphone className="w-4 h-4" /> معلومات الجهاز
//                 </h3>
//               </div>
              
//               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
//                   <div className="space-y-4">
//                     <div className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
//                       {device.company} <span className="text-blue-500 dark:text-blue-400">{device.model}</span>
//                     </div>
//                     <div className="flex flex-wrap gap-3">
//                         {device.battery_percentage && (
//                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-500/20">
//                             <Battery className="w-4 h-4" /> نسبة البطارية: %{device.battery_percentage}
//                           </div>
//                         )}
//                       <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.storage}</span>
//                       <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.ram} RAM</span>
//                       <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.color}</span>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <DetailItem icon={ShieldCheck} label="الحالة" value={device.condition} colorClass="text-blue-600 dark:text-blue-400" />
//                     <DetailItem icon={Box} label="العلبة" value={device.has_box ? 'مع علبة' : 'بدون علبة'} colorClass={device.has_box ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"} />
//                   </div>
//                 </div>
                
//                 {/* Background Decor */}
//                 <Smartphone className="absolute -bottom-10 -right-10 w-48 h-48 text-slate-200 dark:text-white/[0.02] rotate-12 pointer-events-none" />
//               </div>
//             </section>

//             {/* Identifiers & Technicals */}
//             <section className="space-y-6">
//                <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <Hash className="w-4 h-4" /> المعرفات الفنية
//                 </h3>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
//                   <div>
//                     <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">IMEI Primary</div>
//                     <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{device.imei1}</div>
//                   </div>
//                   <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
//                 </div>
//                 {device.imei2 && (
//                   <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
//                     <div>
//                       <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">IMEI Secondary</div>
//                       <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{device.imei2}</div>
//                     </div>
//                     <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
//                   </div>
//                 )}
//               </div>
//             </section>

//             {/* Financial Details */}
//             <section className="space-y-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <DollarSign className="w-4 h-4" /> البيانات المالية
//                 </h3>
//               </div>
              
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                 <DetailItem icon={DollarSign} label="سعر الشراء" value={`${device.cost_price.toLocaleString()} ج.م`} colorClass="text-emerald-600 dark:text-emerald-400 text-xl" mono />
//                 <DetailItem icon={TrendingUp} label="سعر البيع" value={`${device.selling_price.toLocaleString()} ج.م`} colorClass="text-blue-600 dark:text-blue-400 text-xl" mono />
//                 <DetailItem icon={Info} label="الضريبة" value={`${device.tax ? device.tax.toLocaleString() : '0'} ج.م`} mono />
//                 <DetailItem icon={CreditCard} label="الربح المتوقع" value={`${(device.selling_price - device.cost_price).toLocaleString()} ج.م`} colorClass="text-teal-600 dark:text-teal-400" mono />
//               </div>
//             </section>

//             {/* Entry Metadata */}
//             <section className="space-y-6 pb-4">
//               <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <Info className="w-4 h-4" /> بيانات القيد
//                 </h3>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <DetailItem icon={Building2} label="المورد / المصدر" value={device.source} />
//                   <div className="flex gap-4">
//                     <DetailItem icon={Calendar} label="التاريخ" value={formatDate(device.created_at)} />
//                     <DetailItem icon={Clock} label="الوقت" value={formatTime(device.created_at)} mono />
//                   </div>
//                 </div>
                
//                 <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative group flex flex-col justify-center">
//                   <div className="flex items-center gap-3 mb-3">
//                     <FileText className="w-4 h-4 text-slate-400" />
//                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات إضافية</span>
//                   </div>
//                   <p className="text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic">
//                     {device.notes || 'لا توجد ملاحظات مسجلة لهذه العملية'}
//                   </p>
//                   <div className="absolute top-4 end-4">
//                     <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
//                   </div>
//                 </div>
//               </div>
//             </section>

//           </div>

//           {/* Footer Actions */}
//           <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-2 rounded-full bg-emerald-500" />
//               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">تم جلب البيانات من المركز الرئيسي</span>
//             </div>
            
//             <div className="flex items-center gap-4">
//               <button 
//                 onClick={onClose}
//                 className="px-10 py-4 bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-teal-500/10 active:scale-95"
//               >
//                 إغلاق التفاصيل
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Smartphone, Battery, Hash, Calendar, Clock, DollarSign, 
  Building2, FileText, CheckCircle2, RotateCcw, 
  Package, Tag, Printer, Info, User, Phone,
  CreditCard, ShieldCheck, Box, TrendingUp, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

interface Device {
  id: number;
  created_at: string;
  company: string;
  model: string;
  source: string;
  cost_price: number;
  battery_percentage?: number;
  selling_price: number;
  wholesale_price?: number;
  half_wholesale_price?: number;
  imei1: string;
  imei2: string | null;
  condition: string;
  storage: string;
  ram: string;
  color: string;
  has_box: boolean;
  activation_status?: string;
  sim_type?: string;
  status: string;
  notes: string | null;
  tax: number;
}

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export default function DeviceDetailsModal({ isOpen, onClose, device }: DeviceDetailsModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !device) return null;

  const handlePrint = async () => {
    if (!printRef.current) return;
    
    setIsPrinting(true);
    try {
      const element = printRef.current;
      const dataUrl = await toPng(element, { pixelRatio: 2 });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [element.offsetWidth, element.offsetHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
      pdf.save(`device-${device.company}-${device.model}-${device.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to browser print if PDF generation fails
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const DetailItem = ({ icon: Icon, label, value, colorClass = "text-slate-900 dark:text-white", mono = false }: any) => (
    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 transition-all hover:border-teal-500/30 group">
      <div className="flex items-center gap-3 mb-1">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-sm font-black ${colorClass} ${mono ? 'font-mono' : ''}`}>
        {value || 'غير محدد'}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72 overflow-hidden" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-100/80 dark:bg-[#080c13]/90 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] relative shrink-0">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-14 h-14 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/10">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل التوريد</h2>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-1 space-x-2 space-x-reverse">
                  <span>#{device.id}</span>
                  <span className="opacity-30">|</span>
                  <span className={device.status === 'returned' ? 'text-red-500' : 'text-emerald-500'}>
                    {device.status === 'returned' ? 'مرتجع' : 'مكتمل'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                disabled={isPrinting}
                className="p-3 bg-white dark:bg-white/5 text-slate-500 hover:text-teal-500 border border-slate-200 dark:border-white/5 rounded-2xl transition-all shadow-sm disabled:opacity-50"
              >
                 {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
              </button>
              <button 
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Glossy line effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
          </div>

          {/* Body */}
          <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 space-y-6 sm:space-y-10 custom-scrollbar bg-white dark:bg-[#111827]">
            
            {/* Main Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> معلومات الجهاز
                </h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                      {device.company} <span className="text-blue-500 dark:text-blue-400">{device.model}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {device.battery_percentage && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-500/20">
                            <Battery className="w-4 h-4" /> نسبة البطارية: %{device.battery_percentage}
                          </div>
                        )}
                      <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.storage}</span>
                      <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.ram} RAM</span>
                      <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{device.color}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailItem icon={ShieldCheck} label="الحالة" value={device.condition} colorClass="text-blue-600 dark:text-blue-400" />
                    <DetailItem icon={Box} label="العلبة" value={device.has_box ? 'مع علبة' : 'بدون علبة'} colorClass={device.has_box ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"} />
                    <DetailItem icon={Smartphone} label="حالة التفعيل" value={device.activation_status || 'غير محدد'} colorClass="text-purple-600 dark:text-purple-400" />
                    <DetailItem icon={Smartphone} label="نوع الشريحة" value={device.sim_type || 'غير محدد'} colorClass="text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
                
                {/* Background Decor */}
                <Smartphone className="absolute -bottom-10 -right-10 w-48 h-48 text-slate-200 dark:text-white/[0.02] rotate-12 pointer-events-none" />
              </div>
            </section>

            {/* Identifiers & Technicals */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-4 h-4" /> المعرفات الفنية
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">IMEI Primary</div>
                    <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{device.imei1}</div>
                  </div>
                  <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
                </div>
                {device.imei2 && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">IMEI Secondary</div>
                      <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{device.imei2}</div>
                    </div>
                    <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
                  </div>
                )}
              </div>
            </section>

            {/* Financial Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> البيانات المالية
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <DetailItem icon={DollarSign} label="سعر الشراء" value={`${device.cost_price.toLocaleString()} ج.م`} colorClass="text-emerald-600 dark:text-emerald-400 text-xl" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع قطاعي" value={`${device.selling_price.toLocaleString()} ج.م`} colorClass="text-blue-600 dark:text-blue-400 text-xl" mono />
                {device.wholesale_price && (
                  <DetailItem icon={TrendingUp} label="سعر البيع جملة" value={`${device.wholesale_price.toLocaleString()} ج.م`} colorClass="text-indigo-600 dark:text-indigo-400 text-xl" mono />
                )}
                {device.half_wholesale_price && (
                  <DetailItem icon={TrendingUp} label="سعر البيع نصف جملة" value={`${device.half_wholesale_price.toLocaleString()} ج.م`} colorClass="text-purple-600 dark:text-purple-400 text-xl" mono />
                )}
                <DetailItem icon={Info} label="الضريبة" value={`${device.tax ? device.tax.toLocaleString() : '0'} ج.م`} mono />
                <DetailItem icon={CreditCard} label="الربح المتوقع" value={`${(device.selling_price - device.cost_price).toLocaleString()} ج.م`} colorClass="text-teal-600 dark:text-teal-400" mono />
              </div>
            </section>

            {/* Entry Metadata */}
            <section className="space-y-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" /> بيانات القيد
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <DetailItem icon={Building2} label="المورد / المصدر" value={device.source} />
                  <div className="flex gap-4">
                    <DetailItem icon={Calendar} label="التاريخ" value={formatDate(device.created_at)} />
                    <DetailItem icon={Clock} label="الوقت" value={formatTime(device.created_at)} mono />
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative group flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات إضافية</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic">
                    {device.notes || 'لا توجد ملاحظات مسجلة لهذه العملية'}
                  </p>
                  <div className="absolute top-4 end-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">تم جلب البيانات من المركز الرئيسي</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-teal-500/10 active:scale-95"
              >
                إغلاق التفاصيل
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
