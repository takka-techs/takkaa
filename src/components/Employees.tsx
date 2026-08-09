import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Loader2, Edit, Trash2, AlertTriangle, X, Eye, Landmark, Wallet, Calendar, Clock, BarChart2, Search, ChevronDown } from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';
import Salaries from './Salaries';
import Loans from './Loans';
import Leaves from './Leaves';
import Attendance from './Attendance';
import EmployeeProfileModal from './EmployeeProfileModal';
import { useBranchPermissions } from '../hooks/useBranchPermissions';
import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Employees() {
  const { canCreateEmployees, canDeleteEmployees } = useBranchPermissions();
  const { isOwner, currentBranchId } = useBranch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الموظفين');
  
  // States for custom delete modal
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for Edit/Update
  const [employeeToEdit, setEmployeeToEdit] = useState<any | null>(null);
  const [employeeToView, setEmployeeToView] = useState<any | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const activeCashierStr = localStorage.getItem('active_cashier');
    let ownerId = userId;
    
    if (activeCashierStr) {
      try {
        const cashierAuth = JSON.parse(activeCashierStr);
        if (cashierAuth.tenant_id) {
           ownerId = cashierAuth.tenant_id;
        }
      } catch(e) {}
    }

    try {
      let url = `${SUPABASE_URL}/rest/v1/employees?select=*,branches(name)&tenant_id=eq.${ownerId}&order=created_at.desc`;
      if (!isOwner && currentBranchId) {
        url += `&branch_id=eq.${currentBranchId}`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentBranchId, isOwner]);

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${employeeToDelete}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });
      if (response.ok) {
        setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  const tabs = [
    { id: 'الموظفين', icon: Users, label: 'الموظفين' },
    { id: 'الرواتب', icon: Landmark, label: 'الرواتب' },
    { id: 'السلف', icon: Wallet, label: 'السلف والعهد' },
    { id: 'الإجازات', icon: Calendar, label: 'الإجازات' },
    { id: 'الحضور', icon: Clock, label: 'الحضور والانصراف' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-2 overflow-x-auto custom-scrollbar">
        <div className="flex flex-nowrap gap-2 md:gap-4 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all duration-300 whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'الموظفين' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              قائمة الموظفين
            </h1>
            {canCreateEmployees && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                إضافة موظف
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="md:col-span-4 lg:col-span-5 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">البحث:</span>
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="اسم الموظف..." 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl pr-10 pl-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors dark:text-white"
                />
              </div>
            </div>
            
            <div className="md:col-span-8 lg:col-span-7 flex flex-wrap items-center gap-4 justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">القسم:</span>
                <div className="relative">
                  <select className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 pr-8 text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer dark:text-white">
                    <option>الكل</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">الحالة:</span>
                <div className="relative">
                  <select className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 pr-8 text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer dark:text-white">
                    <option>الكل</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center text-slate-500">
              <p>لا يوجد موظفين مسجلين حالياً. اضغط على زر الإضافة للبدء.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-center">
                  <thead className="bg-[#0f172a] text-slate-400 font-medium">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">الموظف</th>
                      <th className="px-6 py-4">الوظيفة</th>
                      <th className="px-6 py-4">القسم</th>
                      <th className="px-6 py-4">الفرع</th>
                      <th className="px-6 py-4">الهاتف</th>
                      <th className="px-6 py-4">تاريخ التعيين</th>
                      <th className="px-6 py-4">الراتب</th>
                      <th className="px-6 py-4">رصيد الإجازات</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 relative">
                    <AnimatePresence mode="popLayout">
                      {employees.map((emp, index) => (
                        <motion.tr 
                          layout
                          key={emp.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50, filter: 'blur(8px)' }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-white"
                        >
                          <td className="px-6 py-4 font-mono">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-blue-500">{emp.full_name}</td>
                          <td className="px-6 py-4">{emp.job_title}</td>
                          <td className="px-6 py-4">{emp.department || '-'}</td>
                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{emp.branches?.name || '-'}</td>
                          <td className="px-6 py-4">{emp.national_id || '-'}</td>
                          <td className="px-6 py-4 font-mono" dir="ltr">{emp.hire_date?.replace(/-/g, '/')}</td>
                          <td className="px-6 py-4 font-bold text-white font-mono">
                            {emp.monthly_salary} <span className="text-xs font-normal text-slate-400">ج.م/شهر</span>
                          </td>
                          <td className="px-6 py-4 font-mono">{emp.vacation_balance} يوم</td>
                          <td className="px-6 py-4">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                              emp.status === 'نشط' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* View Button */}
                              <button 
                                onClick={() => setEmployeeToView(emp)}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-transform hover:scale-110"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Edit Button */}
                              {canCreateEmployees && (
                                <button 
                                  onClick={() => setEmployeeToEdit(emp)}
                                  className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-transform hover:scale-110"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {/* Delete Button */}
                              {canDeleteEmployees && (
                                <button 
                                  onClick={() => setEmployeeToDelete(emp.id)}
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-transform hover:scale-110"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'الرواتب' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Salaries />
        </motion.div>
      )}

      {activeTab === 'السلف' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Loans />
        </motion.div>
      )}

      {activeTab === 'الإجازات' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Leaves />
        </motion.div>
      )}

      {activeTab === 'الحضور' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Attendance />
        </motion.div>
      )}


      {activeTab !== 'الموظفين' && activeTab !== 'الرواتب' && activeTab !== 'السلف' && activeTab !== 'الإجازات' && activeTab !== 'الحضور' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-full mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">قريباً</h2>
          <p className="text-slate-500 dark:text-slate-400">
            جاري العمل على شاشة ({tabs.find(t => t.id === activeTab)?.label}). ستكون متاحة قريباً في التحديث القادم!
          </p>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {employeeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setEmployeeToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                هل أنت متأكد من رغبتك في حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة بياناته.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEmployeeToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
                >
                  تراجع
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 font-medium disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddEmployeeModal 
        isOpen={isAddModalOpen || !!employeeToEdit} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEmployeeToEdit(null);
        }} 
        onSuccess={fetchEmployees}
        employee={employeeToEdit}
      />

      <EmployeeProfileModal 
        isOpen={!!employeeToView}
        onClose={() => setEmployeeToView(null)}
        employee={employeeToView}
      />
    </div>
  );
}
