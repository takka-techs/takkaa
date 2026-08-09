import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Warehouse, ArrowRightLeft, Loader2, AlertCircle } from 'lucide-react';

interface TransferItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
  itemType: 'devices' | 'accessories' | 'spare_parts';
  sourceWarehouse: any;
}

export default function TransferItemModal({ isOpen, onClose, onSuccess, item, itemType, sourceWarehouse }: TransferItemModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      fetchCompatibleWarehouses();
      // Reset state on open
      setSelectedWarehouseId('');
      setTransferQuantity(1);
      setError('');
    }
  }, [isOpen]);

  const fetchCompatibleWarehouses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=*&type=eq.${itemType}`;
      if (activeBranchId) url += `&branch_id=eq.${activeBranchId}`;
      else if (tenantId) url += `&tenant_id=eq.${tenantId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('فشل جلب المخازن المتوافقة');
      
      const data = await response.json();
      // Exclude source warehouse
      setWarehouses(data.filter((w: any) => w.id !== sourceWarehouse?.id));
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedWarehouseId) {
      setError('الرجاء اختيار المخزن الوجهة');
      return;
    }
    
    if (itemType !== 'devices' && (transferQuantity <= 0 || transferQuantity > (item.quantity || 1))) {
      setError('الكمية المحددة غير صحيحة');
      return;
    }

    setIsTransferring(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const tableMap = {
        'devices': 'Devices',
        'accessories': 'Accessories',
        'spare_parts': 'spare_parts'
      };
      const tableName = tableMap[itemType];

      if (itemType === 'devices') {
        const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${tableName}?id=eq.${item.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ warehouse_id: selectedWarehouseId })
        });
        
        if (!response.ok) {
           const errText = await response.text();
           throw new Error('فشل نقل الجهاز: ' + errText);
        }
        
        const resData = await response.json();
        if (!resData || resData.length === 0) {
           throw new Error('لم يتم تحويل الجهاز! (0 rows updated) قد يكون السبب صلاحيات التعديل في قاعدة البيانات تمنع تغيير المخزن.');
        }

      } else {
        // If transferring the entire quantity, optimize by simply updating the warehouse_id (No Insert+Delete)
        if (transferQuantity === item.quantity) {
          const updateRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${tableName}?id=eq.${item.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ warehouse_id: selectedWarehouseId })
          });
          
          if (!updateRes.ok) {
             const errText = await updateRes.text();
             throw new Error('فشل التحديث بالكامل: ' + errText);
          }
          const updateData = await updateRes.json();
          if (!updateData || updateData.length === 0) {
             throw new Error('لم يتم تحديث المخزن بوجهة التحويل! (0 rows updated) قد يكون السبب صلاحيات التعديل.');
          }
        } else {
          // Partial transfer: Insert new row for transferred amount, then decrement source amount
          const { id, created_at, quantity, warehouse_id, ...itemDetails } = item;
          const newItem = {
            ...itemDetails,
            quantity: transferQuantity,
            warehouse_id: selectedWarehouseId,
            user_id: localStorage.getItem('user_id')
          };
          
          const insertRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${tableName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newItem)
          });
          if (!insertRes.ok) {
             const errText = await insertRes.text();
             throw new Error('فشل إضافة المنتج كمية منفصلة: ' + errText);
          }
          
          const insertData = await insertRes.json();
          if (!insertData || insertData.length === 0) {
             throw new Error('تم رفض الإضافة في المخزن الوجهة! (0 rows inserted) تأكد من صلاحيات RLS للـ Insert.');
          }

          const remainingQuantity = item.quantity - transferQuantity;
          const updateRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${tableName}?id=eq.${item.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ quantity: remainingQuantity })
          });
          if (!updateRes.ok) {
             const errText = await updateRes.text();
             throw new Error('فشل تعديل الكمية القديمة: ' + errText);
          }
          const updateData = await updateRes.json();
          if (!updateData || updateData.length === 0) {
             throw new Error('لم يتم خصم الكمية من المخزن المصدر! (0 rows updated) تأكد من صلاحيات التعديل.');
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل التحويل المخزني');
    } finally {
      setIsTransferring(false);
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#11151c] rounded-3xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-200 dark:border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 text-teal-500 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">تحويل مخزني</h2>
                <span className="text-xs text-slate-500">نقل من: {sourceWarehouse?.name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Target Item Display */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">الصنف المراد تحويله:</span>
              <p className="font-bold text-slate-900 dark:text-white">{item?.name || item?.model || 'غير معروف'}</p>
              {itemType !== 'devices' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    الكمية المراد نقلها (المتاح: {item?.quantity})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={item?.quantity || 1}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Select Destination */}
            <div>
               <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                 المخزن الوجهة (يطابق نوع: {itemType})
               </label>
               
               {isLoading ? (
                 <div className="py-8 flex justify-center text-teal-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
               ) : warehouses.length === 0 ? (
                 <div className="text-center py-6 text-slate-500 bg-slate-50 dark:bg-[#080c13] rounded-xl border border-slate-200 dark:border-white/5">
                   لا يوجد مخازن أخرى من نفس النوع لتحويل المنتج إليها.
                 </div>
               ) : (
                 <div className="space-y-3">
                   <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ابحث عن مخزن..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors dark:text-white"
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {filteredWarehouses.map(w => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWarehouseId(w.id)}
                          className={`w-full text-start p-3 rounded-xl border transition-all flex items-center gap-3 ${
                            selectedWarehouseId === w.id 
                            ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                            : 'bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                          }`}
                        >
                          <Warehouse className={`w-5 h-5 ${selectedWarehouseId === w.id ? 'text-teal-500' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-bold text-sm">{w.name}</div>
                            {w.location && <div className="text-xs opacity-70">{w.location}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                 </div>
               )}
            </div>

          </div>

          <div className="p-6 border-t border-slate-200 dark:border-white/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleTransfer}
              disabled={isTransferring || warehouses.length === 0 || !selectedWarehouseId}
              className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-teal-500/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isTransferring ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تنفيذ التحويل'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
