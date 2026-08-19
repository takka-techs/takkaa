
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Smartphone, LayoutGrid, Settings, Package,
  Store, Barcode, DollarSign, Building2, FileText,
  Save, Loader2, Layers, Plus, AlertCircle
  , Battery
} from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToMultiple?: () => void;
  entryType?: 'purchase' | 'manual' | 'import';
  warehouseId?: string | null;
}

export default function AddDeviceModal(props: AddDeviceModalProps) {
  const {
    isOpen,
    onClose,
    onSuccess,
    onSwitchToMultiple,
    entryType = 'purchase'
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company: '',
    model: '',
    storage: '',
    ram: '',
    color: '',
    condition: 'جديد',
    has_box: true,
    source: '',
    imei1: '',
    imei2: '',
    barcodeType: 'auto',
    cost_price: '',
    battery_percentage: '',
    selling_price: '',
    wholesale_price: '',
    half_wholesale_price: '',
    tax: '',
    notes: '',
    entry_type: entryType
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  const [otherCompany, setOtherCompany] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourcePhone, setNewSourcePhone] = useState('');

  const { isOwner, branches, currentBranchId } = useBranch();

  React.useEffect(() => {
    if (isOpen) {
      if (currentBranchId && currentBranchId !== 'ALL') {
        setSelectedBranchId(currentBranchId);
      } else if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].id.toString());
      }
    }
  }, [isOpen, currentBranchId, branches]);

  React.useEffect(() => {
    if (isOpen) {
      const fetchDefaults = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const tenantId = localStorage.getItem('tenant_id') || userId;
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };

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

          if (results[0].ok) setSuppliers(await results[0].json());
          if (results[1].ok) setClients(await results[1].json());
          if (results[2].ok) setWallets(await results[2].json());
        } catch (error) {
          console.error('Error fetching defaults:', error);
        }
      };
      fetchDefaults();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;

      // 🚨 Security System: Check Blacklist Before Adding
      const checkImei = [formData.imei1, formData.imei2].filter(Boolean).map(i => encodeURIComponent(i));
      if (checkImei.length > 0) {
        const blacklistRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Blacklist?imei=in.(${checkImei.join(',')})`, {
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => null);

        if (blacklistRes && blacklistRes.ok) {
          const blacklistData = await blacklistRes.json();
          if (blacklistData.length > 0) {
            const badDevice = blacklistData[0];
            setError(`🚨 تحذير أمني: هذا السيريال (${badDevice.imei}) مسجل في البلاك ليست كـ "${badDevice.status === 'stolen' ? 'مسروق' : badDevice.status === 'lost' ? 'مفقود' : 'تحت التحقيق'}". يرجى مراجعة نظام الأمان!`);
            setIsLoading(false);
            return;
          }
        }
      }

      const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId || null);
      let formWarehouseId = ((props as any).warehouseId === 'ALL' || (props as any).warehouseId === 'NONE') ? null : ((props as any).warehouseId || null);

      let finalCompany = formData.company === 'أخرى' ? otherCompany : formData.company;
      let finalSource = formData.source;

      if (formData.source === 'مورد_جديد' && newSourceName) {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newSourceName,
            phone: newSourcePhone || null,
            user_id: userId,
            tenant_id: tenantId,
            branch_id: targetBranchId
          })
        });
        finalSource = newSourceName;
      } else if (formData.source === 'عميل_جديد' && newSourceName) {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newSourceName,
            phone: newSourcePhone || null,
            user_id: userId,
            tenant_id: tenantId,
            branch_id: targetBranchId
          })
        });
        finalSource = newSourceName;
      }

      if (!formWarehouseId && targetBranchId) {
        try {
          const commonHeaders = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.devices&is_default=eq.true&branch_id=eq.${targetBranchId}`;
          let whRes = await fetch(url, { headers: commonHeaders });
          if (whRes.ok) {
            let whData = await whRes.json();
            if (whData && whData.length > 0) formWarehouseId = whData[0].id;
            else {
              let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.devices&branch_id=eq.${targetBranchId}&order=created_at.asc&limit=1`;
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

      const payload = {
        company: finalCompany,
        model: formData.model,
        storage: formData.storage,
        ram: formData.ram,
        color: formData.color,
        condition: formData.condition,
        has_box: formData.has_box.toString() === 'true',
        source: finalSource,
        imei1: formData.imei1,
        imei2: formData.imei2 || null,
        battery_percentage: formData.battery_percentage ? Number(formData.battery_percentage) : null,
        cost_price: Number(formData.cost_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        half_wholesale_price: formData.half_wholesale_price ? Number(formData.half_wholesale_price) : null,
        tax: Number(formData.tax) || 0,
        notes: formData.notes || null,
        entry_type: formData.entry_type,
        user_id: userId,
        status: 'available',
        warehouse_id: formWarehouseId,
        branch_id: targetBranchId,
        tenant_id: tenantId
      };

      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices', {
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
        let errText = await response.text();
        try {
          const errData = JSON.parse(errText);
          errText = errData.message || errData.details || errText;
        } catch (e) { }
        throw new Error(`فشل إضافة الجهاز: ${errText}`);
      }

      if (finalSource && Number(paidAmount) > 0 && selectedWalletId) {
        const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
        if (wallet) {
          await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ balance: Number(wallet.balance || 0) - Number(paidAmount) })
          });
        }
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            wallet_id: Number(selectedWalletId),
            user_id: userId,
            type: 'out',
            amount: Number(paidAmount),
            category: 'سداد دفعة للمورد',
            description: `سداد المورد ${finalSource} (جهاز: ${finalCompany} ${formData.model})`,
            branch_id: targetBranchId,
            tenant_id: tenantId
          })
        });
      }

      onSuccess();
      onClose();
      setPaidAmount('');
      setSelectedWalletId('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
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
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة جهاز جديد</h2>
            </div>
            <div className="flex items-center gap-3">
              {onSwitchToMultiple && (
                <button
                  type="button"
                  onClick={onSwitchToMultiple}
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" /> إضافة سريعة متعددة
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form id="add-device-form" onSubmit={handleSubmit} className="space-y-6">

              {isOwner && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Store className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة الجهاز إليه
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

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Store className="w-4 h-4 text-orange-400" /> نوع الإدخال
                  </label>
                  <select
                    name="entry_type" value={formData.entry_type} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="purchase">مشتريات</option>
                    <option value="stock">رصيد أول مدة</option>
                    <option value="manual">إدخال يدوي</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <LayoutGrid className="w-4 h-4 text-blue-400" /> الشركة
                  </label>
                  <select
                    name="company" value={formData.company} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- اختر الشركة --</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Realme">Realme</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  {formData.company === 'أخرى' && (
                    <input
                      type="text" value={otherCompany} onChange={(e) => setOtherCompany(e.target.value)} required
                      placeholder="اكتب اسم الشركة..."
                      className="w-full mt-2 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Smartphone className="w-4 h-4 text-purple-400" /> الموديل
                  </label>
                  <input
                    type="text" name="model" value={formData.model} onChange={handleChange} required
                    placeholder="مثال: iPhone 13 Pro"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Save className="w-4 h-4 text-emerald-400" /> السعة
                  </label>
                  <input
                    type="text" name="storage" value={formData.storage} onChange={handleChange} required
                    placeholder="مثال: 128GB"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <LayoutGrid className="w-4 h-4 text-pink-400" /> الرام
                  </label>
                  <select
                    name="ram" value={formData.ram} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- اختر --</option>
                    <option value="4GB">4GB</option>
                    <option value="6GB">6GB</option>
                    <option value="8GB">8GB</option>
                    <option value="12GB">12GB</option>
                    <option value="16GB">16GB</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <LayoutGrid className="w-4 h-4 text-orange-400" /> اللون
                  </label>
                  <input
                    type="text" name="color" value={formData.color} onChange={handleChange} required
                    placeholder="مثال: أسود، أبيض، ذهبي"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" /> الحالة
                  </label>
                  <select
                    name="condition" value={formData.condition} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="جديد">جديد</option>
                    <option value="كالجديد">كالجديد</option>
                    <option value="مستعمل">مستعمل</option>
                    <option value="عاطل">عاطل</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Battery className="w-4 h-4 text-emerald-400" /> نسبة البطارية
                  </label>
                  <input
                    type="number" name="battery_percentage" value={formData.battery_percentage} onChange={handleChange} min="0" max="100"
                    placeholder="نسبة البطارية (%)"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Package className="w-4 h-4 text-yellow-400" /> الكرتونة
                  </label>
                  <select
                    name="has_box" value={formData.has_box.toString()} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="true">مع كرتونة</option>
                    <option value="false">بدون كرتونة</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-red-400" /> المصدر
                    </label>
                    <select
                      name="source" value={formData.source} onChange={handleChange} required
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="">-- اختر نوع المصدر --</option>
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

                  {(formData.source === 'مورد_جديد' || formData.source === 'عميل_جديد') && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">اسم {formData.source === 'مورد_جديد' ? 'المورد' : 'العميل'}</label>
                        <input
                          type="text" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} required
                          placeholder="الاسم"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">رقم الهاتف (اختياري)</label>
                        <input
                          type="text" value={newSourcePhone} onChange={(e) => setNewSourcePhone(e.target.value)}
                          placeholder="رقم الهاتف"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {(suppliers.some(s => s.name === formData.source) || formData.source === 'مورد_جديد') && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-600 dark:text-slate-400">إجمالي المطلوب:</span>
                        <span className="text-rose-600 dark:text-rose-400">
                          {((Number(formData.cost_price) || 0) + (Number(formData.tax) || 0)).toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع للمورد (اختياري)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="المبلغ المدفوع الآن"
                          className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>
                      {Number(paidAmount) > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">خصم من المحفظة</label>
                          <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            required={Number(paidAmount) > 0}
                            className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                          >
                            <option value="">اختر المحفظة...</option>
                            {wallets.map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* Identifiers */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Barcode className="w-4 h-4 text-blue-400" /> IMEI 1
                  </label>
                  <input
                    type="text" name="imei1" value={formData.imei1} onChange={handleChange} required
                    placeholder="IMEI1"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Barcode className="w-4 h-4 text-blue-400" /> IMEI 2 (اختياري)
                  </label>
                  <input
                    type="text" name="imei2" value={formData.imei2} onChange={handleChange}
                    placeholder="IMEI2"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Barcode className="w-4 h-4 text-purple-400" /> الباركود
                  </label>
                  <div className="flex items-center gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name="barcodeType" value="auto"
                        checked={formData.barcodeType === 'auto'} onChange={handleChange}
                        className="text-emerald-500 focus:ring-emerald-500 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">تلقائي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name="barcodeType" value="manual"
                        checked={formData.barcodeType === 'manual'} onChange={handleChange}
                        className="text-emerald-500 focus:ring-emerald-500 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">يدوي/سكان</span>
                    </label>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/5" />

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 text-orange-400" /> التكلفة
                  </label>
                  <input
                    type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} required
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> سعر البيع قطاعي
                  </label>
                  <input
                    type="number" name="selling_price" value={formData.selling_price} onChange={handleChange} required
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 text-indigo-400" /> سعر البيع جملة (اختياري)
                  </label>
                  <input
                    type="number" name="wholesale_price" value={formData.wholesale_price} onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 text-purple-400" /> سعر البيع نصف جملة (اختياري)
                  </label>
                  <input
                    type="number" name="half_wholesale_price" value={formData.half_wholesale_price} onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" /> ضريبة NTRA (اختياري)
                </label>
                <input
                  type="number" name="tax" value={formData.tax} onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-500">ضريبة الجمارك للأجهزة المستوردة - اتركها فارغة إذا الجهاز معفى</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" /> ملاحظات (اختياري)
                </label>
                <textarea
                  name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="add-device-form"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الجهاز
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
