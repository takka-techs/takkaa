import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackageSearch, Tag, Barcode, DollarSign, Layers, Calendar, AlertCircle, Building2, Activity } from 'lucide-react';

interface ViewAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: any;
}

export default function ViewAccessoryModal({ isOpen, onClose, accessory }: ViewAccessoryModalProps) {
  if (!isOpen || !accessory) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Animations
  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20, 
      transition: { duration: 0.2 } 
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  const InfoCard = ({ label, value, icon: Icon, fullWidth = false, valueColor = "text-slate-900 dark:text-white" }: any) => (
    <motion.div 
      variants={itemVariants}
      className={`bg-slate-50 dark:bg-[#080c13]/50 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/[0.04] transition-colors group ${fullWidth ? 'md:col-span-2' : ''}`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all duration-300">
        <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-400 transition-colors" />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">{label}</span>
        <span className={`font-medium text-sm truncate ${valueColor}`} title={typeof value === 'string' ? value : ''}>
          {value}
        </span>
      </div>
    </motion.div>
  );

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
          variants={containerVariants}
          initial="hidden" 
          animate="visible" 
          exit="exit"
          className="relative w-full max-w-xl my-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0 relative overflow-hidden">
            <div className="absolute top-0 end-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-2xl flex items-center justify-center shadow-inner border border-cyan-500/20">
                <PackageSearch className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل الصنف</h2>
                <p className="text-sm text-cyan-400 mt-0.5 font-medium">{accessory.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoCard label="اسم الصنف" value={accessory.name || '-'} icon={Tag} fullWidth />
              <InfoCard label="الماركة / النوع" value={accessory.brand || '-'} icon={Building2} />
              <InfoCard label="الباركود" value={accessory.barcode || '-'} icon={Barcode} valueColor="text-cyan-400 font-mono" />
              <InfoCard label="التصنيف" value={accessory.category || '-'} icon={Layers} />
              <InfoCard label="نوع الإدخال" value={accessory.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'} icon={Activity} />
              <InfoCard label="الضريبة (%)" value={accessory.tax ? `${accessory.tax}%` : '0%'} icon={DollarSign} valueColor="text-blue-400" />
              <InfoCard label="سعر الشراء" value={accessory.cost_price != null ? `${accessory.cost_price} ج.م` : '-'} icon={DollarSign} valueColor="text-orange-400" />
              <InfoCard label="سعر البيع" value={accessory.selling_price != null ? `${accessory.selling_price} ج.م` : '-'} icon={DollarSign} valueColor="text-emerald-400" />
              <InfoCard 
                label="الكمية الحالية" 
                value={accessory.quantity || '0'} 
                icon={PackageSearch} 
                valueColor={accessory.quantity <= (accessory.alert_quantity || 5) ? 'text-red-400 font-bold' : 'text-slate-900 dark:text-white'} 
              />
              <InfoCard label="حد التنبيه" value={accessory.alert_quantity || '0'} icon={AlertCircle} />
              <InfoCard label="المورد" value={accessory.supplier || '-'} icon={Building2} />
              <InfoCard label="الحالة" value={accessory.status || '-'} icon={Activity} />
              <InfoCard label="مكان التخزين" value={accessory.location || '-'} icon={Layers} />
              <InfoCard label="تاريخ الإضافة" value={formatDate(accessory.created_at)} icon={Calendar} fullWidth />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white transition-colors"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
