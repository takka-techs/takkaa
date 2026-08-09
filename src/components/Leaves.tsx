import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar as CalendarIcon, Clock, Search, Plus, 
  Trash2, X, Save, Loader2, CheckCircle2, AlertCircle, CalendarDays
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Leaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal State
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'سنوية',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    try {
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,full_name,vacation_balance&tenant_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const leavesRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_leaves?select=*,employees(full_name)&tenant_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (empRes.ok) {
        setEmployees(await empRes.json());
      }
      
      if (leavesRes.ok) {
        setLeaves(await leavesRes.json());
      } else {
        setLeaves([]);
      }
    } catch (err) {
        console.error('Error fetching data:', err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute calculated days based on selected dates
  const calculatedDays = useMemo(() => {
      if (!formData.start_date || !formData.end_date) return 0;
      const start = parseISO(formData.start_date);
      const end = parseISO(formData.end_date);
      const diff = differenceInDays(end, start) + 1; // +1 to include both start and end dates
      return diff > 0 ? diff : 0;
  }, [formData.start_date, formData.end_date]);

  // Selected Employee Balance
  const selectedEmployeeInfo = employees.find(e => e.id === formData.employee_id);
  const defaultBalance = 21; // Default yearly balance if not specifically set on employee
  const currentBalance = selectedEmployeeInfo?.vacation_balance ?? defaultBalance;

  const handleSubmit = async () => {
      if (!formData.employee_id || !formData.start_date || !formData.end_date) {
          alert('برجاء إدخال الحقول الإجبارية');
          return;
      }

      if (calculatedDays <= 0) {
          alert('يجب أن يكون تاريخ النهاية بعد تاريخ البداية أو يساويه');
          return;
      }

      const isYearly = formData.leave_type === 'سنوية' || formData.leave_type === 'سنوية (من الرصيد)';
      if (isYearly && calculatedDays > currentBalance) {
          alert(`رصيد الإجازات المتاح (${currentBalance} يوم) لا يكفي لطلب ${calculatedDays} أيام`);
          return;
      }

      setIsSubmitLoading(true);
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');

      const payload = {
          tenant_id: userId,
          employee_id: formData.employee_id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: calculatedDays,
          reason: formData.reason,
          status: 'موافق عليها' // Defaulting to approved based on the design request, can be changed to pending if needed
      };

      try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/employee_leaves`, {
              method: 'POST',
              headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
              },
              body: JSON.stringify(payload)
          });

          if (response.ok) {
              // If it's a yearly leave, we should ideally deduct this from their master balance
              if (isYearly) {
                  const newBalance = currentBalance - calculatedDays;
                  await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${formData.employee_id}&tenant_id=eq.${userId}`, {
                      method: 'PATCH',
                      headers: {
                          'apikey': SUPABASE_KEY,
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ vacation_balance: newBalance })
                  });
              }

              setIsNewLeaveOpen(false);
              setFormData({
                employee_id: '',
                leave_type: 'سنوية',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                reason: ''
              });
              fetchData();
              alert('تم تسجيل الإجازة بنجاح! ✅');
          } else {
              const error = await response.json();
              alert(`تأكد من إنشاء جدول employee_leaves في قاعدة البيانات أولاً. التفاصيل: ${error.message}`);
          }
      } catch (err) {
          alert('فشل الاتصال بخادم قاعدة البيانات!');
      } finally {
          setIsSubmitLoading(false);
      }
  };

  const confirmDelete = async () => {
      if (!leaveToDelete) return;
      setIsDeleting(true);
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');

      try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/employee_leaves?id=eq.${leaveToDelete.id}&tenant_id=eq.${userId}`, {
              method: 'DELETE',
              headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${token}`
              }
          });

          if (res.ok) {
              // Refund balance if it was a yearly leave
              const isYearly = leaveToDelete.leave_type === 'سنوية' || leaveToDelete.leave_type === 'سنوية (من الرصيد)';
              if (isYearly) {
                  const emp = employees.find(e => e.id === leaveToDelete.employee_id);
                  if (emp) {
                      const currentBal = emp.vacation_balance ?? defaultBalance;
                      await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${leaveToDelete.employee_id}&tenant_id=eq.${userId}`, {
                          method: 'PATCH',
                          headers: {
                              'apikey': SUPABASE_KEY,
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ vacation_balance: currentBal + leaveToDelete.days_count })
                      });
                  }
              }
              fetchData();
          }
      } catch (error) {
          console.error('حدث خطأ أثناء الحذف');
      } finally {
          setIsDeleting(false);
          setLeaveToDelete(null);
      }
  };

  const filteredLeaves = leaves.filter(leave => {
      const matchSearch = leave.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'الكل' || leave.leave_type === typeFilter;
      const matchStatus = statusFilter === 'الكل' || leave.status === statusFilter;
      return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toolbox & Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <CalendarDays className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">طلبات الإجازات 🏖️</h2>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 md:justify-end">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="بحث باسم الموظف..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Type Filter */}
              <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                  <option className="bg-white dark:bg-slate-800" value="الكل">كل الأنواع</option>
                  <option className="bg-white dark:bg-slate-800" value="سنوية">سنوية</option>
                  <option className="bg-white dark:bg-slate-800" value="سنوية (من الرصيد)">سنوية (من الرصيد)</option>
                  <option className="bg-white dark:bg-slate-800" value="مرضية">مرضية</option>
                  <option className="bg-white dark:bg-slate-800" value="طارئة">طارئة</option>
                  <option className="bg-white dark:bg-slate-800" value="بدون راتب">بدون راتب</option>
              </select>

              {/* Status Filter */}
              <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                  <option className="bg-white dark:bg-slate-800" value="الكل">كل الحالات</option>
                  <option className="bg-white dark:bg-slate-800" value="موافق عليها">موافق عليها</option>
                  <option className="bg-white dark:bg-slate-800" value="معلق">معلق</option>
                  <option className="bg-white dark:bg-slate-800" value="مرفوض">مرفوض</option>
              </select>

              <button 
                 onClick={() => setIsNewLeaveOpen(true)}
                 className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
              >
                  <Plus className="w-5 h-5" /> طلب إجازة جديدة
              </button>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-sm">
                      <tr>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">#</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">الموظف</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">نوع الإجازة</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">من تاريخ</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">إلى تاريخ</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">عدد الأيام</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5">السبب</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5 border-l">الحالة</th>
                          <th className="px-6 py-4 font-medium border-b border-slate-200 dark:border-white/5 text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {isLoading ? (
                          <tr>
                             <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                                 <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                                 جاري تحميل البيانات...
                             </td>
                          </tr>
                      ) : filteredLeaves.length === 0 ? (
                          <tr>
                             <td colSpan={9} className="px-6 py-12 text-center text-slate-500 bg-white dark:bg-[#161b22]">
                                 <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                 لا توجد طلبات إجازات مسجلة
                             </td>
                          </tr>
                      ) : (
                          filteredLeaves.map((leave, index) => {
                              const isApproved = leave.status === 'موافق عليها';
                              const isUnpaid = leave.leave_type === 'بدون راتب';
                              return (
                                  <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-slate-900 dark:text-white text-sm bg-white dark:bg-[#161b22]">
                                      <td className="px-6 py-4 font-mono text-slate-500">{index + 1}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{leave.employees?.full_name || 'غير معروف'}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isUnpaid ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                              {leave.leave_type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-mono">
                                          {new Date(leave.start_date).toLocaleDateString('ar-EG')}
                                      </td>
                                      <td className="px-6 py-4 font-mono">
                                          {new Date(leave.end_date).toLocaleDateString('ar-EG')}
                                      </td>
                                      <td className="px-6 py-4 font-bold text-emerald-500 dark:text-emerald-400 text-center font-mono text-base">
                                          {leave.days_count} <span className="text-xs font-normal text-slate-500">يوم</span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={leave.reason}>
                                          {leave.reason || '-'}
                                      </td>
                                      <td className="px-6 py-4 border-l border-slate-200 dark:border-white/5">
                                          <span className={`flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                              isApproved 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                                : leave.status === 'مرفوض'
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                    : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                                          }`}>
                                              {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                                              {leave.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <button 
                                             onClick={() => setLeaveToDelete(leave)}
                                             className="p-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 dark:text-rose-400 rounded-lg transition-all"
                                             title="حذف الإجازة واسترداد الرصيد"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Leave Modal */}
      <AnimatePresence>
          {isNewLeaveOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-slate-900/40 dark:bg-[#0f172a]/90 backdrop-blur-sm"
                     onClick={() => !isSubmitLoading && setIsNewLeaveOpen(false)}
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                  >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50">
                          <div className="flex items-center gap-3">
                              <span className="text-2xl">🏖️</span>
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white">طلب إجازة جديدة</h2>
                          </div>
                          <button onClick={() => !isSubmitLoading && setIsNewLeaveOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                              <X className="w-5 h-5" />
                          </button>
                      </div>

                      {/* Body */}
                      <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الموظف <span className="text-rose-500">*</span></label>
                                    <select 
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                                    >
                                        <option className="bg-white dark:bg-[#1a2035]" value="">-- اختر الموظف --</option>
                                        {employees.map(emp => (
                                            <option className="bg-white dark:bg-[#1a2035]" key={emp.id} value={emp.id}>{emp.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 flex flex-col items-end w-full">
                                   <label className="text-xs text-slate-500">رصيد الإجازات المتاح</label>
                                   <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 w-full text-center">
                                       {selectedEmployeeInfo ? currentBalance : '--'}
                                   </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">نوع الإجازة <span className="text-rose-500">*</span></label>
                                <select 
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                                >
                                    <option className="bg-white dark:bg-[#1a2035]" value="سنوية">سنوية</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="سنوية (من الرصيد)">سنوية (من الرصيد)</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="مرضية">مرضية</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="طارئة">طارئة</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="بدون راتب">بدون راتب</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">من تاريخ <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 pb-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-center [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">إلى تاريخ <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 pb-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-center [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 z-10">عدد الأيام</label>
                                <span className="text-4xl font-bold font-mono text-slate-900 dark:text-white z-10 shadow-sm">{calculatedDays}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-400">السبب/ملاحظات</label>
                                <textarea 
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    className="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-700 pb-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors resize-none h-16"
                                    placeholder="اكتب سبب طلب الإجازة..."
                                />
                            </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-4">
                          <button 
                              onClick={handleSubmit}
                              disabled={isSubmitLoading}
                              className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:bg-blue-600/50 text-white flex-1 py-4 rounded-xl font-bold transition-all shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                          >
                              {isSubmitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>تقديم الطلب 💾</span>}
                          </button>
                          <button 
                             onClick={() => setIsNewLeaveOpen(false)}
                             disabled={isSubmitLoading}
                             className="px-8 py-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
                          >
                              إلغاء
                          </button>
                      </div>

                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {leaveToDelete && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-slate-900/40 dark:bg-[#0f172a]/90 backdrop-blur-sm"
                     onClick={() => !isDeleting && setLeaveToDelete(null)}
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-rose-200 dark:border-rose-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                  >
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">تأكيد الحذف</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                هل أنت متأكد من حذف إجازة الموظف 
                                <span className="text-rose-500 dark:text-rose-400 font-bold mx-1">{leaveToDelete.employees?.full_name}</span>؟
                                <br/>
                                { (leaveToDelete.leave_type === 'سنوية' || leaveToDelete.leave_type === 'سنوية (من الرصيد)') && 
                                  "سيتم استرجاع رصيد أيام الإجازة للموظف تلقائياً."
                                }
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a] flex gap-3">
                            <button 
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نعم، احذف'}
                            </button>
                            <button 
                                onClick={() => setLeaveToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white py-3 rounded-xl font-bold transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
