import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit, Wallet, Smartphone, Landmark, Trash2, Settings, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inlineMode?: boolean;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
// Need anon key here. The key below is public/anon key from previous files
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function ManageWalletsModal({ isOpen, onClose, inlineMode = false }: Props) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', type: 'e_wallet', 
    provider: '', account_number: '', 
    account_holder: '', branch_name: '', 
    iban: '', notes: '', 
    is_default: false, is_active: true 
  });

  const resetForm = () => {
    setFormData({ 
      name: '', type: 'e_wallet', 
      provider: '', account_number: '', 
      account_holder: '', branch_name: '', 
      iban: '', notes: '', 
      is_default: false, is_active: true 
    });
    setEditingId(null);
    setFormOpen(false);
  };

  useEffect(() => {
    if (isOpen || inlineMode) {
      loadWallets();
    }
  }, [isOpen, inlineMode]);

  const loadWallets = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      let query = `${SUPABASE_URL}/rest/v1/wallets?select=*&order=is_default.desc,id.asc`;
      if (tenantId) {
        query += `&tenant_id=eq.${tenantId}`;
      }
      if (activeBranchId && activeBranchId !== 'ALL') {
        query += `&branch_id=eq.${activeBranchId}`;
      }

      let branchesMap: Record<string, string> = {};
      try {
        const bRes = await fetch(`${SUPABASE_URL}/rest/v1/branches?select=id,name`, { headers });
        if (bRes.ok) {
          const bs = await bRes.json();
          bs.forEach((b: any) => branchesMap[b.id] = b.name);
        }
      } catch(e) {}

      const res = await fetch(query, { headers });
      if (res.ok) {
        const rawWallets = await res.json();
        setWallets(rawWallets.map((w: any) => ({ ...w, branch_info: branchesMap[w.branch_id] })));
      } else {
         setErrorMsg('Failed to fetch wallets');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error fetching wallets');
    } finally {
       setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const payload: any = {
        name: formData.name,
        type: formData.type,
        user_id: userId,
        tenant_id: tenantId,
        balance: 0, // starting balance for new wallets
        is_default: formData.is_default,
        status: formData.is_active ? 'active' : 'inactive'
      };
      if (activeBranchId) payload.branch_id = activeBranchId;
      
      // We send the extra columns expecting they will be added to the DB
      if(formData.provider) payload.provider = formData.provider;
      if(formData.account_number) payload.account_number = formData.account_number;
      if(formData.account_holder) payload.account_holder = formData.account_holder;
      if(formData.branch_name) payload.branch_name = formData.branch_name;
      if(formData.iban) payload.iban = formData.iban;
      if(formData.notes) payload.notes = formData.notes;

      const updatePayload: any = { 
        name: formData.name, 
        type: formData.type, 
        is_default: formData.is_default,
        status: formData.is_active ? 'active' : 'inactive'
      };
      
      if(formData.provider !== undefined) updatePayload.provider = formData.provider;
      if(formData.account_number !== undefined) updatePayload.account_number = formData.account_number;
      if(formData.account_holder !== undefined) updatePayload.account_holder = formData.account_holder;
      if(formData.branch_name !== undefined) updatePayload.branch_name = formData.branch_name;
      if(formData.iban !== undefined) updatePayload.iban = formData.iban;
      if(formData.notes !== undefined) updatePayload.notes = formData.notes;
      
      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };

      let res;
      if (editingId) {
         res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${editingId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updatePayload)
         });
         if (!res.ok) {
           res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${editingId}`, {
             method: 'PATCH',
             headers,
             body: JSON.stringify({ name: formData.name, balance: updatePayload.balance, is_default: formData.is_default })
           });
         }
      } else {
         res = await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
         });
         if (!res.ok) {
           res = await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
             method: 'POST',
             headers,
             body: JSON.stringify({ name: formData.name, balance: 0, branch_id: payload.branch_id, is_default: formData.is_default })
           });
         }
      }

      if (res.ok) {
        resetForm();
        loadWallets();
      } else {
        setErrorMsg('Failed to save wallet');
      }
    } catch (e) {
       console.error(e);
       setErrorMsg('Network error saving wallet');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id: number) => {
    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('حذف البيانات')) {
      alert('ليس لديك صلاحية لحذف البيانات');
      setDeleteConfirmId(null);
      return;
    }

    setIsSubmitting(true);
    setDeleteConfirmId(null);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        loadWallets();
      } else {
        setErrorMsg('Failed to delete wallet');
      }
    } catch (e) {
      setErrorMsg('Network error deleting wallet');
    } finally {
        setIsSubmitting(false);
    }
  };

  const openNew = (type: string) => {
    setEditingId(null);
    setFormData({ 
      name: '', type, 
      provider: '', account_number: '', 
      account_holder: '', branch_name: '', 
      iban: '', notes: '', 
      is_default: false, is_active: true 
    });
    setFormOpen(true);
  };
  const openEdit = (w: any) => {
    setEditingId(w.id);
    setFormData({
       name: w.name || '',
       type: w.type || 'e_wallet',
       provider: w.provider || '',
       account_number: w.account_number || '',
       account_holder: w.account_holder || '',
       branch_name: w.branch_name || '',
       iban: w.iban || '',
       notes: w.notes || '',
       is_default: w.is_default || false,
       is_active: w.status !== 'inactive'
     });
     setFormOpen(true);
  };

  if (!isOpen && !inlineMode) return null;

  const defaultWallets = wallets.filter(w => w.is_default);
  const additionalBanks = wallets.filter(w => !w.is_default && w.type === 'bank');
  const additionalEWallets = wallets.filter(w => !w.is_default && w.type === 'e_wallet');
  const additionalCash = wallets.filter(w => !w.is_default && (w.type === 'cash' || !w.type));

  const content = (
    <div className={inlineMode ? "space-y-6" : "p-6"}>
      {inlineMode && (
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-amber-500/10 rounded-2xl">
            <Wallet className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">المحافظ المالية</h1>
            <p className="text-slate-500">إدارة حسابات الدفع والبنوك، وإعدادات رسوم التحويل</p>
          </div>
        </div>
      )}

      {errorMsg && (
         <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
           {errorMsg}
         </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
      <>
        {/* المحافظ الافتراضية */}
        {defaultWallets.length > 0 && (
            <div className="bg-white dark:bg-[#11151c] p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg">المحافظ الافتراضية</h3>
                        <p className="text-xs text-slate-500 mt-1">هذه المحافظ محمية ولا يمكن حذفها - تُستخدم في جميع العمليات المالية</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                    {defaultWallets.map(w => (
                    <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl gap-4 sm:gap-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                                {w.type === 'bank' ? <Landmark className="w-6 h-6 text-slate-400" /> : w.type === 'e_wallet' ? <Smartphone className="w-6 h-6 text-purple-500" /> : <Wallet className="w-6 h-6 text-emerald-500" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">{w.name}</h4>
                                <p className="text-xs text-slate-500">{w.type === 'bank' ? 'حساب بنكي' : w.type === 'e_wallet' ? 'محفظة إلكترونية' : 'كاش سائل'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"><Wallet className="w-3 h-3"/> افتراضي</span>
                            <button onClick={() => openEdit(w)} className="px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:text-blue-500 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                تعديل الاسم <Edit className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* الحسابات البنكية الإضافية */}
            <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <Landmark className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg">الحسابات البنكية</h3>
                        <p className="text-xs text-slate-500 mt-1">إضافة حسابات بنكية إضافية</p>
                    </div>
                    </div>
                </div>
                
                <button onClick={() => openNew('bank')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-4 transition-colors">
                    <Plus className="w-5 h-5" /> إضافة حساب بنكي جديد
                </button>

                <div className="space-y-3">
                    {additionalBanks.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-8">
                        <Landmark className="w-8 h-8 opacity-50" />
                        <p className="text-sm">لا توجد حسابات بنكية إضافية، سيتم استخدام الحساب الافتراضي</p>
                    </div>
                    ) : (
                        additionalBanks.map((w) => (
                        <div key={w.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between">
                            <div className="w-[75%] flex flex-col items-start gap-1">
                                <h4 className="font-bold text-slate-800 dark:text-white leading-tight break-words max-w-full">
                                  {w.name}
                                </h4>
                                {!localStorage.getItem("takka_active_branch_id") && w.branch_info && (
                                   <span className="text-[11px] bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 px-2 py-1 rounded-md leading-tight break-words max-w-full inline-block">
                                      فرع: {w.branch_info}
                                   </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(w)} className="p-2 bg-white dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-600 border border-slate-200 dark:border-white/5 transition-colors"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(w.id)} disabled={isSubmitting} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>

            {/* المحافظ الإلكترونية الإضافية */}
            <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                        <Smartphone className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg">المحافظ الإلكترونية</h3>
                        <p className="text-xs text-slate-500 mt-1">فودافون كاش، اتصالات كاش، وما إلى ذلك</p>
                    </div>
                    </div>
                </div>
                
                <button onClick={() => openNew('e_wallet')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-4 transition-colors">
                    <Plus className="w-5 h-5" /> إضافة محفظة إلكترونية
                </button>

                <div className="space-y-3">
                    {additionalEWallets.length === 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-8">
                            <Smartphone className="w-8 h-8 opacity-50" />
                            <p className="text-sm">لا توجد محافظ إلكترونية إضافية</p>
                        </div>
                    ) : (
                    additionalEWallets.map(w => (
                    <div key={w.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="w-[75%] flex flex-col items-start gap-1">
                            <h4 className="font-bold text-slate-800 dark:text-white leading-tight break-words max-w-full">
                                {w.name}
                            </h4>
                            {!localStorage.getItem("takka_active_branch_id") && w.branch_info && (
                                <span className="text-[11px] bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 px-2 py-1 rounded-md leading-tight break-words max-w-full inline-block">
                                    فرع: {w.branch_info}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(w)} className="p-2 bg-white dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-600 border border-slate-200 dark:border-white/5 transition-colors"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(w.id)} disabled={isSubmitting} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </div>
                    ))
                    )}
                </div>
            </div>

            {/* محافظ متنوعة / كاش إضافي */}
            {additionalCash.length > 0 && (
            <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg">خزائن / كاش إضافي</h3>
                    </div>
                    </div>
                </div>
                
                <button onClick={() => openNew('cash')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-4 transition-colors">
                    <Plus className="w-5 h-5" /> إضافة خزينة أخرى
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {additionalCash.map(w => (
                    <div key={w.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="w-[75%] flex flex-col items-start gap-1">
                            <h4 className="font-bold text-slate-800 dark:text-white leading-tight break-words max-w-full">
                                {w.name}
                            </h4>
                            {!localStorage.getItem("takka_active_branch_id") && w.branch_info && (
                                <span className="text-[11px] bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 px-2 py-1 rounded-md leading-tight break-words max-w-full inline-block">
                                    فرع: {w.branch_info}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(w)} className="p-2 bg-white dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-600 border border-slate-200 dark:border-white/5 transition-colors"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(w.id)} disabled={isSubmitting} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
            )}
            
            {additionalCash.length === 0 && (
                <div className="md:col-span-2 flex justify-center">
                    <button onClick={() => openNew('cash')} className="bg-white dark:bg-[#11151c] text-emerald-600 dark:text-emerald-500 font-bold py-3 px-6 rounded-xl border border-dashed border-emerald-500 flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                        <Plus className="w-5 h-5" /> إضافة خزينة كاش أخرى (درج كاشير آخر)
                    </button>
                </div>
            )}
        </div>
      </>
      )}

      {/* Form Modal Sub-component */}
      <AnimatePresence>
         {formOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-[#1a1f26] w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                        <h3 className="text-xl font-bold flex-1 text-center">
                            {editingId 
                                ? (formData.type === 'bank' ? 'تعديل حساب بنكي' : formData.type === 'e_wallet' ? 'تعديل محفظة إلكترونية' : 'تعديل خزينة') 
                                : (formData.type === 'bank' ? 'إضافة حساب بنكي جديد' : formData.type === 'e_wallet' ? 'إضافة محفظة إلكترونية' : 'إضافة خزينة جديدة')}
                        </h3>
                        <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-rose-500 absolute start-6 top-6">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        
                        {/* Name Field - Common */}
                        <div>
                            <label className="block text-sm font-bold mb-2">
                                {formData.type === 'bank' ? 'اسم البنك' : formData.type === 'e_wallet' ? 'اسم المحفظة' : 'اسم الخزينة'} <span className="text-rose-500">*</span>
                            </label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-blue-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder={formData.type === 'bank' ? 'مثال: البنك الأهلي المصري' : 'مثال: فودافون كاش - أحمد'} />
                        </div>

                        {/* E-Wallet Specific Fields */}
                        {formData.type === 'e_wallet' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold mb-2">مزود الخدمة</label>
                                    <select value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none">
                                        <option value="">-- اختر المزود --</option>
                                        <option value="vodafone">فودافون كاش</option>
                                        <option value="orange">أورنج ماني</option>
                                        <option value="etisalat">اتصالات كاش</option>
                                        <option value="we">وي باي</option>
                                        <option value="other">أخرى</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">رقم المحفظة / الهاتف <span className="text-rose-500">*</span></label>
                                    <input value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none font-mono text-left" dir="ltr" placeholder="01xxxxxxxxx" />
                                </div>
                            </>
                        )}

                        {/* Bank Specific Fields */}
                        {formData.type === 'bank' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold mb-2">رقم الحساب <span className="text-rose-500">*</span></label>
                                    <input value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-left" dir="ltr" placeholder="رقم الحساب البنكي" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">اسم صاحب الحساب</label>
                                    <input value={formData.account_holder} onChange={e => setFormData({...formData, account_holder: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="اسم صاحب الحساب" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">اسم الفرع</label>
                                    <input value={formData.branch_name} onChange={e => setFormData({...formData, branch_name: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="اسم الفرع" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">IBAN (إن وجد)</label>
                                    <input value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-left font-mono" dir="ltr" placeholder="EGXX XXXX XXXX XXXX XXXX XXXX" />
                                </div>
                            </>
                        )}

                        {/* Notes - Common */}
                        <div>
                            <label className="block text-sm font-bold mb-2">ملاحظات</label>
                            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none min-h-[100px] resize-none" placeholder="ملاحظات إضافية (اختياري)"></textarea>
                        </div>

                        {/* Toggles - Common */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 cursor-pointer">
                                <span className="text-sm font-bold">تعيين {formData.type === 'cash' ? 'كخزينة افتراضية' : formData.type === 'bank' ? 'كحساب افتراضي' : 'كمحفظة افتراضية'} لهذا النوع</span>
                                <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="w-5 h-5 rounded text-blue-600 outline-none" />
                            </label>
                            
                            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 cursor-pointer">
                                <span className="text-sm font-bold">{formData.type === 'bank' ? 'الحساب نشط' : formData.type === 'cash' ? 'الخزينة نشطة' : 'المحفظة نشطة'}</span>
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded text-blue-600 outline-none" />
                            </label>
                        </div>

                        <div className="flex gap-3 mt-8 pt-4">
                            <button onClick={() => setFormOpen(false)} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={handleSave} disabled={isSubmitting || !formData.name || (formData.type !== 'cash' && !formData.account_number)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>حفظ 💾</>}
                            </button>
                        </div>

                    </div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
          {deleteConfirmId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-[#1a1f26] w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 text-center">
                      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                          <Trash2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">تأكيد الحذف</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف هذه المحفظة / החساب بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.</p>
                      
                      <div className="flex gap-3">
                          <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-colors">
                              إلغاء
                          </button>
                          <button onClick={() => executeDelete(deleteConfirmId)} disabled={isSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نعم، احذف'}
                          </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );

  if (inlineMode) {
    return content;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
           className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10 custom-scrollbar"
        >
          <div className="sticky top-0 z-10 flex justify-between items-center p-5 bg-slate-100/80 backdrop-blur-md dark:bg-[#11151c]/80 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الحسابات والمحافظ</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
               <X className="w-6 h-6" />
            </button>
          </div>
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
