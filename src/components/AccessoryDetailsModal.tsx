// import React, { useRef, useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { 
//   X, Hash, Calendar, Clock, DollarSign, 
//   Building2, FileText, CheckCircle2, RotateCcw, 
//   Package, Tag, Printer, Info, User, Phone,
//   CreditCard, ShieldCheck, Box, TrendingUp, Loader2,
//   PackageSearch, Activity, Layers, Barcode
// } from 'lucide-react';
// import jsPDF from 'jspdf';
// import { toPng } from 'html-to-image';

// interface Accessory {
//   id: number;
//   created_at: string;
//   name: string;
//   brand: string | null;
//   category: string;
//   quantity: number;
//   cost_price: number;
//   selling_price: number;
//   tax: number;
//   supplier: string;
//   entry_type: string;
//   status: string;
//   notes: string | null;
//   barcode: string | null;
// }

// interface AccessoryDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   accessory: Accessory | null;
// }

// export default function AccessoryDetailsModal({ isOpen, onClose, accessory }: AccessoryDetailsModalProps) {
//   const [isPrinting, setIsPrinting] = useState(false);
//   const printRef = useRef<HTMLDivElement>(null);

//   if (!isOpen || !accessory) return null;

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
//       pdf.save(`accessory-${accessory.name}-${accessory.id}.pdf`);
//     } catch (error) {
//       console.error('Error generating PDF:', error);
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

//   const totalValue = ((accessory.cost_price || 0) + (accessory.tax || 0)) * (accessory.quantity || 0);

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
//                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل الصنف</h2>
//                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-1 space-x-2 space-x-reverse">
//                   <span>#{accessory.id}</span>
//                   <span className="opacity-30">|</span>
//                   <span className={accessory.status === 'returned' ? 'text-red-500' : 'text-emerald-500'}>
//                     {accessory.status === 'returned' ? 'مرتجع' : (accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات')}
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
//           </div>

//           {/* Body */}
//           <div ref={printRef} className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 custom-scrollbar bg-white dark:bg-[#111827]">
            
//             {/* Accessory Info Section */}
//             <section className="space-y-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <PackageSearch className="w-4 h-4" /> معلومات الصنف
//                 </h3>
//               </div>
              
//               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
//                   <div className="space-y-4">
//                     <div className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
//                       {accessory.name}
//                     </div>
//                     {accessory.brand && (
//                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold border border-blue-500/10 uppercase tracking-widest">
//                         <Building2 className="w-3.5 h-3.5" />
//                         {accessory.brand}
//                       </div>
//                     )}
//                     <div className="flex flex-wrap gap-3">
//                       <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{accessory.category || 'بدون فئة'}</span>
//                       <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{accessory.quantity} قطعة</span>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <DetailItem icon={Activity} label="الحالة" value={accessory.status} colorClass="text-emerald-600 dark:text-emerald-400" />
//                     <DetailItem icon={Layers} label="النوع" value={accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'} colorClass="text-blue-600 dark:text-blue-400" />
//                   </div>
//                 </div>
                
//                 <Package className="absolute -bottom-10 -right-10 w-48 h-48 text-slate-200 dark:text-white/[0.02] rotate-12 pointer-events-none" />
//               </div>
//             </section>

//             {/* Barcode & Identifiers */}
//             <section className="space-y-6">
//                <div className="flex items-center gap-3">
//                 <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
//                 <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                   <Barcode className="w-4 h-4" /> المعرفات
//                 </h3>
//               </div>
              
//               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
//                 <div>
//                   <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">الباركود</div>
//                   <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{accessory.barcode || '-'}</div>
//                 </div>
//                 <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
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
//                 <DetailItem icon={DollarSign} label="سعر الشراء" value={`${(accessory.cost_price || 0).toLocaleString()} ج.م`} colorClass="text-emerald-600 dark:text-emerald-400 text-xl" mono />
//                 <DetailItem icon={TrendingUp} label="سعر البيع" value={`${(accessory.selling_price || 0).toLocaleString()} ج.م`} colorClass="text-blue-600 dark:text-blue-400 text-xl" mono />
//                 <DetailItem icon={Info} label="الضريبة" value={`${(accessory.tax || 0).toLocaleString()}%`} mono />
//                 <DetailItem icon={TrendingUp} label="إجمالي القيمة" value={`${totalValue.toLocaleString()} ج.م`} colorClass="text-teal-600 dark:text-teal-400" mono />
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
//                   <DetailItem icon={Building2} label="المورد / المصدر" value={accessory.supplier || 'غير محدد'} />
//                   <div className="flex gap-4">
//                     <DetailItem icon={Calendar} label="التاريخ" value={formatDate(accessory.created_at)} />
//                     <DetailItem icon={Clock} label="الوقت" value={formatTime(accessory.created_at)} mono />
//                   </div>
//                 </div>
                
