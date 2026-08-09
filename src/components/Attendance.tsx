import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar as CalendarIcon, Clock, Search, Plus, 
  Trash2, X, Save, Loader2, CheckCircle2, AlertCircle, CalendarDays,
  Pencil, Fingerprint, PlusCircle
} from 'lucide-react';
import { differenceInMinutes, parseISO, parse } from 'date-fns';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// Interfaces for structured data
interface Period {
  id: string;
  check_in: string;
  check_out: string;
}

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('الكل');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'حاضر',
    notes: '',
    periods: [{ id: Date.now().toString(), check_in: '', check_out: '' }] as Period[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    
    try {
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,full_name&tenant_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const attRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?select=*,employees(full_name)&tenant_id=eq.${userId}&order=date.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setAttendanceRecords(await attRes.json());
    } catch (err) {
        console.error('Error fetching data:', err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPeriod = () => {
    setFormData({
      ...formData,
      periods: [...formData.periods, { id: Date.now().toString(), check_in: '', check_out: '' }]
    });
  };

  const handleRemovePeriod = (id: string) => {
    if (formData.periods.length === 1) return; // Must have at least one
    setFormData({
      ...formData,
      periods: formData.periods.filter(p => p.id !== id)
    });
  };

  const handlePeriodChange = (id: string, field: 'check_in' | 'check_out', value: string) => {
    setFormData({
      ...formData,
      periods: formData.periods.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const openNewRecordModal = () => {
    setEditingId(null);
    setFormData({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      status: 'حاضر',
      notes: '',
      periods: [{ id: Date.now().toString(), check_in: '', check_out: '' }]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: any) => {
    setEditingId(record.id);
    let parsedPeriods = [{ id: Date.now().toString(), check_in: '', check_out: '' }];
    
    let recordPeriods = record.periods;
    if (typeof recordPeriods === 'string') {
        try { recordPeriods = JSON.parse(recordPeriods); } catch(e) { recordPeriods = null; }
    }

    if (recordPeriods && Array.isArray(recordPeriods)) {
        parsedPeriods = recordPeriods.map((p: any, i: number) => ({
            id: p.id || `existing-${i}`,
            check_in: p.check_in || '',
            check_out: p.check_out || ''
        }));
    } else if (record.check_in || record.check_out) {
        // Fallback for legacy data structure if needed
        parsedPeriods = [{ id: Date.now().toString(), check_in: record.check_in || '', check_out: record.check_out || '' }];
    }

    setFormData({
      employee_id: record.employee_id,
      date: record.date,
      status: record.status,
      notes: record.notes || '',
      periods: parsedPeriods
    });
    setIsModalOpen(true);
  };

  const calculateTotalMinutes = (periods: Period[]) => {
      let total = 0;
      periods.forEach(p => {
          if (p.check_in && p.check_out) {
              const inTime = parse(p.check_in, 'HH:mm', new Date());
              const outTime = parse(p.check_out, 'HH:mm', new Date());
              let diff = differenceInMinutes(outTime, inTime);
              if (diff < 0) diff += 24 * 60; // Handle overnight shifts
              total += diff;
          }
      });
      return total;
  };

  const formatTotalTime = (minutes: number) => {
      if (minutes <= 0) return '-';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0 && mins > 0) return `${hours}س ${mins}د`;
      if (hours > 0) return `${hours}س`;
      return `${mins}د`;
  };

  const handleSubmit = async () => {
      if (!formData.employee_id || !formData.date) {
          alert('برجاء تحديد الموظف والتاريخ');
          return;
      }

      setIsSubmitLoading(true);
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      
      const totalMinutes = calculateTotalMinutes(formData.periods);

      const payload = {
          tenant_id: userId,
          employee_id: formData.employee_id,
          date: formData.date,
          status: formData.status,
          notes: formData.notes,
          periods: formData.periods, // saving the structured JSON
          total_minutes: totalMinutes,
          check_in: formData.periods[0]?.check_in || null, // keeping flat structures for quick backwards compatibility if needed
          check_out: formData.periods[formData.periods.length - 1]?.check_out || null
      };

      try {
          const url = editingId 
              ? `${SUPABASE_URL}/rest/v1/attendance?id=eq.${editingId}&tenant_id=eq.${userId}`
              : `${SUPABASE_URL}/rest/v1/attendance`;
              
          const response = await fetch(url, {
              method: editingId ? 'PATCH' : 'POST',
              headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
              },
              body: JSON.stringify(payload)
          });

          if (response.ok) {
              setIsModalOpen(false);
              fetchData();
          } else {
              const error = await response.json();
              alert(`تأكد من إنشاء جدول attendance في قاعدة البيانات أولاً. التفاصيل: ${error.message}`);
          }
      } catch (err) {
          alert('فشل الاتصال بخادم قاعدة البيانات!');
      } finally {
          setIsSubmitLoading(false);
      }
  };

  const confirmDelete = async () => {
      if (!recordToDelete) return;
      setIsDeleting(true);
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');

      try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${recordToDelete.id}&tenant_id=eq.${userId}`, {
              method: 'DELETE',
              headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${token}`
              }
          });

          if (res.ok) {
              fetchData();
          }
      } catch (error) {
          console.error('حدث خطأ أثناء الحذف');
      } finally {
          setIsDeleting(false);
          setRecordToDelete(null);
      }
  };

  const filteredRecords = attendanceRecords.filter(record => {
      const matchStatus = statusFilter === 'الكل' || record.status === statusFilter;
      const matchEmp = employeeFilter === 'الكل' || record.employee_id === employeeFilter;
      const matchDateFrom = dateFromFilter ? record.date >= dateFromFilter : true;
      const matchDateTo = dateToFilter ? record.date <= dateToFilter : true;
      return matchStatus && matchEmp && matchDateFrom && matchDateTo;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toolbox & Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                <Fingerprint className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">سجل الحضور والانصراف 📋</h2>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 md:justify-end">
              
              {/* Employee Filter */}
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-slate-500 dark:text-slate-400">الموظف:</span>
                 <select 
                     value={employeeFilter}
                     onChange={(e) => setEmployeeFilter(e.target.value)}
                     className="w-full sm:w-auto bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                 >
                     <option className="bg-white dark:bg-[#1a2035]" value="الكل">الكل</option>
                     {employees.map(emp => (
                         <option className="bg-white dark:bg-[#1a2035]" key={emp.id} value={emp.id}>{emp.full_name}</option>
                     ))}
                 </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">من:</span>
                  <input 
                      type="date" 
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">إلى:</span>
                  <input 
                      type="date" 
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">الحالة:</span>
                  <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-auto bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                      <option className="bg-white dark:bg-[#1a2035]" value="الكل">الكل</option>
                      <option className="bg-white dark:bg-[#1a2035]" value="حاضر">حاضر</option>
                      <option className="bg-white dark:bg-[#1a2035]" value="غائب">غائب</option>
                      <option className="bg-white dark:bg-[#1a2035]" value="متأخر">متأخر</option>
                      <option className="bg-white dark:bg-[#1a2035]" value="إجازة">إجازة</option>
                      <option className="bg-white dark:bg-[#1a2035]" value="مريض">مريض</option>
                  </select>
              </div>

              <button 
                 onClick={openNewRecordModal}
                 className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap"
              >
                  <Plus className="w-5 h-5" /> تسجيل حضور
              </button>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right shrink-0">
                  <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-white/5">
                      <tr>
                          <th className="px-6 py-4 font-medium">#</th>
                          <th className="px-6 py-4 font-medium">الموظف</th>
                          <th className="px-6 py-4 font-medium">التاريخ</th>
                          <th className="px-6 py-4 font-medium">الفترات</th>
                          <th className="px-6 py-4 font-medium text-center">إجمالي الساعات</th>
                          <th className="px-6 py-4 font-medium border-r border-slate-200 dark:border-white/5">الحالة</th>
                          <th className="px-6 py-4 font-medium text-center">ملاحظات</th>
                          <th className="px-6 py-4 font-medium text-center border-r border-slate-200 dark:border-white/5">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {isLoading ? (
                          <tr>
                             <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                 <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
                                 جاري تحميل البيانات...
                             </td>
                          </tr>
                      ) : filteredRecords.length === 0 ? (
                          <tr>
                             <td colSpan={8} className="px-6 py-12 text-center text-slate-500 bg-white dark:bg-[#161b22]">
                                 <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                 لا توجد سجلات حضور
                             </td>
                          </tr>
                      ) : (
                          filteredRecords.map((record, index) => {
                              
                              const isPresent = record.status === 'حاضر';
                              const isAbsent = record.status === 'غائب';
                              
                              let periods: any[] = [];
                              if (Array.isArray(record.periods)) {
                                  periods = record.periods;
                              } else if (typeof record.periods === 'string') {
                                  try { periods = JSON.parse(record.periods); } catch(e) {}
                              }

                              return (
                                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-slate-900 dark:text-white text-sm bg-white dark:bg-[#161b22]">
                                      <td className="px-6 py-4 font-mono text-slate-500">{index + 1}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{record.employees?.full_name || 'غير معروف'}</td>
                                      <td className="px-6 py-4 font-mono font-medium">
                                          {new Date(record.date).toLocaleDateString('ar-EG')}
                                      </td>
                                      <td className="px-6 py-4">
                                          {periods.length > 0 ? (
                                              <div className="flex flex-col gap-1">
                                                  {periods.map((p: any, i: number) => (
                                                      <div key={i} className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-md border border-slate-200 dark:border-white/5">
                                                          <Clock className="w-3 h-3 text-slate-400" />
                                                          <span className="text-emerald-600 dark:text-emerald-400">{p.check_in || '--:--'}</span>
                                                          <span className="text-slate-400">-</span>
                                                          <span className="text-rose-600 dark:text-rose-400">{p.check_out || '--:--'}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : (
                                              <span className="text-slate-400">-</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                                          {formatTotalTime(record.total_minutes || 0)}
                                      </td>
                                      <td className="px-6 py-4 border-r border-slate-200 dark:border-white/5">
                                          <span className={`flex w-fit items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${
                                              isPresent 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                                                : isAbsent
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                    : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                                          }`}>
                                              {record.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-center text-xs w-48 truncate" title={record.notes}>
                                          {record.notes || '-'}
                                      </td>
                                      <td className="px-6 py-4 text-center border-r border-slate-200 dark:border-white/5">
                                          <div className="flex items-center justify-center gap-2">
                                              <button 
                                                onClick={() => openEditModal(record)}
                                                className="p-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-500 dark:text-blue-400 rounded-lg transition-all"
                                                title="تعديل السجل"
                                              >
                                                  <Pencil className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => setRecordToDelete(record)}
                                                className="p-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 dark:text-rose-400 rounded-lg transition-all"
                                                title="حذف السجل"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add / Edit Attendance Modal */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-slate-900/40 dark:bg-[#0f172a]/90 backdrop-blur-sm"
                     onClick={() => !isSubmitLoading && setIsModalOpen(false)}
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50 shrink-0">
                          <div className="flex items-center gap-3">
                              <span className="text-2xl">📋</span>
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                  {editingId ? 'تعديل سجل حضور' : 'تسجيل حضور وانصراف'}
                              </h2>
                          </div>
                          <button onClick={() => !isSubmitLoading && setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                              <X className="w-5 h-5" />
                          </button>
                      </div>

                      {/* Body */}
                      <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الموظف <span className="text-rose-500">*</span></label>
                                    <select 
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <option className="bg-white dark:bg-[#1a2035]" value="">-- اختر الموظف --</option>
                                        {employees.map(emp => (
                                            <option className="bg-white dark:bg-[#1a2035]" key={emp.id} value={emp.id}>{emp.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">التاريخ <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Periods Section */}
                            <div className="space-y-4 border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-slate-50/50 dark:bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        فترات الحضور والانصراف
                                    </h3>
                                </div>

                                {formData.periods.map((period, index) => (
                                    <div key={period.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl">
                                        <div className="flex-1 w-full space-y-1">
                                            <label className="text-xs text-slate-500 dark:text-slate-400">وقت الحضور</label>
                                            <input 
                                                type="time" 
                                                value={period.check_in}
                                                onChange={(e) => handlePeriodChange(period.id, 'check_in', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="flex-1 w-full space-y-1">
                                            <label className="text-xs text-slate-500 dark:text-slate-400">وقت الانصراف</label>
                                            <input 
                                                type="time" 
                                                value={period.check_out}
                                                onChange={(e) => handlePeriodChange(period.id, 'check_out', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-rose-500 [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="pt-5">
                                            <button 
                                                onClick={() => handleRemovePeriod(period.id)}
                                                disabled={formData.periods.length === 1}
                                                className="p-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 dark:text-rose-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="حذف الفترة"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={handleAddPeriod}
                                    className="w-full py-3 border border-dashed border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <PlusCircle className="w-4 h-4" /> إضافة فترة جديدة
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الحالة</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                >
                                    <option className="bg-white dark:bg-[#1a2035]" value="حاضر">حاضر</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="غائب">غائب</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="متأخر">متأخر</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="إجازة">إجازة</option>
                                    <option className="bg-white dark:bg-[#1a2035]" value="مريض">مريض</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-400">ملاحظات إضافية</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#1a2035] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none h-20"
                                    placeholder="اكتب أي ملاحظات عن هذا اليوم..."
                                />
                            </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-4 shrink-0">
                          <button 
                              onClick={handleSubmit}
                              disabled={isSubmitLoading}
                              className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:bg-blue-600/50 text-white flex-1 py-4 rounded-xl font-bold transition-all shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                          >
                              {isSubmitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>حفظ السجل 💾</span>}
                          </button>
                          <button 
                             onClick={() => setIsModalOpen(false)}
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
          {recordToDelete && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-slate-900/40 dark:bg-[#0f172a]/90 backdrop-blur-sm"
                     onClick={() => !isDeleting && setRecordToDelete(null)}
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
                                هل أنت متأكد من حذف سجل الحضور للموظف 
                                <span className="text-rose-500 dark:text-rose-400 font-bold mx-1">{recordToDelete.employees?.full_name}</span>؟
                                <br/>لا يمكن التراجع عن هذا الإجراء
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
                                onClick={() => setRecordToDelete(null)}
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
