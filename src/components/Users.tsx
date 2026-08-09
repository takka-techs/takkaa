import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronDown, Lock, Users, Activity, LogOut, Plus, Pause, Edit, Key, Loader2, Play } from 'lucide-react';
import AddUserModal from './AddUserModal';
import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function UsersPage() {
  const { currentBranchId, currentBranch, isOwner } = useBranch();
  const [activeTab, setActiveTab] = useState('المستخدمين');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      let url = `${SUPABASE_URL}/rest/v1/app_users?select=*,branches(name)&order=created_at.desc`;
      
      if (!isOwner && currentBranchId) {
        url += `&branch_id=eq.${currentBranchId}`;
      }
      
      const activeCashierStr = localStorage.getItem('active_cashier');
      let tenantId = userId;
      if (activeCashierStr) {
        try {
          const parsed = JSON.parse(activeCashierStr);
          if (parsed.tenant_id) tenantId = parsed.tenant_id;
        } catch(e) {}
      }
      url += `&tenant_id=eq.${tenantId}`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'المستخدمين') {
      fetchUsers();
    }
  }, [activeTab, currentBranchId, isOwner]);

  const toggleUserStatus = async (user: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const newStatus = user.status === 'نشط' ? 'موقوف' : 'نشط';
      
      await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6" dir="rtl">
      
      {/* Top Header / Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex flex-wrap gap-2 md:gap-4">
          {[
            { id: 'المستخدمين', icon: Users },
            { id: 'الصلاحيات', icon: Lock },
            { id: 'سجل النشاط', icon: Activity },
            { id: 'الجلسات النشطة', icon: LogOut },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'المستخدمين' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-6 h-6 text-purple-500" />
                قائمة المستخدمين
             </h2>
             <button 
               onClick={() => setIsAddModalOpen(true)}
               className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
             >
               <Plus className="w-5 h-5" />
               إضافة مستخدم
             </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>البحث:</span>
                <input 
                  type="text" 
                  placeholder="اسم المستخدم..." 
                  className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 px-2 py-1 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4 text-right">المستخدم</th>
                    <th className="px-6 py-4 text-center">اسم الدخول (Username)</th>
                    <th className="px-6 py-4 text-center">الفرع</th>
                    <th className="px-6 py-4 text-center">الصلاحية</th>
                    <th className="px-6 py-4 text-center">الحالة</th>
                    <th className="px-6 py-4 text-center">آخر دخول</th>
                    <th className="px-6 py-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500 font-bold">لا يوجد مستخدمين مسجلين حالياً.</td></tr>
                  ) : users.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-right">{user.name}</div>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 justify-end">
                               {new Date(user.created_at).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${user.status === 'نشط' ? 'bg-purple-500/20 text-purple-500' : 'bg-slate-500/20 text-slate-500'}`}>
                            {user.name?.charAt(0)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2333] border border-slate-200 dark:border-white/10 font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {user.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {user.branches?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs" dir="ltr">
                        {user.last_login ? new Date(user.last_login).toLocaleString('ar-EG') : 'لم يسجل دخول'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => toggleUserStatus(user)} className="p-2 bg-slate-100 dark:bg-[#1a2333] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-white/10 transition-colors" title={user.status === 'نشط' ? 'إيقاف المستخدم' : 'تفعيل المستخدم'}>
                            {user.status === 'نشط' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                          </button>
                          <button onClick={() => setUserToEdit(user)} className="p-2 bg-slate-100 dark:bg-[#1a2333] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg border border-slate-200 dark:border-white/10 transition-colors" title="تعديل بيانات المستخدم">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      <AddUserModal 
        isOpen={isAddModalOpen || !!userToEdit} 
        onClose={() => { setIsAddModalOpen(false); setUserToEdit(null); }} 
        onSuccess={fetchUsers} 
        userToEdit={userToEdit}
      />
    </div>
  );
}
