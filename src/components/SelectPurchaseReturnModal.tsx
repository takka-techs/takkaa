import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Smartphone, Barcode, Building2, 
  DollarSign, RotateCcw, Loader2, AlertCircle 
} from 'lucide-react';

interface Device {
  id: number;
  created_at: string;
  company: string;
  model: string;
  source: string;
  cost_price: number;
  imei1: string;
  imei2: string | null;
}

interface SelectPurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (device: Device) => void;
}

export default function SelectPurchaseReturnModal({ isOpen, onClose, onSelect }: SelectPurchaseReturnModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [purchases, setPurchases] = useState<Device[]>([]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Fetch devices that were added as purchases and are not returned yet
      // We use OR to include devices that have NULL status (added before column update)
      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*&entry_type=eq.purchase&or=(status.is.null,status.neq.returned)&order=created_at.desc', {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error fetching purchases for return:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPurchases();
    }
  }, [isOpen]);

  const filteredPurchases = purchases.filter(p => 
    `${p.company} ${p.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.imei1.includes(searchTerm) ||
    p.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">اختر المشتريات للإرجاع</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute top-1/2 end-4 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="بحث بالموديل، IMEI، اسم المورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-500/30 rounded-2xl py-4 ps-4 pe-14 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-all font-bold text-end placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-auto p-0 min-h-[300px]">
            <table className="w-full text-right">
              <thead className="sticky top-0 bg-white dark:bg-[#111827] z-10 border-b border-slate-100 dark:border-white/5">
                <tr className="bg-slate-50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">التاريخ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">الجهاز</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-center">IMEI</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-center">المورد</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-center">التكلفة</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-center">إرجاع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                        <span className="text-slate-400 font-bold">جاري تحميل المشتريات...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        <span className="text-slate-400 dark:text-slate-500 font-bold">لا توجد مشتريات مطابقة</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPurchases.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(device.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {device.company} {device.model}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-slate-500 dark:text-slate-400 text-xs">
                       {device.imei1}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                      {device.source}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {device.cost_price.toLocaleString()} ج.م
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onSelect(device)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto shadow-md"
                      >
                        إرجاع
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
            <div className="text-sm text-slate-500">
              إجمالي المشتريات المتاحة: <span className="text-slate-900 dark:text-white font-bold">{filteredPurchases.length}</span>
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all dark:border-white/5"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
