import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Users, Landmark, Wallet, Calendar, Clock, BarChart2, 
  Search, ChevronDown, Plus, CreditCard, DollarSign,
  Briefcase, TrendingUp, AlertCircle, CheckCircle2,
  Printer, Download, Filter, Loader2, X, Save, Check
} from 'lucide-react';

import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Salaries() {
  const { isOwner, currentBranch } = useBranch();
  const [employees, setEmployees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    bonus: 0,
    deduction: 0,
    wallet_id: '',
    notes: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    try {
      // Fetch Employees
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&tenant_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
        }
      });
      
      // Fetch Salary Payments for selected month/year
      const payRes = await fetch(`${SUPABASE_URL}/rest/v1/salary_payments?select=*&tenant_id=eq.${userId}&month=eq.${selectedMonth}&year=eq.${selectedYear}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
        }
      });

      // Fetch active loans
      const loansRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_loans?select=*&tenant_id=eq.${userId}&status=eq.نشط`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
        }
      });

      // Fetch wallets
      const tenantId = localStorage.getItem('tenant_id') || userId;
      let walletQuery = `&tenant_id=eq.${tenantId}`;
      if (!isOwner && currentBranch) {
        walletQuery += `&branch_id=eq.${currentBranch.id}`;
      }
      const walletsRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&order=is_default.desc${walletQuery}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
        }
      });

      let employeesData = [];
      if (empRes.ok) {
        employeesData = await empRes.json();
        setEmployees(employeesData);
      }
      
      let activeLoans: any[] = [];
      if (loansRes.ok) {
        activeLoans = await loansRes.json();
      }

      if (walletsRes.ok) {
        setWallets(await walletsRes.json());
      }

      if (payRes.ok) {
        const payData = await payRes.json();
        // Attaching active loans to employees directly to compute the required deduction
        const empWithLoans = employeesData?.map((emp: any) => {
            const empLoans = activeLoans.filter((l: any) => l.employee_id === emp.id);
            const totalMonthlyDeduction = empLoans.reduce((acc, curr) => acc + (curr.installment_amount || 0), 0);
            return {
               ...emp,
               active_loans: empLoans,
               monthly_loans_deduction: totalMonthlyDeduction
            }
        });
        setEmployees(empWithLoans || []);
        setPayments(payData);
      } else {
        // If table doesn't exist yet, simply default to empty to avoid crashing UI
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    if (!paymentData.wallet_id) {
        alert('برجاء اختيار الخزينة التي سيتم الصرف منها!');
        setIsSubmitting(false);
        return;
    }

    const netSalary = paymentData.amount + paymentData.bonus - paymentData.deduction;

    const payload = {
        tenant_id: userId,
        employee_id: selectedEmployee.id,
        month: selectedMonth,
        year: selectedYear,
        base_salary: selectedEmployee.monthly_salary || 0,
        allowances: selectedEmployee.fixed_allowances || 0,
        bonus: paymentData.bonus || 0,
        deduction: paymentData.deduction || 0,
        net_salary: netSalary,
        notes: paymentData.notes || '',
        payment_date: new Date().toISOString()
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/salary_payments`, {
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
            // Process loan deduction if exists
            if (selectedEmployee.active_loans && selectedEmployee.active_loans.length > 0) {
               for (const loan of selectedEmployee.active_loans) {
                   const newPaidAmount = loan.paid_amount + loan.installment_amount;
                   const newRemaining = loan.remaining_amount - loan.installment_amount;
                   const newStatus = newRemaining <= 0 ? 'مكتمل' : 'نشط';

                   await fetch(`${SUPABASE_URL}/rest/v1/employee_loans?id=eq.${loan.id}&tenant_id=eq.${userId}`, {
                       method: 'PATCH',
                       headers: {
                           'apikey': SUPABASE_KEY,
                           'Authorization': `Bearer ${token}`,
                           'Content-Type': 'application/json'
                       },
                       body: JSON.stringify({
                           paid_amount: newPaidAmount,
                           remaining_amount: newRemaining > 0 ? newRemaining : 0,
                           status: newStatus
                       })
                   });
               }
            }

            // Deduct net salary from treasury
            const targetWallet = wallets.find(w => w.id.toString() === paymentData.wallet_id);
            if (targetWallet) {
                await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
                    method: 'POST',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_id: targetWallet.id,
                        user_id: userId,
                        type: 'out',
                        amount: netSalary,
                        category: 'صرف رواتب',
                        description: `صرف راتب شهر ${months[selectedMonth-1]} للموظف (${selectedEmployee.full_name})`
                    })
                });
                
                await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${targetWallet.id}`, {
                    method: 'PATCH',
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ balance: Number(targetWallet.balance || 0) - netSalary })
                });
            }

            setIsPayModalOpen(false);
            fetchData(); // Refresh list to show as Paid
            alert('تم إثبات صرف الراتب وصق البيانات في السجل وخصمه من الخزينة بنجاح! ✅');
        } else {
            const errorData = await response.json();
            // If uniqueness constraint triggered
            if (errorData.code === '23505') {
               alert('هذا الموظف تم صرف راتبه مسبقاً في هذا الشهر!');
            } else {
               alert(`برجاء إنشاء الجدول في Supabase أولاً (كما موضح بالرسالة) - التفاصيل: ${errorData.message}`);
            }
        }
    } catch (err) {
        alert('فشل الاتصال بخادم قاعدة البيانات!');
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalSalaries = employees.reduce((acc, curr) => acc + (Number(curr.monthly_salary) || 0), 0);
  
  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map(emp => {
      const paymentRecord = payments.find(p => p.employee_id === emp.id);
      const isPaid = !!paymentRecord;
      const autoDeduction = emp.monthly_loans_deduction || 0;
      return {
        'اسم الموظف': emp.full_name,
        'المسمى الوظيفي': emp.job_title,
        'حالة الصرف': isPaid ? 'تم الصرف' : 'معلق',
        'الراتب الأساسي': isPaid ? paymentRecord.base_salary : emp.monthly_salary,
        'حوافز وبدلات': isPaid ? (Number(paymentRecord.allowances || 0) + Number(paymentRecord.bonus || 0)) : (emp.fixed_allowances || 0),
        'خصومات وسلف': isPaid ? (paymentRecord.deduction || 0) : autoDeduction,
        'الصافي المصروف': isPaid ? paymentRecord.net_salary : 'لم يصرف بعد',
        'تاريخ الصرف': isPaid ? new Date(paymentRecord.payment_date).toLocaleDateString('ar-EG') : '—'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salaries");
    XLSX.writeFile(wb, `رواتب_شهر_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Search & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/40 to-[#11151c] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">إدارة الرواتب والأجور 💰</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">قم بمراجعة وصرف رواتب الموظفين لشهر {months[selectedMonth-1]}</p>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-bold">إجمالي المطالبات</h3>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalSalaries.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span></div>
            <p className="text-xs text-slate-500">إجمالي الرواتب الأساسية لـ {employees.length} موظف</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث باسم الموظف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm">
              <Download className="w-4 h-4" /> تصدير Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold">الموظف</th>
                <th className="px-6 py-4 font-bold">الراتب الأساسي</th>
                <th className="px-6 py-4 font-bold text-emerald-500">حوافز/بدلات</th>
                <th className="px-6 py-4 font-bold text-rose-500">خصومات/سلف</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    لا يوجد موظفين مسجلين
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const paymentRecord = payments.find(p => p.employee_id === emp.id);
                  const isPaid = !!paymentRecord;
                  const autoDeduction = emp.monthly_loans_deduction || 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                            {emp.full_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{emp.full_name}</div>
                            <div className="text-xs text-slate-500">{emp.job_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-slate-900 dark:text-white">
                        {isPaid ? paymentRecord.base_salary?.toLocaleString() : emp.monthly_salary?.toLocaleString()} ج.م
                      </td>
                      <td className="px-6 py-5 font-mono text-emerald-500">
                        {isPaid ? `+${(Number(paymentRecord.allowances || 0) + Number(paymentRecord.bonus || 0)).toLocaleString()}` : `+${emp.fixed_allowances?.toLocaleString() || 0}`}
                      </td>
                      <td className="px-6 py-5 font-mono text-rose-500 flex flex-col items-end justify-center">
                        <span>{isPaid ? `-${paymentRecord.deduction?.toLocaleString() || 0}` : `-${autoDeduction.toLocaleString()}`}</span>
                        {!isPaid && autoDeduction > 0 && (
                            <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 mt-1 rounded-md border border-orange-400/20">قسط سلفة مبرمج</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {isPaid ? (
                           <span className="flex w-fit items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">
                             <Check className="w-3 h-3" /> تم الصرف
                           </span>
                        ) : (
                           <span className="flex w-fit items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-bold border border-yellow-500/20">
                             <Clock className="w-3 h-3" /> معلق
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {isPaid ? (
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-500 text-sm font-bold font-mono bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                              {paymentRecord.net_salary?.toLocaleString()} ج.م صافي
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1">{new Date(paymentRecord.payment_date).toLocaleDateString('ar-EG')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setPaymentData({
                                    amount: Number(emp.monthly_salary) + Number(emp.fixed_allowances || 0),
                                    bonus: 0,
                                    deduction: emp.monthly_loans_deduction || 0,
                                    wallet_id: wallets.length > 0 ? wallets[0].id.toString() : '',
                                    notes: ''
                                });
                                setIsPayModalOpen(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> صرف الراتب
                            </button>
                            <button className="p-2 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      <AnimatePresence>
        {isPayModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => !isSubmitting && setIsPayModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">تأكيد صرف راتب</h3>
                      <p className="text-sm text-slate-500">{selectedEmployee.full_name} - شهر {months[selectedMonth-1]}</p>
                    </div>
                  </div>
                  <button onClick={() => !isSubmitting && setIsPayModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-xs text-slate-500 mb-1">الأساسي + البدلات الثابتة</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            {(Number(selectedEmployee.monthly_salary) + Number(selectedEmployee.fixed_allowances || 0)).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                        <div className="text-xs text-blue-400 mb-1">الصافي الذي سيتم صرفه</div>
                        <div className="text-xl font-bold text-blue-500 font-mono">
                            {(paymentData.amount + paymentData.bonus - paymentData.deduction).toLocaleString()}
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-2">الخزينة المراد الصرف منها <span className="text-rose-500">*</span></label>
                   <div className="relative">
                       <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <select 
                           value={paymentData.wallet_id}
                           onChange={(e) => setPaymentData({...paymentData, wallet_id: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-3 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                       >
                           <option value="">-- اختر الخزينة --</option>
                           {wallets.map(w => (
                               <option key={w.id} value={w.id}>
                                   {w.name} {w.branches?.name ? ` - ${w.branches.name}` : ''} ({Number(w.balance || 0).toLocaleString()} ج.م)
                               </option>
                           ))}
                       </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">إضافة حافز/مكافأة (ج.م)</label>
                        <div className="relative">
                            <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input 
                                type="number" 
                                value={paymentData.bonus || ''}
                                onChange={(e) => setPaymentData({...paymentData, bonus: Number(e.target.value)})}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-3 text-emerald-500 font-bold outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">قيمة خصم/سلفة (ج.م)</label>
                        <div className="relative">
                            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                            <input 
                                type="number" 
                                value={paymentData.deduction || ''}
                                onChange={(e) => setPaymentData({...paymentData, deduction: Number(e.target.value)})}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-3 text-rose-500 font-bold outline-none focus:border-rose-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">ملاحظات إضافية على عملية الصرف</label>
                    <textarea 
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 min-h-[100px] transition-colors"
                        placeholder="أدخل أي ملاحظات هنا كمرجع مستقبلي..."
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={handleConfirmPayment}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? 'جاري التسجيل...' : 'تأكيد وصرف 💳'}
                    </button>
                    <button 
                        onClick={() => setIsPayModalOpen(false)}
                        disabled={isSubmitting}
                        className="px-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
