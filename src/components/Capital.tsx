import React, { useState, useEffect } from 'react';
import { Landmark, AlertCircle, Save, TrendingUp, TrendingDown, DollarSign, Smartphone, Headphones, Wrench, Wallet, Building2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export const Capital: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Current stats
  const [currentStats, setCurrentStats] = useState({
    devicesValue: 0,
    accessoriesValue: 0,
    sparePartsValue: 0,
    cashValue: 0,
    walletsValue: 0,
    instapayValue: 0,
    bankValue: 0
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    devicesValue: '',
    accessoriesValue: '',
    sparePartsValue: '',
    cashValue: '',
    walletsValue: '',
    instapayValue: '',
    bankValue: ''
  });

  useEffect(() => {
    fetchInitialCapital();
    fetchCurrentStats();
  }, []);

  const fetchInitialCapital = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };
      const tenantQuery = tenantId ? `tenant_id=eq.${tenantId}` : '';
      const url = `${SUPABASE_URL}/rest/v1/initial_capital?select=*${tenantQuery ? '&' + tenantQuery : ''}&limit=1`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const cap = data[0];
          setInitialCapital({
            devicesValue: Number(cap.devices_value),
            accessoriesValue: Number(cap.accessories_value),
            sparePartsValue: Number(cap.spare_parts_value),
            cashValue: Number(cap.cash_value),
            walletsValue: Number(cap.wallets_value),
            instapayValue: Number(cap.instapay_value),
            bankValue: Number(cap.bank_value),
          });
          setIsSaved(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch initial capital:", err);
    }
  };

  const fetchCurrentStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };

      const tenantId = localStorage.getItem('tenant_id');
      const tenantQuery = tenantId ? `&tenant_id=eq.${tenantId}` : '';

      // Fetch Devices (available only, cost_price)
      const devicesRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=cost_price,status${tenantQuery}&status=in.(available,new)`, { headers });
      const devicesData = devicesRes.ok ? await devicesRes.json() : [];
      const devicesValue = devicesData.reduce((sum: number, item: any) => sum + (Number(item.cost_price) || 0), 0);

      // Fetch Accessories
      const accRes = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=cost_price,quantity${tenantQuery}`, { headers });
      const accData = accRes.ok ? await accRes.json() : [];
      const accessoriesValue = accData.reduce((sum: number, item: any) => sum + ((Number(item.cost_price) || 0) * (Number(item.quantity) || 0)), 0);

      // Fetch Spare Parts
      const spareRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=cost_price,quantity${tenantQuery}`, { headers });
      const spareData = spareRes.ok ? await spareRes.json() : [];
      const sparePartsValue = spareData.reduce((sum: number, item: any) => sum + ((Number(item.cost_price) || 0) * (Number(item.quantity) || 0)), 0);

      // Fetch Wallets / Cash
      const walletsRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=balance,type,name${tenantQuery}`, { headers });
      const walletsData = walletsRes.ok ? await walletsRes.json() : [];
      
      let cashValue = 0;
      let walletsValue = 0;
      let instapayValue = 0;
      let bankValue = 0;

      walletsData.forEach((w: any) => {
        const bal = Number(w.balance) || 0;
        const name = (w.name || '').toLowerCase();
        if (w.type === 'cash' || name.includes('خزينة') || name.includes('كاش')) {
          cashValue += bal;
        } else if (name.includes('انستا') || name.includes('instapay')) {
          instapayValue += bal;
        } else if (w.type === 'bank_account' || name.includes('بنك')) {
          bankValue += bal;
        } else {
          walletsValue += bal;
        }
      });

      setCurrentStats({
        devicesValue,
        accessoriesValue,
        sparePartsValue,
        cashValue,
        walletsValue,
        instapayValue,
        bankValue
      });

    } catch (err) {
      console.error("Failed to fetch current stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }
    
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
        
        const payload = {
          tenant_id: tenantId,
          devices_value: Number(formData.devicesValue) || 0,
          accessories_value: Number(formData.accessoriesValue) || 0,
          spare_parts_value: Number(formData.sparePartsValue) || 0,
          cash_value: Number(formData.cashValue) || 0,
          wallets_value: Number(formData.walletsValue) || 0,
          instapay_value: Number(formData.instapayValue) || 0,
          bank_value: Number(formData.bankValue) || 0
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/initial_capital`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('فشل حفظ رأس المال');
        }

        const data = {
          devicesValue: payload.devices_value,
          accessoriesValue: payload.accessories_value,
          sparePartsValue: payload.spare_parts_value,
          cashValue: payload.cash_value,
          walletsValue: payload.wallets_value,
          instapayValue: payload.instapay_value,
          bankValue: payload.bank_value
        };
        
        setInitialCapital(data);
        setIsSaved(true);
        setSuccessMessage("تم حفظ بيانات رأس المال بنجاح!"); setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        console.error("Save error", err);
        setErrorMessage("حدث خطأ أثناء الحفظ. تأكد من أنك قمت بإنشاء الجدول في قاعدة البيانات."); setTimeout(() => setErrorMessage(""), 3000);
      } finally {
        setLoading(false);
      }
  };

  const getTotalCapital = (data: any) => {
    if (!data) return 0;
    return (
      data.devicesValue +
      data.accessoriesValue +
      data.sparePartsValue +
      data.cashValue +
      data.walletsValue +
      data.instapayValue +
      data.bankValue
    );
  };

  const initialTotal = getTotalCapital(initialCapital);
  const currentTotal = getTotalCapital(currentStats);
  const diff = currentTotal - initialTotal;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">المركز المالي (رأس المال)</h1>
          <p className="text-sm text-slate-500 font-medium">متابعة رأس المال الافتتاحي وحساب الأرباح والخسائر الإجمالية</p>
        </div>
      </div>

      {!isSaved ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl mb-6 border border-amber-200 dark:border-amber-500/20">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">تنبيه: يمكنك إدخال هذه البيانات مرة واحدة فقط عند بدء استخدام النظام. لا يمكن تعديلها لاحقاً لضمان دقة حسابات الأرباح والخسائر.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                قيمة الأجهزة الموجودة (بالتكلفة)
              </label>
              <input type="number" name="devicesValue" value={formData.devicesValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-blue-500" />
                قيمة الإكسسوارات (بالتكلفة)
              </label>
              <input type="number" name="accessoriesValue" value={formData.accessoriesValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                قيمة قطع الغيار (بالتكلفة)
              </label>
              <input type="number" name="sparePartsValue" value={formData.sparePartsValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                الكاش الفعلي في الخزينة
              </label>
              <input type="number" name="cashValue" value={formData.cashValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-pink-500" />
                رصيد المحافظ الإلكترونية
              </label>
              <input type="number" name="walletsValue" value={formData.walletsValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                رصيد إنستا باي
              </label>
              <input type="number" name="instapayValue" value={formData.instapayValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                رصيد البنوك
              </label>
              <input type="number" name="bankValue" value={formData.bankValue} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-purple-500 transition-colors" placeholder="0" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
            {successMessage && <div className="text-emerald-500 font-bold ml-4">{successMessage}</div>}
            {errorMessage && <div className="text-rose-500 font-bold ml-4">{errorMessage}</div>}
            
            {showConfirmDialog ? (
              <div className="flex items-center gap-4">
                <span className="text-amber-600 font-bold">هل أنت متأكد؟ لا يمكن التعديل لاحقاً</span>
                <button onClick={() => setShowConfirmDialog(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700"
                >
                  <Save className="w-5 h-5" />
                  تأكيد الحفظ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
              >
                <Save className="w-5 h-5" />
                حفظ رأس المال الافتتاحي
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-slate-500">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="font-bold">رأس المال الافتتاحي</span>
              </div>
              <h2 className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {initialTotal.toLocaleString()} ج.م
              </h2>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
              <div className="flex items-center gap-3 mb-4 text-purple-500">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">المركز المالي الحالي</span>
              </div>
              <h2 className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
                {loading ? '...' : currentTotal.toLocaleString()} ج.م
              </h2>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${diff >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div className={`flex items-center gap-3 mb-4 ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <div className={`w-10 h-10 rounded-xl ${diff >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'} flex items-center justify-center`}>
                  {diff >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">الفرق (الربح / الخسارة)</span>
              </div>
              <h2 className={`text-3xl font-black font-mono ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {loading ? '...' : Math.abs(diff).toLocaleString()} ج.م
                <span className="text-sm mr-2 font-sans">{diff >= 0 ? '(ربح)' : '(خسارة)'}</span>
              </h2>
            </motion.div>
          </div>

          {/* Detailed Breakdown Comparison */}
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500" />
                تفاصيل المركز المالي
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0a0f16] border-b border-slate-200 dark:border-white/10">
                    <th className="py-4 px-6 text-start font-bold text-slate-500">البند</th>
                    <th className="py-4 px-6 text-start font-bold text-slate-500">رأس المال الافتتاحي</th>
                    <th className="py-4 px-6 text-start font-bold text-slate-500">القيمة الحالية</th>
                    <th className="py-4 px-6 text-start font-bold text-slate-500">الفرق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <ComparisonRow icon={<Smartphone className="w-4 h-4 text-purple-500" />} label="الأجهزة (بالتكلفة)" initial={initialCapital.devicesValue} current={currentStats.devicesValue} />
                  <ComparisonRow icon={<Headphones className="w-4 h-4 text-blue-500" />} label="الإكسسوارات (بالتكلفة)" initial={initialCapital.accessoriesValue} current={currentStats.accessoriesValue} />
                  <ComparisonRow icon={<Wrench className="w-4 h-4 text-orange-500" />} label="قطع الغيار (بالتكلفة)" initial={initialCapital.sparePartsValue} current={currentStats.sparePartsValue} />
                  <ComparisonRow icon={<DollarSign className="w-4 h-4 text-emerald-500" />} label="الكاش" initial={initialCapital.cashValue} current={currentStats.cashValue} />
                  <ComparisonRow icon={<Wallet className="w-4 h-4 text-pink-500" />} label="المحافظ الإلكترونية" initial={initialCapital.walletsValue} current={currentStats.walletsValue} />
                  <ComparisonRow icon={<Smartphone className="w-4 h-4 text-indigo-500" />} label="إنستا باي" initial={initialCapital.instapayValue} current={currentStats.instapayValue} />
                  <ComparisonRow icon={<Building2 className="w-4 h-4 text-sky-500" />} label="حسابات بنكية" initial={initialCapital.bankValue} current={currentStats.bankValue} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ComparisonRow = ({ icon, label, initial, current }: { icon: React.ReactNode, label: string, initial: number, current: number }) => {
  const diff = current - initial;
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300">
          {icon}
          {label}
        </div>
      </td>
      <td className="py-4 px-6 font-mono font-bold text-slate-600 dark:text-slate-400">
        {initial.toLocaleString()} ج.م
      </td>
      <td className="py-4 px-6 font-mono font-black text-slate-900 dark:text-white">
        {current.toLocaleString()} ج.م
      </td>
      <td className="py-4 px-6 font-mono font-bold">
        <span className={`px-2.5 py-1 rounded-lg text-xs ${diff > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : diff < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'}`}>
          {diff > 0 ? '+' : ''}{diff.toLocaleString()}
        </span>
      </td>
    </tr>
  );
};
