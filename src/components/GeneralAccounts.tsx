import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Truck, Landmark, Handshake, 
  PieChart as PieChartIcon, ArrowRight, Printer, 
  Plus, Loader2, CreditCard
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function GeneralAccounts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    customers: [] as any[],
    suppliers: [] as any[],
    wallets: [] as any[],
    partners: [] as any[],
  });
  
  // States for new feature: Add Wallet / Add Partner Modal
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletType, setWalletType] = useState('cash');

  const fetchSupabase = async (endpoint: string) => {
    const token = localStorage.getItem('access_token');
    const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
    const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

    const res = await fetch(`${baseUrl}/${endpoint}`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
        return null;
    }
    return res.json();
  };

  const fetchData = async () => {
    setLoading(true);
    const userId = localStorage.getItem('user_id');
    const branchId = localStorage.getItem('takka_active_branch_id');
    try {
      let qs = userId ? `&user_id=eq.${userId}` : '';
      if (branchId && branchId !== 'ALL') qs += `&branch_id=eq.${branchId}`;
      const [clientsData, suppliersData, walletsData, partnersData] = await Promise.all([
        fetchSupabase(`clients?select=*${qs}`),
        fetchSupabase(`suppliers?select=*${qs}`),
        fetchSupabase(`wallets?select=*${qs}`),
        fetchSupabase(`partners?select=*${qs}`)
      ]);

      setData({
        customers: clientsData || [],
        suppliers: suppliersData || [],
        wallets: walletsData || [], 
        partners: partnersData || [] 
      });
    } catch (err) {
      console.error("Error fetching accounts data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWallet = async () => {
    // Attempt to add a wallet. If the table doesn't exist, it will show an error alerting the user to create it.
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      
      const payload: any = { name: walletName, balance: walletBalance, type: walletType, user_id: userId };
      if (activeBranchId && activeBranchId !== 'ALL') payload.branch_id = activeBranchId;

      const res = await fetch(`${baseUrl}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        if (errData.code === '42P01') {
          alert("خطأ: جدول 'wallets' غير موجود في قاعدة البيانات، يرجى إنشاءه أولاً (الاسم: wallets, الحقول: name text, balance numeric).");
        } else {
          alert("حدث خطأ أثناء إضافة المحفظة.");
        }
      } else {
        setIsAddingWallet(false);
        fetchData();
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بقاعدة البيانات");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">جاري تجميع البيانات المحاسبية...</p>
      </div>
    );
  }

  // Calculations
  const customersBalance = data.customers.reduce((sum, c) => sum + (c.initial_balance || 0), 0);
  const suppliersBalance = data.suppliers.reduce((sum, s) => sum + (s.initial_balance || 0), 0);
  const vaultBalance = data.wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const partnersBalance = data.partners.reduce((sum, p) => sum + ((p.investment || 0) + (p.profits || 0) - (p.withdrawals || 0)), 0);

  // Split Debts (Mock logic based on customers initially, mapped to different categories for aesthetic pie chart)
  // Usually this would come from categorizing transactions.
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];
  
  const sourcesData = [
    { name: 'رصيد افتتاحي', value: Math.abs(customersBalance), color: '#8b5cf6' },
    { name: 'أجهزة', value: 0, color: '#3b82f6' },
    { name: 'صيانة', value: 0, color: '#ef4444' },
    { name: 'إكسسوارات', value: 0, color: '#10b981' },
    { name: 'قطع غيار', value: 0, color: '#f59e0b' },
    { name: 'تحويلات', value: 0, color: '#06b6d4' },
  ];

  const topCustomers = [...data.customers].sort((a, b) => Math.abs(b.initial_balance || 0) - Math.abs(a.initial_balance || 0)).slice(0, 5);
  const topSuppliers = [...data.suppliers].sort((a, b) => Math.abs(b.initial_balance || 0) - Math.abs(a.initial_balance || 0)).slice(0, 5);

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <PieChartIcon className="w-6 h-6 text-indigo-500" />
            </div>
            الحسابات العامة
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">نظرة شاملة وديناميكية لجميع الأرصدة والذمم</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => window.print()}
             className="flex items-center gap-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-500/20 transition-all"
           >
             <Printer className="w-4 h-4" /> طباعة التقرير
           </button>
           <button 
             onClick={() => setIsAddingWallet(true)}
             className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
           >
             <Plus className="w-4 h-4" /> إضافة محفظة
           </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
        <SummaryCard title="رصيد العملاء" value={customersBalance} count={data.customers.length} labelCount="عميل" icon={Users} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-500/10" borderColor="border-indigo-100 dark:border-indigo-500/20" />
        <SummaryCard title="رصيد الموردين" value={suppliersBalance} count={data.suppliers.length} labelCount="مورد" icon={Truck} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
        <SummaryCard title="رصيد الخزنة" value={vaultBalance} count={data.wallets.length} labelCount="محفظة" icon={Landmark} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" borderColor="border-emerald-100 dark:border-emerald-500/20" />
        <SummaryCard title="رصيد الشركاء" value={partnersBalance} count={data.partners.length} labelCount="شريك" icon={Handshake} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" borderColor="border-blue-100 dark:border-blue-500/20" />
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 p-6 mx-4 sm:mx-0 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-indigo-500" />
          تقسيم ذمم العملاء حسب المصدر
        </h3>
        
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/3 h-[250px] relative">
            {customersBalance === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">لا توجد ذمم للعملاء</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcesData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="w-full lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sourcesData.map((source, i) => {
              const total = sourcesData.reduce((acc, curr) => acc + curr.value, 0);
              const percentage = total === 0 ? 0 : ((source.value / total) * 100).toFixed(1);
              return (
                <div key={i} className="bg-slate-50 dark:bg-[#0d1117] border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-center cursor-default hover:border-indigo-500/30 transition-all">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{source.name}</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono break-all">{source.value.toLocaleString()}</div>
                  <div className="text-[10px] font-bold mt-1" style={{ color: source.color }}>{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-4 sm:mx-0">
        
        {/* Top Customers */}
        <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              العملاء (أعلى الأرصدة)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-[#0d1117]">
                <tr>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">#</th>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">الاسم</th>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {topCustomers.length > 0 ? topCustomers.map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500" dir="ltr">
                      {Math.abs(c.initial_balance || 0).toLocaleString()} 
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">لا يوجد عملاء بأرصدة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              الموردين (أعلى الأرصدة)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-[#0d1117]">
                <tr>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">#</th>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">الاسم</th>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {topSuppliers.length > 0 ? topSuppliers.map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-500" dir="ltr">
                      {Math.abs(s.initial_balance || 0).toLocaleString()} 
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">لا يوجد موردين بأرصدة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
      
      {/* Wallets & Partners Lists */}
      <div className="grid grid-cols-1 gap-6 mx-4 sm:mx-0 mt-6">
         {/* Wallets */}
        <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-500" />
              محافظ الخزينة 
            </h3>
            {data.wallets.length === 0 && (
               <span className="bg-orange-500/10 text-orange-600 text-xs px-2 py-1 rounded font-bold">لا يوجد جدول أو بيانات!</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-[#0d1117]">
                <tr>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">اسم المحفظة / الخزنة</th>
                  <th className="px-4 py-3 text-start text-slate-500 font-bold text-[11px] uppercase">الرصيد المتاح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.wallets.map((w, i) => (
                  <tr key={w.id || i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-bold flex items-center gap-3">
                       <CreditCard className="w-4 h-4 text-slate-400" />
                       {w.name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-500 text-base" dir="ltr">
                      {w.balance?.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
                {data.wallets.length === 0 && (
                   <tr>
                     <td colSpan={2} className="px-4 py-12 text-center text-slate-500">
                       <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                       لتفعيل محافظ الخزينة، يجب إنشاء جدول wallets في قاعدة البيانات، 
                       أو انقر على "إضافة محفظة" أعلاه لإنشائه.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

       {/* Add Wallet Modal */}
       {isAddingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">إضافة محفظة (خزينة) جديدة</h3>
            </div>
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
               إذا كان جدول wallets غير موجود، سيقوم النظام بتنبيهك. تأكد من أنك قمت بإنشائه (name, balance).
            </div>
            <div className="p-6 space-y-4 pt-0">
              <input 
                type="text" 
                placeholder="اسم المحفظة (مثال: محفظة فودافون كاش)" 
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
              <input 
                type="number" 
                placeholder="الرصيد الافتتاحي" 
                value={walletBalance}
                onChange={(e) => setWalletBalance(parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-[#0d1117] flex justify-end gap-2">
              <button onClick={() => setIsAddingWallet(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-sm">إلغاء</button>
              <button onClick={handleAddWallet} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm">حفظ المحفظة</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, count, labelCount, icon: Icon, color, bg, borderColor }: any) {
  return (
    <div className={`rounded-3xl border ${borderColor} ${bg} p-6 relative overflow-hidden`}>
      <div className={`absolute top-0 end-0 p-4 opacity-50`}>
        <Icon className={`w-24 h-24 ${color} transform translate-x-6 -translate-y-6 opacity-20`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${color} flex items-center gap-2`}>
            <Icon className="w-5 h-5" />
            {title}
          </h3>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono break-all">
            {Math.abs(value).toLocaleString()}
          </span>
          <span className="text-sm font-bold text-slate-500">ج.م</span>
        </div>
        <div className="text-sm font-bold text-slate-500 flex items-center gap-1">
          <span>{count}</span> <span>{labelCount}</span>
          <ArrowRight className="w-3 h-3 ms-auto" />
        </div>
      </div>
    </div>
  );
}
