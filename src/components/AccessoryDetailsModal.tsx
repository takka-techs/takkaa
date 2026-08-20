import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, DollarSign, 
  Building2, FileText, Package, Tag, Printer, Info,
  TrendingUp, Loader2,
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DetailItem = ({ icon: Icon, label, value, colorClass = "text-slate-900 dark:text-white", mono = false }: any) => (
    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-3 transition-all hover:border-teal-500/30 group">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-xs sm:text-sm font-black ${colorClass} ${mono ? 'font-mono' : ''} truncate`}>
        {value || 'غير محدد'}
      </div>
    </div>
  );

  const totalValue = ((accessory.cost_price || 0) + (accessory.tax || 0)) * (accessory.quantity || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 h-[100dvh]" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-100/80 dark:bg-[#080c13]/90 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[80dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] relative shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">تفاصيل الصنف</h2>
                <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5">
                  <span>#{accessory.id}</span>
                  <span className="opacity-30">|</span>
                  <span className={accessory.status === 'returned' ? 'text-red-500' : 'text-emerald-500'}>
                    {accessory.status === 'returned' ? 'مرتجع' : (accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handlePrint}
                disabled={isPrinting}
                className="p-2 bg-white dark:bg-white/5 text-slate-500 hover:text-teal-500 border border-slate-200 dark:border-white/5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                 {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={printRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4 sm:space-y-5 custom-scrollbar bg-white dark:bg-[#111827]">
            
            {/* Accessory Info Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <PackageSearch className="w-3.5 h-3.5" /> معلومات الصنف
                </h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 relative overflow-hidden">
                <div className="space-y-3 relative z-10">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {accessory.name}
                  </div>
                  {accessory.brand && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold border border-blue-500/10 uppercase tracking-widest">
                      <Building2 className="w-3 h-3" />
                      {accessory.brand}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-white/5">{accessory.category || 'بدون فئة'}</span>
                    <span className="px-3 py-1.5 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-white/5">{accessory.quantity} قطعة</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <DetailItem icon={Activity} label="الحالة" value={accessory.status} colorClass="text-emerald-600 dark:text-emerald-400" />
                    <DetailItem icon={Layers} label="النوع" value={accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'} colorClass="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <Package className="absolute -bottom-6 -right-6 w-28 h-28 text-slate-200 dark:text-white/[0.02] rotate-12 pointer-events-none" />
              </div>
            </section>

            {/* Barcode & Identifiers */}
            <section className="space-y-3">
               <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5" /> المعرفات
                </h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-widest">الباركود</div>
                  <div className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tracking-widest">{accessory.barcode || '-'}</div>
                </div>
                <Tag className="w-5 h-5 text-slate-200 dark:text-white/[0.05]" />
              </div>
            </section>

            {/* Financial Details */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> البيانات المالية
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <DetailItem icon={DollarSign} label="سعر التكلفة" value={`${(accessory.cost_price || 0).toLocaleString()} ج.م`} colorClass="text-emerald-600 dark:text-emerald-400" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع قطاعي" value={`${(accessory.selling_price || 0).toLocaleString()} ج.م`} colorClass="text-blue-600 dark:text-blue-400" mono />
                <DetailItem icon={TrendingUp} label="سعر البيع جملة" value={`${(accessory.wholesale_price || 0).toLocaleString()} ج.م`} colorClass="text-indigo-600 dark:text-indigo-400" mono />
                <DetailItem icon={TrendingUp} label="سعر نصف جملة" value={`${(accessory.half_wholesale_price || 0).toLocaleString()} ج.م`} colorClass="text-purple-600 dark:text-purple-400" mono />
                <DetailItem icon={Info} label="الضريبة" value={`${(accessory.tax || 0).toLocaleString()}%`} mono />
                <DetailItem icon={TrendingUp} label="إجمالي القيمة" value={`${totalValue.toLocaleString()} ج.م`} colorClass="text-teal-600 dark:text-teal-400" mono />
              </div>
            </section>

            {/* Entry Metadata */}
            <section className="space-y-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> بيانات القيد
                </h3>
              </div>
              
              <div className="space-y-3">
                <DetailItem icon={Building2} label="المورد / المصدر" value={accessory.supplier || 'غير محدد'} />
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem icon={Calendar} label="التاريخ" value={formatDate(accessory.created_at)} />
                  <DetailItem icon={Clock} label="الوقت" value={formatTime(accessory.created_at)} mono />
                </div>
                
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-3 relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات إضافية</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic">
                    {accessory.notes || 'لا توجد ملاحظات مسجلة لهذه العملية'}
                  </p>
                  <div className="absolute top-3 end-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest">بيانات كاملة</span>
            </div>
            
            <button 
              onClick={onClose}
              className="px-6 sm:px-8 py-2.5 bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-900 text-sm font-black rounded-xl transition-all shadow-lg active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}