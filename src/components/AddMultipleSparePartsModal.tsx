import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Package, LayoutGrid, Settings, DollarSign, 
  Store, Plus, Trash2, Save, Loader2, Barcode as BarcodeIcon, AlertCircle
} from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddMultipleSparePartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouseId?: string | null;
}

export default function AddMultipleSparePartsModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  warehouseId
}: AddMultipleSparePartsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { isOwner, branches, currentBranchId } = useBranch();
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('saved_spare_parts_categories');
    if (stored) {
      try {
        setSavedCategories(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (currentBranchId && currentBranchId !== 'ALL') {
        setSelectedBranchId(currentBranchId);
      } else if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].id.toString());
      }

      // Fetch suppliers and wallets
      const fetchSuppliersAndWallets = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const tenantId = localStorage.getItem('tenant_id') || userId;
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };
          const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name,initial_balance&tenant_id=eq.${tenantId}&order=name.asc`, { headers });
          if (res.ok) {
            setSuppliers(await res.json());
          }

          let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          if (activeBranchId && activeBranchId !== 'ALL') {
             walletsUrl += `&branch_id=eq.${activeBranchId}`;
          }
          const walletsRes = await fetch(walletsUrl, { headers });
          if (walletsRes.ok) {
            setWallets(await walletsRes.json());
          }
        } catch (error) {
          console.error('Error fetching suppliers and wallets:', error);
        }
      };
      fetchSuppliersAndWallets();
    }
  }, [isOpen, currentBranchId, branches]);

  // Shared Data
  const [sharedData, setSharedData] = useState({
    brand: '',
    category: '',
    supplier: '',
    entry_type: 'purchase',
    location: ''
  });

  const [otherCategory, setOtherCategory] = useState('');
  const [otherBrand, setOtherBrand] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [wallets, setWallets] = useState<any[]>([]);

  // spare_parts List
  const [sparePartsList, setspare_partsList] = useState([
    { id: 1, name: '', barcode: '', quantity: '1', cost_price: '0', sell_price: '0', wholesale_price: '0', half_wholesale_price: '0', tax: '0' },
    { id: 2, name: '', barcode: '', quantity: '1', cost_price: '0', sell_price: '0', wholesale_price: '0', half_wholesale_price: '0', tax: '0' },
    { id: 3, name: '', barcode: '', quantity: '1', cost_price: '0', sell_price: '0', wholesale_price: '0', half_wholesale_price: '0', tax: '0' }
  ]);

  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSharedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSparePartChange = (id: number, field: string, value: string) => {
    setspare_partsList(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  };

  const addRow = () => {
    setspare_partsList(prev => [
      ...prev, 
      { id: Date.now(), name: '', barcode: '', quantity: '1', cost_price: '0', sell_price: '0', wholesale_price: '0', half_wholesale_price: '0', tax: '0' }
    ]);
  };

  const removeRow = (id: number) => {
    if (sparePartsList.length > 1) {
      setspare_partsList(prev => prev.filter(acc => acc.id !== id));
    }
  };

  const handleSubmit = async () => {
    // Validate
    const validSpareParts = sparePartsList.filter(a => a.name.trim() !== '');
    if (validSpareParts.length === 0) {
      setError('يجب إدخال اسم صنف واحد على الأقل');
      return;
    }

    if (sharedData.supplier && Number(paidAmount) > 0) {
       if (!selectedWalletId) {
         setError('الرجاء اختيار الخزنة التي سيتم الدفع منها');
         return;
       }
       const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
       if (wallet && Number(wallet.balance) < Number(paidAmount)) {
         setError('رصيد الخزنة غير كافٍ لإتمام الدفع');
         return;
       }
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      
      const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId && currentBranchId !== 'ALL' ? currentBranchId : null);

      let formWarehouseId = (warehouseId === 'ALL' || warehouseId === 'NONE') ? null : (warehouseId || null);

      let finalBrand = sharedData.brand === 'أخرى' ? otherBrand : sharedData.brand;
      let finalCategory = sharedData.category === 'أخرى' ? otherCategory.trim() : sharedData.category;

      // Save category if it's new
      if (finalCategory && !savedCategories.includes(finalCategory)) {
        const newCats = [...savedCategories, finalCategory];
        setSavedCategories(newCats);
        localStorage.setItem('saved_spare_parts_categories', JSON.stringify(newCats));
      }

      const payload = validSpareParts.map(acc => ({
        name: acc.name,
        category: finalCategory,
        sku: acc.barcode || '', // Use barcode input for SKU temporarily or keep empty
        barcode: acc.barcode.trim() || Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
        barcode_type: 'EAN-13',
        cost_price: Number(acc.cost_price) || 0,
        sell_price: Number(acc.sell_price) || 0,
        wholesale_price: Number(acc.wholesale_price) || null,
        half_wholesale_price: Number(acc.half_wholesale_price) || null,
        quantity: Number(acc.quantity) || 0,
        min_quantity: 0,
        notes: `مورد: ${sharedData.supplier || 'بدون'}, نوع: ${sharedData.entry_type}`,
        user_id: userId,
        tenant_id: tenantId,
        warehouse_id: formWarehouseId,
        branch_id: targetBranchId
      }));

      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'فشل إضافة الأصناف');
      }

      // Handle payment and supplier balance
      if (sharedData.supplier) {
        const commonHeaders = {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        };

        const totalCost = validSpareParts.reduce((sum, acc) => sum + ((Number(acc.cost_price) || 0) * (Number(acc.quantity) || 0)), 0);
        const paid = Number(paidAmount) || 0;
        const debtToAdd = totalCost - paid;

        const supplierObj = suppliers.find(s => s.id.toString() === sharedData.supplier);
        if (supplierObj) {
           await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?id=eq.${supplierObj.id}`, {
             method: 'PATCH',
             headers: commonHeaders,
             body: JSON.stringify({ initial_balance: Number(supplierObj.initial_balance || 0) + debtToAdd })
           });
        }

        if (paid > 0 && selectedWalletId) {
          const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
          if (wallet) {
             await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
               method: 'PATCH',
               headers: commonHeaders,
               body: JSON.stringify({ balance: Number(wallet.balance || 0) - paid })
             });
          }
          await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({
              wallet_id: Number(selectedWalletId),
              user_id: userId,
              type: 'out',
              amount: paid,
              category: 'سداد دفعة للمورد',
              description: `سداد للمورد (إضافة قطع غيار متعددة)`,
              branch_id: targetBranchId,
              tenant_id: tenantId
            })
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalCost = sparePartsList.filter(a => a.name.trim() !== '').reduce((sum, acc) => sum + ((Number(acc.cost_price) || 0) * (Number(acc.quantity) || 0)), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
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
          className="relative w-full max-w-5xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة قطع غيار متعددة</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Shared Data */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 text-cyan-500">
                <LayoutGrid className="w-5 h-5" />
                <h3 className="font-bold">البيانات المشتركة</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isOwner && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">الفرع</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                    >
                      <option value="">كل الفروع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">نوع الإدخال</label>
                  <select 
                    name="entry_type"
                    value={sharedData.entry_type}
                    onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="purchase">توريد مشتريات</option>
                    <option value="stock">رصيد أول مدة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">المورد</label>
                  <select
                    name="supplier"
                    value={sharedData.supplier}
                    onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="">بدون مورد (أو مشتريات عامة)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                {sharedData.supplier && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">المبلغ المدفوع (اختياري)</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="المبلغ المدفوع الآن"
                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                    {Number(paidAmount) > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">خصم من الخزنة *</label>
                        <select
                          value={selectedWalletId}
                          onChange={(e) => setSelectedWalletId(e.target.value)}
                          className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                        >
                          <option value="">اختر الخزنة...</option>
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">التصنيف</label>
                  <select
                    name="category"
                    value={sharedData.category}
                    onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="">بدون تصنيف</option>
                    {savedCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                    <option value="أخرى">+ إضافة تصنيف جديد</option>
                  </select>
                </div>
                {sharedData.category === 'أخرى' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">اسم التصنيف الجديد</label>
                    <input 
                      type="text" 
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      placeholder="مثال: سماعات جيمنج"
                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <BarcodeIcon className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-bold">قائمة الأصناف</h3>
                </div>
                <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                  إجمالي التكلفة: {totalCost.toLocaleString()} ج.م
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5">
                      <tr>
                        <th className="p-3 font-bold">م</th>
                        <th className="p-3 font-bold min-w-[200px]">اسم الصنف *</th>
                        <th className="p-3 font-bold min-w-[120px]">الباركود</th>
                        <th className="p-3 font-bold w-24">الكمية</th>
                        <th className="p-3 font-bold w-32">سعر الشراء</th>
                        <th className="p-3 font-bold w-32">سعر القطاعي</th>
                        <th className="p-3 font-bold w-32">سعر الجملة</th>
                        <th className="p-3 font-bold w-32">جملة الجملة</th>
                        <th className="p-3 font-bold w-16 text-center">إزالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {sparePartsList.map((acc, index) => (
                        <tr key={acc.id} className="hover:bg-white dark:hover:bg-white/[0.01]">
                          <td className="p-3 text-slate-500">{index + 1}</td>
                          <td className="p-3">
                            <input 
                              type="text"
                              value={acc.name}
                              onChange={(e) => handleSparePartChange(acc.id, 'name', e.target.value)}
                              placeholder="اسم قطعة الغيار..."
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text"
                              value={acc.barcode}
                              onChange={(e) => handleSparePartChange(acc.id, 'barcode', e.target.value)}
                              placeholder="تلقائي إذا فارغ"
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none font-mono text-left"
                              dir="ltr"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="number"
                              min="1"
                              value={acc.quantity}
                              onChange={(e) => handleSparePartChange(acc.id, 'quantity', e.target.value)}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input 
                                type="number"
                                min="0"
                                value={acc.cost_price}
                                onChange={(e) => handleSparePartChange(acc.id, 'cost_price', e.target.value)}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none text-left"
                                dir="ltr"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">EGP</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input 
                                type="number"
                                min="0"
                                value={acc.sell_price}
                                onChange={(e) => handleSparePartChange(acc.id, 'sell_price', e.target.value)}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none text-left"
                                dir="ltr"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">EGP</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input 
                                type="number"
                                min="0"
                                value={acc.wholesale_price}
                                onChange={(e) => handleSparePartChange(acc.id, 'wholesale_price', e.target.value)}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none text-left"
                                dir="ltr"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">EGP</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input 
                                type="number"
                                min="0"
                                value={acc.half_wholesale_price}
                                onChange={(e) => handleSparePartChange(acc.id, 'half_wholesale_price', e.target.value)}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 outline-none text-left"
                                dir="ltr"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">EGP</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => removeRow(acc.id)}
                              disabled={sparePartsList.length === 1}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-transparent">
                  <button 
                    onClick={addRow}
                    className="flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-lg transition-colors border border-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" /> صف جديد
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex gap-3">
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-[#080c13] py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isLoading ? 'جاري الحفظ...' : 'حفظ القطع غيار'}
            </button>
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 py-3 rounded-xl font-bold transition-all disabled:opacity-70"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
