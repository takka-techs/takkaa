import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Wallet, Search, Plus, Filter, CreditCard, 
  CheckCircle2, AlertCircle, Clock, FileText, X, 
  Save, Loader2, Landmark, Download
} from 'lucide-react';

import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Loans() {
  const { isOwner, currentBranch } = useBranch();
  const [loans, setLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal State
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    wallet_id: '',
    amount: '',
    installments_count: '1',
    start_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    try {
      // Fetch Employees for dropdown
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,full_name&tenant_id=eq.${localStorage.getItem('tenant_id') || userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch Wallets
      const tenantId = localStorage.getItem('tenant_id') || userId;
      let walletQuery = `&tenant_id=eq.${tenantId}`;
      if (!isOwner && currentBranch) {
        walletQuery += `&branch_id=eq.${currentBranch.id}`;
      }
      const walletsRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&order=is_default.desc${walletQuery}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch Loans (Wait until we verify the database structure before we include the select statement)
      const loansRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_loans?select=*,employees(full_name)&tenant_id=eq.${localStorage.getItem('tenant_id') || userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }
      
      if (walletsRes.ok) {
        const data = await walletsRes.json();
        setWallets(data);
        if (data.length > 0) {
            setFormData(prev => ({ ...prev, wallet_id: data[0].id.toString() }));
        }
      }

      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data);
      } else {
         setLoans([]); // No table yet
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

  const handleSubmit = async () => {
      if (!formData.employee_id || !formData.amount || !formData.installments_count || !formData.wallet_id) {
          alert('برجاء إدخال الحقول الإجبارية (الموظف، الخزينة، المبلغ، عدد الأقساط)');
          return;
      }

      setIsSubmitLoading(true);
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');

      const amount = parseFloat(formData.amount);
      const count = parseInt(formData.installments_count);
      const monthlyInstallment = amount / count;

      const payload = {
          tenant_id: userId,
          employee_id: formData.employee_id,
          total_amount: amount,
          installments_count: count,
          installment_amount: monthlyInstallment,
          paid_amount: 0,
          remaining_amount: amount,
          start_date: formData.start_date,
          reason: formData.reason,
          status: 'نشط'
      };

      try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/employee_loans`, {
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
              // Now deduct from Treasury
              const targetWallet = wallets.find(w => w.id.toString() === formData.wallet_id);
              if (targetWallet) {
                  const empName = employees.find(e => e.id.toString() === formData.employee_id)?.full_name || 'غير محدد';
                  
                  // 1. Log transaction
                  await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
                      method: 'POST',
                      headers: {
                          'apikey': SUPABASE_KEY,
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                          wallet_id: targetWallet.id,
                          user_id: userId,
                          type: 'out',
                          amount: amount,
                          category: 'قرض/سلفة موظف',
                          description: `تم صرف سلفة للموظف (${empName})`
                      })
                  });
                  // 2. Adjust Balance
                  await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${targetWallet.id}`, {
                      method: 'PATCH',
                      headers: {
                          'apikey': SUPABASE_KEY,
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ balance: Number(targetWallet.balance || 0) - amount })
                  });
              }

              setIsNewLoanOpen(false);
              setFormData({
                employee_id: '',
                wallet_id: wallets.length > 0 ? wallets[0].id.toString() : '',
                amount: '',
                installments_count: '1',
                start_date: new Date().toISOString().split('T')[0],
                reason: ''
              });
              fetchData();
              alert('تم تسجيل السلفة وصرفها من الخزينة بنجاح! ✅');
          } else {
              const error = await response.json();
              alert(`تأكد من إنشاء جدول employee_loans في قاعدة البيانات أولاً. التفاصيل: ${error.message}`);
          }
      } catch (err) {
          alert('فشل الاتصال بخادم قاعدة البيانات!');
      } finally {
          setIsSubmitLoading(false);
      }
  };

  // Stats
  const activeLoans = loans.filter(l => l.status === 'نشط');
  const totalAmount = loans.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const paidAmount = loans.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
  const remainingAmount = loans.reduce((acc, curr) => acc + (curr.remaining_amount || 0), 0);

  // Filters
  const filteredLoans = loans.filter(loan => {
      const matchSearch = loan.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'الكل' || loan.status === statusFilter;
      return matchSearch && matchStatus;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredLoans.map((loan, index) => ({
      '#': index + 1,
      'الموظف': loan.employees?.full_name || 'غير معروف',
      'المبلغ الكلي': loan.total_amount,
      'عدد الأقساط': loan.installments_count,
      'قيمة القسط': loan.installment_amount,
      'المسدد': loan.paid_amount,
      'المتبقي': loan.remaining_amount,
      'تاريخ الطلب': new Date(loan.created_at).toLocaleDateString('ar-EG'),
      'الحالة': loan.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loans");
    XLSX.writeFile(wb, `سلف_الموظفين_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                  <p className="text-xs text-slate-500 mb-1">إجمالي السلف النشطة</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeLoans.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <CreditCard className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                  <p className="text-xs text-slate-500 mb-1">إجمالي المبالغ</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalAmount.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Landmark className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                  <p className="text-xs text-slate-500 mb-1">المسدد</p>
                  <h3 className="text-2xl font-bold text-emerald-500">{paidAmount.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                  <p className="text-xs text-slate-500 mb-1">المتبقي</p>
                  <h3 className="text-2xl font-bold text-orange-400">{remainingAmount.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                  <Clock className="w-6 h-6" />
              </div>
          </div>
      </div>

      {/* Toolbox */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
               onClick={() => setIsNewLoanOpen(true)}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
                <Plus className="w-5 h-5" /> طلب سلفة جديدة
            </button>
            <button 
               onClick={handleExportExcel}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 px-6 py-2.5 rounded-xl font-bold transition-all"
            >
                <Download className="w-5 h-5" /> تصدير Excel
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="بحث باسم الموظف..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium text-slate-500">الحالة:</span>
                  <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[120px]"
                  >
                      <option value="الكل">الكل</option>
                      <option value="نشط">نشط</option>
                      <option value="مكتمل">مكتمل</option>
                  </select>
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                  <thead className="bg-[#0f172a] text-slate-400 text-sm">
                      <tr>
                          <th className="px-6 py-4 font-medium border-b border-white/5">#</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">الموظف</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">المبلغ</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">عدد الأقساط</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">قيمة القسط</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">المسدد</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">المتبقي</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">تاريخ الطلب</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5">الحالة</th>
                          <th className="px-6 py-4 font-medium border-b border-white/5 text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {isLoading ? (
                          <tr>
                             <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                 <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                 جاري تحميل البيانات...
                             </td>
                          </tr>
                      ) : filteredLoans.length === 0 ? (
                          <tr>
                             <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                 <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                 لا توجد سلف
                             </td>
                          </tr>
                      ) : (
                          filteredLoans.map((loan, index) => (
                              <tr key={index} className="hover:bg-white/[0.02] transition-colors text-slate-900 dark:text-white text-sm">
                                  <td className="px-6 py-4 font-mono text-slate-500">{index + 1}</td>
                                  <td className="px-6 py-4 font-bold text-blue-400">{loan.employees?.full_name || 'غير معروف'}</td>
                                  <td className="px-6 py-4 font-mono font-bold">{loan.total_amount?.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span></td>
                                  <td className="px-6 py-4 font-mono">{loan.installments_count}</td>
                                  <td className="px-6 py-4 font-mono text-rose-400">{loan.installment_amount?.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span></td>
                                  <td className="px-6 py-4 font-mono text-emerald-500">{loan.paid_amount?.toLocaleString()}</td>
                                  <td className="px-6 py-4 font-mono font-bold text-orange-400">{loan.remaining_amount?.toLocaleString()}</td>
                                  <td className="px-6 py-4 font-mono text-slate-400">{new Date(loan.created_at).toLocaleDateString('ar-EG')}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                                          loan.status === 'نشط' 
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      }`}>
                                          {loan.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <button className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                                          <FileText className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Loan Modal */}
      <AnimatePresence>
          {isNewLoanOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                     onClick={() => !isSubmitLoading && setIsNewLoanOpen(false)}
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-2xl bg-[#11151c] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                  >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                          <div className="flex items-center gap-3">
                              <CreditCard className="w-6 h-6 text-blue-400" />
                              <h2 className="text-xl font-bold text-white">طلب سلفة جديدة</h2>
                          </div>
                          <button onClick={() => !isSubmitLoading && setIsNewLoanOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors bg-[#1a1f2c]">
                              <X className="w-5 h-5" />
                          </button>
                      </div>

                      {/* Body */}
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">الموظف <span className="text-rose-500">*</span></label>
                                <select 
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="w-full bg-[#1a1f2c] border border-[#2d3748] rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">-- اختر الموظف --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">الخزينة (للصرف) <span className="text-rose-500">*</span></label>
                                <select 
                                    value={formData.wallet_id}
                                    onChange={(e) => setFormData({...formData, wallet_id: e.target.value})}
                                    className="w-full bg-[#1a1f2c] border border-[#2d3748] rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 transition-colors"
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

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">مبلغ السلفة <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        className="w-full bg-[#1a1f2c] border border-transparent rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-center font-bold text-lg"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">عدد الأقساط <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={formData.installments_count}
                                        onChange={(e) => setFormData({...formData, installments_count: e.target.value})}
                                        className="w-full bg-[#1a1f2c] border border-transparent rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-center font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 text-center block">قيمة القسط الشهري</label>
                                    <div className="w-full bg-transparent border-b border-[#2d3748] px-4 py-3 text-center">
                                        <span className="text-xl font-bold font-mono text-emerald-400">
                                            {formData.amount && formData.installments_count ? (parseFloat(formData.amount) / parseInt(formData.installments_count)).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 text-center block">تاريخ بدء الخصم</label>
                                    <input 
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        className="w-full bg-transparent border-b border-[#2d3748] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors text-center [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-bold text-slate-400">سبب السلفة</label>
                                <textarea 
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    className="w-full bg-transparent border-b border-[#2d3748] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors resize-none h-20"
                                    placeholder="اكتب سبب طلب السلفة..."
                                />
                            </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t border-white/5 bg-[#161b22] flex items-center gap-4">
                          <button 
                              onClick={handleSubmit}
                              disabled={isSubmitLoading}
                              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                          >
                              {isSubmitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>تقديم الطلب 💾</span>}
                          </button>
                          <button 
                             onClick={() => setIsNewLoanOpen(false)}
                             disabled={isSubmitLoading}
                             className="px-6 py-3 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl font-bold transition-colors"
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
