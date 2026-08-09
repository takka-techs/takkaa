import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Search, Filter, ShieldAlert } from 'lucide-react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function InstallmentAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean | null>(null);
  
  useEffect(() => {
    checkFeatureFlag().then(enabled => {
       if (enabled) {
         fetchLogs();
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

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`
      };

      const activeCashierStr = localStorage.getItem("active_cashier");
      const activeCashier = activeCashierStr ? JSON.parse(activeCashierStr) : null;
      const isAdminActive = localStorage.getItem("admin_active") === "true";

      let tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      if (!isAdminActive && activeCashier) {
        tenantId = activeCashier.user_id || activeCashier.tenant_id || tenantId;
      }

      const query = tenantId ? `?tenant_id=eq.${tenantId}&order=created_at.desc&limit=50` : `?order=created_at.desc&limit=50`;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/installment_audit_logs${query}`, {
        headers
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error("انتهت الجلسة (JWT expired)، يرجى تحديث الصفحة أو تسجيل الدخول مجدداً");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.details || errorData.hint || 'فشل جلب السجلات');
      }
      setLogs(await response.json());

      const empsRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,full_name`, { headers });
      const empsMap: Record<string, string> = {};
      if (empsRes.ok) {
          const emps = await empsRes.json();
          emps.forEach((emp: any) => { empsMap[emp.id] = emp.full_name; });
      }
      
      const appUsersRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=id,name`, { headers });
      if (appUsersRes.ok) {
          const appUsers = await appUsersRes.json();
          appUsers.forEach((user: any) => { empsMap[user.id] = user.name + ' (مدير نظام / كاشير)'; });
      }
      
      setEmployeesMap(empsMap);
    } catch(err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
       case 'payment_received': return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">تسديد كامل</span>;
       case 'partial_payment': return <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">تسديد جزئي</span>;
       case 'reschedule': return <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded">إعادة جدولة</span>;
       case 'soft_delete':
       case 'soft_delete_contract': return <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded">حذف (إلغاء)</span>;
       case 'penalty_waived': return <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded">إعفاء من الغرامة</span>;
       case 'create_contract': return <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded">إنشاء عقد</span>;
       case 'update_contract': return <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded">تحديث عقد</span>;
       case 'payment_cascade': return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-1 rounded">سداد تلقائي (ترحيل)</span>;
       case 'bulk_payment': return <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded">سداد مجمع</span>;
       case 'waived': return <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded">إعفاء</span>;
       default: return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">{action}</span>;
    }
  };

  const getTranslatedKey = (key: string) => {
    const translations: Record<string, string> = {
      status: 'الحالة',
      deleted_at: 'تاريخ الإلغاء',
      due_date: 'تاريخ الاستحقاق',
      due_amount: 'المبلغ المستحق',
      paid_amount: 'المبلغ المدفوع',
      penalty_amount: 'قيمة الغرامة',
      penalty_waived: 'معفى من الغرامة',
      waived_reason: 'سبب الإعفاء',
      installment_no: 'رقم القسط',
      start_date: 'تاريخ البدء',
      installment_count: 'عدد الأقساط',
      amount: 'المبلغ',
      amount_applied: 'المبلغ المطبق',
      remaining_amount: 'المبلغ المتبقي',
      total_amount: 'إجمالي المبلغ',
      notes: 'ملاحظات',
      overpayment_used: 'تغطية من السداد الزائد',
      new_status: 'الحالة الجديدة',
      wallet_id: 'رقم الخزينة'
    };
    return translations[key] || key;
  };

  const getTranslatedValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'فارغ';
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (key === 'status') {
       const statusTrans: Record<string, string> = {
         'pending': 'قيد الانتظار',
         'paid': 'مدفوع',
         'partial': 'مدفوع جزئياً',
         'overdue': 'متأخر',
         'defaulted': 'متعثر',
         'completed': 'مكتمل',
         'deleted': 'ملغى'
       };
       return statusTrans[value] || value;
    }
    if (key === 'deleted_at' || key === 'due_date' || key === 'start_date') {
       try {
           return new Date(value).toLocaleString('ar-EG');
       } catch (e) {
           return String(value);
       }
    }
    return String(value);
  };


  if (isFeatureEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
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
              <ShieldAlert className="w-8 h-8 text-primary-500" />
              سجل حركات التقسيط (Audit Logs)
            </h1>
            <p className="text-slate-500 mt-2 text-sm">تتبع جميع التعديلات والحركات المرتبطة بنظام التقسيط وإعادة الجدولة لضمان النزاهة والمراجعة</p>
         </div>
       </div>

       {loading ? (
          <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
       ) : error ? (
          <div className="p-4 bg-red-100 text-red-500 rounded-xl">{error}</div>
       ) : (
         <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-0 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                 <tr>
                    <th className="p-4">تاريخ ووقت الحركة</th>
                    <th className="p-4">الموظف المسؤول</th>
                    <th className="p-4">رقم العقد</th>
                    <th className="p-4">نوع الإجراء</th>
                    <th className="p-4">البيانات الأساسية</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                 {logs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                         {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-4 font-bold text-primary-600 dark:text-primary-400">
                        {log.performed_by_email || log.employee_name || log.employees?.full_name || employeesMap[log.performed_by] || (log.notes?.match(/\(بواسطة:\s*(.*?)\)/)?.[1]) || 'المالك'}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{log.contract_id?.substring(0,8)}</td>
                      <td className="p-4">{getActionLabel(log.action)}</td>
                      <td className="p-4 text-xs">
                         {log.notes ? <div className="text-orange-500 italic mb-2 font-medium">{log.notes.startsWith('سبب الإلغاء') ? log.notes : `السبب: ${log.notes}`}</div> : null}
                         {log.new_value && log.new_value !== 'null' && typeof log.new_value === 'object' && Object.keys(log.new_value).length > 0 ? (
                           <div className="bg-slate-50 dark:bg-[#1a2333] p-3 rounded-lg border border-slate-200 dark:border-white/5 flex flex-col gap-1">
                             {Object.entries(log.new_value).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">{getTranslatedKey(key)}:</span>
                                    <span className="text-slate-900 dark:text-white" dir="ltr">{getTranslatedValue(key, value)}</span>
                                </div>
                             ))}
                           </div>
                         ) : log.new_value && log.new_value !== 'null' ? (
                           <div className="bg-slate-50 dark:bg-[#1a2333] p-3 rounded-lg border border-slate-200 dark:border-white/5 flex flex-col gap-1">
                               <span className="text-slate-900 dark:text-white">{String(log.new_value)}</span>
                           </div>
                         ) : null}
                      </td>
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
