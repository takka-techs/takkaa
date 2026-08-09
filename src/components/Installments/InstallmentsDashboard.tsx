import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp,
  Search, Plus, Filter, MoreVertical, DollarSign, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function InstallmentsDashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [summary, setSummary] = useState<any>(null);
  const [duePayments, setDuePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureFlag().then(enabled => {
       if (enabled) {
         fetchSummary();
         fetchDuePayments();
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

  const fetchDuePayments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      
      let queryUrl = `${SUPABASE_URL}/rest/v1/installment_payments?select=*,installment_contracts(*)&status=in.(pending,partial,overdue)&deleted_at=is.null&order=due_date.asc&limit=50`;
      if (_tenantId) queryUrl += `&tenant_id=eq.${_tenantId}`;

      // Fetch pending or partial payments ordered by due date
      const response = await fetch(queryUrl, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('فشل جلب قائمة الأقساط');
      const data = await response.json();
      
      let clientUrl = `${SUPABASE_URL}/rest/v1/clients?select=id,name,phone`;
      if (_tenantId) clientUrl += `&tenant_id=eq.${_tenantId}`;
      const clientsRes = await fetch(clientUrl, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      let clientsData: any[] = [];
      if (clientsRes.ok) clientsData = await clientsRes.json();
      
      const mergedData = data.map((payment: any) => ({
         ...payment,
         client: clientsData.find(c => c.id === payment.installment_contracts?.client_id) || null
      }));
      setDuePayments(mergedData || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      
      let queryUrl = `${SUPABASE_URL}/rest/v1/installment_payments?select=*&status=in.(pending,overdue)&deleted_at=is.null`;
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
        throw new Error(errorData.message || errorData.details || errorData.hint || 'فشل جلب الإحصائيات');
      }
      const data = await response.json();
      
      const now = new Date();
      now.setHours(0,0,0,0);
      
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);
      
      let overdue_count = 0, overdue_amount = 0;
      let today_count = 0, today_amount = 0;
      let week_count = 0, week_amount = 0;
      let month_expected = 0;

      data.forEach((ip: any) => {
        const dueDate = new Date(ip.due_date);
        dueDate.setHours(0,0,0,0);
        
        if (ip.status === 'overdue' || (ip.status === 'pending' && dueDate < now)) {
          overdue_count++;
          overdue_amount += (ip.due_amount || 0);
        }
        
        if (ip.status === 'pending' && dueDate.getTime() === now.getTime()) {
          today_count++;
          today_amount += (ip.due_amount || 0);
        }
        
        if (ip.status === 'pending' && dueDate <= in7Days && dueDate >= now) {
          week_count++;
          week_amount += (ip.due_amount || 0);
        }
        
        if (ip.status === 'pending' && dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {
          month_expected += (ip.due_amount || 0);
        }
      });
      
      setSummary({
        overdue_count, overdue_amount,
        today_count, today_amount,
        week_count, week_amount,
        month_expected
      });
    } catch (err: any) {
      console.error(err);
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

  if (loading || isFeatureEnabled === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-red-500/20 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">أقساط متأخرة</p>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{summary?.overdue_count || 0} <span className="text-sm font-bold text-slate-400">قسط</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">إجمالي المتأخرات</span>
            <span className="font-bold text-red-600 dark:text-red-400">{summary?.overdue_amount?.toLocaleString()} ج.م</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-orange-500/20 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">استحقاق اليوم</p>
              <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{summary?.today_count || 0} <span className="text-sm font-bold text-slate-400">قسط</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">المطلوب تحصيله اليوم</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{summary?.today_amount?.toLocaleString()} ج.م</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-blue-500/20 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">استحقاق هذا الأسبوع</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{summary?.week_count || 0} <span className="text-sm font-bold text-slate-400">قسط</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">المتوقع تحصيله</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{summary?.week_amount?.toLocaleString()} ج.م</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي الشهر الجاري</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary?.month_expected?.toLocaleString()} <span className="text-sm font-bold text-slate-400">ج.م</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">المجموع الكلي للشهر المتوقع</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <button 
          onClick={() => onNavigate && onNavigate('installment_contracts')}
          className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/25 transition-all"
        >
          <FileText className="w-5 h-5" />
          إدارة العقود
        </button>
        <button onClick={() => onNavigate && onNavigate('installment_contracts')} className="bg-white dark:bg-[#11151c] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          تحصيل قسط
        </button>
      </div>

      {/* Tables or lists can go here (e.g. Due Today) */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              أقساط مستحقة قريباً (أو متأخرة)
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="بحث..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-2 ps-9 pe-4 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                dir="rtl"
              />
            </div>
        </div>
        
        {duePayments.length > 0 ? (
          <div className="overflow-x-auto text-sm text-right">
             <table className="w-full">
               <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                 <tr>
                   <th className="p-4">رقم العقد/القسط</th>
                   <th className="p-4">العميل</th>
                   <th className="p-4">تاريخ الاستحقاق</th>
                   <th className="p-4">المبلغ المتبقي</th>
                   <th className="p-4">الحالة</th>
                   <th className="p-4 text-center">إجراء</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                 {duePayments
                   .filter(p => !searchTerm || p.client?.name?.includes(searchTerm) || p.client?.phone?.includes(searchTerm) || p.contract_id?.includes(searchTerm))
                   .map(payment => {
                     const remaining = Number(payment.due_amount) - Number(payment.paid_amount || 0) + Number(payment.penalty_amount || 0);
                     const clientRisk = payment.client?.risk_score ?? 100;
                     let riskColor = "bg-green-100 text-green-700";
                     let riskText = "عميل ممتاز";
                     if (clientRisk < 50) {
                         riskColor = "bg-red-100 text-red-700";
                         riskText = "عميل متعثر";
                     } else if (clientRisk < 80) {
                         riskColor = "bg-yellow-100 text-yellow-700";
                         riskText = "عميل متوسط";
                     }
                     return (
                       <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                         <td className="p-4">
                           <div className="font-mono text-xs mb-1 text-slate-500">{payment.contract_id?.substring(0,8)}</div>
                           <span className="font-bold">قسط #{payment.installment_no}</span>
                         </td>
                         <td className="p-4 font-bold dark:text-white">
                           {payment.client?.name || 'مجهول'}
                           <span className={`mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${riskColor}`}>
                               {riskText} ({clientRisk})
                           </span>
                           <div className="text-xs text-slate-500">{payment.client?.phone}</div>
                         </td>
                         <td className="p-4 text-slate-500 font-mono text-xs">
                           {new Date(payment.due_date).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
                         </td>
                         <td className="p-4 font-bold text-orange-500 font-mono">
                           {remaining > 0 ? `${remaining} ج.م` : 'مكتمل'}
                         </td>
                         <td className="p-4">
                           {payment.status === 'overdue' ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">متأخر</span> :
                            payment.status === 'partial' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">مدفوع جزئياً</span> : 
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">مستحق</span>}
                         </td>
                         <td className="p-4 text-center">
                           <button 
                             onClick={() => onNavigate && onNavigate('installment_contracts')}
                             className="bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                           >
                             التفاصيل والتحصيل
                           </button>
                         </td>
                       </tr>
                     );
                   })}
               </tbody>
             </table>
          </div>
        ) : (
          <div className="p-10 text-center flex flex-col items-center justify-center text-slate-500">
             <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
             <p className="font-medium">لا توجد أقساط مستحقة قريباً</p>
          </div>
        )}
      </div>

    </div>
  );
}
