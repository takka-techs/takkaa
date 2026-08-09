import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Package, DollarSign, Target, AlignRight, Tag, Hash } from 'lucide-react';

interface SparePartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: any;
}

export default function SparePartDetailsModal({ isOpen, onClose, sparePart }: SparePartDetailsModalProps) {
  if (!isOpen || !sparePart) return null;

  const details = [
    { label: 'الاسم', value: sparePart.name, icon: Package },
    { label: 'الرقم التعريفي (SKU)', value: sparePart.sku || 'غير محدد', icon: Hash },
    { label: 'الفئة', value: sparePart.category || 'غير فئة', icon: Tag },
    { label: 'المورد', value: sparePart.supplier || 'غير محدد', icon: User },
    { label: 'الكمية الموردة', value: sparePart.quantity, icon: Target },
    { label: 'تكلفة الوحدة', value: `${(sparePart.cost_price || 0).toLocaleString()} ج.م`, icon: DollarSign },
    { label: 'الضريبة (%)', value: sparePart.tax || '0', icon: DollarSign },
    { label: 'سعر البيع', value: `${(sparePart.selling_price || sparePart.sell_price || 0).toLocaleString()} ج.م`, icon: DollarSign },
    { label: 'تاريخ التوريد', value: new Date(sparePart.created_at).toLocaleString('ar-EG'), icon: Calendar },
    { label: 'إجمالي التكلفة', value: `${(((sparePart.cost_price || 0) + (sparePart.tax || 0)) * (sparePart.quantity || 0)).toLocaleString()} ج.م`, icon: DollarSign },
  ];

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
          className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-500" />
              تفاصيل توريد قطعة غيار
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {details.map((detail, index) => (
                <div key={index} className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0">
                    <detail.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">{detail.label}</div>
                    <div className="font-bold text-slate-900 dark:text-white">{detail.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {sparePart.notes && (
              <div className="mt-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0">
                  <AlignRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">ملاحظات</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {sparePart.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
