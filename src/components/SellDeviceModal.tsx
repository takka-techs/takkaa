import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, ShoppingCart, Zap, Loader2 } from 'lucide-react';

interface SellDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: any;
}

export default function SellDeviceModal({ isOpen, onClose, onSuccess, device }: SellDeviceModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickSell = async () => {
    // For now, just close. In a real app, this would create an invoice or change status.
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  const handleAddToCart = () => {
    // Add to POS cart logic here
    onClose();
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
          className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">خيارات البيع</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{device.company} {device.model}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">السعر المتوقع: <span className="text-emerald-400 font-bold">{(device.selling_price || 0).toLocaleString()} جنيه</span></p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleQuickSell}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white py-4 rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                بيع سريع الآن
              </button>
              
              <button 
                onClick={handleAddToCart}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                إضافة لعربة التسوق (POS)
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-center">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
