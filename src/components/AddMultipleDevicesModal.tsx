import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Package, LayoutGrid, Settings, DollarSign, 
  Store, ClipboardPaste, Plus, Trash2, Save, Loader2,
  AlertCircle
, Battery } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddMultipleDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entryType?: 'purchase' | 'manual' | 'import';
}

export default function AddMultipleDevicesModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  entryType = 'purchase'
}: AddMultipleDevicesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
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

  // Shared Data
  const [sharedData, setSharedData] = useState({
    company: '',
    model: '',
    storage: '',
    ram: '',
    condition: 'مستعمل',
    has_box: true,
    cost_price: '',
    selling_price: '',
    warehouse: 'المخزن الرئيسي',
    entry_type: entryType
  });

  // Devices List
  const [devicesList, setDevicesList] = useState([
    { id: 1, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' },
    { id: 2, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' },
    { id: 3, imei1: '', imei2: '', color: 'أسود', barcode: '', battery_percentage: '' }
  ]);

  const [globalColor, setGlobalColor] = useState('أسود');

  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSharedData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeviceChange = (id: number, field: string, value: string) => {
    setDevicesList(prev => prev.map(dev => dev.id === id ? { ...dev, [field]: value } : dev));
  };

  const addRow = () => {
    setDevicesList(prev => [
      ...prev, 
      { id: Date.now(), imei1: '', imei2: '', color: globalColor, barcode: '', battery_percentage: '' }
    ]);
  };

  const removeRow = (id: number) => {
    if (devicesList.length > 1) {
      setDevicesList(prev => prev.filter(dev => dev.id !== id));
    }
  };

  const applyColorToAll = () => {
    setDevicesList(prev => prev.map(dev => ({ ...dev, color: globalColor })));
  };

  const handleSubmit = async () => {
    // Validate
    const validDevices = devicesList.filter(d => d.imei1.trim() !== '');
    if (validDevices.length === 0) {
      setError('يجب إدخال IMEI واحد على الأقل');
      return;
    }

    if (!sharedData.company || !sharedData.model || !sharedData.cost_price || !sharedData.selling_price) {
      setError('يرجى تعبئة جميع البيانات المشتركة الأساسية (الشركة، الموديل، التكلفة، سعر البيع)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      
      const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId && currentBranchId !== 'ALL' ? currentBranchId : null);

      let formWarehouseId: string | null = null;
      if (targetBranchId) {
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

      // 🚨 Security System: Check Blacklist Before Adding Multiple
      let allImeis: string[] = [];
      validDevices.forEach(d => {
        if (d.imei1) allImeis.push(encodeURIComponent(d.imei1));
        if (d.imei2) allImeis.push(encodeURIComponent(d.imei2));
      });

      if (allImeis.length > 0) {
        const blacklistRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Blacklist?imei=in.(${allImeis.join(',')})`, {
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => null);

        if (blacklistRes && blacklistRes.ok) {
          const blacklistData = await blacklistRes.json();
          if (blacklistData.length > 0) {
            const badDevice = blacklistData[0];
            setError(`🚨 تحذير أمني: السيريال (${badDevice.imei}) ضمن القائمة مسجل في البلاك ليست كـ "${badDevice.status === 'stolen' ? 'مسروق' : badDevice.status === 'lost' ? 'مفقود' : 'تحت التحقيق'}". يرجى إزالته أولاً!`);
            setIsLoading(false);
            return;
          }
        }
      }

      const payload = validDevices.map(dev => ({
        company: sharedData.company,
        model: sharedData.model,
        storage: sharedData.storage,
        ram: sharedData.ram,
        color: dev.color,
        condition: sharedData.condition,
        has_box: sharedData.has_box.toString() === 'true',
        source: 'إضافة متعددة',
        imei1: dev.imei1,
        imei2: dev.imei2 || null,
        cost_price: Number(sharedData.cost_price) || 0,
        selling_price: Number(sharedData.selling_price) || 0,
        tax: 0,
        notes: `تمت الإضافة من ${sharedData.warehouse}`,
        entry_type: sharedData.entry_type,
        user_id: userId,
        status: 'available',
        warehouse_id: formWarehouseId,
        branch_id: targetBranchId,
        tenant_id: tenantId
      }));

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
        const errData = await response.json();
        throw new Error(errData.message || 'فشل إضافة الأجهزة');
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

  const totalCost = (Number(sharedData.cost_price) || 0) * devicesList.filter(d => d.imei1.trim() !== '').length;

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
          className="relative w-full max-w-4xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة سريعة متعددة</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Shared Data Section */}
            <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <LayoutGrid className="w-4 h-4" />
                <h3>البيانات المشتركة</h3>
              </div>

              {isOwner && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Store className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة الأجهزة إليه
                  </label>
                  <select 
                    value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required
                    className="w-full bg-white dark:bg-[#11151c] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
                  >
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">نوع الإدخال</label>
                  <select 
                    name="entry_type" value={sharedData.entry_type} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="purchase">مشتريات</option>
                    <option value="stock">رصيد أول مدة</option>
                    <option value="manual">إدخال يدوي</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">الشركة</label>
                  <select 
                    name="company" value={sharedData.company} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختر --</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Oppo">Oppo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">الموديل</label>
                  <input 
                    type="text" name="model" value={sharedData.model} onChange={handleSharedChange}
                    placeholder="مثال: Galaxy A54"
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">السعة</label>
                  <select 
                    name="storage" value={sharedData.storage} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختر --</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">الرام</label>
                  <select 
                    name="ram" value={sharedData.ram} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختر --</option>
                    <option value="4GB">4GB</option>
                    <option value="8GB">8GB</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">الحالة</label>
                  <select 
                    name="condition" value={sharedData.condition} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="جديد">جديد</option>
                    <option value="مستعمل">مستعمل</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">الكرتونة</label>
                  <select 
                    name="has_box" value={sharedData.has_box.toString()} onChange={handleSharedChange}
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  >
                    <option value="true">مع كرتونة</option>
                    <option value="false">بدون كرتونة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">سعر الشراء</label>
                  <input 
                    type="number" name="cost_price" value={sharedData.cost_price} onChange={handleSharedChange}
                    placeholder="0"
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">سعر البيع</label>
                  <input 
                    type="number" name="selling_price" value={sharedData.selling_price} onChange={handleSharedChange}
                    placeholder="0"
                    className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 w-full md:w-1/4">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">المخزن</label>
                <select 
                  name="warehouse" value={sharedData.warehouse} onChange={handleSharedChange}
                  className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                >
                  <option value="المخزن الرئيسي">المخزن الرئيسي</option>
                  <option value="فرع 1">فرع 1</option>
                </select>
              </div>
            </div>

            {/* Devices List Section */}
            <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                  <LayoutGrid className="w-4 h-4" />
                  <h3>قائمة الأجهزة</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <ClipboardPaste className="w-4 h-4" /> لصق IMEIs
                  </button>
                  <button onClick={addRow} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> إضافة صف
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="pb-3 font-medium w-10">#</th>
                      <th className="pb-3 font-medium">IMEI 1</th>
                      <th className="pb-3 font-medium">IMEI 2 (اختياري)</th>
                      <th className="pb-3 font-medium w-32">اللون</th>
                      <th className="pb-3 font-medium">الباركود</th>
                      <th className="pb-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {devicesList.map((device, index) => (
                      <tr key={device.id}>
                        <td className="py-3 font-bold text-slate-500">{index + 1}</td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" value={device.imei1} onChange={(e) => handleDeviceChange(device.id, 'imei1', e.target.value)}
                            placeholder="IMEI 1"
                            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" value={device.imei2} onChange={(e) => handleDeviceChange(device.id, 'imei2', e.target.value)}
                            placeholder="IMEI 2"
                            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" value={device.color} onChange={(e) => handleDeviceChange(device.id, 'color', e.target.value)}
                            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" value={device.barcode} onChange={(e) => handleDeviceChange(device.id, 'barcode', e.target.value)}
                            placeholder="اختياري - امسح البار"
                            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <button 
                            onClick={() => removeRow(device.id)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-slate-900 dark:text-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 p-4 bg-white dark:bg-[#11151c] rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-sm text-slate-500 dark:text-slate-400">تطبيق لون على الكل:</span>
                <input 
                  type="text" value={globalColor} onChange={(e) => setGlobalColor(e.target.value)}
                  className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white w-24 outline-none"
                />
                <button onClick={applyColorToAll} className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                  تطبيق
                </button>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">عدد الأجهزة:</span>
                  <span className="text-lg font-bold text-blue-400">{devicesList.filter(d => d.imei1.trim() !== '').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">إجمالي التكلفة:</span>
                  <span className="text-lg font-bold text-emerald-400">{totalCost.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

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
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الكل ( {devicesList.filter(d => d.imei1.trim() !== '').length} )
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
