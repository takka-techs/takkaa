import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Filter, AlertTriangle } from 'lucide-react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function CashFlowForecastReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureFlag().then(enabled => {
       if (enabled) {
         fetchData();
       }
    });
  }, []);

  const checkFeatureFlag = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const cashierStr = localStorage.getItem('active_cashier');
      const cashier = cashierStr ? JSON.parse(cashierStr) : null;
      if (!userId) {
         setIsFeatureEnabled(false);
         return false;
      }
      
      const isAdmin = localStorage.getItem('admin_active') === 'true';
      const role = isAdmin ? 'المدير (Admin)' : (cashier?.role || 'كاشير (Cashier)');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_installment_feature_enabled`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_user_id: userId, p_role: role })
      });
      if (response.ok) {
        const enabled = await response.json();
        setIsFeatureEnabled(enabled);
        return enabled;
      }
      setIsFeatureEnabled(false);
      return false;
    } catch {
      setIsFeatureEnabled(false);
      return false;
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      
      let queryUrl = `${SUPABASE_URL}/rest/v1/installment_payments?select=due_amount,paid_amount,penalty_amount,due_date,status&deleted_at=is.null`;
      if (_tenantId) queryUrl += `&tenant_id=eq.${_tenantId}`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error("انتهت الجلسة (JWT expired)، يرجى تحديث الصفحة أو تسجيل الدخول مجدداً");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.details || errorData.hint || 'فشل جلب البيانات');
      }
      const resData = await response.json();
      
      const now = new Date();
      now.setDate(1);
      now.setHours(0,0,0,0);
      
      let months = [];
      for(let i = 0; i < 6; i++) {
        let m = new Date(now);
        m.setMonth(m.getMonth() + i);
        months.push(m);
      }
      
      const formatted = months.map(m => {
        let monthStart = new Date(m);
        let monthEnd = new Date(m);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        
        let monthPayments = resData.filter((p: any) => {
          let pd = new Date(p.due_date);
          return pd >= monthStart && pd <= monthEnd;
        });
        
        let expectedSum = monthPayments.reduce((acc: number, val: any) => acc + (val.due_amount || 0) + (val.penalty_amount || 0), 0);
        let collectedSum = monthPayments.reduce((acc: number, val: any) => acc + (val.paid_amount || 0), 0);
        let pendingSum = monthPayments.reduce((acc: number, val: any) => acc + Math.max(0, ((val.due_amount || 0) + (val.penalty_amount || 0)) - (val.paid_amount || 0)), 0);
        
        return {
          month: monthStart.toISOString().split('T')[0],
          monthName: monthStart.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric', timeZone: 'Africa/Cairo' }),
          expected_amount: expectedSum,
          collected_amount: collectedSum,
          pending_amount: pendingSum
        };
      });
      
      setData(formatted);
    } catch(err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  if (isFeatureEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold">نظام التقسيط غير مفعّل لك</h2>
        <p className="text-sm mt-2">يرجى التواصل مع مدير النظام لتفعيل الصلاحية.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
       <div className="flex justify-between items-center bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5">
         <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              توقعات التدفقات النقدية (للتقسيط)
            </h1>
            <p className="text-slate-500 mt-2 text-sm">تحليل المبالغ المتوقع تحصيلها مقارنة بما تم تحصيله فعلياً</p>
         </div>
       </div>

       {loading ? (
          <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
       ) : error ? (
          <div className="p-4 bg-red-100 text-red-500 rounded-xl">{error}</div>
       ) : (
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden min-h-[400px]">
             <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} style={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} style={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}ج`} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.1 }} contentStyle={{ borderRadius: 12, backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                <Legend />
                <Bar dataKey="expected_amount" name="المتوقع تحصيله" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected_amount" name="المحصّل فعلياً" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
       )}
       
       {data.length > 0 && (
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
           <h3 className="font-bold text-lg mb-4 dark:text-white">جدول التدفقات</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                 <tr>
                    <th className="p-4">الشهر</th>
                    <th className="p-4">توقعات العوائد</th>
                    <th className="p-4">ماتم تحصيله</th>
                    <th className="p-4">المتأخر والمعلق</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                 {data.map(d => (
                   <tr key={d.month} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-4 font-bold dark:text-white">{d.monthName}</td>
                      <td className="p-4 text-blue-500 font-mono font-bold">{d.expected_amount?.toLocaleString()} ج</td>
                      <td className="p-4 text-emerald-500 font-mono font-bold">{d.collected_amount?.toLocaleString()} ج</td>
                      <td className="p-4 text-orange-500 font-mono">{d.pending_amount?.toLocaleString()} ج</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}
    </div>
  );
}
