import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Barcode as BarcodeIcon, Loader2 } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouseId?: string | null;
}

export default function AddSparePartModal(props: AddSparePartModalProps) {
  const { isOpen, onClose, onSuccess } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('auto');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourcePhone, setNewSourcePhone] = useState('');
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { isOwner, branches, currentBranchId } = useBranch();

  React.useEffect(() => {
    if (isOpen) {
      if (currentBranchId && currentBranchId !== 'ALL') {
        setSelectedBranchId(currentBranchId);
      } else if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].id.toString());
      }

      const fetchSuppliers = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };
          const tenantId = localStorage.getItem('tenant_id') || userId;

          let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          if (activeBranchId && activeBranchId !== 'ALL') {
            walletsUrl += `&branch_id=eq.${activeBranchId}`;
          }

          const promises = [
            fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&tenant_id=eq.${tenantId}&order=name.asc`, { headers }),
            fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients?select=id,name&tenant_id=eq.${tenantId}&order=name.asc`, { headers }),
            fetch(walletsUrl, { headers })
          ];

          const results = await Promise.all(promises);

          if (results[0].ok) {
            setSuppliers(await results[0].json());
          }
          if (results[1].ok) {
            setClients(await results[1].json());
          }
          if (results[2].ok) {
            setWallets(await results[2].json());
          }
        } catch (error) {
          console.error('Error fetching defaults:', error);
        }
      };
      fetchSuppliers();

      const storedCategories = localStorage.getItem('saved_sparepart_categories');
      if (storedCategories) {
        try {
          setSavedCategories(JSON.parse(storedCategories));
        } catch (e) { }
      }
    }
  }, [isOpen, currentBranchId, branches]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    barcode: '',
    cost_price: '',
    sell_price: '',
    wholesale_price: '',
    half_wholesale_price: '',
    quantity: '0',
    min_quantity: '5',
    supplier: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const tenantId = localStorage.getItem('tenant_id') || userId;

      if (Number(paidAmount) > 0 && selectedWalletId) {
        const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
        if (wallet && Number(wallet.balance) < Number(paidAmount)) {
          alert('عفواً، رصيد الخزينة لا يكفي لهذه العملية.');
          setIsLoading(false);
          return;
        }
      }

      let finalBarcode = formData.barcode;
      if (barcodeMode === 'auto') {
        finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      }

      const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId || null);
      let formWarehouseId = ((props as any).warehouseId === 'ALL' || (props as any).warehouseId === 'NONE') ? null : ((props as any).warehouseId || null);

      const commonHeaders = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let finalSupplier = formData.supplier;
      let finalSupplierId = null;
      let finalClientId = null;
      const totalCost = (Number(formData.cost_price) || 0) * (Number(formData.quantity) || 1);
      const paid = Number(paidAmount) || 0;
      const debtToAdd = totalCost - paid;

      if (formData.supplier === 'مورد_جديد' && newSourceName) {
        const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            name: newSourceName,
            phone: newSourcePhone || null,
            user_id: userId,
            tenant_id: tenantId,
            branch_id: targetBranchId,
            initial_balance: debtToAdd
          })
        });
        if(res.ok) {
           const newSup = await res.json();
           if(newSup && newSup.length > 0) finalSupplierId = newSup[0].id;
        }
        finalSupplier = newSourceName;
      } else if (formData.supplier === 'عميل_جديد' && newSourceName) {
        const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            name: newSourceName,
            phone: newSourcePhone || null,
            user_id: userId,
            tenant_id: tenantId,
            branch_id: targetBranchId,
            initial_balance: -debtToAdd
          })
        });
        if(res.ok) {
           const newCli = await res.json();
           if(newCli && newCli.length > 0) finalClientId = newCli[0].id;
        }
        finalSupplier = newSourceName;
      } else if (formData.supplier) {
        const existingSupplier = suppliers.find(s => s.name === formData.supplier);
        const existingClient = clients.find(c => c.name === formData.supplier);
        
        if (existingSupplier) {
          finalSupplierId = existingSupplier.id;
          if (debtToAdd !== 0) {
            const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?id=eq.${finalSupplierId}&select=initial_balance`, {
              headers: { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              const currentBal = data[0]?.initial_balance || 0;
              await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?id=eq.${finalSupplierId}`, {
                method: 'PATCH',
                headers: commonHeaders,
                body: JSON.stringify({ initial_balance: currentBal + debtToAdd })
              });
            }
          }
        } else if (existingClient) {
          finalClientId = existingClient.id;
          if (debtToAdd !== 0) {
            const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients?id=eq.${finalClientId}&select=initial_balance`, {
              headers: { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              const currentBal = data[0]?.initial_balance || 0;
              await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients?id=eq.${finalClientId}`, {
                method: 'PATCH',
                headers: commonHeaders,
                body: JSON.stringify({ initial_balance: currentBal - debtToAdd })
              });
            }
          }
        }
      }

      if (!formWarehouseId && targetBranchId) {
        try {
          const commonHeaders = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.spare_parts&is_default=eq.true&branch_id=eq.${targetBranchId}`;
          let whRes = await fetch(url, { headers: commonHeaders });
          if (whRes.ok) {
            let whData = await whRes.json();
            if (whData && whData.length > 0) formWarehouseId = whData[0].id;
            else {
              let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.spare_parts&branch_id=eq.${targetBranchId}&order=created_at.asc&limit=1`;
              let whRes2 = await fetch(url2, { headers: commonHeaders });
              if (whRes2.ok) {
                let whData2 = await whRes2.json();
                if (whData2 && whData2.length > 0) formWarehouseId = whData2[0].id;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching branch warehouse", e);
        }
      }

      const finalCategory = isAddingNewCategory ? newCategoryName : formData.category;
      if (finalCategory && !savedCategories.includes(finalCategory)) {
        const updatedCategories = [...savedCategories, finalCategory];
        localStorage.setItem('saved_sparepart_categories', JSON.stringify(updatedCategories));
        setSavedCategories(updatedCategories);
      }

      const payload = {
        name: formData.name,
        category: finalCategory,
        sku: formData.sku,
        barcode: finalBarcode,
        barcode_type: barcodeMode,
        cost_price: Number(formData.cost_price),
        sell_price: Number(formData.sell_price),
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        half_wholesale_price: formData.half_wholesale_price ? Number(formData.half_wholesale_price) : null,
        quantity: Number(formData.quantity),
        min_quantity: Number(formData.min_quantity),
        notes: formData.notes,
        user_id: userId,
        warehouse_id: formWarehouseId,
        branch_id: targetBranchId,
        tenant_id: tenantId
      };

      if (finalSupplier) {
        (payload as any).supplier = finalSupplier;
      }

      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Add spare part error:", errText);
        throw new Error(`فشل في إضافة قطعة الغيار: ${errText}`);
      }

      if (finalSupplier && Number(paidAmount) > 0 && selectedWalletId) {
        const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
        if (wallet) {
          await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
            method: 'PATCH',
            headers: commonHeaders,
            body: JSON.stringify({ balance: Number(wallet.balance || 0) - Number(paidAmount) })
          });
        }
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            wallet_id: Number(selectedWalletId),
            user_id: userId,
            type: 'out',
            amount: Number(paidAmount),
            category: 'سداد دفعة للمورد',
            description: `سداد المورد ${finalSupplier} (قطعة غيار: ${formData.name})`,
            branch_id: targetBranchId,
            tenant_id: tenantId
          })
        });
      }

      onSuccess();
      onClose();
      setPaidAmount('');
      setSelectedWalletId('');
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setFormData({
        name: '',
        category: '',
        sku: '',
        barcode: '',
        cost_price: '',
        sell_price: '',
        wholesale_price: '',
        half_wholesale_price: '',
        quantity: '0',
        min_quantity: '5',
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
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
          className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة قطعة غيار جديدة</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form id="add-spare-form" onSubmit={handleSubmit} className="space-y-6">
              {isOwner && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Wrench className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة القطعة إليه
                  </label>
                  <select
                    value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
                  >
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم القطعة *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الفئة</label>
                  {!isAddingNewCategory ? (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'new_category') {
                          setIsAddingNewCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">بدون فئة</option>
                      {savedCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="new_category">+ إضافة فئة جديدة</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="اسم الفئة الجديدة"
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-3 py-2 bg-slate-200 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <BarcodeIcon className="w-4 h-4 text-cyan-400" /> الباركود
                  </label>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={barcodeMode === 'auto'}
                        onChange={() => setBarcodeMode('auto')}
                        className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">تلقائي 🔄</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={barcodeMode === 'manual'}
                        onChange={() => setBarcodeMode('manual')}
                        className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">يدوي/سكان 📷</span>
                    </label>
                  </div>
                </div>
                {barcodeMode === 'manual' && (
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="امسح الباركود هنا..."
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">تكلفة الشراء *</label>
                  <input
                    type="number"
                    name="cost_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع قطاعي *</label>
                  <input
                    type="number"
                    name="sell_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.sell_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع جملة (اختياري)</label>
                  <input
                    type="number"
                    name="wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع نصف جملة (اختياري)</label>
                  <input
                    type="number"
                    name="half_wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.half_wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية المدرجة</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه الأقل</label>
                  <input
                    type="number"
                    name="min_quantity"
                    min="0"
                    value={formData.min_quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد / المصدر</label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">بدون مصدر (بضاعة متوفرة)</option>
                      <option value="مورد_جديد">+ إضافة مورد جديد</option>
                      <option value="عميل_جديد">+ إضافة عميل جديد</option>
                      <optgroup label="الموردين الحاليين">
                        {suppliers.map(s => (
                          <option key={`sup-${s.id}`} value={s.name}>{s.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="العملاء الحاليين">
                        {clients.map(c => (
                          <option key={`cli-${c.id}`} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {(formData.supplier === 'مورد_جديد' || formData.supplier === 'عميل_جديد') && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">اسم {formData.supplier === 'مورد_جديد' ? 'المورد' : 'العميل'}</label>
                        <input
                          type="text" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} required
                          placeholder="الاسم"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">رقم الهاتف (اختياري)</label>
                        <input
                          type="text" value={newSourcePhone} onChange={(e) => setNewSourcePhone(e.target.value)}
                          placeholder="رقم الهاتف"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {(suppliers.some(s => s.name === formData.supplier) || clients.some(c => c.name === formData.supplier) || formData.supplier === 'مورد_جديد' || formData.supplier === 'عميل_جديد') && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-600 dark:text-slate-400">إجمالي المطلوب:</span>
                        <span className="text-rose-600 dark:text-rose-400">
                          {((Number(formData.cost_price) || 0) * (Number(formData.quantity) || 1)).toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع (اختياري)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="المبلغ المدفوع الآن"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                        />
                      </div>
                      {Number(paidAmount) > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">خصم من الخزينة *</label>
                          <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            required
                            className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                          >
                            <option value="">-- اختر الخزينة --</option>
                            {wallets.map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({Number(w.balance).toLocaleString()} ج.م)</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="add-spare-form"
              disabled={isLoading}
              className="bg-[#00d0d4] hover:bg-[#00b8bc] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              إضافة
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
