import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Briefcase, Calendar, Phone, Mail, MapPin, 
  Landmark, Wallet, Target, Info, CheckCircle2,
  Clock, ShieldAlert, Award
} from 'lucide-react';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function EmployeeProfileModal({ isOpen, onClose, employee }: EmployeeProfileModalProps) {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [takenLeaves, setTakenLeaves] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !employee) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };

      try {
        // Fetch last 3 salaries
        const salRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_salaries?employee_id=eq.${employee.id}&order=year.desc,month.desc&limit=3`, { headers });
        // Fetch active loans
        const loanRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_loans?employee_id=eq.${employee.id}&status=in.(جاري%20السداد,موافق%20عليها)&order=created_at.desc`, { headers });
        // Fetch annual taken leaves
        const leavesRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_leaves?select=days_count,leave_type&employee_id=eq.${employee.id}&status=eq.موافق%20عليها`, { headers });

        if (salRes.ok) setSalaries(await salRes.json());
        if (loanRes.ok) setLoans(await loanRes.json());
        
        if (leavesRes.ok) {
           const leavesData = await leavesRes.json();
           const sum = leavesData
             .filter((curr: any) => curr.leave_type === 'سنوية' || curr.leave_type === 'سنوية (من الرصيد)')
             .reduce((acc: number, curr: any) => acc + (curr.days_count || 0), 0);
           setTakenLeaves(sum);
        }
      } catch (err) {
        console.error('Failed to fetch employee details', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/5 shrink-0 relative overflow-hidden">
             {/* Decorative blob */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

             <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <Briefcase className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">بطاقة الموظف</h2>
             </div>
             
             <button 
               onClick={onClose}
               className="relative z-10 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors bg-slate-100 dark:bg-white/5"
             >
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex flex-col md:flex-row h-full overflow-hidden flex-1">
            {/* Right Panel (Profile Card) */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-[#161b22] border-l border-slate-200 dark:border-white/5 p-6 flex flex-col items-center flex-shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

                {/* Avatar */}
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold font-serif mb-4 shadow-xl border-4 border-white dark:border-[#161b22] relative z-10">
                    {employee.full_name?.charAt(0) || '👤'}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-1 relative z-10">{employee.full_name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 relative z-10">{employee.job_title}</p>
                
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold relative z-10 mb-8 border ${
                    employee.status === 'نشط' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                    : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 border-red-200 dark:border-red-500/20'
                }`}>
                    {employee.status}
                </span>

                <div className="w-full space-y-4 relative z-10 mt-auto">
                    {/* Basic Info Rows */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4" /> الهاتف</span>
                        <span className="text-slate-700 dark:text-slate-200 font-mono" dir="ltr">{employee.national_id || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4" /> إيميل</span>
                        <span className="text-slate-700 dark:text-slate-200 truncate pr-4 max-w-[150px]" title={employee.email}>{employee.email || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> قسم</span>
                        <span className="text-slate-700 dark:text-slate-200">{employee.department || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> التعيين</span>
                        <span className="text-slate-700 dark:text-slate-200 font-mono">{employee.hire_date || '-'}</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="w-full mt-6 relative z-10 flex flex-col gap-3">
                    <div className="bg-white dark:bg-[#1c222d] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm dark:shadow-none">
                         <div className="text-right flex-1">
                             <p className="text-xs text-slate-500 mb-1">الراتب الأساسي</p>
                             <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{employee.monthly_salary} <span className="text-sm font-normal text-slate-400">ج.م</span></h4>
                         </div>
                         <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shrink-0">
                             <Landmark className="w-6 h-6" />
                         </div>
                    </div>

                    <div className="bg-white dark:bg-[#1c222d] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none">
                         <div className="flex items-center justify-between mb-4">
                             <p className="text-sm font-bold text-slate-600 dark:text-slate-300">الإجازات <span className="text-xs font-normal text-slate-400 pr-1">(السنوية)</span></p>
                             <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-white/10">الإجمالي: {employee.vacation_balance + takenLeaves}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-2.5 text-center border border-emerald-100 dark:border-emerald-500/20">
                                 <h5 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{employee.vacation_balance}</h5>
                                 <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold mt-1">متبقي</p>
                             </div>
                             <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-2.5 text-center border border-amber-100 dark:border-amber-500/20">
                                 <h5 className="text-xl font-bold text-amber-600 dark:text-amber-500">{takenLeaves}</h5>
                                 <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 font-bold mt-1">مستنفذ</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Left Panel (Content) */}
            <div className="flex-1 bg-white dark:bg-[#11151c] p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {isLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 flex items-center justify-center">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">نسبة العمولة</p>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-200">{employee.commission_percent || 0}%</h4>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">إجمالي البدلات</p>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-200">{employee.fixed_allowances || 0} ج.م</h4>
                                </div>
                            </div>
                        </div>

                        {/* Recent Salaries */}
                        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.02]">
                                <Landmark className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                <h3 className="font-bold text-slate-900 dark:text-slate-200">آخر الرواتب المصروفة</h3>
                            </div>
                            {salaries.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">لا يوجد سجل لرواتب مصروفة مؤخراً.</div>
                            ) : (
                                <table className="w-full text-sm text-center">
                                    <thead className="bg-slate-100 dark:bg-[#0f1218] text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="py-3 px-4 font-medium">الشهر</th>
                                            <th className="py-3 px-4 font-medium">الأساسي</th>
                                            <th className="py-3 px-4 font-medium">إضافات</th>
                                            <th className="py-3 px-4 font-medium">خصومات</th>
                                            <th className="py-3 px-4 font-medium border-r border-slate-200 dark:border-white/5">الصافي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                                        {salaries.map((sal, idx) => (
                                            <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]">
                                                <td className="py-3 px-4 font-mono">{sal.month}/{sal.year}</td>
                                                <td className="py-3 px-4 font-mono">{sal.basic_salary}</td>
                                                <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">+{sal.total_bonuses}</td>
                                                <td className="py-3 px-4 font-mono text-red-600 dark:text-red-400">-{sal.total_deductions}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/5">{sal.net_salary}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Active Loans */}
                        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.02]">
                                <Wallet className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="font-bold text-slate-900 dark:text-slate-200">السلف الجارية</h3>
                            </div>
                            {loans.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">لا توجد سلف نشطة للموظف حالياً.</div>
                            ) : (
                                <table className="w-full text-sm text-center">
                                    <thead className="bg-slate-100 dark:bg-[#0f1218] text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="py-3 px-4 font-medium">المبلغ الإجمالي</th>
                                            <th className="py-3 px-4 font-medium">الأقساط</th>
                                            <th className="py-3 px-4 font-medium">المسدد</th>
                                            <th className="py-3 px-4 font-medium">المتبقي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                                        {loans.map((loan, idx) => {
                                            const remaining = (loan.amount || 0) - (loan.paid_amount || 0);
                                            return (
                                              <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]">
                                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{loan.amount}</td>
                                                  <td className="py-3 px-4 font-mono">{loan.installments_count}</td>
                                                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">{loan.paid_amount || 0}</td>
                                                  <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{remaining}</td>
                                              </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
