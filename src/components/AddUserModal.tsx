import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, RotateCcw, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userToEdit?: any;
}

const PAGE_MAPPINGS = [
  { id: 'pos', label: 'نقطة البيع' },
  { id: 'warehouses', label: 'المخزون' },
  { id: 'sales', label: 'المبيعات' },
  { id: 'purchases', label: 'المشتريات' },
  { id: 'treasury', label: 'الخزنة' },
  { id: 'accounting', label: 'الحسابات العامة' },
  { id: 'customers', label: 'العملاء' },
  { id: 'suppliers', label: 'الموردين' },
  { id: 'partners', label: 'الشركاء' },
  { id: 'employees', label: 'الموظفين' },
  { id: 'reports', label: 'التقارير' },
  { id: 'reminders', label: 'التذكيرات' },
  { id: 'settings', label: 'الإعدادات' },
  { id: 'maintenance', label: 'الصيانة' }
];

export default function AddUserModal({ isOpen, onClose, onSuccess, userToEdit }: AddUserModalProps) {
  const { branches, isOwner, currentBranchId: contextBranchId } = useBranch();
  const [formData, setFormData] = React.useState({
    username: '',
    name: '',
    password: '',
    role: 'كاشير (Cashier) - قراءة وكتابة 💼',
    status: 'نشط',
    maxDiscount: 0,
    branch_id: contextBranchId || '',
  });

  // Default pages for Cashier
  const [selectedPages, setSelectedPages] = React.useState<string[]>(['pos', 'sales', 'maintenance']);
  const [selectedSpecial, setSelectedSpecial] = React.useState<string[]>(['درج الكاش (نقطة البيع)', 'فواتير نقطة البيع']);
  const [canChangePrice, setCanChangePrice] = React.useState<boolean>(true);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        let perms = userToEdit.permissions || {};
        if (typeof perms === 'string') {
          try {
            perms = JSON.parse(perms);
          } catch(e) {}
        }
        setFormData({
          username: userToEdit.username || '',
          name: userToEdit.name || '',
          password: userToEdit.password || '',
          role: userToEdit.role || 'كاشير (Cashier) - قراءة وكتابة 💼',
          status: userToEdit.status || 'نشط',
          maxDiscount: perms.maxDiscount || 0,
          branch_id: userToEdit.branch_id || contextBranchId || ''
        });
        setSelectedPages(perms.pages || ['pos', 'sales', 'maintenance']);
        setSelectedSpecial(perms.special || ['درج الكاش (نقطة البيع)', 'فواتير نقطة البيع']);
        setCanChangePrice(perms.canChangePrice !== false);
      } else {
        setFormData({ username: '', name: '', password: '', role: 'كاشير (Cashier) - قراءة وكتابة 💼', status: 'نشط', maxDiscount: 0, branch_id: contextBranchId || '' });
        setSelectedPages(['pos', 'sales', 'maintenance']);
        setSelectedSpecial(['درج الكاش (نقطة البيع)', 'فواتير نقطة البيع']);
        setCanChangePrice(true);
      }
      setError('');
    }
  }, [isOpen, userToEdit, contextBranchId]);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p = '';
    for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setFormData(prev => ({ ...prev, password: p }));
  };

  const togglePage = (id: string) => {
    setSelectedPages(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!formData.username || !formData.password || !formData.name) {
      setError('يرجى إدخال (الاسم، اسم المستخدم الدخول، كلمة المرور)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) {
        throw new Error('جلسة المستخدم غير صالحة. يرجى تسجيل الدخول مجدداً.');
      }

      const roleLevel = formData.role.includes('مدير') ? (formData.role.includes('فرع') ? 2 : 1) : 3;

      const currentBranchId = localStorage.getItem('takka_active_branch_id');

      const activeCashierStr = localStorage.getItem('active_cashier');
      let tenantId = userId;
      if (activeCashierStr) {
          try {
            const cashierAuth = JSON.parse(activeCashierStr);
            if (cashierAuth.tenant_id) {
               tenantId = cashierAuth.tenant_id;
            }
          } catch(e) {}
      }

      const payload: any = {
        user_id: userId,
        tenant_id: tenantId,
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        role_level: roleLevel,
        status: formData.status,
        permissions: { 
          pages: selectedPages, 
          special: selectedSpecial,
          canChangePrice: canChangePrice, 
          maxDiscount: Number(formData.maxDiscount) || 0 
        } 
      };

      if (isOwner && formData.branch_id) {
         payload.branch_id = formData.branch_id;
      } else if (currentBranchId) {
         payload.branch_id = currentBranchId;
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users${userToEdit ? `?id=eq.${userToEdit.id}` : ''}`, {
        method: userToEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
          console.error('Supabase error payload:', errData);
        } catch (jsonErr) {
          console.error('Could not parse error response:', jsonErr);
          throw new Error(`خطأ من السيرفر (كود: ${response.status})`);
        }
        
        const errorMsg = errData.message || errData.details || errData.hint;
        
        if (errorMsg?.includes('JWT expired')) {
           throw new Error('انتهت صلاحية الجلسة (JWT expired)، يرجى تسجيل الخروج ثم تسجيل الدخول مرة أخرى.');
        } else if (errorMsg?.includes('app_users_user_id_key')) {
           throw new Error('قمت بتفعيل خيار "Unique" لعمود user_id في جدول app_users بقاعدة البيانات، مما يمنع إضافة أكثر من موظف. يرجى إزالة القيد الفريد من Supabase لإضافة أكثر من موظف.');
        }

        throw new Error(errorMsg || 'حدث خطأ أثناء حفظ المستخدم (تأكد من إنشاء جدول app_users)');
      }

      console.log('User saved successfully!');
      setFormData({ username: '', name: '', password: '', role: 'كاشير (Cashier) - قراءة وكتابة 💼', status: 'نشط', maxDiscount: 0, branch_id: contextBranchId || '' });
      if (onSuccess) onSuccess();
      onClose();
      alert(userToEdit ? 'تم تعديل المستخدم بنجاح!' : 'تم إنشاء المستخدم بنجاح!');
    } catch (e: any) {
      console.error('Caught error in handleSave:', e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('JWT expired')) {
         errMsg = 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول لتتمكن من إضافة مستخدم.';
      } else if (errMsg.includes('app_users_user_id_key')) {
         errMsg = 'قمت بتفعيل خيار "Unique" لعمود user_id في جدول app_users بقاعدة البيانات، مما يمنع إضافة أكثر من موظف. يرجى إزالة القيد الفريد من Supabase.';
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
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
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#1a1f2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-[#161b22]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold text-white">{userToEdit ? 'تعديل سيطرة المستخدم' : 'إضافة مستخدم جديد'}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl font-bold text-sm">
                {error}
              </div>
            )}

            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">اسم المستخدم <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.username} onChange={e => setFormData(prev => ({...prev, username: e.target.value}))} dir="ltr" placeholder="مثال: ahmed" className="w-full bg-[#11151c] border border-blue-500/50 rounded-xl px-4 py-3 text-white focus:border-blue-400 outline-none transition-colors text-right" />
                  <p className="text-xs text-slate-500 text-left">يستخدم لتسجيل الدخول</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الاسم المعروض <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} placeholder="مثال: أحمد محمد" className="w-full bg-[#11151c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 outline-none transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">كلمة المرور <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <button onClick={generatePassword} className="flex items-center gap-2 bg-[#1a2333] hover:bg-[#202b3d] border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl transition-colors whitespace-nowrap">
                    توليد 🎲
                  </button>
                  <input type="text" value={formData.password} onChange={e => setFormData(prev => ({...prev, password: e.target.value}))} placeholder="أدخل كلمة المرور" className="flex-1 bg-[#11151c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 outline-none transition-colors text-left font-mono" dir="ltr" />
                </div>
                <p className="text-xs text-slate-500 text-left mt-1">6 أحرف على الأقل</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الصلاحية <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                      className="w-full bg-[#11151c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 outline-none transition-colors appearance-none"
                    >
                      <option>كاشير (Cashier) - قراءة وكتابة 💼</option>
                      {(() => {
                        const isAdmin = localStorage.getItem('admin_active') === 'true';
                        let roleLevel = isAdmin ? 1 : 3;
                        const cashierStr = localStorage.getItem('active_cashier');
                        if (!isAdmin && cashierStr) {
                          try {
                            const c = JSON.parse(cashierStr);
                            roleLevel = c.role_level || 3;
                          } catch(e) {}
                        }
                        
                        let hasBranches = true;
                        try {
                          const currentUserId = localStorage.getItem('user_id');
                          const storageKey = currentUserId ? `takka_settings_${currentUserId}` : 'takka_settings';
                          const localSettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
                          if (localSettings.hasBranches === false) hasBranches = false;
                        } catch(e) {}
                        
                        const options = [];
                        if (roleLevel <= 2) {
                           if (hasBranches && roleLevel === 1) {
                             options.push(<option key="manager">مدير فرع (Branch Manager) - تحكم بالفرع 🏢</option>);
                           } else if (hasBranches && roleLevel === 2) {
                             // Branch managers might be allowed to create branch managers for their own branch, or maybe just cashiers.
                             // Let's allow branch managers to create branch managers for the current branch.
                             options.push(<option key="manager">مدير فرع (Branch Manager) - تحكم بالفرع 🏢</option>);
                           }
                        }
                        return options;
                      })()}
                      <option>صيانة (Maintenance) - إدارة الورشة 🔧</option>
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {isOwner && branches.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">تعيين فرع <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={formData.branch_id}
                        onChange={(e) => setFormData(prev => ({...prev, branch_id: e.target.value}))}
                        className="w-full bg-[#11151c] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-400 outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled>اختر الفرع</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-[#11151c] border border-white/5 rounded-xl">
                <div className="font-medium text-white">الحالة</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className={`text-sm ${formData.status === 'نشط' ? 'text-emerald-400' : 'text-slate-400'}`}>{formData.status}</span>
                  <div className="relative" onClick={() => setFormData(prev => ({...prev, status: prev.status === 'نشط' ? 'غير نشط' : 'نشط'}))}>
                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${formData.status === 'نشط' ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-all ${formData.status === 'نشط' ? 'left-1' : 'right-1'}`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Permissions Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  تخصيص الصلاحيات 🔒
                </h3>
                <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  إعادة للافتراضي
                </button>
              </div>

              {/* Pages Grid */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-4 px-2">الصفحات المتاحة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PAGE_MAPPINGS.map((page) => (
                    <label key={page.id} className="flex items-center justify-between p-4 bg-[#11151c] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                      <span className="font-medium">{page.label}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedPages.includes(page.id)}
                        onChange={() => togglePage(page.id)}
                        className="w-5 h-5 rounded border-white/20 bg-[#161b22] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#11151c]" 
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Permissions Grid */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-4 px-2">صلاحيات خاصة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'عرض التقارير', 'عرض الخزنة',
                    'درج الكاش (نقطة البيع)', 'فواتير نقطة البيع',
                    'تصدير البيانات', 'حذف البيانات',
                    'تعديل الإعدادات', 'إدارة المستخدمين',
                    'مرتجع الصيانة'
                  ].map((perm) => (
                    <label key={perm} className="flex items-center justify-between p-4 bg-[#11151c] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                      <span className="font-medium text-sm">{perm}</span>
                      <input 
                         type="checkbox" 
                         checked={selectedSpecial.includes(perm)} 
                         onChange={(e) => {
                            if (e.target.checked) setSelectedSpecial(prev => [...prev, perm]);
                            else setSelectedSpecial(prev => prev.filter(p => p !== perm));
                         }}
                         className="w-5 h-5 rounded border-white/20 bg-[#161b22] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#11151c]" 
                      />
                    </label>
                  ))}
                  
                  {/* Special Permission with input */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#11151c] border border-white/5 rounded-xl gap-4 md:col-span-2">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                      <span className="font-medium text-sm text-white">تغيير السعر أثناء البيع</span>
                      <input 
                         type="checkbox" 
                         checked={canChangePrice}
                         onChange={(e) => setCanChangePrice(e.target.checked)}
                         className="w-5 h-5 rounded border-white/20 bg-[#161b22] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#11151c]" 
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">الحد الأقصى للتخفيض: % (0 = بدون حد)</span>
                      <input 
                        type="number" 
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData(prev => ({...prev, maxDiscount: Number(e.target.value)}))}
                        min={0} 
                        max={100} 
                        className="w-16 bg-[#1a2333] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-blue-400 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-start gap-3 p-6 border-t border-white/5 shrink-0 bg-[#161b22]">
            <button disabled={isLoading} onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors font-medium disabled:opacity-70">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isLoading ? 'جاري الحفظ...' : 'حفظ 💾'}
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-slate-300 border border-white/10 hover:bg-white/5 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