//                 <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative group flex flex-col justify-center">
//                   <div className="flex items-center gap-3 mb-3">
//                     <FileText className="w-4 h-4 text-slate-400" />
//                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات إضافية</span>
//                   </div>
//                   <p className="text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic">
//                     {accessory.notes || 'لا توجد ملاحظات مسجلة لهذه العملية'}
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
//             <div className="flex items-center gap-2 text-slate-400">
//               <div className="w-2 h-2 rounded-full bg-emerald-500" />
//               <span className="text-[10px] font-bold uppercase tracking-widest tracking-tight">التفاصيل كاملة وحصرية</span>
//             </div>
            
//             <button 
//               onClick={onClose}
//               className="px-12 py-4 bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl active:scale-95"
//             >
//               إغلاق
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Hash, Calendar, Clock, DollarSign, 
  Building2, FileText, CheckCircle2, RotateCcw, 
  Package, Tag, Printer, Info, User, Phone,
  CreditCard, ShieldCheck, Box, TrendingUp, Loader2,
  PackageSearch, Activity, Layers, Barcode
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

interface Accessory {
  id: number;
  created_at: string;
  name: string;
  brand: string | null;
  category: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number | null;
  half_wholesale_price?: number | null;
  tax: number;
  supplier: string;
  entry_type: string;
  status: string;
  notes: string | null;
  barcode: string | null;
}

interface AccessoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: Accessory | null;
}

export default function AccessoryDetailsModal({ isOpen, onClose, accessory }: AccessoryDetailsModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !accessory) return null;

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
      pdf.save(`accessory-${accessory.name}-${accessory.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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

  const totalValue = ((accessory.cost_price || 0) + (accessory.tax || 0)) * (accessory.quantity || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden" dir="rtl">
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
          className="relative w-full max-w-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] relative shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/10">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل الصنف</h2>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-1 space-x-2 space-x-reverse">
                  <span>#{accessory.id}</span>
                  <span className="opacity-30">|</span>
                  <span className={accessory.status === 'returned' ? 'text-red-500' : 'text-emerald-500'}>
                    {accessory.status === 'returned' ? 'مرتجع' : (accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات')}
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
          </div>

          {/* Body */}
          <div ref={printRef} className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 custom-scrollbar bg-white dark:bg-[#111827]">
            
            {/* Accessory Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PackageSearch className="w-4 h-4" /> معلومات الصنف
                </h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                      {accessory.name}
                    </div>
                    {accessory.brand && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold border border-blue-500/10 uppercase tracking-widest">
                        <Building2 className="w-3.5 h-3.5" />
                        {accessory.brand}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{accessory.category || 'بدون فئة'}</span>
                      <span className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/5">{accessory.quantity} قطعة</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={Activity} label="الحالة" value={accessory.status} colorClass="text-emerald-600 dark:text-emerald-400" />
                    <DetailItem icon={Layers} label="النوع" value={accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'} colorClass="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <Package className="absolute -bottom-10 -right-10 w-48 h-48 text-slate-200 dark:text-white/[0.02] rotate-12 pointer-events-none" />
              </div>
            </section>

            {/* Barcode & Identifiers */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Barcode className="w-4 h-4" /> المعرفات
                </h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">الباركود</div>
                  <div className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-widest">{accessory.barcode || '-'}</div>
                </div>
                <Tag className="w-8 h-8 text-slate-200 dark:text-white/[0.05] group-hover:text-purple-500/20 transition-colors" />
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem icon={DollarSign} label="سعر الشراء" value={`${(accessory.cost_price || 0).toLocaleString()} ج.م`} colorClass="text-emerald-600 dark:text-emerald-400 text-xl" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع قطاعي" value={`${(accessory.selling_price || 0).toLocaleString()} ج.م`} colorClass="text-blue-600 dark:text-blue-400 text-xl" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع جملة" value={`${(accessory.wholesale_price || 0).toLocaleString()} ج.م`} colorClass="text-indigo-600 dark:text-indigo-400 text-xl" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع نصف جملة" value={`${(accessory.half_wholesale_price || 0).toLocaleString()} ج.م`} colorClass="text-purple-600 dark:text-purple-400 text-xl" mono />
                <DetailItem icon={Info} label="الضريبة" value={`${(accessory.tax || 0).toLocaleString()}%`} mono />
                <DetailItem icon={TrendingUp} label="إجمالي القيمة" value={`${totalValue.toLocaleString()} ج.م`} colorClass="text-teal-600 dark:text-teal-400" mono />
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
                  <DetailItem icon={Building2} label="المورد / المصدر" value={accessory.supplier || 'غير محدد'} />
                  <div className="flex gap-4">
                    <DetailItem icon={Calendar} label="التاريخ" value={formatDate(accessory.created_at)} />
                    <DetailItem icon={Clock} label="الوقت" value={formatTime(accessory.created_at)} mono />
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative group flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات إضافية</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic">
                    {accessory.notes || 'لا توجد ملاحظات مسجلة لهذه العملية'}
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
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest tracking-tight">التفاصيل كاملة وحصرية</span>
            </div>
            
            <button 
              onClick={onClose}
              className="px-12 py-4 bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
