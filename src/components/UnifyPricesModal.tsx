import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Calculator, AlertCircle, CheckCircle2, Loader2, Smartphone, TrendingUp, Settings } from 'lucide-react';

interface UnifyPricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDevices: any[];
}

export default function UnifyPricesModal({ isOpen, onClose, onSuccess, selectedDevices }: UnifyPricesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unifyCost, setUnifyCost] = useState(true);
  const [unifySelling, setUnifySelling] = useState(true);

  // Calculate stats
  const stats = useMemo(() => {
    if (!selectedDevices || selectedDevices.length === 0) return null;

    const totalCost = selectedDevices.reduce((sum, dev) => sum + (dev.cost_price || 0), 0);
    const totalSelling = selectedDevices.reduce((sum, dev) => sum + (dev.selling_price || 0), 0);
    
    const minCost = Math.min(...selectedDevices.map(d => d.cost_price || 0));
    const maxCost = Math.max(...selectedDevices.map(d => d.cost_price || 0));
    
    const minSelling = Math.min(...selectedDevices.map(d => d.selling_price || 0));
    const maxSelling = Math.max(...selectedDevices.map(d => d.selling_price || 0));

    const avgCost = totalCost / selectedDevices.length;
    const avgSelling = totalSelling / selectedDevices.length;

    return {
      count: selectedDevices.length,
      totalCost,
      totalSelling,
      minCost,
      maxCost,
      minSelling,
      maxSelling,
      avgCost,
      avgSelling,
      expectedProfitPerDevice: avgSelling - avgCost
    };
  }, [selectedDevices]);

  const handleApply = async () => {
    if (!stats) return;
    
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      // Update each device individually since Supabase REST API doesn't support bulk PATCH easily without specific setups
      const updatePromises = selectedDevices.map(device => {
        const payload: any = {};
        if (unifyCost) payload.cost_price = stats.avgCost;
        if (unifySelling) payload.selling_price = stats.avgSelling;

        if (Object.keys(payload).length === 0) return Promise.resolve();

        return fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?id=eq.${device.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        }).then(res => {
          if (!res.ok) throw new Error(`فشل تحديث الجهاز ${device.id}`);
          return res;
        });
      });

      await Promise.all(updatePromises);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء توحيد الأسعار');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">توحيد أسعار الأجهزة المتشابهة</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <div className="text-blue-400 shrink-0 mt-0.5">💡</div>
              <p className="text-sm text-blue-200 leading-relaxed">
                هذه الخاصية تقوم بحساب <span className="font-bold text-slate-900 dark:text-white">متوسط سعر التكلفة</span> و<span className="font-bold text-slate-900 dark:text-white">متوسط سعر البيع</span> للأجهزة المحددة، ثم تطبيق هذا المتوسط على جميع الأجهزة لتوحيد الأسعار وتوزيع الربح/الخسارة بالتساوي.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {stats && (
              <>
                {/* Selected Devices List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                    <Smartphone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <h3>الأجهزة المحددة ({stats.count} جهاز)</h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedDevices.map((device, idx) => (
                      <div key={device.id} className={`p-3 flex items-center justify-between ${idx !== selectedDevices.length - 1 ? 'border-b border-slate-200 dark:border-white/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {device.company ? device.company.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{device.model || 'غير محدد'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{device.storage} | {device.imei1}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-rose-400">تكلفة: {(device.cost_price || 0).toLocaleString()}</p>
                          <p className="text-xs text-emerald-400">بيع: {(device.selling_price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cost Stats */}
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <h3 className="text-rose-400 font-bold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> التكلفة
                      </h3>
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">الإجمالي:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.totalCost.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">أقل سعر:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.minCost.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">أعلى سعر:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.maxCost.toLocaleString()} ج.م</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-rose-500/20 flex justify-between items-center">
                        <span className="text-rose-400 font-bold">المتوسط:</span>
                        <span className="text-rose-400 font-bold text-lg">{stats.avgCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Selling Stats */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute -left-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> سعر البيع
                      </h3>
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">الإجمالي:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.totalSelling.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">أقل سعر:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.minSelling.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">أعلى سعر:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{stats.maxSelling.toLocaleString()} ج.م</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">المتوسط:</span>
                        <span className="text-emerald-400 font-bold text-lg">{stats.avgSelling.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" /> خيارات التوحيد
                  </h3>
                  
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:text-white transition-colors">توحيد سعر التكلفة</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={unifyCost}
                        onChange={(e) => setUnifyCost(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:text-white transition-colors">توحيد سعر البيع</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={unifySelling}
                        onChange={(e) => setUnifySelling(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </div>
                  </label>
                </div>

                {/* Expected Profit */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-purple-400 font-bold flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" /> الربح المتوقع للجهاز الواحد
                    </h3>
                    <p className="text-xs text-purple-300/70">سعر البيع - التكلفة (بعد التوحيد)</p>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.expectedProfitPerDevice.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={handleApply}
              disabled={isLoading || (!unifyCost && !unifySelling)}
              className="bg-teal-600 hover:bg-teal-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.4)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              تطبيق المتوسط
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
