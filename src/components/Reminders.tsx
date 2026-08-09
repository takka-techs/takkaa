import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, Search, Calendar, CheckSquare, 
  Clock, AlertTriangle, Trash2, Edit, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'call' | 'meeting' | 'task';
  status: 'pending' | 'completed';
  notes: string;
  created_at: string;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'medium',
    category: 'general',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Reminders?order=due_date.asc,due_time.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      const payload = {
        ...formData,
        user_id: userId,
        status: editingReminder ? editingReminder.status : 'pending' // Keep old status if editing
      };

      const url = editingReminder 
        ? `${SUPABASE_URL}/rest/v1/Reminders?id=eq.${editingReminder.id}`
        : `${SUPABASE_URL}/rest/v1/Reminders`;
        
      const res = await fetch(url, {
        method: editingReminder ? 'PATCH' : 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingReminder(null);
        resetForm();
        fetchReminders();
      } else {
        const err = await res.json();
        alert(`خطأ: ${err.message || 'حدث خطأ أثناء الحفظ'}`);
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في الاتصال بالانترنت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (reminder: Reminder) => {
    try {
      const token = localStorage.getItem('access_token');
      const newStatus = reminder.status === 'completed' ? 'pending' : 'completed';
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Reminders?id=eq.${reminder.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setReminders(reminders.map(r => r.id === reminder.id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التذكير؟')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Reminders?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      due_time: '',
      priority: 'medium',
      category: 'general',
      notes: ''
    });
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      due_date: reminder.due_date,
      due_time: reminder.due_time,
      priority: reminder.priority,
      category: reminder.category,
      notes: reminder.notes || ''
    });
    setIsModalOpen(true);
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    completed: reminders.filter(r => r.status === 'completed').length,
    high: reminders.filter(r => r.priority === 'high' && r.status === 'pending').length,
    today: reminders.filter(r => r.due_date === new Date().toISOString().split('T')[0] && r.status === 'pending').length
  };

  const filteredReminders = reminders.filter(r => {
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (searchQuery && !r.title.includes(searchQuery) && !r.description?.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border border-transparent dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التذكيرات والمهام</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">إدارة مهامك اليومية والمواعيد</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingReminder(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة تذكير
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#1a2333] p-4 md:col-span-1 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">الكل</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border-t-4 border-yellow-500 flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">قيد الانتظار</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pending}</p>
          </div>
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border-t-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">مهام اليوم</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.today}</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border-t-4 border-red-500 flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">عاجل وهام</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.high}</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border-t-4 border-green-500 flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">مكتمل</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completed}</p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#1a2333] p-4 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="ابحث في التذكيرات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200"
          >
            <option value="all">الأولوية: الكل</option>
            <option value="high">الأولوية: عالي (عاجل)</option>
            <option value="medium">الأولوية: متوسط</option>
            <option value="low">الأولوية: منخفض</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200"
          >
            <option value="all">التصنيف: الكل</option>
            <option value="task">مهام</option>
            <option value="call">مكالمات</option>
            <option value="meeting">اجتماعات</option>
            <option value="general">عام</option>
          </select>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className={`bg-white dark:bg-[#1a2333] rounded-xl shadow-sm dark:shadow-none border p-5 transition-all ${
              reminder.status === 'completed' 
                ? 'opacity-60 border-green-200 dark:border-green-900/50' 
                : reminder.priority === 'high' 
                  ? 'border-red-200 dark:border-red-900/50 shadow-red-50 dark:shadow-none' 
                  : 'border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(reminder)}
                  className={`w-6 h-6 rounded flex items-center justify-center border ${
                    reminder.status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                  }`}
                >
                  {reminder.status === 'completed' && <CheckSquare className="w-4 h-4" />}
                </button>
                <h3 className={`font-semibold text-lg ${reminder.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                  {reminder.title}
                </h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(reminder)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteReminder(reminder.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{reminder.description}</p>

            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
              <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ${
                reminder.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                reminder.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}>
                {reminder.priority === 'high' && <AlertTriangle className="w-3 h-3" />}
                {reminder.priority === 'high' ? 'عاجل' : reminder.priority === 'medium' ? 'متوسط' : 'عادي'}
              </span>

              <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 font-medium">
                {reminder.category === 'call' ? 'مكالمة' : reminder.category === 'meeting' ? 'اجتماع' : reminder.category === 'task' ? 'مهمة' : 'عام'}
              </span>

              <div className="mr-auto flex items-center gap-2 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg">
                <Calendar className="w-3 h-3" />
                {reminder.due_date} 
                {reminder.due_time && ` - ${reminder.due_time}`}
              </div>
            </div>
          </div>
        ))}
        {filteredReminders.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a2333] rounded-xl border border-gray-100 dark:border-white/5">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>لا توجد تذكيرات لعرضها</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a2333] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-gray-100 dark:border-white/10">
            <div className="p-4 bg-gray-50 dark:bg-[#131b26] border-b dark:border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                {editingReminder ? 'تعديل تذكير' : 'إضافة تذكير جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="مثال: الاتصال بالمورد لدفع الفاتورة"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white flex-row-reverse"
                    style={{ textAlign: 'right' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوقت <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="time"
                    value={formData.due_time}
                    onChange={e => setFormData({...formData, due_time: e.target.value})}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white flex-row-reverse"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                  >
                    <option value="low">منخفضة 🔽</option>
                    <option value="medium">متوسطة ⏸️</option>
                    <option value="high">عاجل 🚨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                  >
                    <option value="general">عام 📝</option>
                    <option value="call">مكالمة هاتفية 📞</option>
                    <option value="meeting">اجتماع 🤝</option>
                    <option value="task">مهمة عمل ✔️</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border dark:border-white/10 bg-white dark:bg-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التذكير 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
